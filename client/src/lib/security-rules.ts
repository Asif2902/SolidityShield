import type { SecurityResult } from "@shared/schema";

interface Pattern {
  regex: RegExp;
  check: (match: RegExpMatchArray, code: string) => SecurityResult | null;
  category: 'security' | 'gas' | 'best_practices' | 'code_quality';
}

const patterns: Pattern[] = [
  // Security Vulnerabilities - Highest Priority
  {
    regex: /\.transfer\s*\(|\.send\s*\(/g,
    check: (match) => ({
      id: "REENTRANCY",
      title: "Potential Reentrancy",
      description: "Using transfer() or send() can lead to reentrancy vulnerabilities",
      severity: "critical",
      line: getLineNumber(match),
      recommendation: "Use the checks-effects-interactions pattern and consider using OpenZeppelin's ReentrancyGuard"
    }),
    category: 'security'
  },
  {
    regex: /tx\.origin/g,
    check: (match) => ({
      id: "TX_ORIGIN",
      title: "tx.origin Usage",
      description: "Using tx.origin for authentication is vulnerable to phishing attacks",
      severity: "critical",
      line: getLineNumber(match),
      recommendation: "Use msg.sender for authentication instead"
    }),
    category: 'security'
  },
  {
    regex: /function\s+\w+\s*\([^)]*\)\s*public(?!\s+view|\s+pure)/g,
    check: (match) => ({
      id: "ACCESS_CONTROL",
      title: "Missing Access Control",
      description: "Public functions should be protected against unauthorized access",
      severity: "high",
      line: getLineNumber(match),
      recommendation: "Add appropriate modifiers (e.g., onlyOwner) or access control checks"
    }),
    category: 'security'
  },
  {
    regex: /\+=|-=|\*=|\/=/g,
    check: (match) => ({
      id: "ARITHMETIC",
      title: "Unchecked Arithmetic",
      description: "Arithmetic operations can overflow/underflow",
      severity: "high",
      line: getLineNumber(match),
      recommendation: "Use OpenZeppelin's SafeMath or Solidity 0.8+ built-in overflow checks"
    }),
    category: 'security'
  },

  // Gas Optimization - Lower Priority for L2
  {
    regex: /\b(for|while)\s*\([^;]+;[^;]+;[^)]+\)/g,
    check: (match) => ({
      id: "GAS_LOOP",
      title: "Unbounded Loop",
      description: "Unbounded loops can lead to DOS attacks (less critical on L2)",
      severity: "medium",
      line: getLineNumber(match),
      recommendation: "Consider implementing pagination if dealing with large data sets"
    }),
    category: 'gas'
  },
  {
    regex: /struct\s+\w+\s*\{[^}]*bool[^}]*\}/g,
    check: (match) => ({
      id: "STRUCT_PACKING",
      title: "Inefficient Struct Packing",
      description: "Boolean values in structs consume a full word (less critical on L2)",
      severity: "low",
      line: getLineNumber(match),
      recommendation: "Consider packing multiple booleans into a single uint256 if gas optimization is crucial"
    }),
    category: 'gas'
  },

  // Code Quality
  {
    regex: /function\s+\w+\s*\([^)]*\)\s*(?!external|public|internal|private)/g,
    check: (match) => ({
      id: "VISIBILITY_MODIFIER",
      title: "Missing Visibility Modifier",
      description: "Functions should explicitly declare their visibility",
      severity: "medium",
      line: getLineNumber(match),
      recommendation: "Add explicit visibility modifier (public, private, internal, or external)"
    }),
    category: 'code_quality'
  },
  {
    regex: /require\s*\([^,)]+\)/g,
    check: (match) => ({
      id: "REQUIRE_MESSAGE",
      title: "Missing Require Message",
      description: "Require statements should have descriptive error messages",
      severity: "low",
      line: getLineNumber(match),
      recommendation: "Add a descriptive error message to the require statement"
    }),
    category: 'code_quality'
  },

  // Best Practices
  {
    regex: /pragma solidity [\^~]?0\.[0-9]+\.[0-9]+/g,
    check: (match) => ({
      id: "FLOATING_PRAGMA",
      title: "Floating Pragma",
      description: "Using ^ or ~ in pragma allows compilation with different compiler versions",
      severity: "medium",
      line: getLineNumber(match),
      recommendation: "Lock the pragma to a specific version"
    }),
    category: 'best_practices'
  },
  {
    regex: /function\s+\w+\s*\([^)]*\)\s*external\s+payable[^{]*{\s*[^}]*msg\.value[^}]*}/g,
    check: (match) => ({
      id: "UNCHECKED_PAYMENT",
      title: "Unchecked Payment Amount",
      description: "Function accepts payments without proper amount validation",
      severity: "critical",
      line: getLineNumber(match),
      recommendation: "Add explicit checks for msg.value to prevent unintended payment amounts"
    }),
    category: 'security'
  },
  {
    regex: /using\s+SafeMath\s+for\s+uint/g,
    check: (match) => ({
      id: "DEPRECATED_SAFEMATH",
      title: "Deprecated SafeMath Usage",
      description: "SafeMath is not needed for Solidity >=0.8.0 as overflow checks are built-in",
      severity: "info",
      line: getLineNumber(match),
      recommendation: "Remove SafeMath for Solidity >=0.8.0 to save gas"
    }),
    category: 'gas'
  },
  {
    regex: /assembly\s*{[^}]*}/g,
    check: (match) => ({
      id: "INLINE_ASSEMBLY",
      title: "Inline Assembly Usage",
      description: "Contract uses inline assembly which bypasses Solidity safety checks",
      severity: "high",
      line: getLineNumber(match),
      recommendation: "Avoid inline assembly unless absolutely necessary for optimizations"
    }),
    category: 'security'
  },
  {
    regex: /function\s+\w+\s*\([^)]*\)\s*public\s+returns\s*\([^)]+\)\s*{\s*[^}]*\}/g,
    check: (match, code) => {
      // Check if the function modifies state but doesn't emit events
      const functionBody = match[0];
      const modifiesState = /\b(=|\+=|-=|\*=|\/=)\b/.test(functionBody);
      const emitsEvent = /\bemit\b/.test(functionBody);

      if (modifiesState && !emitsEvent) {
        return {
          id: "MISSING_EVENTS",
          title: "Missing Event Emission",
          description: "State-changing function doesn't emit events",
          severity: "medium",
          line: getLineNumber(match),
          recommendation: "Emit events for all state changes to aid in off-chain tracking"
        };
      }
      return null;
    },
    category: 'best_practices'
  },
  {
    regex: /mapping\s*\([^)]+\)/g,
    check: (match, code) => {
      const mappingDef = match[0];
      if (!mappingDef.includes("=>")) {
        return {
          id: "INVALID_MAPPING",
          title: "Invalid Mapping Syntax",
          description: "Mapping declaration uses incorrect syntax",
          severity: "high",
          line: getLineNumber(match),
          recommendation: "Use the correct mapping syntax with '=>' operator"
        };
      }
      return null;
    },
    category: 'code_quality'
  },
  {
    regex: /function\s+\w+\s*\([^)]*\)\s*public\s+payable[^{]*{\s*[^}]*selfdestruct\s*\([^)]*\)[^}]*}/g,
    check: (match) => ({
      id: "SELF_DESTRUCT",
      title: "Unprotected Selfdestruct",
      description: "Contract can be destroyed by anyone",
      severity: "critical",
      line: getLineNumber(match),
      recommendation: "Add proper access control to selfdestruct operations"
    }),
    category: 'security'
  }
];

