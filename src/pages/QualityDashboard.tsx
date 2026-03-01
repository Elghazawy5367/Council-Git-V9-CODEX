import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/primitives/card";
import { Badge } from "@/components/primitives/badge";
import { Progress } from "@/components/primitives/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/primitives/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/primitives/alert";
import { ScrollArea } from "@/components/primitives/scroll-area";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle, 
  Target, 
  Zap,
  BookOpen,
  GitPullRequest,
  Activity
} from "lucide-react";
import { toast } from 'sonner';


interface PipelineReport {
  timestamp: string;
  codeAnalysis: {
    averageScore: number;
    totalFiles: number;
    criticalIssues: number;
    filesNeedingWork: number;
  };
  learningResults: {
    patternsDiscovered: number;
    highConfidencePatterns: number;
    recommendations: string[];
  };
  improvements: {
    applied: string[];
    suggested: string[];
  };
  nextSteps: string[];
}

interface SuccessPattern {
  category: string;
  pattern: string;
  confidence: number;
  learnedFrom: string[];
}

export default function QualityDashboard(): JSX.Element {
  const [pipelineReport, setPipelineReport] = useState<PipelineReport | null>(null);
  const [patterns, setPatterns] = useState<SuccessPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoreHistory, setScoreHistory] = useState<Array<{ date: string; score: number }>>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async (): Promise<void> => {
    try {
      // Load pipeline report
      const reportResponse = await fetch("/logs/quality-pipeline-report.json");
      if (reportResponse.ok) {
        const report = await reportResponse.json();
        setPipelineReport(report);
        
        // Add to history
        setScoreHistory(prev => [
          ...prev,
          {
            date: new Date(report.timestamp).toLocaleDateString(),
            score: report.codeAnalysis.averageScore,
          },
        ].slice(-10)); // Keep last 10 entries
      }

      // Load learned patterns (mock data for now)
      const mockPatterns: SuccessPattern[] = [
        {
          category: "positioning",
          pattern: "Clear problem statement in first paragraph",
          confidence: 85,
          learnedFrom: ["shadcn/ui", "vercel/next.js"],
        },
        {
          category: "features",
          pattern: "Interactive examples/playground",
          confidence: 75,
          learnedFrom: ["AutoGPT", "langflow"],
        },
        {
          category: "architecture",
          pattern: "Plugin/extension system",
          confidence: 70,
          learnedFrom: ["vite", "rollup"],
        },
      ];
      setPatterns(mockPatterns);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return "text-green-500";
    if (score >= 75) return "text-blue-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Good";
    if (score >= 60) return "Acceptable";
    return "Needs Work";
  };

  const getConfidenceBadge = (confidence: number): JSX.Element => {
    if (confidence >= 80) {
      return <Badge variant="default" className="bg-green-500">Very High</Badge>;
    }
    if (confidence >= 60) {
      return <Badge variant="default" className="bg-blue-500">High</Badge>;
    }
    if (confidence >= 40) {
      return <Badge variant="secondary">Moderate</Badge>;
    }
    return <Badge variant="outline">Low</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading quality dashboard...</p>
        </div>
      </div>
    );
  }

  const trend = pipelineReport && scoreHistory.length >= 2
    ? scoreHistory[scoreHistory.length - 1].score - scoreHistory[scoreHistory.length - 2].score
    : 0;

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Quality Oracle</h1>
          <p className="text-muted-foreground mt-2 italic flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            Predictive Quality Dashboard (2026 Edition)
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Status</p>
          <p className="text-sm font-medium flex items-center justify-end gap-1">
            {pipelineReport ? (
              <>
                <CheckCircle className="h-3 w-3 text-green-500" />
                Live Monitoring
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3 text-yellow-500" />
                Awaiting Data
              </>
            )}
          </p>
        </div>
      </div>

      {!pipelineReport ? (
        <Alert className="bg-muted/50 border-dashed">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Pipeline Data Available</AlertTitle>
          <AlertDescription>
            Run the predictive quality pipeline to hydrate the Oracle:
            <code className="block mt-2 p-2 bg-background/50 rounded border">npm run improve</code>
          </AlertDescription>
        </Alert>
      ) : (
        <>
      {/* Overall Score Card */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Overall Quality Score</CardTitle>
              <CardDescription>Aggregated code quality metrics</CardDescription>
            </div>
            <div className="text-right">
              <div className={`text-5xl font-bold ${getScoreColor(pipelineReport.codeAnalysis.averageScore)}`}>
                {pipelineReport.codeAnalysis.averageScore}
              </div>
              <div className="text-sm text-muted-foreground">
                {getScoreLabel(pipelineReport.codeAnalysis.averageScore)}
              </div>
              {trend !== 0 && (
                <div className={`flex items-center gap-1 mt-2 ${trend > 0 ? "text-green-500" : "text-red-500"}`}>
                  {trend > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span className="text-sm font-medium">{Math.abs(trend)} pts</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              Files Analyzed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pipelineReport.codeAnalysis.totalFiles}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {pipelineReport.codeAnalysis.filesNeedingWork} need work
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              Critical Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pipelineReport.codeAnalysis.criticalIssues}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-500" />
              Patterns Learned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pipelineReport.learningResults.patternsDiscovered}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {pipelineReport.learningResults.highConfidencePatterns} high confidence
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Improvements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pipelineReport.improvements.applied.length + pipelineReport.improvements.suggested.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {pipelineReport.improvements.applied.length} applied
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="patterns">Learned Patterns</TabsTrigger>
          <TabsTrigger value="improvements">Improvements</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quality Breakdown</CardTitle>
              <CardDescription>Scores across different categories</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mock detailed scores - in real app, would come from report */}
              {[
                { name: "Error Handling", score: 99 },
                { name: "Type Safety", score: 99 },
                { name: "Performance", score: 99 },
                { name: "Architecture", score: 99 },
              ].map((category) => (
                <div key={category.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{category.name}</span>
                    <span className={`text-sm font-bold ${getScoreColor(category.score)}`}>
                      {category.score}/100
                    </span>
                  </div>
                  <Progress value={category.score} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <ul className="space-y-3">
                  {pipelineReport.nextSteps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-primary font-bold mt-0.5">{idx + 1}.</span>
                      <span className="text-sm">{step}</span>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Success Patterns from Elite Repositories</CardTitle>
              <CardDescription>
                Patterns discovered by analyzing top GitHub projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {patterns.map((pattern, idx) => (
                    <Card key={idx} className="border-l-4 border-l-primary">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <Badge variant="outline" className="mb-2">
                              {pattern.category}
                            </Badge>
                            <CardTitle className="text-base">{pattern.pattern}</CardTitle>
                          </div>
                          {getConfidenceBadge(pattern.confidence)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Confidence: {pattern.confidence}%</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div className="text-sm text-muted-foreground">
                              <span>Learned from: </span>
                              {pattern.learnedFrom.map((repo, i) => (
                                <span key={i}>
                                  <a 
                                    href={`https://github.com/${repo}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                  >
                                    {repo}
                                  </a>
                                  {i < pattern.learnedFrom.length - 1 && ", "}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Improvements Tab */}
        <TabsContent value="improvements" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Applied Fixes ({pipelineReport.improvements.applied.length})
                </CardTitle>
                <CardDescription>Automatically applied improvements</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {pipelineReport.improvements.applied.length > 0 ? (
                    <ul className="space-y-2">
                      {pipelineReport.improvements.applied.map((fix, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{fix}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No automatic fixes applied yet.</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitPullRequest className="h-5 w-5 text-blue-500" />
                  Suggested ({pipelineReport.improvements.suggested.length})
                </CardTitle>
                <CardDescription>Manual improvements recommended</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {pipelineReport.improvements.suggested.length > 0 ? (
                    <ul className="space-y-2">
                      {pipelineReport.improvements.suggested.map((suggestion, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No suggestions at this time.</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recommendations from Learning</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <ul className="space-y-2">
                  {pipelineReport.learningResults.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-primary font-bold mt-0.5">{idx + 1}.</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quality Score History</CardTitle>
              <CardDescription>Track improvement over time</CardDescription>
            </CardHeader>
            <CardContent>
              {scoreHistory.length > 0 ? (
                <div className="space-y-4">
                  {scoreHistory.map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground w-24">{entry.date}</span>
                      <Progress value={entry.score} className="flex-1 h-3" />
                      <span className={`text-sm font-bold w-12 ${getScoreColor(entry.score)}`}>
                        {entry.score}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Run the quality pipeline multiple times to see history.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </>
      )}
    </div>
  );
}
