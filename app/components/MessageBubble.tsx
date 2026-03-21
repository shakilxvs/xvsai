'use client';
import { useState, useMemo } from 'react';
import { marked } from 'marked';
import { Copy, Check, Download, ExternalLink, Loader2 } from 'lucide-react';
import { Message } from '@/app/lib/types';
import { MODES } from '@/app/lib/models';

// Configure marked for clean output
marked.setOptions({ breaks: true, gfm: true });

export default function MessageBubble({ message }: { message: Message }) {
  const [copied, setCopied] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const isUser = message.role === 'user';
  const mode = MODES.find(m => m.id === message.mode)!;

  const copyMsg = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadImage = () => {
    if (!message.imageUrl) return;
    const a = document.createElement('a');
    a.href = message.imageUrl;
    a.download = `xvsai-${Date.now()}.png`;
    a.target = '_blank';
    a.click();
  };

  // Convert markdown to HTML using marked — no React type issues at all
  const htmlContent = useMemo(() => {
    if (!message.content) return '';
    const raw = marked.parse(message.content) as string;
    // Inject mode accent color for links and bullets via CSS variables
    return raw;
  }, [message.content]);

  if (isUser) {
    return (
      <div className="flex justify-end anim-up">
        <div
          className="max-w-[80%] md:max-w-[68%] px-4 py-3 rounded-2xl rounded-tr-sm text-[14px] text-white leading-relaxed"
          style={{ background: mode.gradient }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5 anim-up group">
      {/* AI avatar */}
      <div
        className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white mt-0.5"
        style={{ background: mode.gradient }}
      >
        AI
      </div>

      <div className="flex-1 min-w-0">

        {/* IMAGE LOADING */}
        {message.imageLoading && (
          <div
            className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl rounded-tl-sm"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', minHeight: '200px' }}
          >
            <Loader2 size={24} className="animate-spin" style={{ color: mode.accent }} />
            <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Generating your image…</p>
          </div>
        )}

        {/* IMAGE RESULT */}
        {message.imageUrl && !message.imageLoading && (
          <div className="rounded-2xl rounded-tl-sm overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="relative bg-black/40" style={{ minHeight: imgLoaded ? 'auto' : '260px' }}>
              {!imgLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin" style={{ color: mode.accent }} />
                </div>
              )}
              <img
                src={message.imageUrl}
                alt="Generated image"
                className="w-full h-auto block transition-opacity duration-500"
                style={{ opacity: imgLoaded ? 1 : 0, maxHeight: '480px', objectFit: 'contain' }}
                onLoad={() => setImgLoaded(true)}
              />
            </div>
            <div
              className="flex items-center justify-between px-4 py-3 gap-3"
              style={{ background: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.07)' }}
            >
              <p className="text-[12px] truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {message.content.replace("Here's your image: ", '').replace(/\*\*/g, '')}
              </p>
              <button
                onClick={downloadImage}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all flex-shrink-0 hover:bg-white/[0.08]"
                style={{ color: mode.accent, border: `1px solid ${mode.accent}35` }}
              >
                <Download size={12} strokeWidth={2} /> Save
              </button>
            </div>
          </div>
        )}

        {/* TEXT RESPONSE */}
        {!message.imageUrl && !message.imageLoading && (
          <div
            className="relative px-4 py-4 rounded-2xl rounded-tl-sm"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <button
              onClick={copyMsg}
              className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white/[0.08]"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              {copied ? <Check size={13} strokeWidth={2} /> : <Copy size={13} strokeWidth={1.75} />}
            </button>

            {/* Rendered markdown via dangerouslySetInnerHTML — safe because content comes from AI APIs */}
            <div
              className="pr-8 prose-xvsai"
              style={{ '--accent': mode.accent } as React.CSSProperties}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
        )}

        {/* SOURCES */}
        {message.sources && message.sources.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5"
              style={{ color: 'rgba(255,255,255,0.3)' }}>
              Sources
            </p>
            {message.sources.map((src, i) => (
              <a
                key={i}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all hover:bg-white/[0.05] mb-1.5"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <span className="text-[12px] font-medium truncate flex-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {src.title}
                </span>
                <ExternalLink size={11} strokeWidth={1.75} style={{ color: mode.accent, flexShrink: 0 }} />
              </a>
            ))}
          </div>
        )}

        {/* Attribution */}
        {message.model && message.model !== '...' && (
          <p className="mt-1.5 text-[10px]" style={{ color: 'rgba(255,255,255,0.22)' }}>
            {message.model} · {message.provider}
          </p>
        )}
      </div>
    </div>
  );
}
