import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { prompt }: { prompt: string } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'No prompt provided' }, { status: 400 });

    // Clean the prompt - remove meta words like "generate", "make", "create"
    const cleanPrompt = prompt
      .replace(/^(generate|make|create|draw|show|give me|render|produce)\s+(a|an|the|me)?\s*/i, '')
      .trim();

    const encoded = encodeURIComponent(cleanPrompt);
    const seed = Math.floor(Math.random() * 999999);

    // Use the flux model specifically - more reliable than default sana model
    const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?model=flux&width=1024&height=1024&nologo=true&seed=${seed}`;

    return NextResponse.json({ imageUrl, provider: 'Pollinations.ai', prompt: cleanPrompt });

  } catch {
    return NextResponse.json({ error: 'Failed. Please try again.' }, { status: 500 });
  }
}
