import DOMPurify from 'dompurify';

/**
 * Sanitizes Mermaid charts to prevent XSS while allowing SVG tags
 */
export function sanitizeMermaid(content: string): string {
  if (typeof window === 'undefined') return content;
  
  return DOMPurify.sanitize(content, {
    USE_PROFILES: { svg: true },
    ALLOWED_TAGS: ['svg', 'path', 'rect', 'circle', 'line', 'polyline', 'polygon', 'text', 'tspan', 'g', 'defs', 'style', 'marker'],
    ALLOWED_ATTR: ['d', 'x', 'y', 'width', 'height', 'fill', 'stroke', 'viewBox', 'class', 'id', 'transform', 'points', 'r', 'cx', 'cy', 'x1', 'y1', 'x2', 'y2', 'marker-end', 'marker-start', 'text-anchor', 'font-size', 'font-family', 'style']
  });
}

/**
 * Sanitizes Markdown content
 */
export function sanitizeMarkdown(content: string): string {
  if (typeof window === 'undefined') return content;
  return DOMPurify.sanitize(content);
}
