import { NextRequest } from 'next/server';

export const runtime = 'edge';

type Mode = 'chat' | 'deep' | 'fast' | 'research' | 'code' | 'image';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const SYSTEM: Record<Mode, string> = {
  chat:     'You are XVSai, a helpful and knowledgeable AI assistant. Be concise, clear, and friendly. Format responses with markdown when useful.',
  fast:     'You are XVSai in Fast mode. Give short, direct answers. Be snappy and concise.',
  deep:     'You are XVSai in Deep Think mode. Reason through problems step by step. Be thorough, analytical, and precise.',
  code:     'You are XVSai in Code mode. Write clean, well-commented code. Always specify the language. Explain briefly after each block.',
  research: 'You are XVSai in Research mode. Provide well-researched, accurate answers. Structure information clearly.',
  image:    'You are XVSai. The user wants to generate an image. Describe what would be generated.',
};

// Model chains per mode — OpenRouter first, then fallbacks
const CHAINS: Record<Mode, Array<{ model: string; provider: string; type: 'openrouter' | 'groq' | 'deepseek' | 'gemini' }>> = {
  chat: [
    { model: 'anthropic/claude-3.5-haiku',        provider: 'Claude',   type: 'openrouter' },
    { model: 'meta-llama/llama-3.3-70b-instruct', provider: 'OpenRouter', type: 'openrouter' },
    { model: 'llama-3.3-70b-versatile',           provider: 'Groq',     type: 'groq'       },
    { model: 'gemini-1.5-flash',                   provider: 'Google',   type: 'gemini'     },
  ],
  deep: [
    { model: 'anthropic/claude-3.5-sonnet',        provider: 'Claude',   type: 'openrouter' },
    { model: 'deepseek-reasoner',                  provider: 'DeepSeek', type: 'deepseek'   },
    { model: 'gemini-1.5-pro',                     provider: 'Google',   type: 'gemini'     },
  ],
  fast: [
    { model: 'anthropic/claude-3-haiku',           provider: 'Claude',   type: 'openrouter' },
    { model: 'llama-3.3-70b-versatile',            provider: 'Groq',     type: 'groq'       },
    { model: 'mixtral-8x7b-32768',                 provider: 'Groq',     type: 'groq'       },
  ],
  code: [
    { model: 'anthropic/claude-3.5-haiku',         provider: 'Claude',   type: 'openrouter' },
    { model: 'mixtral-8x7b-32768',                 provider: 'Groq',     type: 'groq'       },
    { model: 'gemini-1.5-flash',                   provider: 'Google',   type: 'gemini'     },
  ],
  research: [
    { model: 'anthropic/claude-3.5-haiku',         provider: 'Claude',   type: 'openrouter' },
    { model: 'gemini-1.5-flash',                   provider: 'Google',   type: 'gemini'     },
    { model: 'llama-3.3-70b-versatile',            provider: 'Groq',     type: 'groq'       },
  ],
  image: [
    { model: 'llama-3.3-70b-versatile',            provider: 'Groq',     type: 'groq'       },
  ],
};

// OpenRouter — OpenAI compatible
async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://xvsai.vercel.app',
      'X-Title': 'XVSai',
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
    throw new Error(`OpenRouter ${res.status}: ${err.slice(0, 100)}`);
  }
  return res.body!;
}

// Groq — OpenAI compatible
async function callGroq(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages, stream: true, max_tokens: 2000, temperature: 0.7 }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq ${res.status}: ${err.slice(0, 100)}`);
  }
  return res.body!;
}

// DeepSeek — OpenAI compatible
async function callDeepSeek(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages, stream: true, max_tokens: 2000, temperature: 0.7 }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepSeek ${res.status}: ${err.slice(0, 100)}`);
  }
  return res.body!;
}

// Gemini — REST, converted to SSE stream
async function callGemini(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  systemPrompt: string,
): Promise<ReadableStream<Uint8Array>> {
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
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
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) throw new Error('Gemini empty response');

  return new ReadableStream<Uint8Array>({
    start(controller) {
      const enc = new TextEncoder();
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

export async function POST(req: NextRequest) {
  try {
    const { messages, mode }: { messages: ChatMessage[]; mode: Mode } = await req.json();

    const chain = CHAINS[mode] ?? CHAINS.chat;
    const system = SYSTEM[mode];
    const fullMessages: ChatMessage[] = [{ role: 'system', content: system }, ...messages];

    const orKey  = process.env.OPENROUTER_API_KEY;
    const groqKey   = process.env.GROQ_API_KEY;
    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    const geminiKey = process.env.GOOGLE_API_KEY;

    for (const step of chain) {
      try {
        let stream: ReadableStream<Uint8Array>;

        if (step.type === 'openrouter') {
          if (!orKey) throw new Error('No OpenRouter key');
          stream = await callOpenRouter(orKey, step.model, fullMessages);
        } else if (step.type === 'groq') {
          if (!groqKey) throw new Error('No Groq key');
          stream = await callGroq(groqKey, step.model, fullMessages);
        } else if (step.type === 'deepseek') {
          if (!deepseekKey) throw new Error('No DeepSeek key');
          stream = await callDeepSeek(deepseekKey, step.model, fullMessages);
        } else {
          if (!geminiKey) throw new Error('No Gemini key');
          stream = await callGemini(geminiKey, step.model, messages, system);
        }

        // Get friendly model name for display
        const displayModel = step.model.includes('/')
          ? step.model.split('/')[1]
          : step.model;

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'X-Model': displayModel,
            'X-Provider': step.provider,
          },
        });

      } catch {
        continue; // Try next model silently
      }
    }

    return new Response(
      JSON.stringify({ error: 'All AI models are busy right now. Please try again in a minute.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );

  } catch {
    return new Response(
      JSON.stringify({ error: 'Something went wrong. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
