import { NextRequest } from 'next/server';

export const runtime = 'edge';

type Mode = 'chat' | 'deep' | 'fast' | 'research' | 'code' | 'image';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// ── Model chains per mode ──────────────────────────────────
const CHAINS: Record<Mode, Array<{ model: string; provider: string; type: 'groq' | 'deepseek' | 'gemini' }>> = {
  chat: [
    { model: 'llama-3.3-70b-versatile',   provider: 'Groq',     type: 'groq'     },
    { model: 'gemini-1.5-flash',           provider: 'Google',   type: 'gemini'   },
    { model: 'deepseek-chat',              provider: 'DeepSeek', type: 'deepseek' },
  ],
  fast: [
    { model: 'llama-3.3-70b-versatile',   provider: 'Groq',     type: 'groq'     },
    { model: 'mixtral-8x7b-32768',        provider: 'Groq',     type: 'groq'     },
    { model: 'gemini-1.5-flash',           provider: 'Google',   type: 'gemini'   },
  ],
  deep: [
    { model: 'deepseek-reasoner',          provider: 'DeepSeek', type: 'deepseek' },
    { model: 'gemini-1.5-pro',             provider: 'Google',   type: 'gemini'   },
    { model: 'llama-3.3-70b-versatile',   provider: 'Groq',     type: 'groq'     },
  ],
  code: [
    { model: 'mixtral-8x7b-32768',        provider: 'Groq',     type: 'groq'     },
    { model: 'llama-3.3-70b-versatile',   provider: 'Groq',     type: 'groq'     },
    { model: 'gemini-1.5-flash',           provider: 'Google',   type: 'gemini'   },
  ],
  research: [
    { model: 'gemini-1.5-flash',           provider: 'Google',   type: 'gemini'   },
    { model: 'llama-3.3-70b-versatile',   provider: 'Groq',     type: 'groq'     },
  ],
  image: [
    { model: 'llama-3.3-70b-versatile',   provider: 'Groq',     type: 'groq'     },
  ],
};

// ── System prompts per mode ────────────────────────────────
const SYSTEM: Record<Mode, string> = {
  chat:     'You are XVSai, a helpful and knowledgeable AI assistant. Be concise, clear, and friendly. Format responses with markdown when useful.',
  fast:     'You are XVSai in Fast mode. Give short, direct answers. Skip long explanations unless the user asks. Be snappy.',
  deep:     'You are XVSai in Deep Think mode. Reason through problems step by step. Be thorough, analytical, and precise. Show your reasoning process.',
  code:     'You are XVSai in Code mode. Write clean, well-commented code. Always specify the programming language. Explain what the code does briefly after each block.',
  research: 'You are XVSai in Research mode. Provide well-researched, accurate answers. Cite sources where possible. Structure information clearly with headings and bullet points.',
  image:    'You are XVSai. The user wants to generate an image. Describe what would be generated and let them know image generation is available — Pollinations.ai will be connected in Phase 3.',
};

// ── Call Groq or DeepSeek (OpenAI-compatible) ──────────────
async function callOpenAICompatible(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      max_tokens: 2000,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${res.status}: ${err.slice(0, 100)}`);
  }

  return res.body!;
}

// ── Call Gemini REST (non-streaming, converts to stream) ───
async function callGemini(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  systemPrompt: string,
): Promise<ReadableStream<Uint8Array>> {
  // Convert messages to Gemini format
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { maxOutputTokens: 2000, temperature: 0.7 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini ${res.status}: ${err.slice(0, 100)}`);
  }

  const data = await res.json();
  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) throw new Error('Gemini returned empty response');

  // Convert full text → SSE stream so frontend code is identical
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const enc = new TextEncoder();
      // Chunk into ~4-char pieces for smooth typing effect
      const chunks = text.match(/.{1,4}/g) ?? [text];
      for (const chunk of chunks) {
        const sseData = JSON.stringify({ choices: [{ delta: { content: chunk }, finish_reason: null }] });
        controller.enqueue(enc.encode(`data: ${sseData}\n\n`));
      }
      controller.enqueue(enc.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
}

// ── Main handler ───────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { messages, mode }: { messages: ChatMessage[]; mode: Mode } = await req.json();

    const chain = CHAINS[mode] ?? CHAINS.chat;
    const system = SYSTEM[mode];
    const fullMessages: ChatMessage[] = [{ role: 'system', content: system }, ...messages];

    let lastError = '';

    for (const step of chain) {
      try {
        let stream: ReadableStream<Uint8Array>;

        if (step.type === 'groq') {
          const key = process.env.GROQ_API_KEY;
          if (!key) throw new Error('GROQ_API_KEY not set');
          stream = await callOpenAICompatible(
            'https://api.groq.com/openai/v1', key, step.model, fullMessages
          );
        } else if (step.type === 'deepseek') {
          const key = process.env.DEEPSEEK_API_KEY;
          if (!key) throw new Error('DEEPSEEK_API_KEY not set');
          stream = await callOpenAICompatible(
            'https://api.deepseek.com', key, step.model, fullMessages
          );
        } else {
          // gemini
          const key = process.env.GOOGLE_API_KEY;
          if (!key) throw new Error('GOOGLE_API_KEY not set');
          stream = await callGemini(key, step.model, messages, system);
        }

        // Success — return the stream with model info in headers
        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'X-Model': step.model,
            'X-Provider': step.provider,
          },
        });

      } catch (err: any) {
        lastError = err?.message ?? 'Unknown error';
        // Try next in chain
        continue;
      }
    }

    // All models failed
    return new Response(
      JSON.stringify({ error: 'All AI models are busy right now. Please try again in a minute.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: 'Something went wrong. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
