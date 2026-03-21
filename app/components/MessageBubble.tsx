'use client';
import { useState, useMemo, useCallback } from 'react';
import { marked } from 'marked';
import { Copy, Check, Download, ExternalLink, Loader2, ImageOff, X } from 'lucide-react';
import { Message, ImageResult } from '@/app/lib/types';
import { MODES } from '@/app/lib/models';

marked.setOptions({ breaks: true, gfm: true });

// ── Pinterest-style image grid ────────────────────────────
function ImageGallery({ images, prompt, accent }: {
  images: ImageResult[];
  prompt: string;
  accent: string;
}) {
  const [visible, setVisible] = useState(6);
  const [stopped, setStopped] = useState(false);
  const [lightbox, setLightbox] = useState<ImageResult | null>(null);

  const showMore = () => {
    if (visible >= images.length) { setStopped(true); return; }
    setVisible(v => Math.min(v + 4, images.length));
  };

  const stop = () => setStopped(true);

  return (
    <div>
      {/* Grid */}
      <div style={{
        columns: '2',
        columnGap: '8px',
        width: '100%',
      }}>
        {images.slice(0, stopped ? visible : visible).map((img, i) => (
          <div
            key={i}
            className="group relative cursor-pointer overflow-hidden rounded-xl mb-2 break-inside-avoid"
            style={{
              animation: `fadeUp 0.3s ${i * 0.05}s ease both`,
            }}
            onClick={() => setLightbox(img)}
          >
            <img
              src={img.url}
              alt={prompt}
              className="w-full h-auto block transition-transform duration-300 group-hover:scale-105"
              style={{ borderRadius: '10px' }}
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2 rounded-xl"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }}>
              <div className="flex items-center justify-between">
                {img.photographer && (
                  <a href={img.photoUrl} target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="text-[10px] text-white/80 truncate hover:text-white">
                    {img.photographer}
                  </a>
                )}
                <span className="text-[9px] px-1.5 py-0.5 rounded-full text-white/60 ml-auto flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.15)' }}>
                  {img.provider}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load more / Stop */}
      {!stopped && visible < images.length && (
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={showMore}
            className="flex-1 py-2 rounded-xl text-[12px] font-medium transition-all hover:opacity-80"
            style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}30` }}>
            Show more
          </button>
          <button
            onClick={stop}
            className="px-3 py-2 rounded-xl text-[12px] transition-all hover:bg-white/[0.08]"
            style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {stopped && (
        <p className="text-[11px] mt-2 text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Showing {Math.min(visible, images.length)} of {images.length} images
        </p>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.9)' }}
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <img src={lightbox.url} alt={prompt} className="w-full h-auto rounded-2xl" />
            <div className="flex items-center justify-between mt-3 px-1">
              <div>
                {lightbox.photographer && (
                  <p className="text-[12px] text-white/60">
                    Photo by{' '}
                    <a href={lightbox.photoUrl} target="_blank" rel="noopener noreferrer"
                      className="underline" style={{ color: accent }}>
                      {lightbox.photographer}
                    </a>
                    {' '}on {lightbox.provider}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <a href={lightbox.url} download target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium"
                  style={{ background: accent, color: 'white' }}>
                  <Download size={12} /> Save
                </a>
                <button onClick={() => setLightbox(null)}
                  className="px-3 py-1.5 rounded-lg text-[11px]"
                  style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Single AI generated image ─────────────────────────────
function SingleImage({ imageUrl, prompt, accent }: { imageUrl: string; prompt: string; accent: string }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const download = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `xvsai-${Date.now()}.jpg`;
    a.target = '_blank';
    a.click();
  };

  return (
    <div className="rounded-2xl rounded-tl-sm overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
      {!imgLoaded && !imgError && (
        <div className="flex flex-col items-center justify-center gap-3 p-8"
          style={{ background: 'rgba(255,255,255,0.03)', minHeight: '260px' }}>
          <Loader2 size={24} className="animate-spin" style={{ color: accent }} />
          <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Loading image…</p>
        </div>
      )}
      {imgError && (
        <div className="flex flex-col items-center justify-center gap-3 p-8"
          style={{ background: 'rgba(255,255,255,0.03)', minHeight: '200px' }}>
          <ImageOff size={24} style={{ color: 'rgba(255,255,255,0.3)' }} />
          <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Could not load image.</p>
          <a href={imageUrl} target="_blank" rel="noopener noreferrer"
            className="text-[12px] underline" style={{ color: accent }}>Open in new tab →</a>
        </div>
      )}
      <img src={imageUrl} alt={prompt}
        style={{ display: imgLoaded ? 'block' : 'none', width: '100%', height: 'auto', maxHeight: '512px', objectFit: 'contain' }}
        onLoad={() => setImgLoaded(true)}
        onError={() => setImgError(true)}
      />
      {(imgLoaded || imgError) && (
        <div className="flex items-center justify-between px-4 py-3 gap-3"
          style={{ background: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[12px] truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>"{prompt}"</p>
          {imgLoaded && (
            <button onClick={download}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium flex-shrink-0 hover:opacity-80"
              style={{ color: accent, border: `1px solid ${accent}35` }}>
              <Download size={12} strokeWidth={2} /> Save
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main MessageBubble ────────────────────────────────────
export default function MessageBubble({ message }: { message: Message }) {
  const [copied, setCopied] = useState(false);
  const mode = MODES.find(m => m.id === message.mode)!;
  const isUser = message.role === 'user';

  const copyMsg = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const htmlContent = useMemo(() => {
    if (!message.content) return '';
    return marked.parse(message.content) as string;
  }, [message.content]);

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

        {/* Loading skeleton */}
        {message.imageLoading && (
          <div className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl rounded-tl-sm"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', minHeight: '200px' }}>
            <Loader2 size={24} className="animate-spin" style={{ color: mode.accent }} />
            <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Searching for images…</p>
          </div>
        )}

        {/* Pinterest gallery for real photos */}
        {message.images && message.images.length > 0 && !message.imageLoading && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
                "{message.content}" — {message.images.length} results
              </p>
            </div>
            <ImageGallery
              images={message.images}
              prompt={message.content}
              accent={mode.accent}
            />
          </div>
        )}

        {/* Single AI generated image */}
        {message.imageUrl && !message.imageLoading && (
          <SingleImage imageUrl={message.imageUrl} prompt={message.content} accent={mode.accent} />
        )}

        {/* Text response */}
        {!message.imageUrl && !message.imageLoading && !message.images && (
          <div className="relative px-4 py-4 rounded-2xl rounded-tl-sm"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <button onClick={copyMsg}
              className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white/[0.08]"
              style={{ color: 'rgba(255,255,255,0.4)' }}>
              {copied ? <Check size={13} strokeWidth={2} /> : <Copy size={13} strokeWidth={1.75} />}
            </button>
            <div className="pr-8 prose-xvsai"
              style={{ '--accent': mode.accent } as React.CSSProperties}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
        )}

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5"
              style={{ color: 'rgba(255,255,255,0.3)' }}>Sources</p>
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
        {message.model && message.model !== '...' && !message.images && (
          <p className="mt-1.5 text-[10px]" style={{ color: 'rgba(255,255,255,0.22)' }}>
            {message.model} · {message.provider}
          </p>
        )}
      </div>
    </div>
  );
}
