import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { ollama } from 'genkitx-ollama';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
    ollama({
      models: [{ name: 'gemma4:31b-cloud', type: 'chat' }],
      serverAddress: 'https://ollama.com',
      requestHeaders: async () => ({
        Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
      }),
    }),
  ],
  model: 'googleai/gemini-2.5-flash-lite',
});

export async function generateWithFallback(promptInput: Parameters<typeof ai.generate>[0]) {
  try {
    return await ai.generate({
      ...promptInput,
      model: 'googleai/gemini-2.5-flash-lite',
    });
  } catch {
    return await ai.generate({
      ...promptInput,
      model: 'ollama/gemma4:31b-cloud',
    });
  }
}
