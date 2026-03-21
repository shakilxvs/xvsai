import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { prompt }: { prompt: string } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'No prompt provided' }, { status: 400 });

    const clean = encodeURIComponent(prompt.trim());

    // Return Pollinations URL directly — no HEAD check needed
    // Pollinations is always available and the browser loads the image directly
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${clean}?width=1024&height=1024&nologo=true&enhance=true&seed=${Date.now()}`;

    return NextResponse.json({
      imageUrl: pollinationsUrl,
      provider: 'Pollinations.ai',
    });

  } catch {
    return NextResponse.json({ error: 'Image generation failed. Please try again.' }, { status: 500 });
  }
}
