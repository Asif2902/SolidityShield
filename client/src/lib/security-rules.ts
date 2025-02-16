import type { SecurityResult } from "@shared/schema";

interface Pattern {
  regex: RegExp;
  check: (match: RegExpMatchArray, code: string) => SecurityResult;
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
      results.push(result);
      issuesByCategory[pattern.category].push(result);
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
  const severityWeights = {
    critical: -40,
    high: -20,
    medium: -10,
    low: -5,
    info: -2
  };

  function calculateCategoryScore(issues: SecurityResult[]): number {
    if (issues.length === 0) return 100;

    const deductions = issues.reduce((total, issue) => 
      total + severityWeights[issue.severity as keyof typeof severityWeights], 0);

    return Math.max(0, Math.min(100, 100 + deductions));
  }

  const categoryScores = {
    security: calculateCategoryScore(issuesByCategory.security),
    gas: calculateCategoryScore(issuesByCategory.gas),
    codeQuality: calculateCategoryScore(issuesByCategory.code_quality),
    bestPractices: calculateCategoryScore(issuesByCategory.best_practices)
  };

  // Calculate weighted overall score
  // Security has highest weight (40%), followed by code quality (25%),
  // best practices (20%), and gas optimization (15% - lower due to L2 consideration)
  const overall = Math.round(
    (categoryScores.security * 0.4) +
    (categoryScores.codeQuality * 0.25) +
    (categoryScores.bestPractices * 0.2) +
    (categoryScores.gas * 0.15)
  );

  return {
    ...categoryScores,
    overall
  };
}