import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { jobTitle, companyName, industry } = await req.json();
  if (!jobTitle || !companyName) {
    return NextResponse.json({ error: 'jobTitle and companyName are required' }, { status: 400 });
  }

  // Use Claude to write a tight, Pollinations-ready image prompt
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 120,
    messages: [
      {
        role: 'user',
        content: `Write a short image generation prompt (max 20 words) for a professional LinkedIn hiring post image.
Job: ${jobTitle}
Company: ${companyName}${industry ? `\nIndustry: ${industry}` : ''}

Requirements: modern, corporate, no text, high quality, LinkedIn banner style.
Return ONLY the prompt text, nothing else.`,
      },
    ],
  });

  const prompt = (message.content[0] as { type: string; text: string }).text.trim();

  // Build Pollinations.ai URL — renders image server-side, no API key needed
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1200&height=628&nologo=true`;

  // Pre-fetch to trigger generation so image is cached when client loads it
  try {
    await fetch(imageUrl, { signal: AbortSignal.timeout(25000) });
  } catch {
    // Timeout is fine — image may still be available, client will retry
  }

  return NextResponse.json({ imageUrl, prompt });
}
