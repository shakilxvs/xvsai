import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { prompt }: { prompt: string } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'No prompt provided' }, { status: 400 });

    const clean = encodeURIComponent(prompt.trim());

    // ── Primary: Pollinations.ai (free, no key needed) ─────
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${clean}?width=1024&height=1024&nologo=true&enhance=true`;

    // Verify the image actually loads by doing a HEAD request
    try {
      const check = await fetch(pollinationsUrl, { method: 'HEAD' });
      if (check.ok) {
        return NextResponse.json({
          imageUrl: pollinationsUrl,
          provider: 'Pollinations.ai',
        });
      }
    } catch {
      // Pollinations failed, try Hugging Face
    }

    // ── Fallback: Hugging Face FLUX ────────────────────────
    const hfKey = process.env.HUGGINGFACE_API_KEY;
    if (hfKey) {
      const hfRes = await fetch(
        'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${hfKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inputs: prompt }),
        }
      );

      if (hfRes.ok) {
        const blob = await hfRes.blob();
        const buffer = await blob.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        return NextResponse.json({
          imageUrl: `data:image/png;base64,${base64}`,
          provider: 'Hugging Face FLUX',
        });
      }
    }

    // If both fail, return Pollinations URL anyway (it usually works)
    return NextResponse.json({
      imageUrl: pollinationsUrl,
      provider: 'Pollinations.ai',
    });

  } catch (err: any) {
    return NextResponse.json({ error: 'Image generation failed. Please try again.' }, { status: 500 });
  }
}
