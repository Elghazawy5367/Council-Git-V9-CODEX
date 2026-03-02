import { useState, useEffect } from 'react';
import { db, LearnedPattern } from '../../../../lib/db';
import { analyzeRepoWithLLM, synthesizePatterns } from '../../../../lib/self-improve';
import { useDevToolsStore } from '../../store/devtools-store';

export function LearnPanel() {
  const [repoInput, setRepoInput] = useState('');
  const [patterns, setPatterns]   = useState<LearnedPattern[]>([]);
  const [synthesis, setSynthesis] = useState('');
  const [isRunning, setRunning]   = useState(false);
  const { startRun, completeRun, failRun } = useDevToolsStore();

  useEffect(() => {
    db.learnedPatterns.orderBy('analyzedAt').reverse().limit(20).toArray()
      .then(setPatterns)
      .catch((err) => console.warn('[LearnPanel] Failed to load patterns:', err));
  }, []);

  async function runLearn() {
    const repos = repoInput.split('\n').map(r => r.trim()).filter(Boolean);
    if (repos.length === 0) return;
    setRunning(true);
    const runId = await startRun('learn');
    try {
      const analyses = [];
      for (const repo of repos) {
        const readmeRes = await fetch(
          `https://api.github.com/repos/${repo}/readme`,
          { headers: { Accept: 'application/vnd.github.v3.raw' } }
        );
        const readme = readmeRes.ok ? await readmeRes.text() : '';
        const treeRes = await fetch(`https://api.github.com/repos/${repo}/git/trees/HEAD?recursive=1`);
        const fileList = treeRes.ok
          ? ((await treeRes.json()).tree as Array<{path: string}>).map((f) => f.path).slice(0, 60)
          : [];
        const analysis = await analyzeRepoWithLLM(repo, readme, fileList);
        analyses.push(analysis);
      }
      const synth = await synthesizePatterns(analyses);
      setSynthesis(synth);
      const fresh = await db.learnedPatterns.orderBy('analyzedAt').reverse().limit(20).toArray();
      setPatterns(fresh);
      await completeRun(runId, 'learn', `${analyses.length} repos analyzed`);
    } catch (e) {
      await failRun(runId, 'learn', String(e));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold">📚 Self-Improving Loop</h2>
        <p className="text-xs text-muted-foreground">LLM-powered pattern extraction from elite repos</p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Target Repositories (one per line, format: owner/repo)
        </label>
        <textarea
          value={repoInput}
          onChange={e => setRepoInput(e.target.value)}
          placeholder={'microsoft/autogen\ncrewAIInc/crewAI\nlangchain-ai/langgraph'}
          className="w-full h-28 bg-background border border-border rounded-lg px-3 py-2
            text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button onClick={runLearn} disabled={isRunning || !repoInput.trim()}
          className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground
            disabled:opacity-50 flex items-center gap-2">
          {isRunning ? <><span className="animate-spin inline-block">⟳</span> Learning…</> : '▶ Run Learning'}
        </button>
      </div>

      {synthesis && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="text-xs font-bold uppercase tracking-wide text-primary mb-2">
            ◈ Meta-Pattern Synthesis
          </div>
          <div className="text-sm text-foreground whitespace-pre-wrap">{synthesis}</div>
        </div>
      )}

      {patterns.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Knowledge Base ({patterns.length} repos)
          </div>
          {patterns.map(p => (
            <div key={p.id} className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{p.repoName}</span>
                <span className="text-xs text-muted-foreground">
                  Quality: {p.qualityScore}/100
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {p.architectureTags.map(t => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full
                    bg-accent text-accent-foreground border border-border">{t}</span>
                ))}
              </div>
              <div className="space-y-1">
                {p.patterns.slice(0, 3).map((pat, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full"
                        style={{ width: `${pat.confidence * 100}%` }} />
                    </div>
                    <span className="text-muted-foreground w-32 truncate">{pat.pattern}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
