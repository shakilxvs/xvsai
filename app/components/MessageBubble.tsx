'use client';
import { useState, useMemo } from 'react';
import { marked } from 'marked';
import { Copy, Check, Download, ExternalLink, Loader2, ImageOff, X } from 'lucide-react';
import { Message, ImageResult, MediaItem } from '@/app/lib/types';
import { MODES } from '@/app/lib/models';

marked.setOptions({ breaks: true, gfm: true });

const PROVIDER_COLORS: Record<string, string> = {
  'Pexels': '#05a081',
  'Unsplash': '#555',
  'Pixabay': '#2ec66e',
  'Flickr': '#ff0084',
  'Openverse': '#c00',
  'Wikimedia': '#3d6b9c',
  'Met Museum': '#e41d36',
  'Art Inst. Chicago': '#8B0000',
  'NASA': '#0b3d91',
  'iNaturalist': '#74ac00',
  'Rijksmuseum': '#c8a850',
  'Cleveland Art': '#1a1a2e',
  'Europeana': '#004494',
  'Smithsonian': '#c41230',
  'GIPHY': '#9c00ff',
  'Wallhaven': '#cc0000',
  'Imgur': '#1bb76e',
  'The Dog API': '#f59e0b',
  'The Cat API': '#8b5cf6',
  'RandomFox': '#f97316',
  'Freepik': '#1273eb',
};

