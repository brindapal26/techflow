import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  integer,
  jsonb,
  date,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Companies ───────────────────────────────────────────────────────────────

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  logoUrl: text('logo_url'),
  website: text('website'),
  industry: text('industry'),
  brandColor: text('brand_color'),
  subscriptionPlan: text('subscription_plan').default('free'),
  careerPageUrl: text('career_page_url'),
  linkedinClientId: text('linkedin_client_id'),
  linkedinClientSecret: text('linkedin_client_secret'), // encrypted
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Departments ──────────────────────────────────────────────────────────────
// Company departments. Each department can be linked to one or more ATS
// connections so that jobs sync independently per department.

export const departments = pgTable('departments', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Company Employees (synced from ATS) ──────────────────────────────────────

export const companyEmployees = pgTable('company_employees', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  atsConnectionId: uuid('ats_connection_id').references(() => atsConnections.id, { onDelete: 'set null' }),
  email: text('email').notNull(),
  name: text('name'),
  title: text('title'),
  department: text('department'),
  phone: text('phone'),
  atsEmployeeId: text('ats_employee_id'),
  source: text('source'), // 'greenhouse' | 'ceipal' | 'manual' etc
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }), // set once they register
  syncedAt: timestamp('synced_at').defaultNow().notNull(),
});

// ─── Users ────────────────────────────────────────────────────────────────────
// role: company_admin = full access; recruiter = assigned jobs + posts;
//       employee = can only share admin-created promotions

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  name: text('name'),
  passwordHash: text('password_hash'),
  avatarUrl: text('avatar_url'),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['company_admin', 'recruiter', 'employee'] }).notNull().default('recruiter'),
  isActive: boolean('is_active').default(true).notNull(),
  // OAuth login support (Google / Facebook)
  oauthProvider: text('oauth_provider', { enum: ['google', 'facebook'] }),
  oauthProviderId: text('oauth_provider_id'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── User ↔ Departments (many-to-many) ───────────────────────────────────────
// A user can belong to multiple departments.

export const userDepartments = pgTable('user_departments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  departmentId: uuid('department_id').references(() => departments.id, { onDelete: 'cascade' }).notNull(),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
});

// ─── Invitations ──────────────────────────────────────────────────────────────

