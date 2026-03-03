import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/primitives/card';
import { Button } from '@/components/primitives/button';
import { Badge } from '@/components/primitives/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/primitives/tabs';
import { TrendingUp, DollarSign, Users, Clock, Copy, ExternalLink, Zap } from 'lucide-react';
import { 
  findGoldmines, 
  calculateGoldmineMetrics, 
  generateGoldmineReport,
  categorizeGoldmines,
  generateActionPlan,
  Opportunity 
} from '@/lib/goldmine-detector';
import { toast } from 'sonner';

interface GoldmineDetectorProps {
  opportunities: Opportunity[];
}

export const GoldmineDetector: React.FC<GoldmineDetectorProps> = ({ opportunities }) => {
  const [goldmines, setGoldmines] = useState<Opportunity[]>([]);
  const [categorized, setCategorized] = useState<{
    easyWins: Opportunity[];
    mediumEffort: Opportunity[];
    highEffort: Opportunity[];
  }>({ easyWins: [], mediumEffort: [], highEffort: [] });

  useEffect(() => {
    if (opportunities.length > 0) {
      const found = findGoldmines(opportunities);
      setGoldmines(found);
      setCategorized(categorizeGoldmines(found));
    }
  }, [opportunities]);

  const handleCopyReport = (): void => {
    const report = generateGoldmineReport(goldmines);
    navigator.clipboard.writeText(report);
    toast.success('Goldmine report copied to clipboard');
  };

  const handleCopyActionPlan = (repo: Opportunity): void => {
    const actions = generateActionPlan(repo);
    const text = `# Action Plan: ${repo.owner}/${repo.name}\n\n` + 
                 actions.map((action, i) => `${i + 1}. ${action}`).join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Action plan copied to clipboard');
  };

  // Memoize revenue calculation for performance
  const totalRevenue = useMemo(() =>
    goldmines.slice(0, 10).reduce((sum, repo) => {
      const metrics = calculateGoldmineMetrics(repo);
      return sum + metrics.estimatedRevenueLow;
    }, 0),
    [goldmines]
  );

  if (goldmines.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💰 Abandoned Goldmine Detector
          </CardTitle>
          <CardDescription>
            No goldmines found. Run Scout to discover opportunities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Goldmine criteria:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Stars &gt; 1,000 (proven demand)</li>
              <li>Abandoned &gt; 1 year</li>
              <li>Open Issues &gt; 20 (active user need)</li>
              <li>Fork Ratio &lt; 0.2 (low competition)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💰 Abandoned Goldmines Detected
          </CardTitle>
          <CardDescription>
            High-ROI opportunities ready for revival
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {goldmines.length}
              </div>
              <div className="text-xs text-muted-foreground">Goldmines Found</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                ${(totalRevenue / 1000).toFixed(0)}k
              </div>
              <div className="text-xs text-muted-foreground">Est. Revenue (Low)</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {categorized.easyWins.length}
              </div>
              <div className="text-xs text-muted-foreground">Easy Wins</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {categorized.mediumEffort.length}
              </div>
              <div className="text-xs text-muted-foreground">Medium Effort</div>
            </div>
          </div>

          <Button onClick={handleCopyReport} className="w-full gap-2">
            <Copy className="h-4 w-4" />
            Copy Full Goldmine Report
          </Button>
        </CardContent>
      </Card>

      {/* Categorized Tabs */}
      <Tabs defaultValue="easy" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="easy">
            Easy Wins ({categorized.easyWins.length})
          </TabsTrigger>
          <TabsTrigger value="medium">
            Medium ({categorized.mediumEffort.length})
          </TabsTrigger>
          <TabsTrigger value="high">
            High Effort ({categorized.highEffort.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="easy" className="space-y-4">
          {categorized.easyWins.map((repo) => (
            <GoldmineCard key={`${repo.owner}/${repo.name}`} repo={repo} onCopyActionPlan={handleCopyActionPlan} />
          ))}
        </TabsContent>

        <TabsContent value="medium" className="space-y-4">
          {categorized.mediumEffort.map((repo) => (
            <GoldmineCard key={`${repo.owner}/${repo.name}`} repo={repo} onCopyActionPlan={handleCopyActionPlan} />
          ))}
        </TabsContent>

        <TabsContent value="high" className="space-y-4">
          {categorized.highEffort.map((repo) => (
            <GoldmineCard key={`${repo.owner}/${repo.name}`} repo={repo} onCopyActionPlan={handleCopyActionPlan} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface GoldmineCardProps {
  repo: Opportunity;
  onCopyActionPlan: (repo: Opportunity) => void;
}

const GoldmineCard: React.FC<GoldmineCardProps> = ({ repo, onCopyActionPlan }) => {
  const metrics = calculateGoldmineMetrics(repo);
  const blueOceanScore = repo.blueOceanScore ?? 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg">
              {repo.owner}/{repo.name}
            </CardTitle>
            <CardDescription className="mt-1">
              {repo.description || 'No description'}
            </CardDescription>
          </div>
          <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
            {blueOceanScore}/100
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-yellow-500" />
            <span>{repo.stars.toLocaleString()} stars</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-orange-500" />
            <span>{Math.round(repo.daysSinceUpdate / 365)}y abandoned</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-blue-500" />
            <span>{metrics.potentialCustomers} potential customers</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-green-500" />
            <span>${metrics.estimatedPrice}/year</span>
          </div>
        </div>

        {/* Revenue Estimate */}
        <div className="p-3 bg-green-500/10 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Estimated Monthly Revenue</div>
          <div className="text-lg font-bold text-green-600 dark:text-green-400">
            ${metrics.estimatedRevenueLow.toLocaleString()}-${metrics.estimatedRevenueHigh.toLocaleString()}
          </div>
        </div>

        {/* Quick Info Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            {repo.openIssues} issues
          </Badge>
          <Badge variant="outline" className="text-xs">
            {metrics.competitionLevel} competition
          </Badge>
          <Badge variant="outline" className="text-xs">
            {metrics.timeToMarket} launch
          </Badge>
          {repo.language && (
            <Badge variant="outline" className="text-xs">
              {repo.language}
            </Badge>
          )}
        </div>

        {/* Quick Win Strategy */}
        <div className="space-y-2">
          <div className="text-sm font-medium flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            Quick Win Strategy
          </div>
          <ol className="text-xs text-muted-foreground space-y-1 pl-4">
            <li>1. Fork & update dependencies</li>
            <li>2. Fix top 5-10 issues</li>
            <li>3. Add modern UI/UX</li>
            <li>4. Launch as SaaS</li>
          </ol>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-2"
            onClick={() => onCopyActionPlan(repo)}
          >
            <Copy className="h-3 w-3" />
            Copy Action Plan
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(repo.url, '_blank')}
            className="gap-2"
          >
            <ExternalLink className="h-3 w-3" />
            View Repo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoldmineDetector;
