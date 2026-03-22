import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { message }: { message: string } = await req.json();
    if (!message) return NextResponse.json({ mode: 'chat' });

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return NextResponse.json({ mode: 'chat' });

    const systemPrompt = `You are a routing assistant. Given a user message, respond with ONLY one word:
chat, deep, fast, research, code, image, open

Rules:
- image → wants to generate, create, draw, or find any image, photo, picture, wallpaper, or visual
- code → wants to write, fix, debug, or understand code/programming
- research → wants current news, facts, statistics, or web-based information
- deep → wants detailed analysis, step-by-step reasoning, explanations, or comparisons
- open → adult topics, explicit content, sensitive/controversial topics, relationships, flirting
- fast → very short casual question needing a quick answer
- chat → general conversation, anything else

Respond with ONE word only. No punctuation.`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: message }],
        max_tokens: 5,
        temperature: 0,
      }),
    });

    if (!res.ok) return NextResponse.json({ mode: 'chat' });
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim().toLowerCase() ?? 'chat';
    const validModes = ['chat', 'deep', 'fast', 'research', 'code', 'image', 'open'];
    const mode = validModes.find(m => raw.includes(m)) ?? 'chat';
    return NextResponse.json({ mode });
  } catch {
    return NextResponse.json({ mode: 'chat' });
  }
}
