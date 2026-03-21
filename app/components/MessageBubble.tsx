'use client';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, Download, ExternalLink, Loader2 } from 'lucide-react';
import { Message } from '@/app/lib/types';
import { MODES } from '@/app/lib/models';

export default function MessageBubble({ message }: { message: Message }) {
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState<string | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const isUser = message.role === 'user';
  const mode = MODES.find(m => m.id === message.mode)!;

  const copyMsg = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCodeCopied(id);
    setTimeout(() => setCodeCopied(null), 2000);
  };

  const downloadImage = () => {
    if (!message.imageUrl) return;
    const a = document.createElement('a');
    a.href = message.imageUrl;
    a.download = `xvsai-${Date.now()}.png`;
    a.target = '_blank';
    a.click();
  };

  if (isUser) {
    return (
      <div className="flex justify-end anim-up">
        <div className="max-w-[80%] md:max-w-[68%] px-4 py-3 rounded-2xl rounded-tr-sm text-[14px] text-white leading-relaxed"
          style={{ background: mode.gradient }}>
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5 anim-up group">
      <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white mt-0.5"
        style={{ background: mode.gradient }}>
        AI
      </div>

      <div className="flex-1 min-w-0">

        {/* IMAGE LOADING */}
        {message.imageLoading && (
          <div className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl rounded-tl-sm"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', minHeight: '200px' }}>
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
              <img src={message.imageUrl} alt={message.content}
                className="w-full h-auto block transition-opacity duration-500"
                style={{ opacity: imgLoaded ? 1 : 0, maxHeight: '480px', objectFit: 'contain' }}
                onLoad={() => setImgLoaded(true)} />
            </div>
            <div className="flex items-center justify-between px-4 py-3 gap-3"
              style={{ background: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[12px] truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {message.content.replace("Here's your image: ", '').replace(/\*\*/g, '')}
              </p>
              <button onClick={downloadImage}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all flex-shrink-0 hover:bg-white/[0.08]"
                style={{ color: mode.accent, border: `1px solid ${mode.accent}35` }}>
                <Download size={12} strokeWidth={2} /> Save
              </button>
            </div>
          </div>
        )}

        {/* TEXT RESPONSE */}
        {!message.imageUrl && !message.imageLoading && (
          <div className="relative px-4 py-4 rounded-2xl rounded-tl-sm text-[13.5px] leading-relaxed"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#dcdce8' }}>
            <button onClick={copyMsg}
              className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white/[0.08]"
              style={{ color: 'rgba(255,255,255,0.4)' }}>
              {copied ? <Check size={13} strokeWidth={2} /> : <Copy size={13} strokeWidth={1.75} />}
            </button>

            <div className="pr-8">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => (
                    <p style={{ marginBottom: '10px', lineHeight: 1.8, color: '#dcdce8' }}>{children}</p>
                  ),
                  strong: ({ children }) => (
                    <strong style={{ fontWeight: 600, color: '#ffffff' }}>{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.6)' }}>{children}</em>
                  ),
                  ul: ({ children }) => (
                    <ul style={{ margin: '10px 0', padding: 0, listStyle: 'none' }}>{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol style={{ margin: '10px 0', paddingLeft: '20px', color: '#c8c8dc' }}>{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '6px', color: '#c8c8dc' }}>
                      <span style={{ width: 4, height: 4, minWidth: 4, borderRadius: '50%', marginTop: 8, background: mode.accent, flexShrink: 0, display: 'inline-block' }} />
                      <span>{children}</span>
                    </li>
                  ),
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer"
                      style={{ color: mode.accent, textDecoration: 'underline', textDecorationStyle: 'dotted' }}>
                      {children}
                    </a>
                  ),
                  // @ts-ignore
                  code: ({ inline, className, children }) => {
                    const isBlock = !inline && className?.includes('language-');
                    const lang = className?.replace('language-', '') || '';
                    const codeStr = String(children).replace(/\n$/, '');
                    const blockId = `b-${codeStr.slice(0, 12)}`;
                    if (isBlock) {
                      return (
                        <div style={{ margin: '16px 0', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                            <span style={{ fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)' }}>{lang || 'code'}</span>
                            <button onClick={() => copyCode(codeStr, blockId)}
                              style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {codeCopied === blockId ? <><Check size={11} /> copied</> : <><Copy size={11} /> copy</>}
                            </button>
                          </div>
                          <pre style={{ margin: 0, padding: '16px', overflowX: 'auto', background: 'rgba(0,0,0,0.5)' }}>
                            <code style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '12px', lineHeight: 1.7, color: '#d8e0f0' }}>
                              {codeStr}
                            </code>
                          </pre>
                        </div>
                      );
                    }
                    return (
                      <code style={{ fontFamily: 'monospace', fontSize: '12px', padding: '2px 6px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', color: mode.accent }}>
                        {children}
                      </code>
                    );
                  },
                  h1: ({ children }) => <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: '20px 0 10px' }}>{children}</h1>,
                  h2: ({ children }) => <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: '16px 0 8px' }}>{children}</h2>,
                  h3: ({ children }) => <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#f0f0f8', margin: '12px 0 6px' }}>{children}</h3>,
                  blockquote: ({ children }) => (
                    <blockquote style={{ borderLeft: `2px solid ${mode.accent}70`, paddingLeft: '14px', margin: '12px 0', fontStyle: 'italic', color: 'rgba(255,255,255,0.5)' }}>
                      {children}
                    </blockquote>
                  ),
                  hr: () => <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '16px 0' }} />,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* SOURCES */}
        {message.sources && message.sources.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            <p style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.3)', marginBottom: '6px' }}>Sources</p>
            {message.sources.map((src, i) => (
              <a key={i} href={src.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all hover:bg-white/[0.05] mb-1.5"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-[12px] font-medium truncate flex-1" style={{ color: 'rgba(255,255,255,0.6)' }}>{src.title}</span>
                <ExternalLink size={11} strokeWidth={1.75} style={{ color: mode.accent, flexShrink: 0 }} />
              </a>
            ))}
          </div>
        )}

        {/* Attribution */}
        {message.model && message.model !== '...' && (
          <p style={{ marginTop: '6px', fontSize: '10px', color: 'rgba(255,255,255,0.22)' }}>
            {message.model} · {message.provider}
          </p>
        )}
      </div>
    </div>
  );
}
