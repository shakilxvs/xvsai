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
                content: `You classify image requests. Reply with JSON only, no explanation.
{"type":"real","query":"clean search term"} — when user wants to SEE, FIND, or SHOW an existing real-world photo
{"type":"ai","query":"clean description"} — when user wants to CREATE, GENERATE, DRAW, or MAKE an image

Examples:
"show me a mountain" → {"type":"real","query":"mountain landscape"}
"show mountain image" → {"type":"real","query":"mountain"}
"photo of a beach" → {"type":"real","query":"beach"}
"find me a cat picture" → {"type":"real","query":"cat"}
"generate a dragon" → {"type":"ai","query":"dragon"}
"create a futuristic city" → {"type":"ai","query":"futuristic city"}
"make a pencil image" → {"type":"ai","query":"pencil detailed drawing"}
"draw a sunset" → {"type":"ai","query":"sunset painting"}`
              },
              { role: 'user', content: prompt },
            ],
            max_tokens: 80,
            temperature: 0,
          }),
        });
        if (r.ok) {
          const d = await r.json();
          const raw = d.choices?.[0]?.message?.content?.trim() ?? '';
          // Extract JSON even if there's extra text
          const match = raw.match(/\{[^}]+\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            useRealPhoto = parsed.type === 'real';
            if (parsed.query) cleanPrompt = parsed.query;
          }
        }
      } catch { /* use keyword fallback */ }
    }

    // Keyword fallback in case AI classification fails
    if (!groqKey) {
      useRealPhoto = /^(show|find|get|search|look up|photo of|picture of|image of|see a|see the)/i.test(prompt.trim());
    }

    // ── Step 2a: Real photo → Pexels → Unsplash ──────────
    if (useRealPhoto) {
      if (pexelsKey) {
        try {
          const r = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(cleanPrompt)}&per_page=1&orientation=landscape`,
            { headers: { Authorization: pexelsKey } }
          );
          if (r.ok) {
            const d = await r.json();
            const photo = d.photos?.[0];
            if (photo) return NextResponse.json({
              imageUrl: photo.src.large2x || photo.src.large,
              provider: 'Pexels', prompt: cleanPrompt, type: 'real',
              photographer: photo.photographer, photoUrl: photo.url,
            });
          }
        } catch {}
      }

      if (unsplashKey) {
        try {
          const r = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(cleanPrompt)}&per_page=1&orientation=landscape`,
            { headers: { Authorization: `Client-ID ${unsplashKey}` } }
          );
          if (r.ok) {
            const d = await r.json();
            const photo = d.results?.[0];
            if (photo) return NextResponse.json({
              imageUrl: photo.urls.regular,
              provider: 'Unsplash', prompt: cleanPrompt, type: 'real',
              photographer: photo.user.name, photoUrl: photo.links.html,
            });
          }
        } catch {}
      }

      // Real photo not found — fall through to AI
    }

    // ── Step 2b: AI generation → Stability AI ────────────
    if (stabilityKey) {
      try {
        const r = await fetch(
          'https://api.stability.ai/v2beta/stable-image/generate/core',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${stabilityKey}`,
              'Accept': 'image/*',
            },
            body: (() => {
              const form = new FormData();
              form.append('prompt', cleanPrompt);
              form.append('output_format', 'jpeg');
              form.append('aspect_ratio', '1:1');
              return form;
            })(),
          }
        );

        if (r.ok) {
          const buffer = await r.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          return NextResponse.json({
            imageUrl: `data:image/jpeg;base64,${base64}`,
            provider: 'Stability AI',
            prompt: cleanPrompt,
            type: 'ai',
          });
        }
      } catch {}
    }

    return NextResponse.json({
      error: 'Image generation failed. Please check your Stability AI key in Vercel environment variables.',
    }, { status: 503 });

  } catch {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