function ImageGallery({ images, prompt, accent }: {
  images: ImageResult[]; prompt: string; accent: string;
}) {
  const [visible, setVisible] = useState(5);
  const [stopped, setStopped] = useState(false);
  const [lightbox, setLightbox] = useState<ImageResult | null>(null);
  const [errored, setErrored] = useState<Set<string>>(new Set());

  const validImages = images.filter(img => !errored.has(img.url));
  const shown = Math.min(visible, validImages.length);
  const hasMore = visible < validImages.length;

  const providers = Array.from(new Set(validImages.map(i => i.provider)));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
          "{prompt}" — {validImages.length} from {providers.length} sources
        </p>
      </div>

      {/* Masonry 2-col grid */}
      <div style={{ columns: 2, columnGap: '8px' }}>
        {validImages.slice(0, shown).map((img, i) => {
          const color = PROVIDER_COLORS[img.provider] ?? accent;
          return (
            <div
              key={`${img.url}-${i}`}
              className="group relative cursor-pointer overflow-hidden rounded-xl mb-2 break-inside-avoid"
              style={{ animation: `fadeUp 0.3s ${Math.min(i, 4) * 0.06}s ease both` }}
              onClick={() => setLightbox(img)}
            >
              <img
                src={img.url}
                alt={prompt}
                className="w-full h-auto block transition-transform duration-300 group-hover:scale-[1.03]"
                style={{ borderRadius: '10px' }}
                onError={() => setErrored(prev => new Set([...prev, img.url]))}
              />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2.5 rounded-xl"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)' }}>
                <div className="flex items-end justify-between gap-2">
                  {img.photographer && (
                    <p className="text-[10px] text-white/80 truncate flex-1">{img.photographer}</p>
                  )}
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full text-white font-medium flex-shrink-0"
                    style={{ background: color }}>
                    {img.provider}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show more / stop */}
      {!stopped && hasMore && (
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => { setVisible(v => v + 5); if (visible + 5 >= validImages.length) setStopped(true); }}
            className="flex-1 py-2 rounded-xl text-[12px] font-medium transition-all hover:opacity-80"
            style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}30` }}>
            Show more
          </button>
          <button
            onClick={() => setStopped(true)}
            className="p-2 rounded-xl transition-all hover:bg-white/[0.08]"
            style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <X size={15} />
          </button>
        </div>
      )}

      {(stopped || !hasMore) && (
        <p className="text-[11px] mt-2 text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Showing {shown} of {validImages.length} images
        </p>
      )}

      {/* Source pills */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {providers.map(src => {
          const color = PROVIDER_COLORS[src] ?? accent;
          return (
            <span key={src} className="text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: `${color}20`, color, border: `1px solid ${color}35` }}>
              {src}
            </span>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.92)' }}
          onClick={() => setLightbox(null)}>
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <img src={lightbox.url} alt={prompt} className="w-full h-auto rounded-2xl"
              style={{ maxHeight: '78vh', objectFit: 'contain' }} />
            <div className="flex items-center justify-between mt-3 px-1 flex-wrap gap-2">
              <div>
                {lightbox.photographer && (
                  <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {lightbox.photoUrl
                      ? <><a href={lightbox.photoUrl} target="_blank" rel="noopener noreferrer"
                          className="underline" style={{ color: PROVIDER_COLORS[lightbox.provider] ?? accent }}>{lightbox.photographer}</a> · {lightbox.provider}</>
                      : `${lightbox.photographer} · ${lightbox.provider}`
                    }
                  </p>
                )}
                {!lightbox.photographer && (
                  <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{lightbox.provider}</p>
                )}
              </div>
              <div className="flex gap-2">
                <a href={lightbox.url} download target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-white"
                  style={{ background: PROVIDER_COLORS[lightbox.provider] ?? accent }}>
                  <Download size={12} /> Save
                </a>
                {lightbox.photoUrl && (
                  <a href={lightbox.photoUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] text-white"
                    style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <ExternalLink size={12} /> View
                  </a>
                )}
                <button onClick={() => setLightbox(null)}
                  className="px-3 py-1.5 rounded-lg text-[11px] text-white"
                  style={{ background: 'rgba(255,255,255,0.1)' }}>
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

function SingleImage({ imageUrl, prompt, accent }: { imageUrl: string; prompt: string; accent: string }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <div className="rounded-2xl rounded-tl-sm overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
      {!imgLoaded && !imgError && (
        <div className="flex flex-col items-center justify-center gap-3 p-8"
          style={{ background: 'rgba(255,255,255,0.03)', minHeight: '260px' }}>
          <Loader2 size={24} className="animate-spin" style={{ color: accent }} />
          <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Loading…</p>
        </div>
      )}
      {imgError && (
        <div className="flex flex-col items-center justify-center gap-3 p-8"
          style={{ background: 'rgba(255,255,255,0.03)', minHeight: '200px' }}>
          <ImageOff size={24} style={{ color: 'rgba(255,255,255,0.3)' }} />
          <a href={imageUrl} target="_blank" rel="noopener noreferrer"
            className="text-[12px] underline" style={{ color: accent }}>Open in new tab →</a>
        </div>
      )}
      <img src={imageUrl} alt={prompt}
        style={{ display: imgLoaded ? 'block' : 'none', width: '100%', height: 'auto', maxHeight: '512px', objectFit: 'contain' }}
        onLoad={() => setImgLoaded(true)}
        onError={() => setImgError(true)} />
      {(imgLoaded || imgError) && (
        <div className="flex items-center justify-between px-4 py-3 gap-3"
          style={{ background: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[12px] truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>"{prompt}"</p>
          {imgLoaded && (
            <a href={imageUrl} download target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium flex-shrink-0"
              style={{ color: accent, border: `1px solid ${accent}35` }}>
              <Download size={12} strokeWidth={2} /> Save
            </a>
          )}
        </div>
      )}
    </div>
  );
}


// ── Open Mode Rich Media Grid ─────────────────────────────
function OpenMediaGrid({ media, accent }: { media: MediaItem[]; accent: string }) {
  const [lightbox, setLightbox] = useState<MediaItem | null>(null);
  const [errored, setErrored] = useState<Set<string>>(new Set());

  const images = media.filter(m => (m.type === 'image' || m.type === 'gif') && !errored.has(m.url));
  const videos = media.filter(m => m.type === 'video');

  if (images.length === 0 && videos.length === 0) return null;

  return (
    <div className="mt-3">
      {/* Videos */}
      {videos.length > 0 && (
        <div className="mb-3 space-y-2">
          {videos.map((v, i) => (
            <div key={i} className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              {v.url.includes('youtube') ? (
                <iframe
                  src={v.url}
                  title={v.title ?? 'video'}
                  className="w-full"
                  style={{ height: '200px', border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video src={v.url} controls className="w-full" style={{ maxHeight: '200px' }} />
              )}
              {v.title && (
                <div className="px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <p className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>{v.title}</p>
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{v.provider}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Images & GIFs grid */}
      {images.length > 0 && (
        <div style={{ columns: images.length === 1 ? 1 : 2, columnGap: '6px' }}>
          {images.map((img, i) => (
            <div key={i}
              className="group relative cursor-pointer overflow-hidden rounded-xl mb-1.5 break-inside-avoid"
              onClick={() => setLightbox(img)}>
              <img
                src={img.url}
                alt={img.title ?? 'media'}
                className="w-full h-auto block transition-transform duration-300 group-hover:scale-[1.03]"
                style={{ borderRadius: '10px', maxHeight: img.type === 'gif' ? '180px' : '240px', objectFit: 'cover' }}
                onError={() => setErrored(prev => new Set([...prev, img.url]))}
              />
              {img.type === 'gif' && (
                <span className="absolute top-2 left-2 text-[9px] px-1.5 py-0.5 rounded font-bold text-white"
                  style={{ background: '#9c00ff' }}>GIF</span>
              )}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 rounded-xl"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }}>
                <div className="flex items-end justify-between">
                  {img.photographer && <p className="text-[10px] text-white/70 truncate">{img.photographer}</p>}
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full text-white ml-auto flex-shrink-0"
                    style={{ background: accent + '99' }}>{img.provider}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.93)' }}
          onClick={() => setLightbox(null)}>
          <div className="max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <img src={lightbox.url} alt={lightbox.title ?? ''} className="w-full h-auto rounded-2xl"
              style={{ maxHeight: '75vh', objectFit: 'contain' }} />
            <div className="flex items-center justify-between mt-3 px-1">
              <div>
                {lightbox.photographer && (
                  <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {lightbox.photographer} · {lightbox.provider}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <a href={lightbox.url} download target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-white"
                  style={{ background: accent }}>
                  <Download size={12} /> Save
                </a>
                {lightbox.sourceUrl && (
                  <a href={lightbox.sourceUrl} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg text-[11px] text-white"
                    style={{ background: 'rgba(255,255,255,0.1)' }}>
                    Source
                  </a>
                )}
                <button onClick={() => setLightbox(null)}
                  className="px-3 py-1.5 rounded-lg text-[11px] text-white"
                  style={{ background: 'rgba(255,255,255,0.1)' }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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

        {/* Loading */}
        {message.imageLoading && (
          <div className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl rounded-tl-sm"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', minHeight: '180px' }}>
            <Loader2 size={24} className="animate-spin" style={{ color: mode.accent }} />
            <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {message.provider === 'generating' ? 'Generating image…' : 'Searching across sources…'}
            </p>
          </div>
        )}

        {/* Gallery */}
        {message.images && message.images.length > 0 && !message.imageLoading && (
          <ImageGallery images={message.images} prompt={message.content} accent={mode.accent} />
        )}

        {/* Single AI image */}
        {message.imageUrl && !message.imageLoading && (
          <SingleImage imageUrl={message.imageUrl} prompt={message.content} accent={mode.accent} />
        )}

        {/* Text */}
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
              dangerouslySetInnerHTML={{ __html: htmlContent }} />
          </div>
        )}

        {/* Open Mode Rich Media */}
        {message.openMedia && message.openMedia.length > 0 && (
          <OpenMediaGrid media={message.openMedia} accent={mode.accent} />
        )}

        {/* Research sources */}
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
