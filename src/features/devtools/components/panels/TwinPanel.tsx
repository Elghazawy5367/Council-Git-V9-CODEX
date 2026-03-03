import { useState } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { analyzeTwinDNA, TwinProfile } from '../../lib/twin-analyzer';
import { useDevToolsStore } from '../../store/devtools-store';
import { GITHUB_OWNER, GITHUB_REPO } from '../../../../lib/config';
import { CacheBanner, CACHE_TTLS } from '../CacheBanner';

const YOUR_KEY_FILES = [
  'src/features/council/api/ai-client.ts',
  'src/stores/council.store.ts',
  'src/lib/db.ts',
];

export function TwinPanel() {
  const [targetRepo, setTargetRepo] = useState('microsoft/autogen');
  const [profile, setProfile] = useState<TwinProfile | null>(null);
  const [isRunning, setRunning] = useState(false);
  const [runCost, setRunCost]   = useState(0);
  const { startRun, completeRun, failRun, lastRuns } = useDevToolsStore();

  const lastRun = lastRuns['twin'];
  const cachedAt = lastRun?.status === 'success' ? lastRun.startedAt : null;

  async function runTwin() {
    setRunning(true);
    setRunCost(0);
    const runId = await startRun('twin');
    try {
      const yourFiles = await Promise.all(
        YOUR_KEY_FILES.map(async p => {
          const res = await fetch(
            `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${p}`
          );
          return { path: p, content: res.ok ? await res.text() : '' };
        })
      );
      const result = await analyzeTwinDNA(yourFiles, targetRepo);
      setProfile(result);
      await completeRun(runId, 'twin', `${result.alignmentScore}/100 alignment with ${targetRepo}`);
    } catch (e) {
      await failRun(runId, 'twin', String(e));
    } finally {
      setRunning(false);
    }
  }

  const radarData = profile?.dimensions.map(d => ({
    dimension: d.name,
    You: d.yourScore,
    Target: d.targetScore,
  })) ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold">👯 Twin Mimicry</h2>
        <p className="text-xs text-muted-foreground">LLM code DNA comparison against elite repos</p>
      </div>

      <CacheBanner cachedAt={cachedAt} ttlMs={CACHE_TTLS.twin} onRunFresh={runTwin} />

      <div className="flex gap-3">
        <select value={targetRepo} onChange={e => setTargetRepo(e.target.value)}
          className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm">
          {['microsoft/autogen','crewAIInc/crewAI','langchain-ai/langgraph',
            'open-webui/open-webui','Significant-Gravitas/AutoGPT'].map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <button onClick={runTwin} disabled={isRunning}
          className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground disabled:opacity-50">
          {isRunning ? '⟳ Analyzing…' : '▶ Run'}
        </button>
      </div>
      {isRunning && runCost > 0 && (
        <span className="text-xs text-muted-foreground font-mono">${runCost.toFixed(4)} spent</span>
      )}

      {profile && (
        <>
          <div className="rounded-lg border border-border p-4 text-center">
            <div className="text-4xl font-bold text-primary">{profile.alignmentScore}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Alignment score vs {profile.targetRepoName}
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="dimension"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Radar name="You" dataKey="You" stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))" fillOpacity={0.2} />
                <Radar name="Target" dataKey="Target" stroke="hsl(220 90% 56%)"
                  fill="hsl(220 90% 56%)" fillOpacity={0.1} />
                <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Adoption Plan
            </div>
            {profile.adoptionPlan.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs
                  flex items-center justify-center font-bold flex-shrink-0">
                  {item.priority}
                </span>
                <div className="flex-1">
                  <div className="text-sm">{item.change}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{item.estimatedImpact}</div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border flex-shrink-0 ${
                  item.effort === 'low' ? 'text-green-500 border-green-500/30' :
                  item.effort === 'medium' ? 'text-yellow-500 border-yellow-500/30' :
                  'text-red-500 border-red-500/30'}`}>
                  {item.effort}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
