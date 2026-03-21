import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { prompt }: { prompt: string } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'No prompt provided' }, { status: 400 });

    const groqKey     = process.env.GROQ_API_KEY;
    const geminiKey   = process.env.GOOGLE_API_KEY;
    const hfKey       = process.env.HUGGINGFACE_API_KEY;
    const pexelsKey   = process.env.PEXELS_API_KEY;
    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;

    // ── Step 1: Ask AI to classify intent ────────────────
    let useRealPhoto = false;
    let cleanPrompt = prompt;

    if (groqKey) {
      try {
        const classifyRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'system',
                content: `You are a classifier. Given a user request about images, respond with JSON only.
Determine:
1. "type": either "real" (user wants a real photo/picture that exists in the world) or "ai" (user wants AI to generate/create/draw/illustrate something)
2. "query": a clean short search query or description (remove words like "show me", "generate", "create", "a photo of", etc.)

Examples:
- "show me a photo of mountains" → {"type":"real","query":"mountains"}
- "find a picture of a cat" → {"type":"real","query":"cat"}  
- "generate an image of a dragon" → {"type":"ai","query":"dragon"}
- "draw a futuristic city" → {"type":"ai","query":"futuristic city"}
- "I want to see the Eiffel Tower" → {"type":"real","query":"Eiffel Tower"}
- "create artwork of a sunset over water" → {"type":"ai","query":"sunset over water artwork"}

Respond ONLY with valid JSON, nothing else.`,
              },
              { role: 'user', content: prompt },
            ],
            max_tokens: 60,
            temperature: 0,
          }),
        });

        if (classifyRes.ok) {
          const classifyData = await classifyRes.json();
          const raw = classifyData.choices?.[0]?.message?.content?.trim() ?? '';
          const parsed = JSON.parse(raw);
          useRealPhoto = parsed.type === 'real';
          cleanPrompt = parsed.query || prompt;
        }
      } catch {
        // Fall back to simple keyword detection
        useRealPhoto = /show me|find|photo of|picture of|image of|look up|search for/i.test(prompt);
        cleanPrompt = prompt.replace(/^(show me|find|get|search for|look up)\s+(a|an|the|some)?\s*/i, '').trim();
      }
    }

    // ── Step 2a: Real photo via Pexels then Unsplash ─────
    if (useRealPhoto) {
      // Try Pexels first
      if (pexelsKey) {
        try {
          const pexelsRes = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(cleanPrompt)}&per_page=1&orientation=landscape`,
            { headers: { Authorization: pexelsKey } }
          );
          if (pexelsRes.ok) {
            const data = await pexelsRes.json();
            const photo = data.photos?.[0];
            if (photo) {
              return NextResponse.json({
                imageUrl: photo.src.large2x || photo.src.large,
                provider: 'Pexels',
                prompt: cleanPrompt,
                type: 'real',
                photographer: photo.photographer,
                photoUrl: photo.url,
              });
            }
          }
        } catch { /* fall through */ }
      }

      // Try Unsplash
      if (unsplashKey) {
        try {
          const unsplashRes = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(cleanPrompt)}&per_page=1&orientation=landscape`,
            { headers: { Authorization: `Client-ID ${unsplashKey}` } }
          );
          if (unsplashRes.ok) {
            const data = await unsplashRes.json();
            const photo = data.results?.[0];
            if (photo) {
              return NextResponse.json({
                imageUrl: photo.urls.regular,
                provider: 'Unsplash',
                prompt: cleanPrompt,
                type: 'real',
                photographer: photo.user.name,
                photoUrl: photo.links.html,
              });
            }
          }
        } catch { /* fall through */ }
      }

      // If both fail, fall through to AI generation
    }

    // ── Step 2b: AI generation ───────────────────────────

    // Try Google Imagen 3
    if (geminiKey) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              instances: [{ prompt: cleanPrompt }],
              parameters: { sampleCount: 1 },
            }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          const base64 = data.predictions?.[0]?.bytesBase64Encoded;
          const mimeType = data.predictions?.[0]?.mimeType ?? 'image/png';
          if (base64) {
            return NextResponse.json({
              imageUrl: `data:${mimeType};base64,${base64}`,
              provider: 'Google Imagen 3',
              prompt: cleanPrompt,
              type: 'ai',
            });
          }
        }
      } catch { /* fall through */ }

      // Try Gemini 2.0 Flash image gen
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: cleanPrompt }] }],
              generationConfig: { responseModalities: ['IMAGE'] },
            }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          const parts = data.candidates?.[0]?.content?.parts ?? [];
          const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));
          if (imagePart?.inlineData?.data) {
            return NextResponse.json({
              imageUrl: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`,
              provider: 'Gemini Flash',
              prompt: cleanPrompt,
              type: 'ai',
            });
          }
        }
      } catch { /* fall through */ }
    }

    // Try Hugging Face FLUX
    if (hfKey) {
      try {
        const res = await fetch(
          'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${hfKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ inputs: cleanPrompt }),
          }
        );
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          return NextResponse.json({
            imageUrl: `data:image/jpeg;base64,${base64}`,
            provider: 'FLUX Schnell',
            prompt: cleanPrompt,
            type: 'ai',
          });
        }
      } catch { /* fall through */ }
    }

    // Last resort: Pollinations
    const encoded = encodeURIComponent(cleanPrompt);
    const seed = Math.floor(Math.random() * 999999);
    return NextResponse.json({
      imageUrl: `https://image.pollinations.ai/prompt/${encoded}?model=flux&width=1024&height=1024&nologo=true&seed=${seed}`,
      provider: 'Pollinations.ai',
      prompt: cleanPrompt,
      type: 'ai',
    });

  } catch {
    return NextResponse.json({ error: 'Image generation failed. Please try again.' }, { status: 500 });
  }
}
