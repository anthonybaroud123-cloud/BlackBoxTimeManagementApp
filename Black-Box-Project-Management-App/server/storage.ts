import { 
  type User, type InsertUser,
  type Project, type InsertProject,
  type ProjectScope, type InsertProjectScope,
  type ScopeTemplate, type InsertScopeTemplate, type UpdateScopeTemplate,
  type ProjectMember, type InsertProjectMember,
  type TimeEntry, type InsertTimeEntry,
  type AppSetting, type InsertAppSetting, type UpdateAppSetting,
  users, projects, projectScopes, scopeTemplates, projectMembers,
  timeEntries, appSettings
} from "@shared/schema";
import { randomUUID } from "crypto";
import { eq, and, desc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "./db";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getUsers(): Promise<User[]>;

  // Project management
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;

  // Project scopes
  getProjectScopes(projectId: string): Promise<ProjectScope[]>;
  getAllProjectScopes(): Promise<ProjectScope[]>;
  createProjectScope(scope: InsertProjectScope): Promise<ProjectScope>;
  deleteProjectScope(id: string): Promise<boolean>;

  // Scope templates (Admin only)
  getScopeTemplates(): Promise<ScopeTemplate[]>;
  getScopeTemplate(id: string): Promise<ScopeTemplate | undefined>;
  createScopeTemplate(template: InsertScopeTemplate): Promise<ScopeTemplate>;
  updateScopeTemplate(id: string, updates: UpdateScopeTemplate): Promise<ScopeTemplate | undefined>;
  deleteScopeTemplate(id: string): Promise<boolean>;
  bulkUpdateScopeTemplates(updates: { id: string; isActive: boolean }[]): Promise<ScopeTemplate[]>;

  // Project members
  getProjectMembers(projectId: string): Promise<(ProjectMember & { user: User })[]>;
  addProjectMember(member: InsertProjectMember): Promise<ProjectMember>;
  updateProjectMember(id: string, updates: Partial<InsertProjectMember>): Promise<ProjectMember | undefined>;
  removeProjectMember(id: string): Promise<boolean>;


  // Time tracking
  getTimeEntries(filters?: { userId?: string; projectId?: string }): Promise<(TimeEntry & { project: Project; scope: ProjectScope; user: User })[]>;
  createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry>;
  updateTimeEntry(id: string, updates: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined>;
  deleteTimeEntry(id: string): Promise<boolean>;

  // App settings (Admin only)
  getAppSettings(): Promise<AppSetting[]>;
  getAppSetting(key: string): Promise<AppSetting | undefined>;
  setAppSetting(setting: InsertAppSetting): Promise<AppSetting>;
  updateAppSetting(key: string, updates: UpdateAppSetting): Promise<AppSetting | undefined>;
  deleteAppSetting(key: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User management
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values({
      username: user.username,
      password: user.password,
      name: user.name,
      email: user.email,
      role: "regular" // Default role
    }).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  // Project management
  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    return result[0];
  }

  async createProject(project: InsertProject): Promise<Project> {
    const result = await db.insert(projects).values(project).returning();
    return result[0];
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project | undefined> {
    const result = await db.update(projects).set({
      ...updates,
      updatedAt: new Date()
    }).where(eq(projects.id, id)).returning();
    return result[0];
  }

  async deleteProject(id: string): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Project scopes
  async getProjectScopes(projectId: string): Promise<ProjectScope[]> {
    return await db.select().from(projectScopes)
      .where(eq(projectScopes.projectId, projectId))
      .orderBy(desc(projectScopes.createdAt));
  }

  async getAllProjectScopes(): Promise<ProjectScope[]> {
    return await db.select().from(projectScopes).orderBy(desc(projectScopes.createdAt));
  }

  async createProjectScope(scope: InsertProjectScope): Promise<ProjectScope> {
    const result = await db.insert(projectScopes).values(scope).returning();
    return result[0];
  }

  async deleteProjectScope(id: string): Promise<boolean> {
    const result = await db.delete(projectScopes).where(eq(projectScopes.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Scope templates (Admin only)
  async getScopeTemplates(): Promise<ScopeTemplate[]> {
    return await db.select().from(scopeTemplates).orderBy(desc(scopeTemplates.createdAt));
  }

  async getScopeTemplate(id: string): Promise<ScopeTemplate | undefined> {
    const result = await db.select().from(scopeTemplates).where(eq(scopeTemplates.id, id)).limit(1);
    return result[0];
  }

  async createScopeTemplate(template: InsertScopeTemplate): Promise<ScopeTemplate> {
    const result = await db.insert(scopeTemplates).values(template).returning();
    return result[0];
  }

  async updateScopeTemplate(id: string, updates: UpdateScopeTemplate): Promise<ScopeTemplate | undefined> {
    const result = await db.update(scopeTemplates).set({
      ...updates,
      updatedAt: new Date()
    }).where(eq(scopeTemplates.id, id)).returning();
    return result[0];
  }

  async deleteScopeTemplate(id: string): Promise<boolean> {
    const result = await db.delete(scopeTemplates).where(eq(scopeTemplates.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async bulkUpdateScopeTemplates(updates: { id: string; isActive: boolean }[]): Promise<ScopeTemplate[]> {
    const results: ScopeTemplate[] = [];
    for (const update of updates) {
      const result = await db.update(scopeTemplates)
        .set({ isActive: update.isActive, updatedAt: new Date() })
        .where(eq(scopeTemplates.id, update.id))
        .returning();
      if (result[0]) results.push(result[0]);
    }
    return results;
  }

  // Project members
  async getProjectMembers(projectId: string): Promise<(ProjectMember & { user: User })[]> {
    const result = await db.select({
      id: projectMembers.id,
      projectId: projectMembers.projectId,
      userId: projectMembers.userId,
      costRate: projectMembers.costRate,
      sellingRate: projectMembers.sellingRate,
      assignedAt: projectMembers.assignedAt,
      user: users
    })
    .from(projectMembers)
    .innerJoin(users, eq(projectMembers.userId, users.id))
    .where(eq(projectMembers.projectId, projectId));
    
    return result;
  }

  async addProjectMember(member: InsertProjectMember): Promise<ProjectMember> {
    const result = await db.insert(projectMembers).values(member).returning();
    return result[0];
  }

  async updateProjectMember(id: string, updates: Partial<InsertProjectMember>): Promise<ProjectMember | undefined> {
    const result = await db.update(projectMembers).set(updates).where(eq(projectMembers.id, id)).returning();
    return result[0];
  }

  async removeProjectMember(id: string): Promise<boolean> {
    const result = await db.delete(projectMembers).where(eq(projectMembers.id, id));
    return (result.rowCount ?? 0) > 0;
  }


  // Time tracking
  async getTimeEntries(filters?: { userId?: string; projectId?: string }): Promise<(TimeEntry & { project: Project; scope: ProjectScope; user: User })[]> {
    const baseQuery = db.select({
      id: timeEntries.id,
      userId: timeEntries.userId,
      projectId: timeEntries.projectId,
      scopeId: timeEntries.scopeId,
      description: timeEntries.description,
      minutes: timeEntries.minutes,
      entryType: timeEntries.entryType,
      startedAt: timeEntries.startedAt,
      endedAt: timeEntries.endedAt,
      createdAt: timeEntries.createdAt,
      project: projects,
      scope: projectScopes,
      user: users
    })
    .from(timeEntries)
    .innerJoin(projects, eq(timeEntries.projectId, projects.id))
    .innerJoin(projectScopes, eq(timeEntries.scopeId, projectScopes.id))
    .innerJoin(users, eq(timeEntries.userId, users.id));

    // Build where conditions
    const conditions = [];
    if (filters?.userId) {
      conditions.push(eq(timeEntries.userId, filters.userId));
    }
    if (filters?.projectId) {
      conditions.push(eq(timeEntries.projectId, filters.projectId));
    }

    let query = baseQuery;
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const result = await query.orderBy(desc(timeEntries.createdAt));
    return result as any;
  }

  async createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry> {
    const result = await db.insert(timeEntries).values(entry).returning();
    return result[0];
  }

  async updateTimeEntry(id: string, updates: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined> {
    const result = await db.update(timeEntries).set(updates).where(eq(timeEntries.id, id)).returning();
    return result[0];
  }

  async deleteTimeEntry(id: string): Promise<boolean> {
    const result = await db.delete(timeEntries).where(eq(timeEntries.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // App settings (Admin only)
  async getAppSettings(): Promise<AppSetting[]> {
    return await db.select().from(appSettings).orderBy(desc(appSettings.updatedAt));
  }

  async getAppSetting(key: string): Promise<AppSetting | undefined> {
    const result = await db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
    return result[0];
  }

  async setAppSetting(setting: InsertAppSetting): Promise<AppSetting> {
    // Try to update first, if not found then insert
    const existing = await this.getAppSetting(setting.key);
    if (existing) {
      const result = await db.update(appSettings).set({
        value: setting.value,
        description: setting.description,
        updatedBy: setting.updatedBy,
        updatedAt: new Date()
      }).where(eq(appSettings.key, setting.key)).returning();
      return result[0];
    } else {
      const result = await db.insert(appSettings).values(setting).returning();
      return result[0];
    }
  }

  async updateAppSetting(key: string, updates: UpdateAppSetting): Promise<AppSetting | undefined> {
    const result = await db.update(appSettings).set({
      ...updates,
      updatedAt: new Date()
    }).where(eq(appSettings.key, key)).returning();
    return result[0];
  }

  async deleteAppSetting(key: string): Promise<boolean> {
    const result = await db.delete(appSettings).where(eq(appSettings.key, key));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();

// Sample data seeding function
async function seedData() {
  console.log("Starting data seeding...");

  // Create admin user
  const adminUser = await storage.createUser({
    username: "admin",
    password: "admin123", // In production, this should be hashed
    email: "admin@timetracker.com",
    name: "System Administrator",
    isAdmin: true
  });

  // Create regular user
  const user1 = await storage.createUser({
    username: "john_dev",
    password: "dev123", // In production, this should be hashed
    email: "john@example.com", 
    name: "John Developer",
    isAdmin: false
  });

  const user2 = await storage.createUser({
    username: "jane_designer",
    password: "design123", // In production, this should be hashed
    email: "jane@example.com",
    name: "Jane Designer", 
    isAdmin: false
  });

  // Create scope templates
  const frontendTemplate = await storage.createScopeTemplate({
    name: "Frontend Development",
    color: "#3B82F6",
    isActive: true
  });

  const backendTemplate = await storage.createScopeTemplate({
    name: "Backend Development", 
    color: "#10B981",
    isActive: true
  });

  const designTemplate = await storage.createScopeTemplate({
    name: "UI/UX Design",
    color: "#F59E0B",
    isActive: true
  });

  const testingTemplate = await storage.createScopeTemplate({
    name: "Testing & QA",
    color: "#EF4444", 
    isActive: true
  });

  const docsTemplate = await storage.createScopeTemplate({
    name: "Documentation",
    color: "#8B5CF6",
    isActive: true
  });

  // Create projects
  const project1 = await storage.createProject({
    name: "E-commerce Platform",
    description: "Modern e-commerce platform with React and Node.js",
    status: "active",
    budget: 50000,
    estimatedMinutes: 14400 // 240 hours
  });

  const project2 = await storage.createProject({
    name: "Mobile App MVP",
    description: "Cross-platform mobile application for task management", 
    status: "planning",
    budget: 30000,
    estimatedMinutes: 7200 // 120 hours
  });

  // Create project scopes
  const scope1 = await storage.createProjectScope({
    projectId: project1.id,
    name: "Frontend Development",
    color: "#3B82F6"
  });

  const scope2 = await storage.createProjectScope({
    projectId: project1.id,
    name: "Backend API",
    color: "#10B981" 
  });

  const scope3 = await storage.createProjectScope({
    projectId: project2.id,
    name: "Mobile UI Design",
    color: "#F59E0B"
  });

  // Add project members
  await storage.addProjectMember({
    projectId: project1.id,
    userId: user1.id,
    costRate: 75,
    sellingRate: 120
  });

  await storage.addProjectMember({
    projectId: project1.id, 
    userId: user2.id,
    costRate: 65,
    sellingRate: 100
  });

  await storage.addProjectMember({
    projectId: project2.id,
    userId: user2.id,
    costRate: 65,
    sellingRate: 100
  });


  // Create time entries
  await storage.createTimeEntry({
    userId: user1.id,
    projectId: project1.id,
    scopeId: scope2.id,
    description: "Backend API development",
    minutes: 180, // 3 hours
    entryType: "timer",
    startedAt: new Date("2024-09-24T13:00:00Z"),
    endedAt: new Date("2024-09-24T16:00:00Z")
  });

  await storage.createTimeEntry({
    userId: user2.id,
    projectId: project1.id,
    scopeId: scope1.id,
    description: "Frontend development work",
    minutes: 300, // 5 hours
    entryType: "manual",
    startedAt: null,
    endedAt: null
  });

  // Create default app settings
  await storage.setAppSetting({
    key: "default_currency",
    value: "USD",
    description: "Default currency for all financial calculations and reports",
    updatedBy: adminUser.id
  });

  console.log("Sample data seeded successfully");
}

// Initialize with sample data
seedData().catch(console.error);
