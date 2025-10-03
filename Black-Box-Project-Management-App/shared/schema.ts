import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, decimal, boolean, unique, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("regular"), // "admin" or "regular"
  name: text("name").notNull(),
  email: text("email"),
  baseCostRate: decimal("base_cost_rate", { precision: 8, scale: 2 }).default("75"), // Default cost rate per hour
  baseSellingRate: decimal("base_selling_rate", { precision: 8, scale: 2 }).default("125"), // Default selling rate per hour
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").default(""),
  status: text("status").notNull().default("active"), // "active", "completed", "paused"
  createdById: varchar("created_by_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const projectScopes = pgTable("project_scopes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // "Frontend Development", "Backend Development", etc.
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  // Composite unique constraint for referential integrity
  projectScopeUnique: unique().on(table.projectId, table.id)
}));

export const scopeTemplates = pgTable("scope_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(), // "Frontend Development", "Backend Development", etc.
  description: text("description").default(""),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const projectMembers = pgTable("project_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  costRate: decimal("cost_rate", { precision: 8, scale: 2 }).default("0"), // What company pays per hour
  sellingRate: decimal("selling_rate", { precision: 8, scale: 2 }).default("0"), // What company charges client per hour
  assignedAt: timestamp("assigned_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});


export const timeEntries = pgTable("time_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  scopeId: varchar("scope_id").notNull(),
  description: text("description").default(""),
  minutes: integer("minutes").notNull(),
  entryType: text("entry_type").notNull().default("manual"), // "manual" or "timer"
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  // Composite foreign key ensuring scope belongs to the same project
  projectScopeFk: foreignKey({
    columns: [table.projectId, table.scopeId],
    foreignColumns: [projectScopes.projectId, projectScopes.id],
    name: "time_entries_project_scope_fk"
  })
}));

export const appSettings = pgTable("app_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(), // "default_currency"
  value: text("value").notNull(), // "USD"
  description: text("description").default(""),
  updatedBy: varchar("updated_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// User schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
});

export const updateUserSchema = createInsertSchema(users).pick({
  username: true,
  name: true,
  email: true,
  role: true,
}).extend({
  baseCostRate: z.number().positive().optional()
}).partial();

// Project schemas
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateProjectSchema = insertProjectSchema.partial();

// Project member schemas
export const insertProjectMemberSchema = createInsertSchema(projectMembers).omit({
  id: true,
  assignedAt: true,
});

// Project scope schemas
export const insertProjectScopeSchema = createInsertSchema(projectScopes).omit({
  id: true,
  createdAt: true,
});

// Scope template schemas
export const insertScopeTemplateSchema = createInsertSchema(scopeTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateScopeTemplateSchema = insertScopeTemplateSchema.partial();


// Time entry schemas
export const insertTimeEntrySchema = createInsertSchema(timeEntries).omit({
  id: true,
  createdAt: true,
}).extend({
  startedAt: z.string().datetime().optional().nullable().transform(val => val ? new Date(val) : null),
  endedAt: z.string().datetime().optional().nullable().transform(val => val ? new Date(val) : null)
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertProjectMember = z.infer<typeof insertProjectMemberSchema>;
export type ProjectMember = typeof projectMembers.$inferSelect;

export type InsertProjectScope = z.infer<typeof insertProjectScopeSchema>;
export type ProjectScope = typeof projectScopes.$inferSelect;

export type InsertScopeTemplate = z.infer<typeof insertScopeTemplateSchema>;
export type UpdateScopeTemplate = z.infer<typeof updateScopeTemplateSchema>;
export type ScopeTemplate = typeof scopeTemplates.$inferSelect;


export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;
export type TimeEntry = typeof timeEntries.$inferSelect;

// App settings schemas
export const insertAppSettingSchema = createInsertSchema(appSettings).omit({
  id: true,
  updatedAt: true,
});

export const updateAppSettingSchema = insertAppSettingSchema.partial();

export type InsertAppSetting = z.infer<typeof insertAppSettingSchema>;
export type UpdateAppSetting = z.infer<typeof updateAppSettingSchema>;
export type AppSetting = typeof appSettings.$inferSelect;
