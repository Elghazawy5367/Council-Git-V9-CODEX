import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/primitives/card';
import { Button } from '@/components/primitives/button';
import { Badge } from '@/components/primitives/badge';
import { Play, CheckCircle2, Clock, ExternalLink, ArrowLeft, Github, Calendar, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GITHUB_OWNER, GITHUB_REPO, GITHUB_REPO_URL } from '@/lib/config';
import { useFeatureConfigStore } from '@/features/council/store/feature-config-store';
import { parseCronSchedule } from '@/lib/workflow-dispatcher';
import { MiningDrillPanel } from '@/features/council/components/MiningDrillPanel';
import { GoldmineDetector } from '@/features/council/components/GoldmineDetector';
import { IntelligenceFeed } from '@/components/IntelligenceFeed';
import { FeatureCard } from '@/features/automation/components/FeatureCard';
import { loadAllOpportunities } from '@/lib/opportunity-loader';
import { Opportunity } from '@/lib/goldmine-detector';
import { getSessionKeys } from '@/features/council/lib/vault';
import { toast } from 'sonner';
import { useIntelligenceStore } from '@/stores/intelligence-store';

const FeatureConfigModal = lazy(() => import('@/features/council/components/FeatureConfigModal'));

interface Feature {
  id: string;
  name: string;
  description: string;
  icon: string;
  workflow: string;
  schedule: string;
  lastRun?: string;
  status: 'idle' | 'scheduled' | 'active';
}

/**
 * AutomationDashboard - Unified dashboard for managing all core automation features
 */
