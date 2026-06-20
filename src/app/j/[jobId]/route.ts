import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { jobs, companies } from '@/lib/db/schema';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  const isUuid = UUID_RE.test(jobId);
  const [job] = await db
    .select({ applyUrl: jobs.applyUrl, externalId: jobs.externalId, companyId: jobs.companyId })
    .from(jobs)
    .where(isUuid ? eq(jobs.id, jobId) : eq(jobs.shortCode, jobId))
    .limit(1);

  if (!job) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  const [company] = await db
    .select({ careerPageUrl: companies.careerPageUrl, website: companies.website })
    .from(companies)
    .where(eq(companies.id, job.companyId))
    .limit(1);

  let destination = company?.website ?? '/';
  if (job.applyUrl) destination = job.applyUrl;
  if (company?.careerPageUrl && job.externalId) {
    destination = `${company.careerPageUrl}?job_id=${encodeURIComponent(job.externalId)}`;
  }

  return NextResponse.redirect(destination);
}
