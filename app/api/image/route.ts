import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { prompt }: { prompt: string } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'No prompt provided' }, { status: 400 });

    const clean = encodeURIComponent(prompt.trim());
    const seed = Math.floor(Math.random() * 1000000);

    // Return URL directly — browser loads the image, no server timeout risk
    const imageUrl = `https://image.pollinations.ai/prompt/${clean}?width=1024&height=1024&nologo=true&seed=${seed}`;

    return NextResponse.json({ imageUrl, provider: 'Pollinations.ai' });

  } catch {
    return NextResponse.json({ error: 'Failed. Please try again.' }, { status: 500 });
  }
}
