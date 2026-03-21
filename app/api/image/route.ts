import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { prompt }: { prompt: string } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'No prompt provided' }, { status: 400 });

    const groqKey      = process.env.GROQ_API_KEY;
    const stabilityKey = process.env.STABILITY_API_KEY;
    const pexelsKey    = process.env.PEXELS_API_KEY;
    const unsplashKey  = process.env.UNSPLASH_ACCESS_KEY;

    // ── Step 1: AI classifies intent ─────────────────────
    let useRealPhoto = false;
    let cleanPrompt = prompt
      .replace(/^(generate|make|create|draw|render|produce|paint|illustrate)\s+(a|an|the|me)?\s*/i, '')
      .trim();

    if (groqKey) {
      try {
        const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'system',
                content: `Classify image requests. Reply JSON only.
{"type":"real","query":"search term"} — user wants to SEE/FIND/SHOW existing photos
{"type":"ai","query":"description"} — user wants to CREATE/GENERATE/DRAW/MAKE an image

"show mountain" → real
"phone wallpaper" → real
"boat" → real
"beach photo" → real
"generate dragon" → ai
"create city" → ai
"draw a cat" → ai
"make portrait" → ai`
              },
              { role: 'user', content: prompt },
            ],
            max_tokens: 80, temperature: 0,
          }),
        });
        if (r.ok) {
          const d = await r.json();
          const raw = d.choices?.[0]?.message?.content?.trim() ?? '';
          const match = raw.match(/\{[^}]+\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            useRealPhoto = parsed.type === 'real';
            if (parsed.query) cleanPrompt = parsed.query;
          }
        }
      } catch {}
    }

    // Keyword fallback
    if (!groqKey) {
      useRealPhoto = /^(show|find|get|search|look|photo|picture|image of|see|wallpaper|background)/i.test(prompt.trim());
    }

    // ── Step 2a: Real photos — multiple from Pexels + Unsplash ──
    if (useRealPhoto) {
      const images: Array<{
        url: string; provider: string;
        photographer?: string; photoUrl?: string;
        width?: number; height?: number;
      }> = [];

      // Random page so results differ each time
      const randomPage = Math.floor(Math.random() * 10) + 1;

      // Pexels — get 6 images
      if (pexelsKey) {
        try {
          const r = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(cleanPrompt)}&per_page=6&page=${randomPage}&orientation=landscape`,
            { headers: { Authorization: pexelsKey } }
          );
          if (r.ok) {
            const d = await r.json();
            for (const photo of d.photos ?? []) {
              images.push({
                url: photo.src.large2x || photo.src.large,
                provider: 'Pexels',
                photographer: photo.photographer,
                photoUrl: photo.url,
                width: photo.width,
                height: photo.height,
              });
            }
          }
        } catch {}
      }

      // Unsplash — get 6 images
      if (unsplashKey) {
        try {
          const r = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(cleanPrompt)}&per_page=6&page=${randomPage}&orientation=landscape`,
            { headers: { Authorization: `Client-ID ${unsplashKey}` } }
          );
          if (r.ok) {
            const d = await r.json();
            for (const photo of d.results ?? []) {
              images.push({
                url: photo.urls.regular,
                provider: 'Unsplash',
                photographer: photo.user.name,
                photoUrl: photo.links.html,
                width: photo.width,
                height: photo.height,
              });
            }
          }
        } catch {}
      }

      if (images.length > 0) {
        // Shuffle so Pexels and Unsplash are interleaved
        for (let i = images.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [images[i], images[j]] = [images[j], images[i]];
        }
        return NextResponse.json({
          type: 'gallery',
          images: images.slice(0, 10),
          prompt: cleanPrompt,
        });
      }
    }

    // ── Step 2b: AI generation → Stability AI ────────────
    if (stabilityKey) {
      try {
        const form = new FormData();
        form.append('prompt', cleanPrompt);
        form.append('output_format', 'jpeg');
        form.append('aspect_ratio', '1:1');

        const r = await fetch(
          'https://api.stability.ai/v2beta/stable-image/generate/core',
          {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${stabilityKey}`, 'Accept': 'image/*' },
            body: form,
          }
        );

        if (r.ok) {
          const buffer = await r.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          return NextResponse.json({
            type: 'single',
            imageUrl: `data:image/jpeg;base64,${base64}`,
            provider: 'Stability AI',
            prompt: cleanPrompt,
          });
        }
      } catch {}
    }

    return NextResponse.json({
      error: 'Image generation failed. Please try again.',
    }, { status: 503 });

  } catch {
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
