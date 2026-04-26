# ORCHID.AI PROMPT: CareerArc/HireSocial Social Recruiting Platform - Frontend

## PROJECT OVERVIEW

Build a production-ready B2B social recruiting automation platform frontend (similar to CareerArc/HireSocial) that helps employers automatically create, schedule, and publish recruitment content across multiple social media channels.

**Platform Type:** B2B SaaS Dashboard
**Target Users:** Recruiters, HR teams, talent acquisition professionals
**Core Value:** Save 900+ hours/year through automation, increase social media applicants from <2% to 20%

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, React Query, Zustand

---

## 🎯 CORE USER FLOWS

### Primary User Journey:
1. **Onboarding** (<10 minutes to first post)
   - Connect ATS or career site
   - Connect social media profiles (LinkedIn, Facebook, Twitter)
   - Platform auto-generates first posts
   - Approve and schedule
   - Done!

2. **Daily Workflow** (5-10 min/day)
   - Review auto-generated posts in "Content Tank"
   - Approve/reject/edit posts
   - Mark priority jobs
   - Check analytics dashboard
   - Platform runs on autopilot

3. **Weekly/Monthly**
   - Review performance analytics
   - Adjust posting frequency
   - Create employer brand campaigns
   - Invite team members

---

## 📋 PHASE 1: CORE FEATURES TO BUILD

### 1.1 Authentication & Organization Setup

**Pages to Create:**
```
/register - Organization signup
/login - User login
/setup - Initial onboarding wizard
```

**Onboarding Wizard Flow:**

**Step 1: Organization Info (2 min)**
```typescript
// components/onboarding/OrganizationSetup.tsx
interface OrganizationSetupProps {
  onNext: (data: OrganizationData) => void;
}

// Form fields:
- Company name
- Industry (dropdown: Healthcare, Retail, Hospitality, Tech, etc.)
- Company size (dropdown: 1-50, 51-200, 201-1000, 1000+)
- Upload logo (auto-detects brand colors)
- Primary brand color (color picker)
- Website URL
```

**Step 2: ATS Connection (3 min)**
```typescript
// components/onboarding/ATSConnection.tsx

// Option A: Connect ATS
- Dropdown: "Select your ATS" (Greenhouse, Workday, Lever, BambooHR, etc.)
- OAuth button: "Connect to [ATS Name]"
- Success: "Syncing jobs... Found 47 active jobs"

// Option B: No ATS / Manual
- Input: "Career site URL" (we'll scrape it)
- Button: "Sync Jobs"

// Technical:
- POST /api/integrations/ats/connect
- Webhook setup for real-time job updates
- Display sync status with progress bar
```

**Step 3: Social Profile Connection (3 min)**
```typescript
// components/onboarding/SocialProfilesSetup.tsx

// LinkedIn Company Page
<SocialConnectButton 
  platform="linkedin"
  type="company"
  onConnect={handleLinkedInConnect}
/>

// Optional: LinkedIn Personal (Recruiters)
<SocialConnectButton 
  platform="linkedin"
  type="personal"
  label="Connect recruiter profiles (optional)"
/>

// Facebook, Twitter (optional)
// Set posting frequency per profile
```

**Step 4: First Post Preview (2 min)**
```typescript
// components/onboarding/FirstPostPreview.tsx

// Show 3 auto-generated posts from latest jobs
<PostPreviewCard 
  job={latestJobs[0]}
  generatedPost={aiGeneratedPosts[0]}
  onApprove={() => schedulePost(post)}
/>

// "Approve & Schedule" button
// "You're all set! Posts will publish automatically."
```

**Key Features:**
- Progress indicator (Step 1 of 4)
- Skip options for advanced setup
- "Save & Continue Later" button
- Visual feedback (checkmarks, loading states)
- Error handling with retry

---

### 1.2 Main Dashboard Layout