export const invitations = pgTable('invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  role: text('role', { enum: ['company_admin', 'recruiter', 'employee'] }).default('recruiter').notNull(),
  token: text('token').unique().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  acceptedAt: timestamp('accepted_at'),
  invitedBy: uuid('invited_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── ATS Connections ──────────────────────────────────────────────────────────
// One ATS connection can be scoped to a specific department (departmentId set)
// or shared across the whole company (departmentId null).

export const atsConnections = pgTable('ats_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  departmentId: uuid('department_id').references(() => departments.id, { onDelete: 'set null' }),
  provider: text('provider', {
    enum: ['greenhouse', 'lever', 'workday', 'smartrecruiters', 'bamboohr', 'ceipal', 'custom_url'],
  }).notNull(),
  apiKey: text('api_key'),
  oauthToken: text('oauth_token'),
  webhookUrl: text('webhook_url'),
  customUrl: text('custom_url'),
  lastSyncedAt: timestamp('last_synced_at'),
  status: text('status', { enum: ['active', 'error', 'paused'] }).default('active').notNull(),
  config: jsonb('config'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Platform Rules ───────────────────────────────────────────────────────────
// Admin defines which social platforms are allowed for a given role and/or
// department. Rules are evaluated most-specific first:
//   dept + role > dept only > role only > company default
// allowedPlatforms is an array, e.g. ['linkedin', 'facebook']

export const platformRules = pgTable('platform_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  departmentId: uuid('department_id').references(() => departments.id, { onDelete: 'cascade' }),
  // null role = applies to everyone in that dept / company
  role: text('role', { enum: ['company_admin', 'recruiter', 'employee'] }),
  allowedPlatforms: text('allowed_platforms').array().notNull().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export const jobs = pgTable('jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  atsConnectionId: uuid('ats_connection_id').references(() => atsConnections.id, { onDelete: 'set null' }),
  departmentId: uuid('department_id').references(() => departments.id, { onDelete: 'set null' }),
  externalId: text('external_id'),
  assignedRecruiterId: uuid('assigned_recruiter_id').references(() => users.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description'),
  location: text('location'),
  department: text('department'), // kept for ATS-synced string value
  jobType: text('job_type', { enum: ['full_time', 'part_time', 'contract', 'internship'] }),
  salaryMin: integer('salary_min'),
  salaryMax: integer('salary_max'),
  currency: text('currency').default('USD'),
  applyUrl: text('apply_url'),
  status: text('status', { enum: ['open', 'closed', 'filled'] }).default('open').notNull(),
  isPriority: boolean('is_priority').default(false).notNull(),
  postedDate: date('posted_date'),
  expiresAt: date('expires_at'),
  syncedAt: timestamp('synced_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Posts ────────────────────────────────────────────────────────────────────

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  jobId: uuid('job_id').references(() => jobs.id, { onDelete: 'cascade' }).notNull(),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  platform: text('platform', { enum: ['linkedin', 'facebook', 'twitter'] }).notNull(),
  status: text('status', {
    enum: ['draft', 'approved', 'scheduled', 'published', 'expired', 'paused'],
  }).default('draft').notNull(),
  activeVersionId: uuid('active_version_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Post Versions ────────────────────────────────────────────────────────────

export const postVersions = pgTable('post_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }).notNull(),
  versionNumber: integer('version_number').notNull(),
  caption: text('caption').notNull(),
  hashtags: text('hashtags').array(),
  imageUrl: text('image_url'),
  aiGenerated: boolean('ai_generated').default(true).notNull(),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Post Schedules ───────────────────────────────────────────────────────────

export const postSchedules = pgTable('post_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }).notNull(),
  postVersionId: uuid('post_version_id').references(() => postVersions.id).notNull(),
  scheduledAt: timestamp('scheduled_at').notNull(),
  postedAt: timestamp('posted_at'),
  frequency: text('frequency', {
    enum: ['once', 'daily', 'weekly', 'biweekly', 'custom'],
  }).default('once').notNull(),
  repeatIntervalDays: integer('repeat_interval_days'),
  repeatUntil: timestamp('repeat_until'),
  status: text('status', {
    enum: ['pending', 'posted', 'failed', 'expired', 'cancelled'],
  }).default('pending').notNull(),
  linkedinPostId: text('linkedin_post_id'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Post Analytics ───────────────────────────────────────────────────────────

export const postAnalytics = pgTable('post_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  postScheduleId: uuid('post_schedule_id').references(() => postSchedules.id, { onDelete: 'cascade' }).notNull(),
  impressions: integer('impressions').default(0).notNull(),
  clicks: integer('clicks').default(0).notNull(),
  likes: integer('likes').default(0).notNull(),
  shares: integer('shares').default(0).notNull(),
  comments: integer('comments').default(0).notNull(),
  applicationsAttributed: integer('applications_attributed').default(0).notNull(),
  pulledAt: timestamp('pulled_at').defaultNow().notNull(),
});

// ─── Social Connections ───────────────────────────────────────────────────────

export const socialConnections = pgTable('social_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  platform: text('platform', { enum: ['linkedin', 'facebook', 'twitter'] }).notNull(),
  connectionType: text('connection_type', { enum: ['personal', 'company_page'] }).notNull(),
  platformUserId: text('platform_user_id'),
  platformUsername: text('platform_username'),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  tokenExpiresAt: timestamp('token_expires_at'),
  isActive: boolean('is_active').default(true).notNull(),
  connectedAt: timestamp('connected_at').defaultNow().notNull(),
});

// ─── Promotions ───────────────────────────────────────────────────────────────
// Admin-created content (culture posts, announcements) that employees and
// recruiters can share on their personal social accounts.
// audience: 'all' = everyone; 'recruiter'/'employee' = role-specific;
//           'department' = only users in the linked department

export const promotions = pgTable('promotions', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  departmentId: uuid('department_id').references(() => departments.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  imageUrl: text('image_url'),
  audience: text('audience', {
    enum: ['all', 'recruiter', 'employee', 'department'],
  }).notNull().default('all'),
  allowedPlatforms: text('allowed_platforms').array().notNull().default([]),
  status: text('status', { enum: ['draft', 'active', 'archived'] }).default('active').notNull(),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Promotion Shares ─────────────────────────────────────────────────────────
// Tracks each time a user shares a promotion on a social platform.

export const promotionShares = pgTable('promotion_shares', {
  id: uuid('id').primaryKey().defaultRandom(),
  promotionId: uuid('promotion_id').references(() => promotions.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  platform: text('platform', { enum: ['linkedin', 'facebook', 'twitter'] }).notNull(),
  externalPostId: text('external_post_id'), // platform's returned post ID
  sharedAt: timestamp('shared_at').defaultNow().notNull(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
  departments: many(departments),
  atsConnections: many(atsConnections),
  jobs: many(jobs),
  posts: many(posts),
  promotions: many(promotions),
  platformRules: many(platformRules),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  company: one(companies, { fields: [departments.companyId], references: [companies.id] }),
  userDepartments: many(userDepartments),
  atsConnections: many(atsConnections),
  jobs: many(jobs),
  promotions: many(promotions),
  platformRules: many(platformRules),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, { fields: [users.companyId], references: [companies.id] }),
  userDepartments: many(userDepartments),
  assignedJobs: many(jobs),
  posts: many(posts),
  socialConnections: many(socialConnections),
  promotionShares: many(promotionShares),
}));

export const userDepartmentsRelations = relations(userDepartments, ({ one }) => ({
  user: one(users, { fields: [userDepartments.userId], references: [users.id] }),
  department: one(departments, { fields: [userDepartments.departmentId], references: [departments.id] }),
}));

export const atsConnectionsRelations = relations(atsConnections, ({ one }) => ({
  company: one(companies, { fields: [atsConnections.companyId], references: [companies.id] }),
  department: one(departments, { fields: [atsConnections.departmentId], references: [departments.id] }),
}));

export const platformRulesRelations = relations(platformRules, ({ one }) => ({
  company: one(companies, { fields: [platformRules.companyId], references: [companies.id] }),
  department: one(departments, { fields: [platformRules.departmentId], references: [departments.id] }),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  company: one(companies, { fields: [jobs.companyId], references: [companies.id] }),
  atsConnection: one(atsConnections, { fields: [jobs.atsConnectionId], references: [atsConnections.id] }),
  department: one(departments, { fields: [jobs.departmentId], references: [departments.id] }),
  assignedRecruiter: one(users, { fields: [jobs.assignedRecruiterId], references: [users.id] }),
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  company: one(companies, { fields: [posts.companyId], references: [companies.id] }),
  job: one(jobs, { fields: [posts.jobId], references: [jobs.id] }),
  createdBy: one(users, { fields: [posts.createdBy], references: [users.id] }),
  versions: many(postVersions),
  schedules: many(postSchedules),
}));

export const postVersionsRelations = relations(postVersions, ({ one }) => ({
  post: one(posts, { fields: [postVersions.postId], references: [posts.id] }),
  createdBy: one(users, { fields: [postVersions.createdBy], references: [users.id] }),
}));

export const postSchedulesRelations = relations(postSchedules, ({ one, many }) => ({
  post: one(posts, { fields: [postSchedules.postId], references: [posts.id] }),
  postVersion: one(postVersions, { fields: [postSchedules.postVersionId], references: [postVersions.id] }),
  analytics: many(postAnalytics),
}));

export const companyEmployeesRelations = relations(companyEmployees, ({ one }) => ({
  company: one(companies, { fields: [companyEmployees.companyId], references: [companies.id] }),
  atsConnection: one(atsConnections, { fields: [companyEmployees.atsConnectionId], references: [atsConnections.id] }),
  user: one(users, { fields: [companyEmployees.userId], references: [users.id] }),
}));

export const promotionsRelations = relations(promotions, ({ one, many }) => ({
  company: one(companies, { fields: [promotions.companyId], references: [companies.id] }),
  createdBy: one(users, { fields: [promotions.createdBy], references: [users.id] }),
  department: one(departments, { fields: [promotions.departmentId], references: [departments.id] }),
  shares: many(promotionShares),
}));

export const promotionSharesRelations = relations(promotionShares, ({ one }) => ({
  promotion: one(promotions, { fields: [promotionShares.promotionId], references: [promotions.id] }),
  user: one(users, { fields: [promotionShares.userId], references: [users.id] }),
}));
