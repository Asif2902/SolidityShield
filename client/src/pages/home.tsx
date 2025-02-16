import { useState } from "react";
import { CodeEditor } from "@/components/code-editor";
import { AnalysisReport } from "@/components/analysis-report";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Download } from "lucide-react";
import { analyzeCode } from "@/lib/security-rules";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SecurityResult } from "@shared/schema";
import { generateAuditReport } from "@/lib/pdf-generator";

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

  const handleDownloadReport = async () => {
    if (!results.length || !scores) {
      toast({
        title: "No Analysis Results",
        description: "Please analyze your code first before downloading the report",
        variant: "destructive",
      });
      return;
    }

    try {
      const doc = generateAuditReport(code, results, scores);
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'smart-contract-audit-report.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Report Downloaded",
        description: "Your audit report has been downloaded successfully",
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to generate the audit report. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Solidity Security Analyzer
          </h1>
          <p className="text-muted-foreground text-lg">
            Analyze your smart contract code for potential security issues,
            gas optimizations, and best practices
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Contract Code</h2>
            <CodeEditor value={code} onChange={setCode} />
            <Button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full"
            >
              {analyzing ? "Analyzing..." : "Analyze Contract"}
            </Button>
            <Button
              onClick={handleDownloadReport}
              variant="outline"
              className="w-full mt-2 gap-2"
              disabled={analyzing || !results.length}
            >
              <Download className="h-4 w-4" />
              Download Audit Report
            </Button>
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Analysis Results</h2>

            {results.length > 0 && scores && (
              <>
                <Alert variant="warning">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This is an automated analysis tool. Always consult with professional smart contract auditors before deploying to production.
                  </AlertDescription>
                </Alert>

                <AnalysisReport
                  results={results}
                  scores={scores}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}