import type { SecurityResult } from "@shared/schema";

interface Pattern {
  regex: RegExp;
  check: (match: RegExpMatchArray, code: string) => SecurityResult;
}

const patterns: Pattern[] = [
  // Gas Usage Patterns
  {
    regex: /\b(for|while)\s*\([^;]+;[^;]+;[^)]+\)/g,
    check: (match) => ({
      id: "GAS_LOOP",
      title: "Unbounded Loop",
      description: "Unbounded loops can lead to high gas costs or DOS attacks",
      severity: "high",
      line: getLineNumber(match),
      recommendation: "Add an upper bound to the loop or use pagination patterns"
    })
  },
  {
    regex: /struct\s+\w+\s*\{[^}]*bool[^}]*\}/g,
    check: (match) => ({
      id: "GAS_STRUCT_PACKING",
      title: "Inefficient Struct Packing",
      description: "Boolean values in structs consume a full word (256 bits)",
      severity: "low",
      line: getLineNumber(match),
      recommendation: "Pack multiple booleans into a single uint256 using bit manipulation"
    })
  },
  // Security Vulnerabilities
  {
    regex: /\.transfer\s*\(|\.send\s*\(/g,
    check: (match) => ({
      id: "REENTRANCY",
      title: "Potential Reentrancy",
      description: "Using transfer() or send() can lead to reentrancy vulnerabilities",
      severity: "critical",
      line: getLineNumber(match),
      recommendation: "Use the checks-effects-interactions pattern and consider using OpenZeppelin's ReentrancyGuard"
    })
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
    })
  },
  {
    regex: /\+=|-=|\*=|\/=/g,
    check: (match) => ({
      id: "ARITHMETIC",
      title: "Unchecked Arithmetic",
      description: "Arithmetic operations can overflow/underflow",
      severity: "medium",
      line: getLineNumber(match),
      recommendation: "Use OpenZeppelin's SafeMath or Solidity 0.8+ built-in overflow checks"
    })
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
    })
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
    })
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
    })
  }
];

function getLineNumber(match: RegExpMatchArray): number {
  const index = match.index || 0;
  const lines = match.input?.slice(0, index).split('\n') || [];
  return lines.length;
}

export function analyzeCode(code: string): SecurityResult[] {
  const results: SecurityResult[] = [];

  // Run all pattern checks
  patterns.forEach(pattern => {
    let matches = Array.from(code.matchAll(pattern.regex));
    matches.forEach(match => {
      results.push(pattern.check(match, code));
    });
  });

  // Add general checks
  if (code.length > 0) {
    // Check for SPDX license
    if (!code.includes('SPDX-License-Identifier:')) {
      results.push({
        id: "LICENSE",
        title: "Missing SPDX License",
        description: "Source code should include an SPDX license identifier",
        severity: "info",
        recommendation: "Add an SPDX license identifier (e.g., // SPDX-License-Identifier: MIT)"
      });
    }

    // Check for NatSpec comments
    if (!code.includes('/// @')) {
      results.push({
        id: "NATSPEC",
        title: "Missing NatSpec Comments",
        description: "Functions should be documented using NatSpec format",
        severity: "info",
        recommendation: "Add NatSpec comments to document contract and functions"
      });
    }
  }

  return results;
}

export function calculateScore(results: SecurityResult[]): number {
  const severityWeights = {
    critical: -40,
    high: -20,
    medium: -10,
    low: -5,
    info: 0
  };

  // Count issues by severity
  const counts = results.reduce((acc, result) => {
    acc[result.severity] = (acc[result.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Base score starts at 100
  let score = 100;

  // Apply weighted deductions
  Object.entries(counts).forEach(([severity, count]) => {
    score += severityWeights[severity as keyof typeof severityWeights] * count;
  });

  return Math.max(0, Math.min(100, score));
}