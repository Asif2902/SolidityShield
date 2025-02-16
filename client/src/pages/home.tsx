import { useState } from "react";
import { CodeEditor } from "@/components/code-editor";
import { AnalysisReport } from "@/components/analysis-report";
import { Button } from "@/components/ui/button";
import { analyzeCode } from "@/lib/security-rules";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SecurityResult } from "@shared/schema";

interface AnalysisScores {
  security: number;
  gas: number;
  codeQuality: number;
  bestPractices: number;
  overall: number;
}

export default function Home() {
  const [code, setCode] = useState("");
  const [results, setResults] = useState<SecurityResult[]>([]);
  const [scores, setScores] = useState<AnalysisScores>();
  const [analyzing, setAnalyzing] = useState(false);
  const { toast } = useToast();

  async function handleAnalyze() {
    if (!code.trim()) {
      toast({
        title: "No Code",
        description: "Please enter some Solidity code to analyze",
        variant: "destructive",
      });
      return;
    }

    setAnalyzing(true);
    try {
      const analysis = analyzeCode(code);

      await apiRequest("POST", "/api/analyze", {
        code,
        results: analysis.results,
        score: analysis.scores.overall,
        timestamp: new Date().toISOString(),
      });

      setResults(analysis.results);
      setScores(analysis.scores);

      toast({
        title: "Analysis Complete",
        description: `Found ${analysis.results.length} potential issues`,
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "There was an error analyzing your code",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Solidity Security Analyzer
          </h1>
          <p className="text-muted-foreground">
            Paste your Solidity smart contract code below to analyze it for potential security issues, 
            gas optimizations, and best practices
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Contract Code</h2>
            <CodeEditor value={code} onChange={setCode} />
            <Button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full"
            >
              {analyzing ? "Analyzing..." : "Analyze Contract"}
            </Button>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Analysis Results</h2>
            {results.length > 0 && scores && (
              <AnalysisReport
                results={results}
                scores={scores}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}