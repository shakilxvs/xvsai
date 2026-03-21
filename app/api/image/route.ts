import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { prompt }: { prompt: string } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'No prompt provided' }, { status: 400 });

    const geminiKey = process.env.GOOGLE_API_KEY;

    // Clean prompt
    const cleanPrompt = prompt
      .replace(/^(generate|make|create|draw|show|give me|render|produce)\s+(a|an|the|me)?\s*/i, '')
      .trim();

    // ── Primary: Gemini 2.0 Flash Image (500/day free) ──────
    if (geminiKey) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: cleanPrompt }] }],
              generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
            }),
          }
        );

        if (res.ok) {
          const data = await res.json();
          const parts = data.candidates?.[0]?.content?.parts ?? [];
          const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));

          if (imagePart?.inlineData?.data) {
            const base64 = imagePart.inlineData.data;
            const mimeType = imagePart.inlineData.mimeType;
            return NextResponse.json({
              imageUrl: `data:${mimeType};base64,${base64}`,
              provider: 'Gemini Flash Image',
              prompt: cleanPrompt,
            });
          }
        }
      } catch {
        // fall through to Pollinations
      }
    }

    // ── Fallback: Pollinations with flux model ───────────────
    const encoded = encodeURIComponent(cleanPrompt);
    const seed = Math.floor(Math.random() * 999999);
    const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?model=flux&width=1024&height=1024&nologo=true&seed=${seed}`;

    return NextResponse.json({ imageUrl, provider: 'Pollinations.ai', prompt: cleanPrompt });

  } catch {
    return NextResponse.json({ error: 'Image generation failed. Please try again.' }, { status: 500 });
  }
}
