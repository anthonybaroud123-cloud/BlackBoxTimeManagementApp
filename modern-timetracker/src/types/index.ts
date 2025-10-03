export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'regular';
  base_cost_rate: number;
  base_selling_rate: number;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'paused';
  created_by_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectScope {
  id: string;
  project_id: string;
  name: string;
  created_at: string;
}

export interface ScopeTemplate {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  cost_rate: number;
  selling_rate: number;
  assigned_at: string;
  users?: User;
}

export interface TimeEntry {
  id: string;
  user_id: string;
  project_id: string;
  scope_id: string;
  description: string;
  minutes: number;
  entry_type: 'manual' | 'timer';
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  projects?: Project;
  project_scopes?: ProjectScope;
}
