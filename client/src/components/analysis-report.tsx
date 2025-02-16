import { SecurityResult } from "@shared/schema";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

  const severityColors = {
    critical: "text-red-500 border-red-200 bg-red-50",
    high: "text-orange-500 border-orange-200 bg-orange-50",
    medium: "text-yellow-600 border-yellow-200 bg-yellow-50",
    low: "text-blue-500 border-blue-200 bg-blue-50",
    info: "text-gray-500 border-gray-200 bg-gray-50"
  };

  const sortedResults = [...results].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );

  const issuesByCategory = sortedResults.reduce((acc, result) => {
    acc[result.severity] = acc[result.severity] || [];
    acc[result.severity].push(result);
    return acc;
  }, {} as Record<string, SecurityResult[]>);

  const scoreColor = score >= 90 ? "text-green-600" :
                    score >= 70 ? "text-yellow-600" :
                    "text-red-600";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Security Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Progress value={score} className="h-4" />
              <span className={`text-xl font-bold ml-4 ${scoreColor}`}>
                {score}/100
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {results.length} issues found
            </p>
          </div>
        </CardContent>
      </Card>

      {Object.entries(issuesByCategory).map(([severity, items]) => (
        <div key={severity} className="space-y-4">
          <div className="flex items-center gap-2">
            {severityIcons[severity as keyof typeof severityIcons]}
            <h3 className="text-lg font-semibold capitalize">{severity} Issues</h3>
            <Badge variant="outline" className={severityColors[severity as keyof typeof severityColors]}>
              {items.length}
            </Badge>
          </div>

          <div className="space-y-3">
            {items.map((result) => (
              <Alert key={result.id} variant="outline" className="border-l-4 border-l-current">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <AlertTitle className="flex items-center gap-2">
                      {result.title}
                      {result.line && (
                        <span className="text-xs font-normal text-muted-foreground">
                          Line {result.line}
                        </span>
                      )}
                    </AlertTitle>
                    <AlertDescription className="mt-2">
                      <p className="mb-2 text-sm">{result.description}</p>
                      <div className="mt-3 p-3 bg-muted/50 rounded-md">
                        <p className="text-sm font-medium mb-1">Recommendation:</p>
                        <p className="text-sm">{result.recommendation}</p>
                      </div>
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}