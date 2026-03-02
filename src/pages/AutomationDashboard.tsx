import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/primitives/card';
import { Button } from '@/components/primitives/button';
import { Badge } from '@/components/primitives/badge';
import { Play, CheckCircle2, Clock, ExternalLink, ArrowLeft, Github, Calendar, Settings, Zap, LayoutGrid, List, AlertCircle, RefreshCcw, ShieldCheck, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GITHUB_OWNER, GITHUB_REPO, GITHUB_REPO_URL } from '@/lib/config';
import { useFeatureConfigStore } from '@/features/council/store/feature-config-store';
import { parseCronSchedule } from '@/lib/workflow-dispatcher';
import { MiningDrillPanel } from '@/features/council/components/MiningDrillPanel';
import { GoldmineDetector } from '@/features/council/components/GoldmineDetector';
import { loadAllOpportunities } from '@/lib/opportunity-loader';
import { Opportunity } from '@/lib/goldmine-detector';
import { getSessionKeys } from '@/features/council/lib/vault';
import { toast } from 'sonner';
import { EmptyState } from '@/components/EmptyState';
import { cn } from '@/lib/utils';

const FeatureConfigModal = lazy(() => import('@/features/council/components/FeatureConfigModal'));

interface Feature {
  id: string;
  name: string;
  description: string;
  icon: string;
  workflow: string;
  schedule: string;
  lastRun?: string;
  status: 'idle' | 'scheduled' | 'active' | 'error';
}

