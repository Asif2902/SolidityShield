import { SecurityResult } from "@shared/schema";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle, Info, Shield, Zap, Code, Book } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AnalysisScores {
  security: number;
  gas: number;
  codeQuality: number;
  bestPractices: number;
  overall: number;
}

interface AnalysisReportProps {
  results: SecurityResult[];
  scores: AnalysisScores;
}

export function AnalysisReport({ results, scores }: AnalysisReportProps) {
  const severityIcons = {
    critical: <AlertCircle className="h-5 w-5 text-red-500" />,
    high: <AlertTriangle className="h-5 w-5 text-orange-500" />,
    medium: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    low: <Info className="h-5 w-5 text-blue-500" />,
    info: <Info className="h-5 w-5 text-gray-500" />
  };

  const categoryIcons = {
    security: <Shield className="h-5 w-5" />,
    gas: <Zap className="h-5 w-5" />,
    codeQuality: <Code className="h-5 w-5" />,
    bestPractices: <Book className="h-5 w-5" />
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

  const getScoreColor = (score: number) => 
    score >= 90 ? "text-green-600" :
    score >= 70 ? "text-yellow-600" :
    "text-red-600";

  const sortedResults = [...results].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );

  const issuesByCategory = sortedResults.reduce((acc, result) => {
    acc[result.severity] = acc[result.severity] || [];
    acc[result.severity].push(result);
    return acc;
  }, {} as Record<string, SecurityResult[]>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Overall Analysis Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Progress value={scores.overall} className="h-4" />
                <span className={`text-2xl font-bold ml-4 ${getScoreColor(scores.overall)}`}>
                  {scores.overall}/100
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {results.length} issues found
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {categoryIcons.security}
                  <span className="font-medium">Security Score</span>
                  <span className={`ml-auto font-bold ${getScoreColor(scores.security)}`}>
                    {scores.security}/100
                  </span>
                </div>
                <Progress value={scores.security} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {categoryIcons.gas}
                  <span className="font-medium">Gas Optimization</span>
                  <span className={`ml-auto font-bold ${getScoreColor(scores.gas)}`}>
                    {scores.gas}/100
                  </span>
                </div>
                <Progress value={scores.gas} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {categoryIcons.codeQuality}
                  <span className="font-medium">Code Quality</span>
                  <span className={`ml-auto font-bold ${getScoreColor(scores.codeQuality)}`}>
                    {scores.codeQuality}/100
                  </span>
                </div>
                <Progress value={scores.codeQuality} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {categoryIcons.bestPractices}
                  <span className="font-medium">Best Practices</span>
                  <span className={`ml-auto font-bold ${getScoreColor(scores.bestPractices)}`}>
                    {scores.bestPractices}/100
                  </span>
                </div>
                <Progress value={scores.bestPractices} className="h-2" />
              </div>
            </div>
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
              <Alert key={`${result.id}-${result.line || 0}`} className="border-l-4 border-l-current">
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