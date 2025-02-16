import { SecurityResult } from "@shared/schema";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";

interface AnalysisReportProps {
  results: SecurityResult[];
  score: number;
}

export function AnalysisReport({ results, score }: AnalysisReportProps) {
  const severityIcons = {
    critical: <AlertCircle className="h-5 w-5 text-red-500" />,
    high: <AlertTriangle className="h-5 w-5 text-orange-500" />,
    medium: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    low: <Info className="h-5 w-5 text-blue-500" />,
    info: <Info className="h-5 w-5 text-gray-500" />
  };

  const severityOrder: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    info: 4
  };

  const sortedResults = [...results].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Security Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={score} className="h-4" />
            <p className="text-sm text-muted-foreground text-right">
              {score}/100
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {sortedResults.map((result) => (
          <Alert key={result.id} variant="outline">
            <div className="flex items-start gap-4">
              {severityIcons[result.severity]}
              <div className="flex-1">
                <AlertTitle className="flex items-center gap-2">
                  {result.title}
                  <span className="text-xs font-normal text-muted-foreground">
                    {result.line ? `Line ${result.line}` : null}
                  </span>
                </AlertTitle>
                <AlertDescription className="mt-2">
                  <p className="mb-2">{result.description}</p>
                  <p className="text-sm font-medium">Recommendation:</p>
                  <p className="text-sm">{result.recommendation}</p>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        ))}
      </div>
    </div>
  );
}
