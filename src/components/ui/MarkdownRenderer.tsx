import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getImageUrl } from '../../db/imageStore';

const IMG_PROTOCOL = 'img://';

function ResolvedImage({ src, alt }: { src: string; alt?: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!src.startsWith(IMG_PROTOCOL)) {
      setUrl(src);
      return;
    }
    const id = src.slice(IMG_PROTOCOL.length);
    let objectUrl: string | null = null;
    getImageUrl(id).then((resolved) => {
      objectUrl = resolved;
      setUrl(resolved);
    });
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (!url) return null;
  return <img src={url} alt={alt ?? ''} style={{ maxWidth: '100%', maxHeight: '600px', objectFit: 'contain', display: 'block' }} />;
}

interface MarkdownRendererProps {
  children: string;
  className?: string;
}

function urlTransform(url: string): string {
  if (url.startsWith('img://')) return url;
  if (/^(https?|ircs?|mailto|xmpp):/i.test(url)) return url;
  return '';
}

export function MarkdownRenderer({ children, className }: MarkdownRendererProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={urlTransform}
        components={{
          img: ({ src, alt }) => <ResolvedImage src={src ?? ''} alt={alt} />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
