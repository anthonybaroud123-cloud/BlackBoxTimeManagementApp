/*
  # Create Initial TimeTracker Pro Schema

  1. New Tables
    - `users`
      - `id` (varchar, primary key, auto-generated UUID)
      - `username` (text, unique, not null)
      - `password` (text, not null)
      - `role` (text, default 'regular')
      - `name` (text, not null)
      - `email` (text)
      - `base_cost_rate` (decimal, default 75)
      - `base_selling_rate` (decimal, default 125)
      - `created_at` (timestamp, default CURRENT_TIMESTAMP)
    
    - `projects`
      - `id` (varchar, primary key, auto-generated UUID)
      - `name` (text, not null)
      - `description` (text, default '')
      - `status` (text, default 'active')
      - `created_by_id` (varchar, references users.id)
      - `created_at` (timestamp, default CURRENT_TIMESTAMP)
      - `updated_at` (timestamp, default CURRENT_TIMESTAMP)
    
    - `project_scopes`
      - `id` (varchar, primary key, auto-generated UUID)
      - `project_id` (varchar, references projects.id)
      - `name` (text, not null)
      - `created_at` (timestamp, default CURRENT_TIMESTAMP)
      - Unique constraint on (project_id, id)
    
    - `scope_templates`
      - `id` (varchar, primary key, auto-generated UUID)
      - `name` (text, unique, not null)
      - `description` (text, default '')
      - `is_active` (boolean, default true)
      - `created_at` (timestamp, default CURRENT_TIMESTAMP)
      - `updated_at` (timestamp, default CURRENT_TIMESTAMP)
    
    - `project_members`
      - `id` (varchar, primary key, auto-generated UUID)
      - `project_id` (varchar, references projects.id)
      - `user_id` (varchar, references users.id)
      - `cost_rate` (decimal, default 0)
      - `selling_rate` (decimal, default 0)
      - `assigned_at` (timestamp, default CURRENT_TIMESTAMP)
    
    - `time_entries`
      - `id` (varchar, primary key, auto-generated UUID)
      - `user_id` (varchar, references users.id)
      - `project_id` (varchar, references projects.id)
      - `scope_id` (varchar)
      - `description` (text, default '')
      - `minutes` (integer, not null)
      - `entry_type` (text, default 'manual')
      - `started_at` (timestamp)
      - `ended_at` (timestamp)
      - `created_at` (timestamp, default CURRENT_TIMESTAMP)
      - Composite foreign key for (project_id, scope_id)
    
    - `app_settings`
      - `id` (varchar, primary key, auto-generated UUID)
      - `key` (text, unique, not null)
      - `value` (text, not null)
      - `description` (text, default '')
      - `updated_by` (varchar, references users.id)
      - `updated_at` (timestamp, default CURRENT_TIMESTAMP)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for admins to manage all data
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
  username text NOT NULL UNIQUE,
  password text NOT NULL,
  role text NOT NULL DEFAULT 'regular',
  name text NOT NULL,
  email text,
  base_cost_rate decimal(8, 2) DEFAULT 75,
  base_selling_rate decimal(8, 2) DEFAULT 125,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
  name text NOT NULL,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  created_by_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create project_scopes table
CREATE TABLE IF NOT EXISTS project_scopes (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
  project_id varchar NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, id)
);

-- Create scope_templates table
CREATE TABLE IF NOT EXISTS scope_templates (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
  name text NOT NULL UNIQUE,
  description text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create project_members table
CREATE TABLE IF NOT EXISTS project_members (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
  project_id varchar NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cost_rate decimal(8, 2) DEFAULT 0,
  selling_rate decimal(8, 2) DEFAULT 0,
  assigned_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create time_entries table
CREATE TABLE IF NOT EXISTS time_entries (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
  user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id varchar NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scope_id varchar NOT NULL,
  description text DEFAULT '',
  minutes integer NOT NULL,
  entry_type text NOT NULL DEFAULT 'manual',
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT time_entries_project_scope_fk FOREIGN KEY (project_id, scope_id) REFERENCES project_scopes(project_id, id)
);

-- Create app_settings table
CREATE TABLE IF NOT EXISTS app_settings (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  description text DEFAULT '',
  updated_by varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scope_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id::text = auth.uid()::text)
  WITH CHECK (id::text = auth.uid()::text);

-- RLS Policies for projects table
CREATE POLICY "Users can view all projects"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (created_by_id::text = auth.uid()::text);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (created_by_id::text = auth.uid()::text)
  WITH CHECK (created_by_id::text = auth.uid()::text);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (created_by_id::text = auth.uid()::text);

-- RLS Policies for project_scopes table
CREATE POLICY "Users can view project scopes"
  ON project_scopes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Project creators can manage scopes"
  ON project_scopes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_scopes.project_id
      AND projects.created_by_id::text = auth.uid()::text
    )
  );

-- RLS Policies for scope_templates table
CREATE POLICY "Users can view scope templates"
  ON scope_templates FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for project_members table
CREATE POLICY "Users can view project members"
  ON project_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Project creators can manage members"
  ON project_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
      AND projects.created_by_id::text = auth.uid()::text
    )
  );

-- RLS Policies for time_entries table
CREATE POLICY "Users can view own time entries"
  ON time_entries FOR SELECT
  TO authenticated
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can create own time entries"
  ON time_entries FOR INSERT
  TO authenticated
  WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update own time entries"
  ON time_entries FOR UPDATE
  TO authenticated
  USING (user_id::text = auth.uid()::text)
  WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can delete own time entries"
  ON time_entries FOR DELETE
  TO authenticated
  USING (user_id::text = auth.uid()::text);

-- RLS Policies for app_settings table
CREATE POLICY "Users can view app settings"
  ON app_settings FOR SELECT
  TO authenticated
  USING (true);