**Layout Structure:**
```typescript
// app/(dashboard)/layout.tsx

<DashboardLayout>
  <Sidebar>
    {/* Navigation */}
    <NavItem icon={Home} href="/dashboard">Overview</NavItem>
    <NavItem icon={Calendar} href="/content-calendar">Content Calendar</NavItem>
    <NavItem icon={Briefcase} href="/jobs">Jobs</NavItem>
    <NavItem icon={Megaphone} href="/campaigns">Campaigns</NavItem>
    <NavItem icon={BarChart} href="/analytics">Analytics</NavItem>
    <NavItem icon={Users} href="/team">Team</NavItem>
    <NavItem icon={Settings} href="/settings">Settings</NavItem>
    
    {/* Quick Stats */}
    <QuickStats>
      <Stat label="Posts This Month" value="124" />
      <Stat label="Engagement Rate" value="8.2%" trend="up" />
      <Stat label="Job Clicks" value="1,247" />
    </QuickStats>
  </Sidebar>
  
  <MainContent>
    <TopBar>
      <Breadcrumbs />
      <SearchBar placeholder="Search jobs, posts..." />
      <NotificationBell count={3} />
      <UserMenu />
    </TopBar>
    
    <PageContent>
      {children}
    </PageContent>
  </MainContent>
</DashboardLayout>
```

**Responsive Design:**
- Desktop: Sidebar always visible
- Tablet: Collapsible sidebar
- Mobile: Bottom navigation + hamburger menu

---

### 1.3 Content Calendar (Core Feature)

**Purpose:** Central hub to review, approve, and schedule all social posts

**Page:** `/content-calendar`

**Layout Options:**
1. **Calendar View** (default)
2. **List View** (for bulk operations)
3. **Content Tank View** (queue of approved posts)

**Calendar View Component:**
```typescript
// components/calendar/ContentCalendar.tsx

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

interface CalendarEvent {
  id: string;
  title: string; // Job title or campaign name
  start: Date;
  backgroundColor: string; // Color by platform or status
  extendedProps: {
    platform: 'linkedin' | 'facebook' | 'twitter';
    postType: 'job' | 'employer_brand';
    status: 'draft' | 'approved' | 'scheduled' | 'published';
    profileName: string;
    engagement?: {
      likes: number;
      shares: number;
      clicks: number;
    };
  };
}

<FullCalendar
  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
  initialView="dayGridMonth"
  headerToolbar={{
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay'
  }}
  events={calendarEvents}
  eventClick={handleEventClick}
  eventDrop={handleReschedule}
  height="auto"
/>
```

**Event Click → Post Detail Modal:**
```typescript
// components/calendar/PostDetailModal.tsx

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="max-w-3xl">
    <div className="grid grid-cols-2 gap-6">
      {/* Left: Post Preview */}
      <div>
        <SocialPostPreview 
          platform={post.platform}
          caption={post.caption}
          image={post.imageUrl}
          profilePic={post.profile.avatarUrl}
          profileName={post.profile.name}
        />
      </div>
      
      {/* Right: Post Details */}
      <div>
        <PostMetadata>
          <Field label="Job" value={post.job.title} />
          <Field label="Location" value={post.job.location} />
          <Field label="Status" value={<Badge>{post.status}</Badge>} />
          <Field label="Scheduled" value={formatDateTime(post.scheduledAt)} />
          <Field label="Profile" value={post.profile.name} />
        </PostMetadata>
        
        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Button onClick={handleEdit}>Edit Post</Button>
          <Button onClick={handleReschedule}>Reschedule</Button>
          <Button variant="destructive" onClick={handleDelete}>Delete</Button>
        </div>
        
        {/* If published, show analytics */}
        {post.status === 'published' && (
          <PostAnalytics>
            <StatCard label="Impressions" value={post.analytics.impressions} />
            <StatCard label="Clicks" value={post.analytics.clicks} />
            <StatCard label="Engagement" value={`${post.analytics.engagementRate}%`} />
          </PostAnalytics>
        )}
      </div>
    </div>
  </DialogContent>
</Dialog>
```

**Filtering & Views:**
```typescript
// Toolbar above calendar
<CalendarToolbar>
  <FilterGroup>
    <Select>
      <SelectTrigger>All Platforms</SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Platforms</SelectItem>
        <SelectItem value="linkedin">LinkedIn</SelectItem>
        <SelectItem value="facebook">Facebook</SelectItem>
        <SelectItem value="twitter">Twitter</SelectItem>
      </SelectContent>
    </Select>
    
    <Select>
      <SelectTrigger>All Statuses</SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Statuses</SelectItem>
        <SelectItem value="draft">Drafts</SelectItem>
        <SelectItem value="approved">Approved</SelectItem>
        <SelectItem value="scheduled">Scheduled</SelectItem>
        <SelectItem value="published">Published</SelectItem>
      </SelectContent>
    </Select>
  </FilterGroup>
  
  <ViewToggle>
    <ToggleButton active={view === 'calendar'} onClick={() => setView('calendar')}>
      <CalendarIcon /> Calendar
    </ToggleButton>
    <ToggleButton active={view === 'list'} onClick={() => setView('list')}>
      <ListIcon /> List
    </ToggleButton>
    <ToggleButton active={view === 'tank'} onClick={() => setView('tank')}>
      <LayersIcon /> Content Tank
    </ToggleButton>
  </ViewToggle>
</CalendarToolbar>
```

