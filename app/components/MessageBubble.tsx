'use client';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';
import { Message } from '@/app/lib/types';
import { MODES } from '@/app/lib/models';

export default function MessageBubble({ message }: { message: Message }) {
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState<string | null>(null);
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

  if (isUser) {
    return (
      <div className="flex justify-end anim-up">
        <div
          className="max-w-[68%] px-4 py-3 rounded-2xl rounded-tr-sm text-[13.5px] text-white leading-relaxed"
          style={{ background: mode.gradient }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 anim-up group">
      <div
        className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white mt-0.5"
        style={{ background: mode.gradient }}
      >
        AI
      </div>

      <div className="flex-1 max-w-[80%]">
        <div
          className="relative px-4 py-4 rounded-2xl rounded-tl-sm text-[13.5px] leading-relaxed"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            color: '#d0d0e0',
          }}
        >
          {/* Copy button */}
          <button
            onClick={copyMsg}
            className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white/[0.07]"
            style={{ color: 'rgba(255,255,255,0.28)' }}
          >
            {copied ? <Check size={13} strokeWidth={2} /> : <Copy size={13} strokeWidth={1.75} />}
          </button>

          <div className="pr-8">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => (
                  <p className="mb-2.5 last:mb-0 leading-[1.75]">{children}</p>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-white">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="italic" style={{ color: 'rgba(255,255,255,0.6)' }}>{children}</em>
                ),
                ul: ({ children }) => (
                  <ul className="my-2.5 space-y-1.5">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="my-2.5 space-y-1.5 list-decimal list-inside" style={{ color: '#b0b0c8' }}>{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="flex items-baseline gap-2.5" style={{ color: '#b8b8d0' }}>
                    <span
                      className="rounded-full flex-shrink-0"
                      style={{ width: 4, height: 4, minWidth: 4, marginTop: 9, background: mode.accent }}
                    />
                    <span>{children}</span>
                  </li>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href} target="_blank" rel="noopener noreferrer"
                    className="underline underline-offset-2 decoration-dotted hover:decoration-solid transition-all"
                    style={{ color: mode.accent }}
                  >
                    {children}
                  </a>
                ),
                code: ({ className, children, ...props }: React.HTMLAttributes<HTMLElement> & { className?: string }) => {
                  const isBlock = Boolean(className?.includes('language-'));
                  const lang = className?.replace('language-', '') || '';
                  const codeStr = String(children);
                  const blockId = `block-${codeStr.slice(0, 10)}`;

                  if (isBlock) {
                    return (
                      <div
                        className="my-4 rounded-xl overflow-hidden"
                        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        <div
                          className="flex items-center justify-between px-4 py-2"
                          style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                        >
                          <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.22)' }}>
                            {lang || 'code'}
                          </span>
                          <button
                            onClick={() => copyCode(codeStr, blockId)}
                            className="flex items-center gap-1.5 text-[11px] transition-colors hover:text-white/50"
                            style={{ color: 'rgba(255,255,255,0.22)' }}
                          >
                            {codeCopied === blockId
                              ? <><Check size={11} strokeWidth={2} /> copied</>
                              : <><Copy size={11} strokeWidth={1.75} /> copy</>
                            }
                          </button>
                        </div>
                        <pre className="px-4 py-4 overflow-x-auto" style={{ background: 'rgba(0,0,0,0.45)', margin: 0 }}>
                          <code className="font-mono text-[12px] leading-relaxed" style={{ color: '#c8d0e8', fontFamily: '"JetBrains Mono", monospace' }}>
                            {children}
                          </code>
                        </pre>
                      </div>
                    );
                  }
                  return (
                    <code
                      className="font-mono text-[12px] px-1.5 py-0.5 rounded-md"
                      style={{ background: 'rgba(255,255,255,0.08)', color: mode.accent }}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                h1: ({ children }) => <h1 className="text-[17px] font-semibold text-white mb-2.5 mt-5 first:mt-0">{children}</h1>,
                h2: ({ children }) => <h2 className="text-[15px] font-semibold text-white mb-2 mt-4 first:mt-0">{children}</h2>,
                h3: ({ children }) => <h3 className="text-[13.5px] font-semibold text-white mb-1.5 mt-3 first:mt-0">{children}</h3>,
                blockquote: ({ children }) => (
                  <blockquote
                    className="pl-3.5 my-3 italic"
                    style={{ borderLeft: `2px solid ${mode.accent}60`, color: 'rgba(255,255,255,0.4)' }}
                  >
                    {children}
                  </blockquote>
                ),
                hr: () => <hr className="my-4" style={{ borderColor: 'rgba(255,255,255,0.07)' }} />,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>

        {message.model && (
          <p className="mt-1.5 ml-0.5 text-[10px]" style={{ color: 'rgba(255,255,255,0.14)' }}>
            {message.model} · {message.provider}
          </p>
        )}
      </div>
    </div>
  );
}
