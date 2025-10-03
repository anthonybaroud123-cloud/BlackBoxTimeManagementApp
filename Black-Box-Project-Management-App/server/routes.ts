import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProjectSchema, 
  insertProjectScopeSchema,
  insertScopeTemplateSchema,
  updateScopeTemplateSchema,
  insertProjectMemberSchema,
  insertTimeEntrySchema,
  insertAppSettingSchema,
  updateAppSettingSchema,
  insertUserSchema,
  updateUserSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      console.log('PATCH /api/users - Raw request body:', JSON.stringify(req.body, null, 2));
      const updates = updateUserSchema.parse(req.body);
      console.log('PATCH /api/users - Validated data:', JSON.stringify(updates, null, 2));
      const user = await storage.updateUser(req.params.id, updates);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (error) {
      console.error('PATCH /api/users - Validation error:', error);
      console.error('PATCH /api/users - Error details:', error.message);
      res.status(400).json({ error: "Invalid user data", details: error.message });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteUser(req.params.id);
      if (!deleted) return res.status(404).json({ error: "User not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Project routes
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) return res.status(404).json({ error: "Project not found" });
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ error: "Invalid project data" });
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const updates = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(req.params.id, updates);
      if (!project) return res.status(404).json({ error: "Project not found" });
      res.json(project);
    } catch (error) {
      res.status(400).json({ error: "Invalid project data" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteProject(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Project not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // Project scope routes
  app.get("/api/project-scopes", async (req, res) => {
    try {
      const scopes = await storage.getAllProjectScopes();
      res.json(scopes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project scopes" });
    }
  });

  app.get("/api/projects/:projectId/scopes", async (req, res) => {
    try {
      const scopes = await storage.getProjectScopes(req.params.projectId);
      res.json(scopes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project scopes" });
    }
  });

  app.post("/api/projects/:projectId/scopes", async (req, res) => {
    try {
      const validatedData = insertProjectScopeSchema.parse({
        ...req.body,
        projectId: req.params.projectId
      });
      const scope = await storage.createProjectScope(validatedData);
      res.status(201).json(scope);
    } catch (error) {
      res.status(400).json({ error: "Invalid scope data" });
    }
  });

  app.delete("/api/projects/:projectId/scopes/:scopeId", async (req, res) => {
    try {
      const deleted = await storage.deleteProjectScope(req.params.scopeId);
      if (!deleted) return res.status(404).json({ error: "Scope not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete scope" });
    }
  });

  // Scope template routes (Admin only)
  app.get("/api/scope-templates", async (req, res) => {
    try {
      const templates = await storage.getScopeTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scope templates" });
    }
  });

  app.get("/api/scope-templates/:id", async (req, res) => {
    try {
      const template = await storage.getScopeTemplate(req.params.id);
      if (!template) return res.status(404).json({ error: "Scope template not found" });
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scope template" });
    }
  });

  app.post("/api/scope-templates", async (req, res) => {
    try {
      const validatedData = insertScopeTemplateSchema.parse(req.body);
      const template = await storage.createScopeTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      res.status(400).json({ error: "Invalid scope template data" });
    }
  });

  app.patch("/api/scope-templates/:id", async (req, res) => {
    try {
      const updates = updateScopeTemplateSchema.parse(req.body);
      const template = await storage.updateScopeTemplate(req.params.id, updates);
      if (!template) return res.status(404).json({ error: "Scope template not found" });
      res.json(template);
    } catch (error) {
      res.status(400).json({ error: "Invalid scope template data" });
    }
  });

  app.delete("/api/scope-templates/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteScopeTemplate(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Scope template not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete scope template" });
    }
  });

  app.patch("/api/scope-templates/bulk", async (req, res) => {
    try {
      const updates = req.body.updates; // Array of { id: string, isActive: boolean }
      if (!Array.isArray(updates)) {
        return res.status(400).json({ error: "Updates must be an array" });
      }
      const updatedTemplates = await storage.bulkUpdateScopeTemplates(updates);
      res.json(updatedTemplates);
    } catch (error) {
      res.status(400).json({ error: "Invalid bulk update data" });
    }
  });

  // Project member routes
  app.get("/api/projects/:projectId/members", async (req, res) => {
    try {
      const members = await storage.getProjectMembers(req.params.projectId);
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project members" });
    }
  });

  app.post("/api/projects/:projectId/members", async (req, res) => {
    try {
      const validatedData = insertProjectMemberSchema.parse({
        ...req.body,
        projectId: req.params.projectId
      });
      const member = await storage.addProjectMember(validatedData);
      res.status(201).json(member);
    } catch (error) {
      res.status(400).json({ error: "Invalid member data" });
    }
  });

  app.patch("/api/projects/:projectId/members/:memberId", async (req, res) => {
    try {
      const updates = insertProjectMemberSchema.partial().parse(req.body);
      const member = await storage.updateProjectMember(req.params.memberId, updates);
      if (!member) return res.status(404).json({ error: "Member not found" });
      res.json(member);
    } catch (error) {
      res.status(400).json({ error: "Invalid member data" });
    }
  });

  app.delete("/api/projects/:projectId/members/:memberId", async (req, res) => {
    try {
      const deleted = await storage.removeProjectMember(req.params.memberId);
      if (!deleted) return res.status(404).json({ error: "Member not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to remove member" });
    }
  });


  // Time entry routes
  app.get("/api/time-entries", async (req, res) => {
    try {
      const { userId, projectId } = req.query as Record<string, string>;
      const entries = await storage.getTimeEntries({
        userId: userId || undefined,
        projectId: projectId || undefined
      });
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch time entries" });
    }
  });

  app.post("/api/time-entries", async (req, res) => {
    try {
      console.log('Received time entry data:', JSON.stringify(req.body, null, 2));
      const validatedData = insertTimeEntrySchema.parse(req.body);
      console.log('Validated data:', JSON.stringify(validatedData, null, 2));
      const entry = await storage.createTimeEntry(validatedData);
      res.status(201).json(entry);
    } catch (error) {
      console.error('Time entry validation error:', error);
      console.error('Raw request body:', JSON.stringify(req.body, null, 2));
      res.status(400).json({ error: "Invalid time entry data", details: error.message });
    }
  });

  app.patch("/api/time-entries/:id", async (req, res) => {
    try {
      const updates = insertTimeEntrySchema.partial().parse(req.body);
      const entry = await storage.updateTimeEntry(req.params.id, updates);
      if (!entry) return res.status(404).json({ error: "Time entry not found" });
      res.json(entry);
    } catch (error) {
      res.status(400).json({ error: "Invalid time entry data" });
    }
  });

  app.delete("/api/time-entries/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTimeEntry(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Time entry not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete time entry" });
    }
  });

  // App settings routes (Admin only)
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getAppSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch app settings" });
    }
  });

  app.get("/api/settings/:key", async (req, res) => {
    try {
      const setting = await storage.getAppSetting(req.params.key);
      if (!setting) return res.status(404).json({ error: "Setting not found" });
      res.json(setting);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch setting" });
    }
  });

  app.put("/api/settings/:key", async (req, res) => {
    try {
      const validatedData = insertAppSettingSchema.parse({
        ...req.body,
        key: req.params.key
      });
      const setting = await storage.setAppSetting(validatedData);
      res.json(setting);
    } catch (error) {
      res.status(400).json({ error: "Invalid setting data" });
    }
  });

  app.patch("/api/settings/:key", async (req, res) => {
    try {
      const updates = updateAppSettingSchema.parse(req.body);
      const setting = await storage.updateAppSetting(req.params.key, updates);
      if (!setting) return res.status(404).json({ error: "Setting not found" });
      res.json(setting);
    } catch (error) {
      res.status(400).json({ error: "Invalid setting data" });
    }
  });

  app.delete("/api/settings/:key", async (req, res) => {
    try {
      const deleted = await storage.deleteAppSetting(req.params.key);
      if (!deleted) return res.status(404).json({ error: "Setting not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete setting" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