function getLineNumber(match: RegExpMatchArray): number {
  const index = match.index || 0;
  const lines = match.input?.slice(0, index).split('\n') || [];
  return lines.length;
}

interface AnalysisScores {
  security: number;
  gas: number;
  codeQuality: number;
  bestPractices: number;
  overall: number;
}

export function analyzeCode(code: string): { results: SecurityResult[], scores: AnalysisScores } {
  const results: SecurityResult[] = [];
  const issuesByCategory: Record<string, SecurityResult[]> = {
    security: [],
    gas: [],
    code_quality: [],
    best_practices: []
  };

  // Run all pattern checks
  patterns.forEach(pattern => {
    let matches = Array.from(code.matchAll(pattern.regex));
    matches.forEach(match => {
      const result = pattern.check(match, code);
      if (result) {
        results.push(result);
        issuesByCategory[pattern.category].push(result);
      }
    });
  });

  // Add general checks
  if (code.length > 0) {
    if (!code.includes('SPDX-License-Identifier:')) {
      const result = {
        id: "LICENSE",
        title: "Missing SPDX License",
        description: "Source code should include an SPDX license identifier",
        severity: "info",
        recommendation: "Add an SPDX license identifier (e.g., // SPDX-License-Identifier: MIT)"
      };
      results.push(result);
      issuesByCategory.best_practices.push(result);
    }

    if (!code.includes('/// @')) {
      const result = {
        id: "NATSPEC",
        title: "Missing NatSpec Comments",
        description: "Functions should be documented using NatSpec format",
        severity: "info",
        recommendation: "Add NatSpec comments to document contract and functions"
      };
      results.push(result);
      issuesByCategory.code_quality.push(result);
    }
  }

  const scores = calculateScores(issuesByCategory);
  return { results, scores };
}

function calculateScores(issuesByCategory: Record<string, SecurityResult[]>): AnalysisScores {
  // Recalibrated severity weights to be less punitive
  const severityWeights = {
    critical: -15, // Was -40
    high: -10,     // Was -20
    medium: -5,    // Was -10
    low: -2,       // Was -5
    info: -1       // Was -2
  };

  function calculateCategoryScore(issues: SecurityResult[]): number {
    if (issues.length === 0) return 100;

    // Calculate base deductions
    const deductions = issues.reduce((total, issue) =>
      total + severityWeights[issue.severity as keyof typeof severityWeights], 0);

    // Scale deductions based on number of issues (more forgiving for a few issues)
    const scalingFactor = Math.max(0.5, 1 - (issues.length / 20)); // Reduces impact for first few issues
    const scaledDeductions = deductions * scalingFactor;

    // Ensure score stays within bounds and apply a more gradual reduction
    return Math.max(0, Math.min(100, 100 + scaledDeductions));
  }

  const categoryScores = {
    security: calculateCategoryScore(issuesByCategory.security),
    gas: calculateCategoryScore(issuesByCategory.gas),
    codeQuality: calculateCategoryScore(issuesByCategory.code_quality),
    bestPractices: calculateCategoryScore(issuesByCategory.best_practices)
  };

  // Weighted overall score with adjusted weights
  // Security issues are weighted less heavily to prevent over-penalization
  const overall = Math.round(
    (categoryScores.security * 0.35) +      // Was 0.4
    (categoryScores.codeQuality * 0.25) +   // Same
    (categoryScores.bestPractices * 0.25) + // Was 0.2
    (categoryScores.gas * 0.15)             // Same
  );

  return {
    ...categoryScores,
    overall
  };
}