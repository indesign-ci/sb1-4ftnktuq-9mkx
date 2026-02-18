/*
  # Add Project Features

  1. New Tables
    - `project_phases` - Stores the 9 phases of each project
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key)
      - `name` (text)
      - `order_number` (integer)
      - `status` (text) - 'todo', 'in_progress', 'completed'
      - `planned_start_date` (date)
      - `planned_end_date` (date)
      - `actual_start_date` (date)
      - `actual_end_date` (date)
      - `created_at` (timestamp)

    - `moodboards` - Stores moodboards for projects
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key)
      - `title` (text)
      - `description` (text)
      - `colors` (jsonb) - Array of color codes
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `moodboard_images` - Stores images in moodboards
      - `id` (uuid, primary key)
      - `moodboard_id` (uuid, foreign key)
      - `image_url` (text)
      - `title` (text)
      - `description` (text)
      - `tags` (text array)
      - `position` (integer)
      - `created_at` (timestamp)

    - `project_history` - Stores project activity history
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `action_type` (text)
      - `description` (text)
      - `metadata` (jsonb)
      - `created_at` (timestamp)

  2. Updates to existing tables
    - Add `deleted_at` to projects table for soft delete

  3. Security
    - Enable RLS on all new tables
    - Add policies for company access
*/

-- Add deleted_at to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE projects ADD COLUMN deleted_at TIMESTAMPTZ;
  END IF;
END $$;

-- Create project_phases table
CREATE TABLE IF NOT EXISTS project_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_number INTEGER NOT NULL,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed')),
  planned_start_date DATE,
  planned_end_date DATE,
  actual_start_date DATE,
  actual_end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create moodboards table
CREATE TABLE IF NOT EXISTS moodboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  colors JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create moodboard_images table
CREATE TABLE IF NOT EXISTS moodboard_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moodboard_id UUID NOT NULL REFERENCES moodboards(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  tags TEXT[],
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create project_history table
CREATE TABLE IF NOT EXISTS project_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  action_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE project_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE moodboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE moodboard_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_phases
CREATE POLICY "Users can view phases from their company projects"
  ON project_phases FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE company_id IN (
        SELECT company_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert phases to their company projects"
  ON project_phases FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE company_id IN (
        SELECT company_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update phases in their company projects"
  ON project_phases FOR UPDATE
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE company_id IN (
        SELECT company_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE company_id IN (
        SELECT company_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete phases from their company projects"
  ON project_phases FOR DELETE
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE company_id IN (
        SELECT company_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for moodboards
CREATE POLICY "Users can view moodboards from their company projects"
  ON moodboards FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE company_id IN (
        SELECT company_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert moodboards to their company projects"
  ON moodboards FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE company_id IN (
        SELECT company_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update moodboards in their company projects"
  ON moodboards FOR UPDATE
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE company_id IN (
        SELECT company_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE company_id IN (
        SELECT company_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete moodboards from their company projects"
  ON moodboards FOR DELETE
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE company_id IN (
        SELECT company_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for moodboard_images
CREATE POLICY "Users can view moodboard images from their company projects"
  ON moodboard_images FOR SELECT
  TO authenticated
  USING (
    moodboard_id IN (
      SELECT id FROM moodboards WHERE project_id IN (
        SELECT id FROM projects WHERE company_id IN (
          SELECT company_id FROM profiles WHERE user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert moodboard images to their company projects"
  ON moodboard_images FOR INSERT
  TO authenticated
  WITH CHECK (
    moodboard_id IN (
      SELECT id FROM moodboards WHERE project_id IN (
        SELECT id FROM projects WHERE company_id IN (
          SELECT company_id FROM profiles WHERE user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can update moodboard images in their company projects"
  ON moodboard_images FOR UPDATE
  TO authenticated
  USING (
    moodboard_id IN (
      SELECT id FROM moodboards WHERE project_id IN (
        SELECT id FROM projects WHERE company_id IN (
          SELECT company_id FROM profiles WHERE user_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    moodboard_id IN (
      SELECT id FROM moodboards WHERE project_id IN (
        SELECT id FROM projects WHERE company_id IN (
          SELECT company_id FROM profiles WHERE user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can delete moodboard images from their company projects"
  ON moodboard_images FOR DELETE
  TO authenticated
  USING (
    moodboard_id IN (
      SELECT id FROM moodboards WHERE project_id IN (
        SELECT id FROM projects WHERE company_id IN (
          SELECT company_id FROM profiles WHERE user_id = auth.uid()
        )
      )
    )
  );

-- RLS Policies for project_history
CREATE POLICY "Users can view project history from their company"
  ON project_history FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE company_id IN (
        SELECT company_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert project history to their company projects"
  ON project_history FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE company_id IN (
        SELECT company_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );
