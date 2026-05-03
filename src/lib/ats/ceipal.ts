const CEIPAL_BASE = 'https://api.ceipal.com';

export interface CeipalJob {
  externalId: string;
  title: string;
  description: string | null;
  location: string | null;
  department: string | null;
  jobType: 'full_time' | 'part_time' | 'contract' | 'internship' | null;
  salaryMin: number | null;
  salaryMax: number | null;
  applyUrl: string | null;
  status: 'open';
  postedDate: string | null;
  expiresAt: string | null;
}

export interface CeipalEmployee {
  atsEmployeeId: string;
  email: string;
  name: string | null;
  title: string | null;
  department: string | null;
  phone: string | null;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
// Ceipal auth endpoint returns XML: <root><access_token>...</access_token></root>

function extractXmlTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>(.*?)<\/${tag}>`, 's'));
  return match ? match[1].trim() : null;
}

export async function getCeipalToken(email: string, password: string, apiKey: string): Promise<string> {
  const res = await fetch(`${CEIPAL_BASE}/v1/createAuthtoken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, api_key: apiKey }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Ceipal auth failed (${res.status}): ${text.slice(0, 200)}`);
  }
  // Response is XML: <?xml ...><root><access_token>...</access_token></root>
  const token = extractXmlTag(text, 'access_token');
  if (!token) {
    throw new Error(`Ceipal auth: could not extract access_token from response: ${text.slice(0, 200)}`);
  }
  return token;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildLocation(city?: string, state?: string, country?: string): string | null {
  const parts = [city, state, country].filter(p => p && p.trim());
  return parts.length > 0 ? parts.join(', ') : null;
}

function mapJobType(employmentType?: string): CeipalJob['jobType'] {
  const t = (employmentType ?? '').toLowerCase();
  if (t.includes('full')) return 'full_time';
  if (t.includes('part')) return 'part_time';
  if (t.includes('contract') || t.includes('c2c') || t.includes('1099')) return 'contract';
  if (t.includes('intern')) return 'internship';
  return null;
}

function parsePayRate(payRates: any[]): { min: number | null; max: number | null } {
  if (!Array.isArray(payRates) || payRates.length === 0) return { min: null, max: null };
  const first = payRates[0];
  const minStr = first.min_pay_rate;
  const maxStr = first.max_pay_rate;
  const min = minStr && minStr !== 'N/A' ? parseFloat(minStr) : null;
  const max = maxStr && maxStr !== 'N/A' ? parseFloat(maxStr) : null;
  return {
    min: min && !isNaN(min) ? min : null,
    max: max && !isNaN(max) ? max : null,
  };
}

function parseClosingDate(closing?: string): string | null {
  if (!closing || closing === 'Open Until Filled' || closing === '') return null;
  const d = new Date(closing);
  return isNaN(d.getTime()) ? null : closing;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function testCeipalConnection(
  email: string,
  password: string,
  apiKey: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await getCeipalToken(email, password, apiKey);
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message ?? 'Connection failed' };
  }
}

export async function syncCeipalJobs(
  email: string,
  password: string,
  apiKey: string,
  maxPages = 0  // 0 = all pages, N = stop after N pages
): Promise<CeipalJob[]> {
  const token = await getCeipalToken(email, password, apiKey);
  const allJobs: CeipalJob[] = [];
  let page = 1;

  while (true) {
    const res = await fetch(
      `${CEIPAL_BASE}/v1/getJobPostingsList/?limit=50&page=${page}`,
      { headers: { Authorization: `JWT ${token}` } }
    );
    if (!res.ok) break;

    const data = await res.json();
    const items: any[] = data?.results ?? (Array.isArray(data) ? data : []);
    if (items.length === 0) break;

    for (const item of items) {
      const pay = parsePayRate(item.pay_rates ?? []);
      allJobs.push({
        externalId: String(item.id ?? item.job_code),
        title: item.position_title ?? item.public_job_title ?? 'Untitled',
        description: item.requisition_description ?? item.public_job_desc ?? null,
        location: buildLocation(item.city, item.state, item.country),
        department: item.job_category ?? null,
        jobType: mapJobType(item.employment_type ?? item.job_type),
        salaryMin: pay.min,
        salaryMax: pay.max,
        applyUrl: item.apply_job ?? item.apply_job_without_registration ?? null,
        status: 'open',
        postedDate: item.job_start_date ?? item.created ?? null,
        expiresAt: parseClosingDate(item.closing_date),
      });
    }

    if (!data?.next) break;
    if (maxPages > 0 && page >= maxPages) break;
    page++;
  }

  return allJobs;
}

// ── ATS Browser ───────────────────────────────────────────────────────────────

export async function getCeipalUsers(
  email: string,
  password: string,
  apiKey: string
): Promise<Array<{ id: string; name: string; email: string; role: string; status: string }>> {
  const token = await getCeipalToken(email, password, apiKey);
  const allUsers: Array<{ id: string; name: string; email: string; role: string; status: string }> = [];
  let page = 1;

  while (true) {
    const res = await fetch(
      `${CEIPAL_BASE}/v1/getUsersList/?limit=50&page=${page}`,
      { headers: { Authorization: `JWT ${token}` } }
    );
    if (!res.ok) break;

    const data = await res.json();
    const items: any[] = data?.results ?? (Array.isArray(data) ? data : []);
    if (items.length === 0) break;

    for (const item of items) {
      const firstName = item.first_name ?? '';
      const lastName = item.last_name ?? '';
      const displayName = item.display_name || [firstName, lastName].filter(Boolean).join(' ');
      allUsers.push({
        id: String(item.id),
        name: displayName || 'Unknown',
        email: item.email_id ?? '',
        role: item.role ?? '',
        status: item.status ?? '',
      });
    }

    if (!data?.next) break;
    page++;
  }

  return allUsers.sort((a, b) => a.name.localeCompare(b.name));
}

export async function browseAtsJobs(
  email: string,
  password: string,
  apiKey: string,
  endpointUrl: string,
  params: {
    page?: number;
    search?: string;
    recruiterId?: string;
    status?: string;
    skills?: string;
    country?: string;
    state?: string;
    year?: number;
    last3months?: boolean; // default true when year is not set
    last6months?: boolean;
  }
): Promise<{ count: number; numPages: number; results: any[] }> {
  const token = await getCeipalToken(email, password, apiKey);

  const userPage = params.page ?? 1;
  const hasDateFilter = !!(params.year || params.last6months || (params.last3months !== false));
  const hasAnyFilter  = hasDateFilter || !!(params.status || params.skills || params.country || params.state);

  // Ceipal's custom endpoint ignores paging_length, ordering, from_date, job_status, etc.
  // It ALWAYS returns 20 items per page, oldest-first.
  // Fix: when any filter is active, probe page 1 to get total pages, then reverse-paginate
  // so user's page 1 → Ceipal's last page (newest jobs), page 2 → second-to-last, etc.
  let effectivePage = userPage;
  let totalPagesFromCeipal = 1;

  if (hasAnyFilter) {
    const probeRes = await fetch(
      `${endpointUrl}?paging_length=20&page=1`,
      { headers: { Authorization: `JWT ${token}` } }
    );
    if (probeRes.ok) {
      const probeData = await probeRes.json();
      totalPagesFromCeipal = probeData?.num_pages ?? Math.ceil((probeData?.count ?? 36911) / 20);
      effectivePage = Math.max(1, totalPagesFromCeipal - (userPage - 1));
    }
  }

  const qp = new URLSearchParams();
  qp.set('paging_length', '20');
  qp.set('page', String(effectivePage));
  if (params.search)      qp.set('searchkey',        params.search);
  if (params.recruiterId) qp.set('primary_recruiter', params.recruiterId);

  // Date range
  const toDate = new Date();
  let fromDate: Date | null = null;
  if (params.year) {
    fromDate = new Date(params.year, 0, 1);
    toDate.setFullYear(params.year, 11, 31);
  } else if (params.last6months) {
    fromDate = new Date();
    fromDate.setMonth(fromDate.getMonth() - 6);
  } else if (params.last3months !== false) {
    fromDate = new Date();
    fromDate.setMonth(fromDate.getMonth() - 3);
  }
  if (fromDate) {
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    qp.set('from_date', fmt(fromDate));
    qp.set('to_date',   fmt(toDate));
  }

  const url = `${endpointUrl}?${qp.toString()}`;
  const res = await fetch(url, { headers: { Authorization: `JWT ${token}` } });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ceipal browse jobs failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  let results: any[] = data?.results ?? (Array.isArray(data) ? data : []);

  // ── Client-side fallback filters ─────────────────────────────────────────
  // Applied after the API call in case Ceipal ignores any of the params above.

  if (params.status) {
    const t = params.status.toLowerCase();
    results = results.filter((item) => (item.job_status ?? '').toLowerCase() === t);
  }

  if (params.skills) {
    const needle = params.skills.toLowerCase();
    results = results.filter((item) =>
      (item.primary_skills ?? '').toLowerCase().includes(needle) ||
      (item.secondary_skills ?? '').toLowerCase().includes(needle)
    );
  }

  if (params.country) {
    const needle = params.country.toLowerCase();
    results = results.filter((item) => (item.country ?? '').toLowerCase().includes(needle));
  }

  if (params.state) {
    const needle = params.state.toLowerCase();
    results = results.filter((item) =>
      (item.states ?? item.state ?? '').toLowerCase().includes(needle)
    );
  }

  if (fromDate) {
    const from = fromDate.getTime();
    const to   = toDate.getTime();
    results = results.filter((item) => {
      const raw = item.job_start_date ?? item.created ?? item.opening_date ?? item.posted_date;
      if (!raw) return false;
      const t = new Date(raw).getTime();
      return !isNaN(t) && t >= from && t <= to;
    });
  }

  // Sort by date descending
  results.sort((a, b) => {
    const rawA = a.job_start_date ?? a.created ?? a.opening_date ?? a.posted_date;
    const rawB = b.job_start_date ?? b.created ?? b.opening_date ?? b.posted_date;
    const da = rawA ? new Date(rawA).getTime() : 0;
    const db = rawB ? new Date(rawB).getTime() : 0;
    return db - da;
  });

  return {
    count: data?.count ?? results.length,
    numPages: totalPagesFromCeipal || (data?.num_pages ?? 1),
    results,
  };
}

export async function syncCeipalEmployees(
  email: string,
  password: string,
  apiKey: string
): Promise<CeipalEmployee[]> {
  const token = await getCeipalToken(email, password, apiKey);
  const allEmployees: CeipalEmployee[] = [];
  let page = 1;

  while (true) {
    const res = await fetch(
      `${CEIPAL_BASE}/v1/getUsersList/?limit=50&page=${page}`,
      { headers: { Authorization: `JWT ${token}` } }
    );
    if (!res.ok) break;

    const data = await res.json();
    const items: any[] = data?.results ?? (Array.isArray(data) ? data : []);
    if (items.length === 0) break;

    for (const item of items) {
      // getUsersList uses email_id; fall back to other fields if missing
      const userEmail = item.email_id ?? item.email ?? item.work_email ?? item.personal_email;
      if (!userEmail) continue;

      const firstName = item.first_name ?? '';
      const lastName = item.last_name ?? '';
      const displayName = item.display_name || [firstName, lastName].filter(Boolean).join(' ') || null;

      allEmployees.push({
        atsEmployeeId: String(item.id ?? item.user_id ?? item.employee_id),
        email: userEmail.toLowerCase().trim(),
        name: displayName,
        title: item.title ?? item.designation ?? null,
        department: item.department ?? null,
        phone: item.phone ?? item.mobile ?? null,
      });
    }

    if (!data?.next) break;
    page++;
  }

  return allEmployees;
}
