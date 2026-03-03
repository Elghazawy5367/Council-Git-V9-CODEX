import { formatDistanceToNow } from 'date-fns';

interface CacheBannerProps {
  cachedAt: number | null;
  ttlMs: number;
  onRunFresh: () => void;
}

export function CacheBanner({ cachedAt, ttlMs, onRunFresh }: CacheBannerProps) {
  if (!cachedAt) return null;
  const isStale = Date.now() - cachedAt > ttlMs;
  if (isStale) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground">
      <span>⊡</span>
      <span>Cached result from {formatDistanceToNow(cachedAt, { addSuffix: true })}</span>
      <button onClick={onRunFresh}
        className="ml-auto hover:text-foreground transition-colors">
        Run Fresh ↺
      </button>
    </div>
  );
}

// Cache TTLs
export const CACHE_TTLS = {
  mirror: 1 * 60 * 60 * 1000,       // 1 hour
  learn:  24 * 60 * 60 * 1000,      // 24 hours
  twin:   6 * 60 * 60 * 1000,       // 6 hours
  heist:  7 * 24 * 60 * 60 * 1000,  // 7 days
} as const;
