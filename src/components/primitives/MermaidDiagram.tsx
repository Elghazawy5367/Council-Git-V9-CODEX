import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { sanitizeMermaid } from '@/lib/sanitize';

// Initialize mermaid with dark theme
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'strict',
  fontFamily: 'inherit',
  themeVariables: {
    primaryColor: 'hsl(var(--primary))',
    primaryTextColor: 'hsl(var(--primary-foreground))',
    primaryBorderColor: 'hsl(var(--border))',
    lineColor: 'hsl(var(--muted-foreground))',
    secondaryColor: 'hsl(var(--secondary))',
    tertiaryColor: 'hsl(var(--muted))',
    background: 'hsl(var(--background))',
    mainBkg: 'hsl(var(--card))',
    nodeBorder: 'hsl(var(--border))',
    clusterBkg: 'hsl(var(--muted))',
    titleColor: 'hsl(var(--foreground))',
    edgeLabelBackground: 'hsl(var(--background))',
  },
});

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
    const renderDiagram = async () => {
      if (!chart || !containerRef.current) return;

      setIsLoading(true);
      setError(null);

      try {
        // Generate unique ID for this diagram
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Clean the chart string
        const cleanedChart = chart.trim();
        
        // Render the diagram
        const { svg: renderedSvg } = await mermaid.render(id, cleanedChart);
        setSvg(renderedSvg);
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
      } finally {
        setIsLoading(false);
      }
    };

    renderDiagram();
  }, [chart]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-4 bg-muted/30 rounded-lg ${className}`}>
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Rendering diagram...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-destructive/10 border border-destructive/30 rounded-lg ${className}`}>
        <p className="text-destructive text-sm font-medium mb-2">Diagram Error</p>
        <pre className="text-xs text-muted-foreground overflow-x-auto">
          {chart}
        </pre>
        <p className="text-xs text-destructive/70 mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`mermaid-container overflow-x-auto p-4 bg-muted/20 rounded-lg border border-border/50 ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizeMermaid(svg) }}
    />
  );
};

export default MermaidDiagram;
