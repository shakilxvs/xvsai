import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { message }: { message: string } = await req.json();
    if (!message) return NextResponse.json({ mode: 'chat' });

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return NextResponse.json({ mode: 'chat' });

    const systemPrompt = `You are a routing assistant. Given a user message, you must respond with ONLY one of these exact words — nothing else:
chat, deep, fast, research, code, image

Rules:
- image → user wants to generate, create, draw, or see any image, picture, photo, artwork, or visual
- code → user wants to write, fix, debug, or understand code or programming
- research → user wants current news, facts, statistics, or web-based information
- deep → user wants detailed analysis, step-by-step reasoning, explanations, or comparisons
- fast → very short casual question needing a quick answer
- chat → general conversation, anything else

Respond with ONE word only. No punctuation. No explanation.`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: 5,
        temperature: 0,
      }),
    });

    if (!res.ok) return NextResponse.json({ mode: 'chat' });

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim().toLowerCase() ?? 'chat';

    // Clean and validate
    const validModes = ['chat', 'deep', 'fast', 'research', 'code', 'image'];
    const mode = validModes.find(m => raw.includes(m)) ?? 'chat';

    return NextResponse.json({ mode });

  } catch {
    return NextResponse.json({ mode: 'chat' });
  }
}