---

### 1.4 "Magic Posts" - AI Content Generation

**Key Feature:** Auto-generate job posts and employer brand posts

**Component: Post Generation Queue**
```typescript
// app/(dashboard)/posts/review/page.tsx

// Show all pending AI-generated posts waiting for approval

<PostReviewQueue>
  <QueueHeader>
    <h2>Review Generated Posts</h2>
    <p>{pendingPosts.length} posts waiting for approval</p>
    <Button onClick={handleBulkApprove}>Approve All ({selectedCount})</Button>
  </QueueHeader>
  
  <PostGrid>
    {pendingPosts.map(post => (
      <PostReviewCard 
        key={post.id}
        post={post}
        onApprove={() => approvePost(post.id)}
        onReject={() => rejectPost(post.id)}
        onEdit={() => editPost(post.id)}
        onRegenerate={() => regeneratePost(post.id)}
      />
    ))}
  </PostGrid>
</PostReviewQueue>
```

**Post Review Card:**
```typescript
// components/posts/PostReviewCard.tsx

<Card className="relative">
  {/* Checkbox for bulk actions */}
  <Checkbox 
    checked={isSelected}
    onCheckedChange={handleSelect}
    className="absolute top-4 left-4"
  />
  
  {/* Job Info */}
  <CardHeader>
    <h3>{post.job.title}</h3>
    <p className="text-sm text-muted-foreground">{post.job.location}</p>
    <Badge>{post.job.jobType}</Badge>
  </CardHeader>
  
  {/* Generated Post Preview */}
  <CardContent>
    <SocialPostPreview 
      platform={post.platform}
      caption={post.caption}
      image={post.imageUrl}
      hashtags={post.hashtags}
    />
    
    {/* AI Variation Selector */}
    <div className="mt-4">
      <label className="text-sm font-medium">AI Generated Variations:</label>
      <div className="flex gap-2 mt-2">
        {post.variations.map((variation, idx) => (
          <Button
            key={idx}
            variant={selectedVariation === idx ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedVariation(idx)}
          >
            Option {idx + 1}
          </Button>
        ))}
      </div>
    </div>
  </CardContent>
  
  {/* Actions */}
  <CardFooter className="flex justify-between">
    <div className="flex gap-2">
      <Button 
        variant="ghost" 
        size="sm"
        onClick={handleEdit}
      >
        <EditIcon /> Edit
      </Button>
      <Button 
        variant="ghost" 
        size="sm"
        onClick={handleRegenerate}
      >
        <RefreshIcon /> Regenerate
      </Button>
    </div>
    
    <div className="flex gap-2">
      <Button 
        variant="destructive" 
        size="sm"
        onClick={handleReject}
      >
        Reject
      </Button>
      <Button 
        size="sm"
        onClick={handleApprove}
      >
        Approve & Schedule
      </Button>
    </div>
  </CardFooter>
</Card>
```

**Post Editor Modal:**
```typescript
// components/posts/PostEditorModal.tsx

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="max-w-4xl">
    <div className="grid grid-cols-2 gap-6">
      {/* Left: Editor */}
      <div>
        <Tabs defaultValue="caption">
          <TabsList>
            <TabsTrigger value="caption">Caption</TabsTrigger>
            <TabsTrigger value="image">Image</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>
          
          <TabsContent value="caption">
            <Textarea 
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={8}
              placeholder="Write your post caption..."
            />
            
            <div className="mt-4">
              <label>Hashtags</label>
              <Input 
                value={hashtags.join(' ')}
                onChange={handleHashtagsChange}
                placeholder="#hiring #jobs"
              />
            </div>
            
            <CharacterCount 
              current={caption.length}
              max={getPlatformCharLimit(platform)}
            />
          </TabsContent>
          
          <TabsContent value="image">
            <ImageEditor 
              currentImage={imageUrl}
              onImageChange={setImageUrl}
              brandColors={organization.brandColors}
              logo={organization.logoUrl}
            />
          </TabsContent>
          
          <TabsContent value="schedule">
            <DateTimePicker 
              value={scheduledAt}
              onChange={setScheduledAt}
              minDate={new Date()}
            />
            
            <OptimalTimesSuggestion 
              platform={platform}
              onSelect={setScheduledAt}
            />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Right: Live Preview */}
      <div>
        <label className="text-sm font-medium">Preview</label>
        <SocialPostPreview 
          platform={platform}
          caption={caption}
          image={imageUrl}
          hashtags={hashtags}
          profilePic={profile.avatarUrl}
          profileName={profile.name}
        />
      </div>
    </div>
    
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button onClick={handleSave}>Save Changes</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### 1.5 Jobs Management

**Page:** `/jobs`

**Purpose:** View all synced jobs, mark priority, see social media performance

```typescript
// app/(dashboard)/jobs/page.tsx