const AutomationDashboard: React.FC = () => {
  const navigate = useNavigate();
  const repoOwner = GITHUB_OWNER;
  const repoName = GITHUB_REPO;
  
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loadingOpportunities, setLoadingOpportunities] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('automation-view-mode') as 'grid' | 'list') || 'grid';
  });
  
  const { 
    scout, mirror, quality, selfImprove, githubTrending, marketGap, redditSniper,
    redditPainPoints, viralRadar, hackerNews, twinMimicry, forkEvolution,
    promptHeist, stargazerAnalysis
  } = useFeatureConfigStore();
  
  const loadData = async (): Promise<void> => {
    setLoadingOpportunities(true);
    setLoadError(null);
    try {
      const keys = getSessionKeys();
      const opps = await loadAllOpportunities(keys?.githubApiKey);
      setOpportunities(opps);
    } catch (error: any) {
      console.error('Failed to load opportunities:', error);
      setLoadError(error.message || 'Unknown network error');
    } finally {
      setLoadingOpportunities(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    localStorage.setItem('automation-view-mode', viewMode);
  }, [viewMode]);
  
  const [features, setFeatures] = useState<Feature[]>([]);

  useEffect(() => {
    setFeatures([
      { id: 'github-trending', name: 'GitHub Trending', description: 'Scans trending repositories for market opportunities', icon: '📈', workflow: 'github-trending.yml', schedule: githubTrending.schedule, status: githubTrending.enabled ? 'active' : 'idle' },
      { id: 'market-gap', name: 'Market Gap Identifier', description: 'Identifies underserved market gaps using GitHub & Reddit', icon: '🎯', workflow: 'market-gap.yml', schedule: marketGap.schedule, status: marketGap.enabled ? 'active' : 'idle' },
      { id: 'stargazer', name: 'Stargazer Analysis', description: 'Analyze repository stars for institutional backing', icon: '⭐', workflow: 'stargazer-analysis.yml', schedule: '0 0 * * *', status: stargazerAnalysis.enabled ? 'active' : 'idle' },
      { id: 'mirror', name: 'Code Mirror System', description: 'Analyze codebase against elite repository standards', icon: '🔄', workflow: 'code-mirror.yml', schedule: mirror.schedule, status: mirror.enabled ? 'active' : 'idle' },
      { id: 'quality', name: 'QUALITY Amplification Pipeline', description: 'Run full quality analysis and improvement pipeline', icon: '⚡', workflow: 'quality-pipeline.yml', schedule: quality.schedule, status: quality.enabled ? 'active' : 'idle' },
      { id: 'learn', name: 'Self-Improving Loop', description: 'Learn patterns from successful repositories', icon: '🧠', workflow: 'self-improve.yml', schedule: selfImprove.schedule, status: selfImprove.enabled ? 'active' : 'idle' },
      { id: 'reddit-sniper', name: 'Reddit Sniper', description: 'Detect high-intent buying signals on Reddit in real-time', icon: '🎯', workflow: 'reddit-sniper.yml', schedule: redditSniper.schedule, status: redditSniper.enabled ? 'active' : 'idle' },
      { id: 'reddit-pain-points', name: 'Reddit Pain Points', description: 'Extract market gaps and user frustrations from subreddits', icon: '💬', workflow: 'reddit-pain-points.yml', schedule: redditPainPoints.schedule, status: redditPainPoints.enabled ? 'active' : 'idle' },
      { id: 'viral-radar', name: 'Viral Radar', description: 'Track viral trends across Twitter, Reddit, and HN', icon: '📡', workflow: 'viral-radar.yml', schedule: viralRadar.schedule, status: viralRadar.enabled ? 'active' : 'idle' },
      { id: 'hackernews', name: 'HackerNews Intelligence', description: 'Extract buying intent signals and tech trends from HN', icon: '🗞️', workflow: 'hackernews-producthunt.yml', schedule: hackerNews.schedule, status: hackerNews.enabled ? 'active' : 'idle' },
      { id: 'twin-mimicry', name: 'Twin Mimicry', description: 'Mimic high-performing repository styles and patterns', icon: '👯', workflow: 'twin-mimicry.yml', schedule: twinMimicry.schedule, status: twinMimicry.enabled ? 'active' : 'idle' },
      { id: 'fork-evolution', name: 'Fork Evolution', description: 'Track high-value forks and their innovative changes', icon: '🍴', workflow: 'fork-evolution.yml', schedule: forkEvolution.schedule, status: forkEvolution.enabled ? 'active' : 'idle' },
      { id: 'heist', name: 'The HEIST', description: 'Import 290+ world-class prompts from danielmiessler/fabric', icon: '🎭', workflow: 'heist-prompts.ts', schedule: 'monthly', status: promptHeist.enabled ? 'active' : 'idle' },
      { id: 'scout', name: 'Phantom Scout', description: '24/7 automated GitHub intelligence gathering', icon: '👻', workflow: 'daily-scout.yml', schedule: scout.schedule, status: scout.enabled ? 'active' : 'idle' },
      { id: 'sonar', name: 'Sonar (Blue Ocean Scanner)', description: 'Detect abandoned high-value repositories', icon: '📡', workflow: 'daily-scout.yml', schedule: scout.schedule, status: scout.enabled ? 'active' : 'idle' },
    ]);
  }, [scout, mirror, quality, selfImprove, githubTrending, marketGap, redditSniper, redditPainPoints, viralRadar, twinMimicry, forkEvolution, promptHeist, stargazerAnalysis, hackerNews]);

  const getWorkflowUrl = (workflow: string): string => `https://github.com/${repoOwner}/${repoName}/actions/workflows/${workflow}`;
  const getTriggerUrl = (workflow: string): string => `https://github.com/${repoOwner}/${repoName}/actions/workflows/${workflow}`;

  const getStatusBadge = (status: Feature['status']): JSX.Element => {
    const variants: Record<Feature['status'], { className: string; label: string; icon: JSX.Element }> = {
      idle: { className: 'bg-bg-elevated text-text-tertiary border-border-subtle', label: 'Idle', icon: <div className="w-1.5 h-1.5 rounded-full bg-text-disabled" /> },
      scheduled: { className: 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20', label: 'Scheduled', icon: <Clock className="h-3 w-3" /> },
      active: { className: 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20', label: 'Running', icon: <div className="w-1.5 h-1.5 rounded-full bg-accent-emerald animate-pulse" /> },
      error: { className: 'bg-accent-rose/10 text-accent-rose border-accent-rose/20', label: 'Error', icon: <AlertCircle className="h-3 w-3" /> },
    };

    const { className, label, icon } = variants[status];
    return (
      <Badge variant="outline" className={cn('flex items-center gap-1.5 px-2 py-0.5 font-bold text-[9px] uppercase tracking-wider', className)}>
        {icon}
        {label}
      </Badge>
    );
  };

  const handleOpenConfig = (id?: string) => {
    const tabMap: Record<string, string> = {
      'github-trending': 'github-trending', 'market-gap': 'market-gap', 'stargazer': 'stargazer', 'mirror': 'mirror',
      'quality': 'quality', 'learn': 'self-improve', 'reddit-sniper': 'reddit-sniper', 'reddit-pain-points': 'reddit-pain-points',
      'viral-radar': 'viral-radar', 'hackernews': 'hackernews', 'twin-mimicry': 'twin-mimicry', 'fork-evolution': 'fork-evolution',
      'scout': 'scout', 'sonar': 'scout'
    };
    setSelectedFeatureId(id ? (tabMap[id] || id) : null);
    setShowConfigModal(true);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border-subtle">
        <div className="space-y-1.5">
           <div className="flex items-center gap-2 text-primary-glow font-bold uppercase tracking-[0.2em] text-[10px]">
              <Zap className="w-3.5 h-3.5" /> Autonomous Intelligence
           </div>
           <h1 className="text-3xl font-bold text-text-primary tracking-tight">Intelligence Control Center</h1>
           <p className="text-sm text-text-tertiary font-medium"> Orchestrate and monitor {features.length} core automation modules </p>
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-bg-base border border-border-subtle p-1 rounded-xl flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8 rounded-lg", viewMode === 'grid' ? "bg-bg-raised text-primary-glow" : "text-text-tertiary")}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8 rounded-lg", viewMode === 'list' ? "bg-bg-raised text-primary-glow" : "text-text-tertiary")}
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
           </div>
           <Button onClick={() => handleOpenConfig()} className="h-10 px-4 bg-primary hover:bg-primary-glow text-white font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2">
              <Settings className="h-4 w-4" /> Configure Fleet
           </Button>
        </div>
      </div>

      <Suspense fallback={null}>
        <FeatureConfigModal isOpen={showConfigModal} onClose={() => setShowConfigModal(false)} initialTab={selectedFeatureId} />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className={cn("grid gap-4", viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
            {features.map((feature) => (
              <Card key={feature.id} className="group glass-panel border-border-subtle bg-bg-raised hover:border-border-default transition-all duration-300 shadow-sm hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-bg-base border border-border-subtle flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                        {feature.icon}
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-sm font-bold text-text-primary truncate">{feature.name}</CardTitle>
                        <CardDescription className="text-[10px] text-text-tertiary font-medium line-clamp-1 mt-0.5">{feature.description}</CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(feature.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="flex items-center justify-between text-[10px] font-mono text-text-tertiary bg-bg-void/50 px-2 py-1.5 rounded-lg border border-border-subtle">
                     <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {parseCronSchedule(feature.schedule)}</span>
                     <span className="opacity-50 truncate ml-2">{feature.workflow}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button onClick={() => handleOpenConfig(feature.id)} size="sm" variant="outline" className="h-8 px-3 text-[10px] font-bold uppercase tracking-wider border-border-subtle hover:bg-bg-elevated flex-1">
                      Setup
                    </Button>
                    <Button onClick={() => window.open(getTriggerUrl(feature.workflow), '_blank')} size="sm" className="h-8 px-3 text-[10px] font-bold uppercase tracking-wider bg-bg-base text-text-primary border border-border-subtle hover:bg-bg-elevated flex-1 gap-1.5">
                      <Play className="h-3 w-3" /> Run
                    </Button>
                    <Button onClick={() => window.open(getWorkflowUrl(feature.workflow), '_blank')} size="icon" variant="ghost" className="h-8 w-8 text-text-tertiary hover:text-text-primary border border-transparent hover:border-border-subtle">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <Card className="glass-panel border-primary/20 bg-primary/5 shadow-glow shadow-primary/5 overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <Github className="w-24 h-24 rotate-12" />
             </div>
             <CardHeader className="relative z-10">
                <CardTitle className="text-[10px] font-bold text-primary-glow uppercase tracking-widest flex items-center gap-2">
                   <ShieldCheck className="w-4 h-4" /> Strategic Infrastructure
                </CardTitle>
                <CardDescription className="text-xs font-medium text-text-secondary pt-1">Zero-latency autonomous execution layer via GitHub Actions</CardDescription>
             </CardHeader>
             <CardContent className="relative z-10 space-y-6">
                <div className="space-y-3">
                   {[
                     { icon: "✨", label: "Automatic Scheduling", desc: "Modules run on set cron intervals" },
                     { icon: "🚀", label: "Manual Override", desc: "Force execution via GitHub API" },
                     { icon: "💾", label: "State Persistence", desc: "Results committed to repository" },
                     { icon: "🆓", label: "Cost Efficiency", desc: "Leveraging free GitHub action tiers" }
                   ].map((item, i) => (
                     <div key={i} className="flex items-start gap-3">
                        <span className="text-sm mt-0.5">{item.icon}</span>
                        <div>
                           <p className="text-[11px] font-bold text-text-primary">{item.label}</p>
                           <p className="text-[10px] text-text-tertiary">{item.desc}</p>
                        </div>
                     </div>
                   ))}
                </div>
                
                <div className="bg-bg-base/80 border border-border-subtle rounded-xl p-4 space-y-3">
                   <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Global Operations</p>
                   <div className="grid grid-cols-2 gap-2">
                      <Button variant="ghost" size="sm" className="justify-start h-8 text-[10px] px-2 font-bold hover:bg-bg-elevated gap-2" onClick={() => window.open(`${GITHUB_REPO_URL}/actions`, '_blank')}>
                         <Github className="h-3.5 w-3.5 text-text-disabled" /> Workflows
                      </Button>
                      <Button variant="ghost" size="sm" className="justify-start h-8 text-[10px] px-2 font-bold hover:bg-bg-elevated gap-2" onClick={() => navigate('/quality')}>
                         <Activity className="h-3.5 w-3.5 text-accent-emerald" /> Dashboard
                      </Button>
                   </div>
                </div>
             </CardContent>
          </Card>

          <Card className="glass-panel border-border-subtle bg-bg-raised">
             <CardHeader>
                <CardTitle className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Intelligence Feed</CardTitle>
             </CardHeader>
             <CardContent className="space-y-3">
                {[
                  { label: "Daily Intelligence Feed", path: "/actions", icon: "📡" },
                  { label: "Blue Ocean Opportunities", path: "/data/opportunities/latest.json", icon: "🎯", isExternal: true },
                  { label: "Mirror Reports", path: "/attached_assets/", icon: "🪞", isExternal: true },
                  { label: "Learned Patterns", path: "/src/lib/knowledge-base/", icon: "🧠", isExternal: true }
                ].map((feed, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start h-10 px-3 bg-bg-base border-border-subtle hover:bg-bg-elevated text-[10px] font-bold uppercase tracking-wider transition-all hover:translate-x-1"
                    onClick={() => feed.isExternal ? window.open(feed.path, '_blank') : navigate(feed.path)}
                  >
                    <span className="mr-3 text-sm">{feed.icon}</span>
                    {feed.label}
                  </Button>
                ))}
             </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-border-subtle space-y-8">
        <div className="flex items-center gap-2 text-[10px] font-bold text-primary-glow uppercase tracking-[0.2em] mb-4">
           <LayoutGrid className="w-3.5 h-3.5" /> High-Value Targets
        </div>

        <MiningDrillPanel />

        {loadError ? (
          <EmptyState
            icon={<AlertCircle className="w-8 h-8 text-accent-rose" />}
            title="Intelligence Retrieval Failed"
            description={loadError}
            action={
              <Button onClick={() => loadData()} className="h-10 px-4 bg-bg-elevated border border-border-subtle hover:bg-bg-overlay text-text-primary font-bold rounded-xl flex items-center gap-2">
                <RefreshCcw className="w-4 h-4" /> Retry Feed
              </Button>
            }
            className="bg-accent-rose/5 border-accent-rose/20 py-16"
          />
        ) : (
          <div className="transition-all duration-500">
             {loadingOpportunities ? (
               <div className="flex flex-col items-center justify-center py-12 space-y-4 glass-panel border-border-subtle bg-bg-raised">
                  <Activity className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Parsing Goldmine Data...</p>
               </div>
             ) : (
               <GoldmineDetector opportunities={opportunities} />
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AutomationDashboard;
