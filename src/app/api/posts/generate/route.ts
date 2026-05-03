import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db';
import { jobs, companies } from '@/lib/db/schema';
import { auth } from '@/lib/auth';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = session.user as any;
  const body = await req.json();
  const { jobId, platform, tone, highlights } = body;

  if (!jobId) return NextResponse.json({ error: 'jobId is required' }, { status: 400 });

  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.companyId, currentUser.companyId)))
    .limit(1);

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  const [company] = await db
    .select({ name: companies.name, website: companies.website, industry: companies.industry, careerPageUrl: companies.careerPageUrl })
    .from(companies)
    .where(eq(companies.id, currentUser.companyId))
    .limit(1);

  const companyName = company?.name ?? 'our company';

  // Build apply URL: careerPageUrl?job_id=externalId takes priority, then job.applyUrl, then website
  let applyUrl = company?.website ?? '';
  if (job.applyUrl) applyUrl = job.applyUrl;
  if (company?.careerPageUrl && job.externalId) {
    applyUrl = `${company.careerPageUrl}?job_id=${encodeURIComponent(job.externalId)}`;
  }

  // Use short redirect URL in the post (e.g. https://app.com/j/<jobId>)
  const appUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? '';
  const postApplyUrl = appUrl ? `${appUrl}/j/${job.id}` : applyUrl;

  const prompt = `You are a social recruiting copywriter. Generate 3 distinct LinkedIn post variants for a job opening.

Job details:
- Title: ${job.title}
- Company: ${companyName}${company?.industry ? ` (${company.industry})` : ''}
- Location: ${job.location ?? 'Not specified'}
- Department: ${job.department ?? 'Not specified'}
- Apply URL: ${postApplyUrl || 'Not specified'}${highlights ? `\n- Highlights: ${highlights}` : ''}

Tone: ${tone ?? 'professional'}
Platform: ${platform ?? 'linkedin'}

Guidelines:
- Each post should be unique in structure and angle (announcement, referral ask, culture-focused)
- Use relevant emojis naturally
- Include 3–5 hashtags per post (#hiring, #nowhiring, plus role/industry-specific)
- Keep posts under 1,300 characters
- For "professional" tone: formal, results-focused language
- For "conversational" tone: approachable, first-person friendly language
- For "enthusiastic" tone: high energy, exclamation points, urgency

Return ONLY valid JSON (no markdown fences) in this exact shape:
{
  "variants": [
    {
      "id": 1,
      "caption": "full post text here",
      "hashtags": ["hiring", "nowhiring", "tag3"],
      "score": 0.94
    },
    {
      "id": 2,
      "caption": "...",
      "hashtags": [...],
      "score": 0.88
    },
    {
      "id": 3,
      "caption": "...",
      "hashtags": [...],
      "score": 0.82
    }
  ]
}`;

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  let rawText = (message.content[0] as { type: string; text: string }).text.trim();

  // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
  rawText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  let parsed: { variants: { id: number; caption: string; hashtags: string[]; score: number }[] };
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
  }

  const variants = parsed.variants.map(v => ({ ...v, platform: platform ?? 'linkedin' }));

  return NextResponse.json({
    variants,
    job: { title: job.title, location: job.location, department: job.department, applyUrl: postApplyUrl },
    company: { name: companyName, website: company?.website },
  });
}