const AutomationDashboard: React.FC = () => {
  const navigate = useNavigate();
  const repoOwner = GITHUB_OWNER;
  const repoName = GITHUB_REPO;
  const addSuggestion = useIntelligenceStore(state => state.addSuggestion);
  
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loadingOpportunities, setLoadingOpportunities] = useState(false);
  
  const { 
    scout, 
    mirror, 
    quality, 
    selfImprove,
    githubTrending,
    marketGap,
    redditSniper,
    redditPainPoints,
    viralRadar,
    hackerNews,
    twinMimicry,
    forkEvolution,
    promptHeist,
    stargazerAnalysis
  } = useFeatureConfigStore();
  
  // Load opportunities on mount
  useEffect(() => {
    const loadData = async (): Promise<void> => {
      setLoadingOpportunities(true);
      try {
        const keys = getSessionKeys();
        const opps = await loadAllOpportunities(keys?.githubApiKey);
        setOpportunities(opps);
      } catch (error) {
        console.error('Failed to load opportunities:', error);
        toast.error('Failed to load opportunities');
      } finally {
        setLoadingOpportunities(false);
      }
    };
    
    void loadData();
  }, []);

  // Mock initial suggestions for 2026 feel
  useEffect(() => {
    const timer = setTimeout(() => {
      addSuggestion({
        title: 'Security Vulnerability Alert',
        description: 'New high-risk pattern detected in cross-feature imports. Standard architecture protocol violation.',
        priority: 'high',
        featureId: 'quality',
        rationale: {
          strategic: 'Maintain codebase integrity to prevent cascading failures in autonomous workflows.',
          technical: 'Static analysis flagged 3 new violations of the "no-direct-import" rule between Features and Shared Libs.'
        }
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, [addSuggestion]);
  
  const [features, setFeatures] = useState<Feature[]>([]);

  useEffect(() => {
    setFeatures([
      {
        id: 'github-trending',
        name: 'GitHub Trending',
        description: 'Scans trending repositories for market opportunities',
        icon: '📈',
        workflow: 'github-trending.yml',
        schedule: githubTrending.schedule,
        status: githubTrending.enabled ? 'active' : 'idle',
      },
      {
        id: 'market-gap',
        name: 'Market Gap Identifier',
        description: 'Identifies underserved market gaps using GitHub & Reddit',
        icon: '🎯',
        workflow: 'market-gap.yml',
        schedule: marketGap.schedule,
        status: marketGap.enabled ? 'active' : 'idle',
      },
      {
        id: 'stargazer',
        name: 'Stargazer Analysis',
        description: 'Analyze repository stars for institutional backing',
        icon: '⭐',
        workflow: 'stargazer-analysis.yml',
        schedule: '0 0 * * *',
        status: stargazerAnalysis.enabled ? 'active' : 'idle',
      },
      {
        id: 'mirror',
        name: 'Code Mirror System',
        description: 'Analyze codebase against elite repository standards',
        icon: '🔄',
        workflow: 'code-mirror.yml',
        schedule: mirror.schedule,
        status: mirror.enabled ? 'active' : 'idle',
      },
      {
        id: 'quality',
        name: 'QUALITY Amplification Pipeline',
        description: 'Run full quality analysis and improvement pipeline',
        icon: '⚡',
        workflow: 'quality-pipeline.yml',
        schedule: quality.schedule,
        status: quality.enabled ? 'active' : 'idle',
      },
      {
        id: 'learn',
        name: 'Self-Improving Loop',
        description: 'Learn patterns from successful repositories',
        icon: '🧠',
        workflow: 'self-improve.yml',
        schedule: selfImprove.schedule,
        status: selfImprove.enabled ? 'active' : 'idle',
      },
      {
        id: 'reddit-sniper',
        name: 'Reddit Sniper',
        description: 'Detect high-intent buying signals on Reddit in real-time',
        icon: '🎯',
        workflow: 'reddit-sniper.yml',
        schedule: redditSniper.schedule,
        status: redditSniper.enabled ? 'active' : 'idle',
      },
      {
        id: 'reddit-pain-points',
        name: 'Reddit Pain Points',
        description: 'Extract market gaps and user frustrations from subreddits',
        icon: '💬',
        workflow: 'reddit-pain-points.yml',
        schedule: redditPainPoints.schedule,
        status: redditPainPoints.enabled ? 'active' : 'idle',
      },
      {
        id: 'viral-radar',
        name: 'Viral Radar',
        description: 'Track viral trends across Twitter, Reddit, and HN',
        icon: '📡',
        workflow: 'viral-radar.yml',
        schedule: viralRadar.schedule,
        status: viralRadar.enabled ? 'active' : 'idle',
      },
      {
        id: 'hackernews',
        name: 'HackerNews Intelligence',
        description: 'Extract buying intent signals and tech trends from HN',
        icon: '🗞️',
        workflow: 'hackernews-producthunt.yml',
        schedule: hackerNews.schedule,
        status: hackerNews.enabled ? 'active' : 'idle',
      },
      {
        id: 'twin-mimicry',
        name: 'Twin Mimicry',
        description: 'Mimic high-performing repository styles and patterns',
        icon: '👯',
        workflow: 'twin-mimicry.yml',
        schedule: twinMimicry.schedule,
        status: twinMimicry.enabled ? 'active' : 'idle',
      },
      {
        id: 'fork-evolution',
        name: 'Fork Evolution',
        description: 'Track high-value forks and their innovative changes',
        icon: '🍴',
        workflow: 'fork-evolution.yml',
        schedule: forkEvolution.schedule,
        status: forkEvolution.enabled ? 'active' : 'idle',
      },
      {
        id: 'heist',
        name: 'The HEIST',
        description: 'Import 290+ world-class prompts from danielmiessler/fabric',
        icon: '🎭',
        workflow: 'heist-prompts.ts',
        schedule: 'monthly',
        status: promptHeist.enabled ? 'active' : 'idle',
      },
      {
        id: 'scout',
        name: 'Phantom Scout',
        description: '24/7 automated GitHub intelligence gathering',
        icon: '👻',
        workflow: 'daily-scout.yml',
        schedule: scout.schedule,
        status: scout.enabled ? 'active' : 'idle',
      },
      {
        id: 'sonar',
        name: 'Sonar (Blue Ocean Scanner)',
        description: 'Detect abandoned high-value repositories',
        icon: '📡',
        workflow: 'daily-scout.yml',
        schedule: scout.schedule,
        status: scout.enabled ? 'active' : 'idle',
      },
    ]);
  }, [scout, mirror, quality, selfImprove, githubTrending, marketGap, redditSniper, redditPainPoints, viralRadar, twinMimicry, forkEvolution, promptHeist, stargazerAnalysis, hackerNews]);

  const handleOpenConfig = (id?: string) => {
    // Map feature IDs to modal tab IDs if necessary
    const tabMap: Record<string, string> = {
      'github-trending': 'github-trending',
      'market-gap': 'market-gap',
      'stargazer': 'stargazer',
      'mirror': 'mirror',
      'quality': 'quality',
      'learn': 'self-improve',
      'reddit-sniper': 'reddit-sniper',
      'reddit-pain-points': 'reddit-pain-points',
      'viral-radar': 'viral-radar',
      'hackernews': 'hackernews',
      'twin-mimicry': 'twin-mimicry',
      'fork-evolution': 'fork-evolution',
      'scout': 'scout',
      'sonar': 'scout'
    };
    
    setSelectedFeatureId(id ? (tabMap[id] || id) : null);
    setShowConfigModal(true);
  };

  return (
    <div className="min-h-screen bg-background selection:bg-primary/30">
      {/* Header */}
      <header className="glass-panel border-b border-border/50 sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="hover:bg-violet-500/10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                  Intelligence Command Center
                </h1>
                <p className="text-xs text-muted-foreground">Orchestrating {features.length} autonomous agents • {features.filter(f => f.status === 'active' || f.status === 'scheduled').length} active</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleOpenConfig()} 
                className="gap-2 glass-panel border-violet-500/20 hover:bg-violet-500/10"
              >
                <Settings className="h-4 w-4" />
                Configure Features
              </Button>
            </div>
          </div>
        </div>
      </header>

      <Suspense fallback={<div>Loading...</div>}>
        <FeatureConfigModal 
          isOpen={showConfigModal} 
          onClose={() => setShowConfigModal(false)} 
          initialTab={selectedFeatureId}
        />
      </Suspense>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column: Intelligence Feed */}
          <div className="xl:col-span-1 h-[calc(100vh-12rem)] sticky top-24">
            <IntelligenceFeed />
          </div>

          {/* Center Column: Features List */}
          <div className="xl:col-span-1 space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                Core Features ({features.length})
              </h2>
              <Badge variant="outline" className="gap-2 glass-panel">
                <Github className="h-4 w-4" />
                GitHub Actions
              </Badge>
            </div>
            
            {features.map((feature) => {
              // Map local Feature interface to FeatureDefinition for FeatureCard
              const featureDef = {
                id: feature.id,
                name: feature.name,
                description: feature.description,
                icon: feature.icon,
                category: 'Market Intelligence',
                status: feature.status === 'active' ? 'active' : 'inactive',
                enabled: feature.status === 'active',
                defaultConfig: {},
                metrics: {
                  lastRun: feature.lastRun ? new Date(feature.lastRun) : null,
                  successRate: 0.95,
                  totalRuns: 12,
                  reportsGenerated: 8,
                  averageExecutionTime: 45000,
                }
              } as any;

              return <FeatureCard key={feature.id} feature={featureDef} />;
            })}
          </div>

          {/* Right Column: Info Panel */}
          <div className="xl:col-span-1 space-y-4">
            <Card className="bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-fuchsia-500/10 border-2 border-violet-500/20 glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Github className="h-6 w-6 text-violet-500" />
                  GitHub Actions Integration
                </CardTitle>
                <CardDescription className="text-base">Zero-cost automated intelligence</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">How It Works</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="text-lg">✨</span>
                      Features run automatically on schedule
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-lg">🚀</span>
                      Trigger workflows manually anytime
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-lg">💾</span>
                      Results stored in repository
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-lg">🆓</span>
                      Completely free using GitHub Actions
                    </li>
                  </ul>
                </div>
                
                <div className="p-3 bg-background/50 rounded-lg border border-violet-500/20">
                  <h4 className="font-semibold text-sm mb-2">Quick Actions</h4>
                  <div className="space-y-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start hover:bg-violet-500/10"
                      onClick={() => window.open(`${GITHUB_REPO_URL}/actions`, '_blank')}
                    >
                      <Github className="h-4 w-4 mr-2" />
                      View All Workflows
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start hover:bg-violet-500/10"
                      onClick={() => navigate('/quality')}
                    >
                      📊 Quality Dashboard
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel border-2 border-violet-500/10">
              <CardHeader>
                <CardTitle className="text-lg">Latest Results</CardTitle>
                <CardDescription>Access generated reports and data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start glass-panel hover:bg-violet-500/10"
                  onClick={() => window.open(`${GITHUB_REPO_URL}/actions`, '_blank')}
                >
                  📡 Daily Intelligence Feed
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start glass-panel hover:bg-violet-500/10"
                  onClick={() => navigate('/features/scout')}
                >
                  👻 The Sonar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start glass-panel hover:bg-violet-500/10"
                  onClick={() => navigate('/features/scout')}
                >
                  📡 The Drill
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start glass-panel hover:bg-violet-500/10"
                  onClick={() => window.open('/data/opportunities/latest.json', '_blank')}
                >
                  🎯 Blue Ocean Opportunities
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start glass-panel hover:bg-violet-500/10"
                  onClick={() => window.open('/attached_assets/', '_blank')}
                >
                  🪞 Mirror Reports
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start glass-panel hover:bg-violet-500/10"
                  onClick={() => window.open('/src/lib/knowledge-base/', '_blank')}
                >
                  🧠 Learned Patterns
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mining Drill Section */}
        <div className="mt-8">
          <MiningDrillPanel />
        </div>

        {/* Goldmine Detector Section */}
        <div className="mt-8">
          {loadingOpportunities ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Loading opportunities...
              </CardContent>
            </Card>
          ) : (
            <GoldmineDetector opportunities={opportunities} />
          )}
        </div>
      </main>
    </div>
  );
};

export default AutomationDashboard;
