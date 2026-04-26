import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { atsConnections } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { browseAtsJobs } from '@/lib/ats/ceipal';
import { safeDecrypt } from '@/lib/crypto';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = session.user as any;
  const { id } = await params;

  const [connection] = await db
    .select()
    .from(atsConnections)
    .where(
      and(
        eq(atsConnections.id, id),
        eq(atsConnections.companyId, currentUser.companyId)
      )
    )
    .limit(1);

  if (!connection) {
    return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
  }

  const config = connection.config as any;
  const customJobEndpoint: string | null = config?.customJobEndpoint ?? null;

  if (!customJobEndpoint) {
    return NextResponse.json(
      { error: 'No custom job endpoint configured' },
      { status: 400 }
    );
  }

  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const search = searchParams.get('search') ?? '';
  const recruiter = searchParams.get('recruiter') ?? '';
  const status = searchParams.get('status') ?? '';
  const skills = searchParams.get('skills') ?? '';
  const country = searchParams.get('country') ?? '';
  const state = searchParams.get('state') ?? '';
  const yearRaw = searchParams.get('year') ?? '';
  const year = yearRaw ? parseInt(yearRaw, 10) : undefined;
  // last3months=false is passed explicitly when user wants to see all (no year selected and no cutoff)
  const last3months = searchParams.get('last3months') !== 'false';
  const last6months = searchParams.get('last6months') === 'true';

  const email = config?.email;
  const password = config?.password ? safeDecrypt(config.password) : null;
  const apiKey = connection.apiKey;

  if (!email || !password || !apiKey) {
    return NextResponse.json({ error: 'Missing credentials in connection config' }, { status: 400 });
  }

  try {
    const data = await browseAtsJobs(email, password, apiKey, customJobEndpoint, {
      page,
      search: search || undefined,
      recruiterId: recruiter || undefined,
      status: status || undefined,
      skills: skills || undefined,
      country: country || undefined,
      state: state || undefined,
      year,
      last3months,
      last6months,
    });

    const results = data.results.map((item: any) => {
      const city = item.city ?? '';
      const state = item.states ?? '';
      const country = item.country ?? '';
      const location = [city, state, country].filter(Boolean).join(', ') || null;

      return {
        id: item.id,
        jobCode: item.job_code,
        title: item.job_title,
        status: item.job_status,
        city,
        state,
        country,
        location,
        primarySkills: item.primary_skills,
        secondarySkills: item.secondary_skills,
        taxTerms: item.tax_terms,
        jobType: item.job_type,
        duration: item.duration,
        client: item.client,
        positions: item.number_of_positions,
        startDate: item.job_start_date,
        payRate: item.pay_rate___salary,
        workAuth: item.work_authorization,
        primaryRecruiterId: item.primary_recruiter,
        assignedToId: item.assigned_to,
        applyUrl: item.apply_job,
      };
    });

    return NextResponse.json({
      count: data.count,
      numPages: data.numPages,
      page,
      results,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Failed to browse jobs' }, { status: 500 });
  }
}
