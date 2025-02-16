import type { SecurityResult } from "@shared/schema";

interface Pattern {
  regex: RegExp;
  check: (match: RegExpMatchArray, code: string) => SecurityResult;
}

const patterns: Pattern[] = [
  {
    regex: /function\s+\w+\s*\([^)]*\)\s*public(?!\s+view)/g,
    check: (match) => ({
      id: "PUBLIC_FUNCTION",
      title: "Public Function Found",
      description: "Public functions should be carefully reviewed for access control",
      severity: "medium",
      line: getLineNumber(match),
      recommendation: "Consider adding access modifiers or making the function internal/private if possible"
    })
  },
  {
    regex: /selfdestruct|suicide/g,
    check: (match) => ({
      id: "SELFDESTRUCT",
      title: "Self Destruct Found",
      description: "The selfdestruct operation is dangerous and can leave the contract vulnerable",
      severity: "critical",
      line: getLineNumber(match),
      recommendation: "Remove selfdestruct if not absolutely necessary"
    })
  },
  {
    regex: /tx\.origin/g,
    check: (match) => ({
      id: "TX_ORIGIN",
      title: "tx.origin Usage",
      description: "Using tx.origin for authentication is vulnerable to phishing attacks",
      severity: "high",
      line: getLineNumber(match),
      recommendation: "Use msg.sender instead of tx.origin"
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
  
  patterns.forEach(pattern => {
    const matches = code.matchAll(pattern.regex);
    for (const match of matches) {
      results.push(pattern.check(match, code));
    }
  });

  // Add general checks
  if (code.length > 0) {
    results.push({
      id: "COMPILER_VERSION",
      title: "Compiler Version",
      description: "Using a stable compiler version is recommended",
      severity: "info",
      recommendation: "Specify exact compiler version (e.g. pragma solidity 0.8.9;)"
    });
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

  const baseScore = 100;
  return Math.max(0, results.reduce((score, result) => 
    score + severityWeights[result.severity], baseScore));
}
