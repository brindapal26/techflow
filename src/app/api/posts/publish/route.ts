import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { jobs, posts, postVersions, socialConnections } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { safeDecrypt } from '@/lib/crypto';

function getLinkedInVersion() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1); // always use previous month — current month may not be released yet
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = session.user as any;
  const body = await req.json();
  const { jobId, caption, hashtags = [], platform = 'linkedin', imageUrl } = body;

  if (!jobId || !caption) {
    return NextResponse.json({ error: 'jobId and caption are required' }, { status: 400 });
  }

  // Verify job belongs to this company (and recruiter is assigned if recruiter role)
  const [job] = await db
    .select({ id: jobs.id, assignedRecruiterId: jobs.assignedRecruiterId })
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.companyId, currentUser.companyId)))
    .limit(1);

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  if (currentUser.role === 'recruiter' && job.assignedRecruiterId !== currentUser.id) {
    return NextResponse.json({ error: 'This job is not assigned to you' }, { status: 403 });
  }

  // Get recruiter's LinkedIn connection
  const [conn] = await db
    .select({
      id: socialConnections.id,
      accessToken: socialConnections.accessToken,
      platformUserId: socialConnections.platformUserId,
      tokenExpiresAt: socialConnections.tokenExpiresAt,
    })
    .from(socialConnections)
    .where(
      and(
        eq(socialConnections.userId, currentUser.id),
        eq(socialConnections.platform, 'linkedin'),
        eq(socialConnections.connectionType, 'personal'),
        eq(socialConnections.isActive, true)
      )
    )
    .limit(1);

  if (!conn) {
    return NextResponse.json(
      { error: 'No LinkedIn connection found. Please connect your LinkedIn account first.' },
      { status: 400 }
    );
  }

  if (conn.tokenExpiresAt && new Date(conn.tokenExpiresAt) < new Date()) {
    return NextResponse.json(
      { error: 'Your LinkedIn token has expired. Please reconnect your account.' },
      { status: 400 }
    );
  }

  const accessToken = safeDecrypt(conn.accessToken!);
  const personUrn = `urn:li:person:${conn.platformUserId}`;
  const liVersion = getLinkedInVersion();
  const liHeaders = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'LinkedIn-Version': liVersion,
    'X-Restli-Protocol-Version': '2.0.0',
  };

  // Upload image to LinkedIn if provided
  let imageUrn: string | null = null;
  if (imageUrl) {
    try {
      // 1. Initialize upload
      const initRes = await fetch('https://api.linkedin.com/rest/images?action=initializeUpload', {
        method: 'POST',
        headers: liHeaders,
        body: JSON.stringify({ initializeUploadRequest: { owner: personUrn } }),
      });
      if (initRes.ok) {
        const initData = await initRes.json();
        const uploadUrl = initData.value?.uploadUrl;
        imageUrn = initData.value?.image;

        // 2. Fetch image bytes and upload
        if (uploadUrl && imageUrn) {
          const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) });
          if (imgRes.ok) {
            const imgBuffer = await imgRes.arrayBuffer();
            await fetch(uploadUrl, {
              method: 'PUT',
              headers: { 'Content-Type': imgRes.headers.get('content-type') ?? 'image/jpeg' },
              body: imgBuffer,
            });
          }
        }
      }
    } catch {
      // Image upload failed — continue without image
      imageUrn = null;
    }
  }

  // Build post body
  const postBody: Record<string, unknown> = {
    author: personUrn,
    commentary: caption,
    visibility: 'PUBLIC',
    distribution: {
      feedDistribution: 'MAIN_FEED',
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: 'PUBLISHED',
    isReshareDisabledByAuthor: false,
  };
  if (imageUrn) {
    postBody.content = { media: { id: imageUrn } };
  }

  // Publish to LinkedIn
  const liRes = await fetch('https://api.linkedin.com/rest/posts', {
    method: 'POST',
    headers: liHeaders,
    body: JSON.stringify(postBody),
  });

  if (!liRes.ok) {
    const errorText = await liRes.text();
    let errorMsg = `LinkedIn API error (${liRes.status})`;
    try {
      const errJson = JSON.parse(errorText);
      errorMsg = errJson.message ?? errJson.error_description ?? errorMsg;
    } catch {
      errorMsg = errorText.slice(0, 300) || errorMsg;
    }
    return NextResponse.json({ error: errorMsg }, { status: 502 });
  }

  const linkedinPostId = liRes.headers.get('x-linkedin-id') ?? liRes.headers.get('location') ?? null;

  // Save post + version to DB with status 'published'
  const [post] = await db
    .insert(posts)
    .values({
      companyId: currentUser.companyId,
      jobId,
      createdBy: currentUser.id,
      platform: platform as any,
      status: 'published',
    })
    .returning();

  const [version] = await db
    .insert(postVersions)
    .values({
      postId: post.id,
      versionNumber: 1,
      caption,
      hashtags,
      aiGenerated: true,
      createdBy: currentUser.id,
    })
    .returning();

  // Set active version
  await db
    .update(posts)
    .set({ activeVersionId: version.id })
    .where(eq(posts.id, post.id));

  return NextResponse.json({
    success: true,
    postId: post.id,
    linkedinPostId,
  });
}
