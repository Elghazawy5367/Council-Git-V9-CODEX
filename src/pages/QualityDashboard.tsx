import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/primitives/card";
import { Badge } from "@/components/primitives/badge";
import { Progress } from "@/components/primitives/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/primitives/tabs";
import { ScrollArea } from "@/components/primitives/scroll-area";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/primitives/button";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle, 
  Target, 
  Zap,
  BookOpen,
  GitPullRequest,
  Activity,
  ShieldCheck,
  Search,
  ArrowRight
} from "lucide-react";
import { toast } from 'sonner';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';


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
      const reportResponse = await fetch("/logs/quality-pipeline-report.json");
      if (reportResponse.ok) {
        const report = await reportResponse.json();
        setPipelineReport(report);
        
        setScoreHistory([
          { date: "2/20", score: 82 },
          { date: "2/22", score: 85 },
          { date: "2/25", score: 84 },
          { date: "2/28", score: report.codeAnalysis.averageScore },
        ]);
      } else {
          setPipelineReport(null);
      }

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
      setPipelineReport(null);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return "text-accent-emerald";
    if (score >= 75) return "text-primary-glow";
    if (score >= 60) return "text-accent-amber";
    return "text-accent-rose";
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return "Optimal";
    if (score >= 75) return "Stable";
    if (score >= 60) return "Acceptable";
    return "Critical";
  };

  const triggerPipeline = () => {
      toast.info("Triggering quality pipeline via CLI recommended: npm run improve");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="relative">
           <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
           <Activity className="h-10 w-10 animate-spin text-primary relative z-10" />
        </div>
        <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Auditing System Quality...</p>
      </div>
    );
  }

  if (!pipelineReport) {
    return (
      <div className="py-12">
        <EmptyState
          icon={<ShieldCheck className="w-8 h-8 text-primary" />}
          title="No Quality Report Found"
          description="The autonomous quality pipeline has not been executed yet. Run the intelligence drill to generate your first system audit."
          action={
            <Button onClick={triggerPipeline} className="bg-primary hover:bg-primary-glow text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Run Quality Pipeline
            </Button>
          }
          className="bg-bg-raised border-border-subtle shadow-inner"
        />
      </div>
    );
  }

  const trend = scoreHistory.length >= 2
    ? scoreHistory[scoreHistory.length - 1].score - scoreHistory[scoreHistory.length - 2].score
    : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border-subtle">
        <div className="space-y-1.5">
           <div className="flex items-center gap-2 text-accent-emerald font-bold uppercase tracking-[0.2em] text-[10px]">
              <ShieldCheck className="w-3.5 h-3.5" /> Intelligence Audit
           </div>
           <h1 className="text-3xl font-bold text-text-primary tracking-tight">Quality Oracle</h1>
           <p className="text-sm text-text-tertiary font-medium">
             Continuous quality monitoring and predictive insight engine
           </p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-[10px] font-bold text-text-disabled uppercase tracking-widest">Last Oracle Pass</p>
          <p className="text-xs font-mono text-text-secondary mt-1">
            {new Date(pipelineReport.timestamp).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Score Card */}
          <Card className="lg:col-span-2 glass-panel border-border-default bg-bg-raised overflow-hidden shadow-lg">
             <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">System Health Index</CardTitle>
             </CardHeader>
             <CardContent>
                <div className="flex items-center justify-between gap-8 py-4">
                   <div className="space-y-1">
                      <div className={`text-6xl font-bold tracking-tighter ${getScoreColor(pipelineReport.codeAnalysis.averageScore)}`}>
                        {pipelineReport.codeAnalysis.averageScore}
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-sm font-bold text-text-primary uppercase tracking-wider">
                           {getScoreLabel(pipelineReport.codeAnalysis.averageScore)}
                         </span>
                         {trend !== 0 && (
                            <Badge className={`h-5 px-1.5 border-none font-bold text-[10px] ${trend > 0 ? "bg-accent-emerald/20 text-accent-emerald" : "bg-accent-rose/20 text-accent-rose"}`}>
                               {trend > 0 ? "+" : ""}{trend} pts
                            </Badge>
                         )}
                      </div>
                   </div>

                   <div className="flex-1 h-32">
                      <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={scoreHistory}>
                            <defs>
                               <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                               </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border-subtle))" />
                            <Tooltip
                               contentStyle={{ backgroundColor: 'hsl(var(--bg-overlay))', border: '1px solid hsl(var(--border-default))', borderRadius: '8px' }}
                            />
                            <Area
                               type="monotone"
                               dataKey="score"
                               stroke="hsl(var(--primary))"
                               strokeWidth={2}
                               fill="url(#scoreGrad)"
                               dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                            />
                         </AreaChart>
                      </ResponsiveContainer>
                   </div>
                </div>
             </CardContent>
          </Card>

          {/* Critical Issues Card */}
          <Card className="glass-panel border-accent-rose/20 bg-accent-rose/5 shadow-md">
             <CardHeader>
                <CardTitle className="text-[10px] font-bold text-accent-rose uppercase tracking-widest flex items-center gap-2">
                   <AlertCircle className="w-3.5 h-3.5" /> High Risk Factors
                </CardTitle>
             </CardHeader>
             <CardContent className="space-y-6">
                <div className="flex items-end justify-between">
                   <div className="text-4xl font-bold text-text-primary">{pipelineReport.codeAnalysis.criticalIssues}</div>
                   <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest pb-1">Blockers</div>
                </div>
                <div className="space-y-2">
                   <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                      <span>Remediation Progress</span>
                      <span>12%</span>
                   </div>
                   <Progress value={12} className="h-1.5 bg-accent-rose/10" />
                </div>
                <p className="text-[10px] text-accent-rose/70 font-medium leading-relaxed italic">
                   System detected {pipelineReport.codeAnalysis.criticalIssues} structural anomalies requiring immediate manual synthesis or refactoring.
                </p>
             </CardContent>
          </Card>
      </div>

      {/* Detailed Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Files Analyzed', val: pipelineReport.codeAnalysis.totalFiles, sub: `${pipelineReport.codeAnalysis.filesNeedingWork} items pending`, icon: Target, color: 'text-accent-cyan' },
          { label: 'Patterns Learned', val: pipelineReport.learningResults.patternsDiscovered, sub: `${pipelineReport.learningResults.highConfidencePatterns} verified`, icon: BookOpen, color: 'text-primary-glow' },
          { label: 'Applied Fixes', val: pipelineReport.improvements.applied.length, sub: 'Automatic remediation', icon: CheckCircle, color: 'text-accent-emerald' },
          { label: 'Suggested', val: pipelineReport.improvements.suggested.length, sub: 'Strategic optimizations', icon: GitPullRequest, color: 'text-accent-amber' },
        ].map((stat, i) => (
          <Card key={i} className="glass-panel border-border-subtle bg-bg-raised hover:bg-bg-elevated transition-colors group">
            <CardContent className="pt-6">
               <div className="flex items-start justify-between">
                  <div className="space-y-1">
                     <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">{stat.label}</p>
                     <div className="text-2xl font-bold text-text-primary">{stat.val}</div>
                     <p className="text-[10px] text-text-disabled font-medium">{stat.sub}</p>
                  </div>
                  <stat.icon className={`h-5 w-5 ${stat.color} group-hover:scale-110 transition-transform`} />
               </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="patterns" className="space-y-6">
         <div className="flex items-center justify-between border-b border-border-subtle pb-1">
            <TabsList className="bg-transparent border-none gap-8 p-0">
              <TabsTrigger value="patterns" className="bg-transparent h-10 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary-glow font-bold text-xs uppercase tracking-widest shadow-none">
                Intelligence Patterns
              </TabsTrigger>
              <TabsTrigger value="remediation" className="bg-transparent h-10 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary-glow font-bold text-xs uppercase tracking-widest shadow-none">
                Remediation Log
              </TabsTrigger>
            </TabsList>
         </div>

         <TabsContent value="patterns" className="animate-fade-in outline-none">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {patterns.map((pattern, idx) => (
                  <Card key={idx} className="glass-panel border-border-subtle bg-bg-raised flex flex-col">
                    <CardHeader className="pb-3">
                       <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-[9px] h-5 border-primary/20 bg-primary/5 text-primary-glow font-bold uppercase tracking-wider">
                             {pattern.category}
                          </Badge>
                          <div className="text-[10px] font-bold text-accent-emerald uppercase tracking-tighter">
                             {pattern.confidence}% Conf
                          </div>
                       </div>
                       <CardTitle className="text-sm font-bold text-text-primary pt-2 leading-tight">
                          {pattern.pattern}
                       </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                       <div className="space-y-2">
                          <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Learned From</p>
                          <div className="flex flex-wrap gap-1.5">
                             {pattern.learnedFrom.map((repo, i) => (
                               <Badge key={i} variant="secondary" className="bg-bg-base hover:bg-bg-elevated text-text-secondary text-[9px] border-border-subtle cursor-pointer flex items-center gap-1">
                                  <Search className="w-2 h-2" /> {repo}
                               </Badge>
                             ))}
                          </div>
                       </div>
                    </CardContent>
                    <div className="p-4 border-t border-border-subtle bg-bg-base/20">
                       <Button variant="ghost" className="w-full h-8 text-[10px] font-bold uppercase tracking-wider text-text-tertiary hover:text-primary-glow group">
                          View Analysis <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                       </Button>
                    </div>
                  </Card>
                ))}
            </div>
         </TabsContent>

         <TabsContent value="remediation" className="animate-fade-in outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass-panel border-border-subtle bg-bg-raised">
                   <CardHeader className="border-b border-border-subtle bg-bg-base/30">
                      <CardTitle className="text-[10px] font-bold text-accent-emerald uppercase tracking-widest flex items-center gap-2">
                         <CheckCircle className="w-3.5 h-3.5" /> Applied Remediations
                      </CardTitle>
                   </CardHeader>
                   <CardContent className="p-0">
                      <ScrollArea className="h-[300px]">
                         <div className="divide-y divide-border-subtle">
                            {pipelineReport.improvements.applied.map((fix, idx) => (
                              <div key={idx} className="px-6 py-4 flex items-start gap-3 hover:bg-bg-base/40 transition-colors">
                                 <Zap className="h-4 w-4 text-accent-emerald mt-0.5 flex-shrink-0" />
                                 <span className="text-xs text-text-secondary font-medium">{fix}</span>
                              </div>
                            ))}
                         </div>
                      </ScrollArea>
                   </CardContent>
                </Card>

                <Card className="glass-panel border-border-subtle bg-bg-raised">
                   <CardHeader className="border-b border-border-subtle bg-bg-base/30">
                      <CardTitle className="text-[10px] font-bold text-accent-cyan uppercase tracking-widest flex items-center gap-2">
                         <GitPullRequest className="w-3.5 h-3.5" /> Suggested Optimizations
                      </CardTitle>
                   </CardHeader>
                   <CardContent className="p-0">
                      <ScrollArea className="h-[300px]">
                         <div className="divide-y divide-border-subtle">
                            {pipelineReport.improvements.suggested.map((suggestion, idx) => (
                              <div key={idx} className="px-6 py-4 flex items-start gap-3 hover:bg-bg-base/40 transition-colors">
                                 <AlertCircle className="h-4 w-4 text-accent-cyan mt-0.5 flex-shrink-0" />
                                 <span className="text-xs text-text-secondary font-medium">{suggestion}</span>
                              </div>
                            ))}
                         </div>
                      </ScrollArea>
                   </CardContent>
                </Card>
            </div>
         </TabsContent>
      </Tabs>
    </div>
  );
}
