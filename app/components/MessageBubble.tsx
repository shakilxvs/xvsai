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
            <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Generating your image…
            </p>
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
                alt={message.content}
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
                <Download size={12} strokeWidth={2} />
                Save
              </button>
            </div>
          </div>
        )}

        {/* TEXT RESPONSE */}
        {!message.imageUrl && !message.imageLoading && (
          <div
            className="relative px-4 py-4 rounded-2xl rounded-tl-sm text-[13.5px] leading-relaxed"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#dcdce8',
            }}
          >
            <button
              onClick={copyMsg}
              className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white/[0.08]"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              {copied ? <Check size={13} strokeWidth={2} /> : <Copy size={13} strokeWidth={1.75} />}
            </button>

            <div className="pr-8">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => (
                    <p className="mb-2.5 last:mb-0" style={{ lineHeight: 1.8, color: '#dcdce8' }}>{children}</p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold" style={{ color: '#ffffff' }}>{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic" style={{ color: 'rgba(255,255,255,0.6)' }}>{children}</em>
                  ),
                  ul: ({ children }) => <ul className="my-3 space-y-2">{children}</ul>,
                  ol: ({ children }) => (
                    <ol className="my-3 space-y-2 list-decimal list-inside" style={{ color: '#c8c8dc' }}>{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="flex items-baseline gap-2.5" style={{ color: '#c8c8dc' }}>
                      <span className="rounded-full flex-shrink-0"
                        style={{ width: 4, height: 4, minWidth: 4, marginTop: 9, background: mode.accent }} />
                      <span style={{ color: '#c8c8dc' }}>{children}</span>
                    </li>
                  ),
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer"
                      className="underline underline-offset-2 decoration-dotted hover:decoration-solid"
                      style={{ color: mode.accent }}>{children}</a>
                  ),
                  code: ({ className, children, ...props }: React.HTMLAttributes<HTMLElement> & { className?: string }) => {
                    const isBlock = Boolean(className?.includes('language-'));
                    const lang = className?.replace('language-', '') || '';
                    const codeStr = String(children);
                    const blockId = `b-${codeStr.slice(0, 12)}`;
                    if (isBlock) {
                      return (
                        <div className="my-4 rounded-xl overflow-hidden"
                          style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                          <div className="flex items-center justify-between px-4 py-2.5"
                            style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            <span className="text-[10px] font-mono uppercase tracking-widest"
                              style={{ color: 'rgba(255,255,255,0.35)' }}>
                              {lang || 'code'}
                            </span>
                            <button onClick={() => copyCode(codeStr, blockId)}
                              className="flex items-center gap-1.5 text-[11px] transition-colors"
                              style={{ color: 'rgba(255,255,255,0.35)' }}>
                              {codeCopied === blockId
                                ? <><Check size={11} strokeWidth={2} /> copied</>
                                : <><Copy size={11} strokeWidth={1.75} /> copy</>
                              }
                            </button>
                          </div>
                          <pre className="px-4 py-4 overflow-x-auto" style={{ background: 'rgba(0,0,0,0.5)', margin: 0 }}>
                            <code className="font-mono text-[12.5px] leading-relaxed"
                              style={{ color: '#d8e0f0', fontFamily: '"JetBrains Mono", monospace' }}>
                              {children}
                            </code>
                          </pre>
                        </div>
                      );
                    }
                    return (
                      <code className="font-mono text-[12px] px-1.5 py-0.5 rounded-md"
                        style={{ background: 'rgba(255,255,255,0.1)', color: mode.accent }} {...props}>
                        {children}
                      </code>
                    );
                  },
                  h1: ({ children }) => <h1 className="text-[18px] font-semibold mb-2.5 mt-5 first:mt-0" style={{ color: '#ffffff' }}>{children}</h1>,
                  h2: ({ children }) => <h2 className="text-[16px] font-semibold mb-2 mt-4 first:mt-0" style={{ color: '#ffffff' }}>{children}</h2>,
                  h3: ({ children }) => <h3 className="text-[14px] font-semibold mb-1.5 mt-3 first:mt-0" style={{ color: '#f0f0f8' }}>{children}</h3>,
                  blockquote: ({ children }) => (
                    <blockquote className="pl-3.5 my-3 italic"
                      style={{ borderLeft: `2px solid ${mode.accent}70`, color: 'rgba(255,255,255,0.5)' }}>
                      {children}
                    </blockquote>
                  ),
                  hr: () => <hr className="my-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />,
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-3">
                      <table className="w-full text-[12.5px]" style={{ borderCollapse: 'collapse' }}>{children}</table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-3 py-2" style={{ color: '#c0c0d8', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {children}
                    </td>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* SOURCES */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest px-0.5"
              style={{ color: 'rgba(255,255,255,0.3)' }}>
              Sources
            </p>
            {message.sources.map((src, i) => (
              <a key={i} href={src.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all hover:bg-white/[0.05]"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-[12px] font-medium truncate flex-1"
                  style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {src.title}
                </span>
                <ExternalLink size={11} strokeWidth={1.75} style={{ color: mode.accent, flexShrink: 0 }} />
              </a>
            ))}
          </div>
        )}

        {/* Attribution */}
        {message.model && message.model !== '...' && (
          <p className="mt-2 ml-0.5 text-[11px]" style={{ color: 'rgba(255,255,255,0.22)' }}>
            {message.model} · {message.provider}
          </p>
        )}
      </div>
    </div>
  );
}
