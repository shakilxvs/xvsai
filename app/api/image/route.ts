import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { prompt }: { prompt: string } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'No prompt provided' }, { status: 400 });

    const groqKey   = process.env.GROQ_API_KEY;
    const hfKey     = process.env.HUGGINGFACE_API_KEY;
    const pexelsKey = process.env.PEXELS_API_KEY;
    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;

    // ── Step 1: AI classifies intent ─────────────────────
    let useRealPhoto = false;
    let cleanPrompt = prompt.replace(/^(generate|make|create|draw|show me|give me|render|produce)\s+(a|an|the|me)?\s*/i, '').trim();

    if (groqKey) {
      try {
        const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: 'Classify the user request. Reply with JSON only: {"type":"real" or "ai","query":"clean short description"}. "real" = wants an existing photo. "ai" = wants generated art/image.' },
              { role: 'user', content: prompt },
            ],
            max_tokens: 60, temperature: 0,
          }),
        });
        if (r.ok) {
          const d = await r.json();
          const parsed = JSON.parse(d.choices?.[0]?.message?.content?.trim() ?? '{}');
          useRealPhoto = parsed.type === 'real';
          if (parsed.query) cleanPrompt = parsed.query;
        }
      } catch { /* use keyword fallback */ }
    }

    // ── Step 2a: Real photo (Pexels → Unsplash) ──────────
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
      // If real photo not found, fall through to AI generation
    }

    // ── Step 2b: AI generation ────────────────────────────

    // Primary: Hugging Face FLUX (best quality free)
    if (hfKey) {
      try {
        const r = await fetch(
          'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell',
          {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${hfKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ inputs: cleanPrompt }),
            signal: AbortSignal.timeout(25000), // 25 second timeout
          }
        );
        if (r.ok) {
          const buffer = await r.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          return NextResponse.json({
            imageUrl: `data:image/jpeg;base64,${base64}`,
            provider: 'FLUX Schnell', prompt: cleanPrompt, type: 'ai',
          });
        }
      } catch {}
    }

    // Fallback: Pollinations with FLUX model
    const encoded = encodeURIComponent(cleanPrompt);
    const seed = Math.floor(Math.random() * 999999);
    return NextResponse.json({
      imageUrl: `https://image.pollinations.ai/prompt/${encoded}?model=flux&width=1024&height=1024&nologo=true&seed=${seed}`,
      provider: 'Pollinations.ai', prompt: cleanPrompt, type: 'ai',
    });

  } catch {
    return NextResponse.json({ error: 'Image generation failed. Please try again.' }, { status: 500 });
  }
}