<JobsPage>
  <PageHeader>
    <h1>Active Jobs</h1>
    <div className="flex gap-2">
      <Button onClick={handleSyncJobs}>
        <RefreshIcon /> Sync Jobs
      </Button>
      <Button onClick={handleCreateManualJob}>
        <PlusIcon /> Add Manual Job
      </Button>
    </div>
  </PageHeader>
  
  {/* Filters */}
  <FiltersBar>
    <SearchInput placeholder="Search jobs..." />
    <Select>
      <SelectTrigger>All Departments</SelectTrigger>
      {/* Department options */}
    </Select>
    <Select>
      <SelectTrigger>All Locations</SelectTrigger>
      {/* Location options */}
    </Select>
    <Switch>
      <Label>Priority Jobs Only</Label>
    </Switch>
  </FiltersBar>
  
  {/* Jobs Table */}
  <JobsTable>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Job Title</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Posted Date</TableHead>
          <TableHead>Social Posts</TableHead>
          <TableHead>Clicks</TableHead>
          <TableHead>Applications</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.map(job => (
          <TableRow key={job.id}>
            <TableCell>
              <div>
                <p className="font-medium">{job.title}</p>
                <p className="text-sm text-muted-foreground">{job.company}</p>
              </div>
            </TableCell>
            <TableCell>{job.location}</TableCell>
            <TableCell>{job.department}</TableCell>
            <TableCell>{formatDate(job.postedDate)}</TableCell>
            <TableCell>
              <Badge variant="secondary">{job.socialPostsCount} posts</Badge>
            </TableCell>
            <TableCell>{job.clicks.toLocaleString()}</TableCell>
            <TableCell>{job.applications}</TableCell>
            <TableCell>
              <Switch 
                checked={job.isPriority}
                onCheckedChange={() => togglePriority(job.id)}
              />
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button variant="ghost" size="sm">
                    <MoreVerticalIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => viewJobDetails(job.id)}>
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => createPost(job.id)}>
                    Create Post
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => viewAnalytics(job.id)}>
                    View Analytics
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </JobsTable>
</JobsPage>
```

---

### 1.6 Analytics Dashboard

**Page:** `/analytics`

**Key Metrics to Display:**
- Total posts published (this month)
- Total reach (impressions)
- Engagement rate
- Click-through rate
- Applications from social
- Top performing posts
- Top performing platforms
- Top performing profiles

```typescript
// app/(dashboard)/analytics/page.tsx

