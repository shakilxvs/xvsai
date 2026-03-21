import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { prompt }: { prompt: string } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'No prompt provided' }, { status: 400 });

    const groqKey     = process.env.GROQ_API_KEY;
    const hfKey       = process.env.HUGGINGFACE_API_KEY;
    const pexelsKey   = process.env.PEXELS_API_KEY;
    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;

    // ── Step 1: AI classifies intent ─────────────────────
    let useRealPhoto = false;
    let cleanPrompt = prompt
      .replace(/^(generate|make|create|draw|render|produce)\s+(a|an|the|me)?\s*/i, '')
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
                content: 'Classify the image request. Reply JSON only: {"type":"real" or "ai","query":"clean short description"}. "real"=user wants existing photo. "ai"=user wants generated/drawn image.'
              },
              { role: 'user', content: prompt },
            ],
            max_tokens: 60,
            temperature: 0,
          }),
        });
        if (r.ok) {
          const d = await r.json();
          const parsed = JSON.parse(d.choices?.[0]?.message?.content?.trim() ?? '{}');
          useRealPhoto = parsed.type === 'real';
          if (parsed.query) cleanPrompt = parsed.query;
        }
      } catch { /* use cleaned prompt */ }
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

      // Real photo not found — fall through to AI generation
    }

    // ── Step 2b: AI generation → HuggingFace FLUX only ───
    if (!hfKey) {
      return NextResponse.json({ error: 'Image generation unavailable. Please add HUGGINGFACE_API_KEY.' }, { status: 503 });
    }

    // Try FLUX.1-schnell first (fastest)
    const hfModels = [
      'black-forest-labs/FLUX.1-schnell',
      'black-forest-labs/FLUX.1-dev',
      'stabilityai/stable-diffusion-xl-base-1.0',
    ];

    for (const model of hfModels) {
      try {
        const r = await fetch(
          `https://api-inference.huggingface.co/models/${model}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${hfKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              inputs: cleanPrompt,
              parameters: { num_inference_steps: 4, guidance_scale: 0 },
            }),
          }
        );

        if (r.ok) {
          const contentType = r.headers.get('content-type') ?? 'image/jpeg';
          if (contentType.includes('image')) {
            const buffer = await r.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');
            const mime = contentType.split(';')[0];
            return NextResponse.json({
              imageUrl: `data:${mime};base64,${base64}`,
              provider: 'FLUX AI',
              prompt: cleanPrompt,
              type: 'ai',
            });
          }
        }

        // If model is loading (503), try next
        if (r.status === 503) continue;

      } catch { continue; }
    }

    return NextResponse.json({
      error: 'Image generation is warming up. Please try again in 30 seconds.',
    }, { status: 503 });

  } catch {
    return NextResponse.json({ error: 'Image generation failed. Please try again.' }, { status: 500 });
  }
}
