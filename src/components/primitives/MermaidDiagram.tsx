import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, AlertCircle } from 'lucide-react';

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    const renderDiagram = async () => {
      if (!chart || !containerRef.current) return;

      setIsLoading(true);
      setError(null);

      try {
        // Dynamic import of mermaid to split bundle
        const { default: mermaid } = await import('mermaid');

        if (!mounted) return;

        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          securityLevel: 'strict',
          fontFamily: 'Space Grotesk, system-ui, sans-serif',
          themeVariables: {
            primaryColor: 'hsl(258 85% 62%)',
            primaryTextColor: '#FFFFFF',
            primaryBorderColor: 'hsl(224 14% 19%)',
            lineColor: 'hsl(220 12% 64%)',
            secondaryColor: 'hsl(224 18% 12%)',
            tertiaryColor: 'hsl(224 20% 9%)',
            background: 'hsl(224 28% 3%)',
            mainBkg: 'hsl(224 20% 9%)',
            nodeBorder: 'hsl(224 14% 19%)',
            clusterBkg: 'hsl(224 18% 12%)',
            titleColor: 'hsl(220 20% 94%)',
            edgeLabelBackground: 'hsl(224 28% 3%)',
          },
        });

        // Generate unique ID for this diagram
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        
        // Clean the chart string
        const cleanedChart = chart.trim();
        
        // Render the diagram
        const { svg: renderedSvg } = await mermaid.render(id, cleanedChart);

        if (!mounted) return;

        // Inject <title> for accessibility
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(renderedSvg, 'image/svg+xml');
        const svgElement = svgDoc.documentElement;
        const titleElement = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'title');
        titleElement.textContent = 'AI-generated system architecture diagram';
        svgElement.insertBefore(titleElement, svgElement.firstChild);

        setSvg(new XMLSerializer().serializeToString(svgDoc));
      } catch (err) {
        if (!mounted) return;
        console.error('Mermaid rendering error:', err);
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    renderDiagram();
    return () => { mounted = false; };
  }, [chart]);

  if (isLoading) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-12 bg-bg-base/50 rounded-2xl border border-dashed border-border-subtle min-h-[200px] animate-pulse", className)}>
        <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
        <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Synthesizing Architecture...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("p-6 bg-accent-rose/5 border border-accent-rose/20 rounded-2xl", className)}>
        <div className="flex items-center gap-2 text-accent-rose mb-3">
           <AlertCircle className="h-4 w-4" />
           <p className="text-xs font-bold uppercase tracking-wider">Diagram Synthesis Failure</p>
        </div>
        <pre className="text-[10px] text-text-tertiary overflow-x-auto p-3 bg-bg-void/50 rounded-lg border border-border-subtle mb-3">
          {chart}
        </pre>
        <p className="text-[10px] text-accent-rose/70 font-medium italic">{error}</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn("mermaid-container overflow-x-auto p-6 bg-bg-base/30 rounded-2xl border border-border-subtle hover:border-border-default transition-colors", className)}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export default MermaidDiagram;
