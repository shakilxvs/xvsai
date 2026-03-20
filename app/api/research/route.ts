import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface Source {
  title: string;
  url: string;
}

async function searchTavily(query: string, apiKey: string): Promise<{ results: TavilyResult[] }> {
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: 'basic',
      max_results: 5,
      include_answer: true,
    }),
  });
  if (!res.ok) throw new Error(`Tavily error: ${res.status}`);
  return res.json();
}

async function synthesizeWithGroq(
  query: string,
  context: string,
  history: ChatMessage[],
  apiKey: string,
): Promise<ReadableStream<Uint8Array>> {

  const systemPrompt = `You are XVSai in Research mode. You have been given web search results.
Synthesize them into a clear, well-structured answer with markdown formatting.
You also have access to the previous conversation history — use it to understand context and references like "me", "my name", "that topic", etc.
Always end with a brief "Sources" section referencing what you found.
Be accurate and cite specific facts from the search results.`;

  // Build messages: history first, then the current research request
  const messages: ChatMessage[] = [
    ...history.slice(-8), // last 8 messages for context, avoids token limits
    {
      role: 'user',
      content: `Search query: ${query}\n\nSearch Results:\n${context}\n\nPlease provide a comprehensive answer.`,
    },
  ];

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      stream: true,
      max_tokens: 1500,
      temperature: 0.3,
    }),
  });

  if (!res.ok) throw new Error(`Groq synthesis error: ${res.status}`);
  return res.body!;
}

async function synthesizeWithGemini(
  query: string,
  context: string,
  history: ChatMessage[],
  apiKey: string,
): Promise<string> {
  // Build contents with history
  const contents = [
    ...history.slice(-6).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    {
      role: 'user',
      parts: [{ text: `Search query: ${query}\n\nSearch Results:\n${context}\n\nProvide a comprehensive answer.` }],
    },
  ];

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: 'You are XVSai in Research mode. Use conversation history for context. Synthesize search results into a clear markdown answer.' }],
        },
        contents,
        generationConfig: { maxOutputTokens: 1500, temperature: 0.3 },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

export async function POST(req: NextRequest) {
  try {
    const {
      query,
      messages = [],
    }: { query: string; messages?: ChatMessage[] } = await req.json();

    if (!query) return NextResponse.json({ error: 'No query provided' }, { status: 400 });

    const tavilyKey = process.env.TAVILY_API_KEY;
    const groqKey   = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GOOGLE_API_KEY;

    let sources: Source[] = [];
    let context = '';

    // ── Step 1: Search the web ─────────────────────────────
    if (tavilyKey) {
      try {
        const searchData = await searchTavily(query, tavilyKey);
        sources = searchData.results.map(r => ({ title: r.title, url: r.url }));
        context = searchData.results
          .slice(0, 4)
          .map((r, i) => `[${i + 1}] ${r.title}\n${r.content}`)
          .join('\n\n');
      } catch {
        context = 'Web search unavailable. Answer from training knowledge and be transparent.';
      }
    } else {
      context = 'No web search key configured. Answer from training knowledge.';
    }

    // ── Step 2: Synthesize with conversation history ───────
    if (groqKey) {
      try {
        const stream = await synthesizeWithGroq(query, context, messages, groqKey);
        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'X-Model': 'llama-3.3-70b-versatile',
            'X-Provider': 'Groq + Tavily',
            'X-Sources': encodeURIComponent(JSON.stringify(sources)),
          },
        });
      } catch { /* fall through */ }
    }

    // Fallback: Gemini
    if (geminiKey) {
      const text = await synthesizeWithGemini(query, context, messages, geminiKey);
      const enc = new TextEncoder();
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          const chunks = text.match(/.{1,4}/g) ?? [text];
          for (const chunk of chunks) {
            const sseData = JSON.stringify({ choices: [{ delta: { content: chunk }, finish_reason: null }] });
            controller.enqueue(enc.encode(`data: ${sseData}\n\n`));
          }
          controller.enqueue(enc.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'X-Model': 'gemini-1.5-flash',
          'X-Provider': 'Google + Tavily',
          'X-Sources': encodeURIComponent(JSON.stringify(sources)),
        },
      });
    }

    return NextResponse.json({ error: 'No AI keys configured.' }, { status: 503 });

  } catch {
    return NextResponse.json({ error: 'Research failed. Please try again.' }, { status: 500 });
  }
}