<AnalyticsDashboard>
  {/* Date Range Selector */}
  <DateRangePicker 
    value={dateRange}
    onChange={setDateRange}
    presets={['Last 7 days', 'Last 30 days', 'Last 90 days', 'This year']}
  />
  
  {/* Overview Stats */}
  <StatsGrid>
    <StatCard 
      label="Posts Published"
      value="124"
      change="+12%"
      trend="up"
      icon={<MessageSquareIcon />}
    />
    <StatCard 
      label="Total Reach"
      value="45.2K"
      change="+8%"
      trend="up"
      icon={<UsersIcon />}
    />
    <StatCard 
      label="Engagement Rate"
      value="8.2%"
      change="+2.1%"
      trend="up"
      icon={<HeartIcon />}
    />
    <StatCard 
      label="Job Clicks"
      value="1,247"
      change="+15%"
      trend="up"
      icon={<MousePointerIcon />}
    />
    <StatCard 
      label="Applications"
      value="87"
      change="+22%"
      trend="up"
      icon={<FileTextIcon />}
    />
    <StatCard 
      label="Cost per Applicant"
      value="$12.50"
      change="-18%"
      trend="down"
      icon={<DollarSignIcon />}
    />
  </StatsGrid>
  
  {/* Charts */}
  <div className="grid grid-cols-2 gap-6 mt-6">
    <Card>
      <CardHeader>
        <CardTitle>Engagement Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <LineChart 
          data={engagementData}
          xKey="date"
          yKey="engagement"
        />
      </CardContent>
    </Card>
    
    <Card>
      <CardHeader>
        <CardTitle>Platform Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <BarChart 
          data={platformData}
          xKey="platform"
          yKey="clicks"
        />
      </CardContent>
    </Card>
  </div>
  
  {/* Top Performing Posts */}
  <Card className="mt-6">
    <CardHeader>
      <CardTitle>Top Performing Posts</CardTitle>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Post</TableHead>
            <TableHead>Platform</TableHead>
            <TableHead>Published</TableHead>
            <TableHead>Impressions</TableHead>
            <TableHead>Engagement</TableHead>
            <TableHead>Clicks</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {topPosts.map(post => (
            <TableRow key={post.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <img src={post.imageUrl} className="w-12 h-12 rounded" />
                  <p className="line-clamp-2">{post.caption}</p>
                </div>
              </TableCell>
              <TableCell>
                <PlatformBadge platform={post.platform} />
              </TableCell>
              <TableCell>{formatDate(post.publishedAt)}</TableCell>
              <TableCell>{post.impressions.toLocaleString()}</TableCell>
              <TableCell>{post.engagement.toLocaleString()}</TableCell>
              <TableCell>{post.clicks.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
</AnalyticsDashboard>
```

---

### 1.7 Job Maps Integration

**Purpose:** Embeddable interactive map showing jobs by location

**Page:** `/job-maps`

**Features:**
- Create multiple maps (by brand, region, job type)
- Configure map filters
- Generate embed code
- Track map analytics

```typescript
// app/(dashboard)/job-maps/page.tsx

<JobMapsPage>
  <PageHeader>
    <h1>Job Maps</h1>
    <Button onClick={handleCreateMap}>
      <PlusIcon /> Create New Map
    </Button>
  </PageHeader>
  
  <MapsList>
    {jobMaps.map(map => (
      <MapCard key={map.id}>
        <MapPreview mapId={map.id} />
        <CardContent>
          <h3>{map.name}</h3>
          <p>{map.jobCount} jobs displayed</p>
          <div className="flex gap-2 mt-4">
            <Button size="sm" onClick={() => editMap(map.id)}>Edit</Button>
            <Button size="sm" variant="outline" onClick={() => viewEmbed(map.id)}>
              Get Embed Code
            </Button>
            <Button size="sm" variant="outline" onClick={() => viewAnalytics(map.id)}>
              Analytics
            </Button>
          </div>
        </CardContent>
      </MapCard>
    ))}
  </MapsList>
</JobMapsPage>
```

**Map Configuration Modal:**
```typescript
// components/job-maps/MapConfigModal.tsx

<Dialog open={isOpen}>
  <DialogContent className="max-w-4xl">
    <Tabs defaultValue="settings">
      <TabsList>
        <TabsTrigger value="settings">Settings</TabsTrigger>
        <TabsTrigger value="filters">Filters</TabsTrigger>
        <TabsTrigger value="branding">Branding</TabsTrigger>
        <TabsTrigger value="embed">Embed Code</TabsTrigger>
      </TabsList>
      
      <TabsContent value="settings">
        <div className="space-y-4">
          <Input 
            label="Map Name"
            placeholder="e.g., 'Retail Locations' or 'East Coast Jobs'"
            value={mapName}
            onChange={(e) => setMapName(e.target.value)}
          />
          
          <Select label="Default View">
            <SelectItem value="usa">USA</SelectItem>
            <SelectItem value="world">World</SelectItem>
            <SelectItem value="region">Specific Region</SelectItem>
          </Select>
        </div>
      </TabsContent>
      
      <TabsContent value="filters">
        <FilterConfiguration>
          <Checkbox checked={filterByDepartment}>
            Allow filter by department
          </Checkbox>
          <Checkbox checked={filterByJobType}>
            Allow filter by job type
          </Checkbox>
          <Checkbox checked={showSalary}>
            Show salary ranges
          </Checkbox>
        </FilterConfiguration>
      </TabsContent>
      
      <TabsContent value="branding">
        <BrandingOptions>
          <ColorPicker 
            label="Pin Color"
            value={pinColor}
            onChange={setPinColor}
          />
          <ImageUpload 
            label="Custom Pin Icon"
            value={customPinIcon}
            onChange={setCustomPinIcon}
          />
        </BrandingOptions>
      </TabsContent>
      
      <TabsContent value="embed">
        <EmbedCodeDisplay>
          <CodeBlock language="html">
            {`<iframe src="${embedUrl}" width="100%" height="600px" frameborder="0"></iframe>`}
          </CodeBlock>
          <Button onClick={copyEmbedCode}>
            <CopyIcon /> Copy Code
          </Button>
        </EmbedCodeDisplay>
      </TabsContent>
    </Tabs>
  </DialogContent>
</Dialog>
```

**Interactive Map Component:**
```typescript
// components/job-maps/InteractiveJobMap.tsx

import mapboxgl from 'mapbox-gl';

const InteractiveJobMap: React.FC<JobMapProps> = ({ jobs, config }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-98.5795, 39.8283], // Center of USA
      zoom: 4
    });

    // Add job markers
    jobs.forEach(job => {
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-4">
          <h3 class="font-bold">${job.title}</h3>
          <p class="text-sm">${job.location}</p>
          <a href="${job.applyUrl}" class="text-blue-600">Apply Now</a>
        </div>
      `);

      new mapboxgl.Marker({ color: config.pinColor })
        .setLngLat([job.longitude, job.latitude])
        .setPopup(popup)
        .addTo(map.current!);
    });

    // Add "Find Me" button
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true
      })
    );

    return () => map.current?.remove();
  }, [jobs, config]);

  return <div ref={mapContainer} className="w-full h-[600px] rounded-lg" />;
};
```

---

## 🔐 SECURITY & OPTIMIZATION

### Security Implementation

**1. API Client with Rate Limiting:**
```typescript
// lib/api/client.ts

import axios from 'axios';
import rateLimit from 'axios-rate-limit';

const apiClient = rateLimit(axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
}), {
  maxRequests: 60,
  perMilliseconds: 60000, // 60 requests per minute
});

// Add auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 and refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Refresh token logic
      const refreshToken = localStorage.getItem('refresh_token');
      const newToken = await refreshAuthToken(refreshToken);
      localStorage.setItem('auth_token', newToken);
      // Retry original request
      return apiClient(error.config);
    }
    return Promise.reject(error);
  }
);
```

**2. Input Sanitization:**
```typescript
// lib/utils/sanitize.ts

import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href'],
  });
}

export function sanitizeInput(input: string): string {
  return input.trim().slice(0, 1000).replace(/[<>]/g, '');
}
```

### Cost Optimization

**1. Image Optimization:**
```typescript
// Use Next.js Image component everywhere
import Image from 'next/image';

<Image
  src={post.imageUrl}
  alt={post.caption}
  width={600}
  height={400}
  quality={85}
  loading="lazy"
  placeholder="blur"
/>
```

**2. React Query Configuration:**
```typescript
// lib/providers/react-query-provider.tsx

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

**3. Code Splitting:**
```typescript
// Dynamic imports for heavy components
const AnalyticsDashboard = dynamic(
  () => import('@/components/analytics/Dashboard'),
  { loading: () => <DashboardSkeleton />, ssr: false }
);

const JobMapEditor = dynamic(
  () => import('@/components/job-maps/MapEditor'),
  { loading: () => <MapSkeleton />, ssr: false }
);
```

---

## 📊 MONITORING

**Sentry Setup:**
```typescript
// app/layout.tsx

import * as Sentry from '@sentry/nextjs';

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV,
  });
}
```

**PostHog Analytics:**
```typescript
// lib/analytics/posthog.tsx

import posthog from 'posthog-js';

export function initAnalytics() {
  if (typeof window !== 'undefined') {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: 'https://app.posthog.com',
      capture_pageview: false,
    });
  }
}

export function trackEvent(eventName: string, properties?: Record<string, any>) {
  posthog.capture(eventName, properties);
}
```

---

## ✅ COMPLETION CRITERIA

Frontend is complete when:
- [ ] Onboarding flow works (<10 min to first post)
- [ ] Calendar view displays and allows rescheduling
- [ ] Post review queue shows AI-generated posts
- [ ] Posts can be approved/rejected/edited
- [ ] Analytics dashboard displays metrics
- [ ] Job maps can be created and configured
- [ ] All forms have Zod validation
- [ ] Loading states for all async operations
- [ ] Error handling with user-friendly messages
- [ ] Mobile responsive (all views work on phone)
- [ ] Security headers configured
- [ ] Rate limiting prevents API abuse
- [ ] Bundle size < 250KB (main chunk)
- [ ] Lighthouse score > 90

**Build this incrementally - start with onboarding, then calendar, then analytics.**
