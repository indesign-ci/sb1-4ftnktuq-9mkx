/*
  # Optimize RLS Policies for Performance

  1. Performance Improvements
    - Replace auth.uid() with (select auth.uid()) in all RLS policies
    - This prevents the function from being re-evaluated for each row
    - Significantly improves query performance at scale

  2. Tables Affected
    - All tables with RLS policies using auth functions
    - Maintains same security logic, just optimizes evaluation

  3. Security
    - No changes to security model
    - All existing access controls remain the same
    - Only optimization of function evaluation
*/

-- ====================
-- COMPANIES TABLE
-- ====================
DROP POLICY IF EXISTS "Users can view their company" ON companies;
CREATE POLICY "Users can view their company"
  ON companies
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT company_id FROM profiles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can update their company" ON companies;
CREATE POLICY "Admins can update their company"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT company_id FROM profiles WHERE user_id = (select auth.uid()) AND role = 'admin'
    )
  )
  WITH CHECK (
    id IN (
      SELECT company_id FROM profiles WHERE user_id = (select auth.uid()) AND role = 'admin'
    )
  );

-- ====================
-- PROFILES TABLE
-- ====================
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view company profiles" ON profiles;
CREATE POLICY "Users can view company profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (company_id = public.get_user_company_id() AND user_id != (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- ====================
-- CLIENTS TABLE
-- ====================
DROP POLICY IF EXISTS "Users can manage clients in their company" ON clients;
CREATE POLICY "Users can manage clients in their company"
  ON clients
  FOR ALL
  TO authenticated
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

-- ====================
-- PROJECTS TABLE
-- ====================
DROP POLICY IF EXISTS "Users can manage projects in their company" ON projects;
CREATE POLICY "Users can manage projects in their company"
  ON projects
  FOR ALL
  TO authenticated
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

-- ====================
-- TASKS TABLE
-- ====================
DROP POLICY IF EXISTS "Users can manage tasks for projects in their company" ON tasks;
CREATE POLICY "Users can manage tasks for projects in their company"
  ON tasks
  FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE company_id = public.get_user_company_id()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE company_id = public.get_user_company_id()
    )
  );

-- ====================
-- BUDGET_ITEMS TABLE
-- ====================
DROP POLICY IF EXISTS "Users can manage budget items for projects in their company" ON budget_items;
CREATE POLICY "Users can manage budget items for projects in their company"
  ON budget_items
  FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE company_id = public.get_user_company_id()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE company_id = public.get_user_company_id()
    )
  );

-- ====================
-- QUOTES TABLE
-- ====================
DROP POLICY IF EXISTS "Users can manage quotes in their company" ON quotes;
CREATE POLICY "Users can manage quotes in their company"
  ON quotes
  FOR ALL
  TO authenticated
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

-- ====================
-- QUOTE_SECTIONS TABLE
-- ====================
DROP POLICY IF EXISTS "Users can manage quote sections" ON quote_sections;
CREATE POLICY "Users can manage quote sections"
  ON quote_sections
  FOR ALL
  TO authenticated
  USING (
    quote_id IN (
      SELECT id FROM quotes WHERE company_id = public.get_user_company_id()
    )
  )
  WITH CHECK (
    quote_id IN (
      SELECT id FROM quotes WHERE company_id = public.get_user_company_id()
    )
  );

-- ====================
-- QUOTE_LINES TABLE
-- ====================
DROP POLICY IF EXISTS "Users can manage quote lines" ON quote_lines;
CREATE POLICY "Users can manage quote lines"
  ON quote_lines
  FOR ALL
  TO authenticated
  USING (
    quote_id IN (
      SELECT id FROM quotes WHERE company_id = public.get_user_company_id()
    )
  )
  WITH CHECK (
    quote_id IN (
      SELECT id FROM quotes WHERE company_id = public.get_user_company_id()
    )
  );

-- ====================
-- INVOICES TABLE
-- ====================
DROP POLICY IF EXISTS "Users can manage invoices in their company" ON invoices;
CREATE POLICY "Users can manage invoices in their company"
  ON invoices
  FOR ALL
  TO authenticated
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

-- ====================
-- INVOICE_LINES TABLE
-- ====================
DROP POLICY IF EXISTS "Users can manage invoice lines" ON invoice_lines;
CREATE POLICY "Users can manage invoice lines"
  ON invoice_lines
  FOR ALL
  TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE company_id = public.get_user_company_id()
    )
  )
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices WHERE company_id = public.get_user_company_id()
    )
  );

-- ====================
-- PAYMENTS TABLE
-- ====================
DROP POLICY IF EXISTS "Users can manage payments" ON payments;
DROP POLICY IF EXISTS "Users can view own company payments" ON payments;
DROP POLICY IF EXISTS "Users can create own company payments" ON payments;
DROP POLICY IF EXISTS "Users can update own company payments" ON payments;
DROP POLICY IF EXISTS "Users can delete own company payments" ON payments;

CREATE POLICY "Users can view own company payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE company_id = public.get_user_company_id()
    )
  );

CREATE POLICY "Users can create own company payments"
  ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices WHERE company_id = public.get_user_company_id()
    )
  );

CREATE POLICY "Users can update own company payments"
  ON payments
  FOR UPDATE
  TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE company_id = public.get_user_company_id()
    )
  )
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices WHERE company_id = public.get_user_company_id()
    )
  );

CREATE POLICY "Users can delete own company payments"
  ON payments
  FOR DELETE
  TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE company_id = public.get_user_company_id()
    )
  );

-- ====================
-- SUPPLIERS TABLE
-- ====================
DROP POLICY IF EXISTS "Users can manage suppliers in their company" ON suppliers;
CREATE POLICY "Users can manage suppliers in their company"
  ON suppliers
  FOR ALL
  TO authenticated
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

-- ====================
-- MATERIALS TABLE
-- ====================
DROP POLICY IF EXISTS "Users can manage materials in their company" ON materials;
CREATE POLICY "Users can manage materials in their company"
  ON materials
  FOR ALL
  TO authenticated
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

-- ====================
-- EVENTS TABLE
-- ====================
DROP POLICY IF EXISTS "Users can manage events in their company" ON events;
CREATE POLICY "Users can manage events in their company"
  ON events
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE user_id = (select auth.uid()) AND company_id = events.company_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE user_id = (select auth.uid()) AND company_id = events.company_id
    )
  );

-- ====================
-- DOCUMENTS TABLE
-- ====================
DROP POLICY IF EXISTS "Users can manage documents in their company" ON documents;
CREATE POLICY "Users can manage documents in their company"
  ON documents
  FOR ALL
  TO authenticated
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

-- ====================
-- ACTIVITIES TABLE
-- ====================
DROP POLICY IF EXISTS "Users can manage activities in their company" ON activities;
CREATE POLICY "Users can manage activities in their company"
  ON activities
  FOR ALL
  TO authenticated
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

-- ====================
-- NOTIFICATIONS TABLE
-- ====================
DROP POLICY IF EXISTS "Users can manage their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

CREATE POLICY "Users can read own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own notifications"
  ON notifications
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ====================
-- CATEGORIES TABLE
-- ====================
DROP POLICY IF EXISTS "Users can view categories from their company" ON categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
DROP POLICY IF EXISTS "Admins can update categories" ON categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON categories;

CREATE POLICY "Users can view categories from their company"
  ON categories
  FOR SELECT
  TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Admins can insert categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id = public.get_user_company_id()
    AND EXISTS (
      SELECT 1 FROM profiles WHERE user_id = (select auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update categories"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (
    company_id = public.get_user_company_id()
    AND EXISTS (
      SELECT 1 FROM profiles WHERE user_id = (select auth.uid()) AND role = 'admin'
    )
  )
  WITH CHECK (
    company_id = public.get_user_company_id()
    AND EXISTS (
      SELECT 1 FROM profiles WHERE user_id = (select auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete categories"
  ON categories
  FOR DELETE
  TO authenticated
  USING (
    company_id = public.get_user_company_id()
    AND EXISTS (
      SELECT 1 FROM profiles WHERE user_id = (select auth.uid()) AND role = 'admin'
    )
  );

-- ====================
-- PROJECT_PHASES TABLE
-- ====================
DROP POLICY IF EXISTS "Users can view phases from their company projects" ON project_phases;
DROP POLICY IF EXISTS "Users can insert phases to their company projects" ON project_phases;
DROP POLICY IF EXISTS "Users can update phases in their company projects" ON project_phases;
DROP POLICY IF EXISTS "Users can delete phases from their company projects" ON project_phases;

CREATE POLICY "Users can view phases from their company projects"
  ON project_phases
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE company_id = public.get_user_company_id()
    )
  );

CREATE POLICY "Users can insert phases to their company projects"
  ON project_phases
  FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE company_id = public.get_user_company_id()
    )
  );

CREATE POLICY "Users can update phases in their company projects"
  ON project_phases
  FOR UPDATE
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE company_id = public.get_user_company_id()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE company_id = public.get_user_company_id()
    )
  );

CREATE POLICY "Users can delete phases from their company projects"
  ON project_phases
  FOR DELETE
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE company_id = public.get_user_company_id()
    )
  );

-- ====================
-- MOODBOARDS TABLE
-- ====================
DROP POLICY IF EXISTS "Users can view moodboards from their company projects" ON moodboards;
DROP POLICY IF EXISTS "Users can insert moodboards to their company projects" ON moodboards;
DROP POLICY IF EXISTS "Users can update moodboards in their company projects" ON moodboards;
DROP POLICY IF EXISTS "Users can delete moodboards from their company projects" ON moodboards;
DROP POLICY IF EXISTS "Users can view company moodboards" ON moodboards;
DROP POLICY IF EXISTS "Users can create moodboards" ON moodboards;
DROP POLICY IF EXISTS "Users can update company moodboards" ON moodboards;
DROP POLICY IF EXISTS "Users can delete company moodboards" ON moodboards;

CREATE POLICY "Users can view company moodboards"
  ON moodboards
  FOR SELECT
  TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can create moodboards"
  ON moodboards
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Users can update company moodboards"
  ON moodboards
  FOR UPDATE
  TO authenticated
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Users can delete company moodboards"
  ON moodboards
  FOR DELETE
  TO authenticated
  USING (company_id = public.get_user_company_id());

-- ====================
-- MOODBOARD_IMAGES TABLE
-- ====================
DROP POLICY IF EXISTS "Users can view moodboard images from their company projects" ON moodboard_images;
DROP POLICY IF EXISTS "Users can insert moodboard images to their company projects" ON moodboard_images;
DROP POLICY IF EXISTS "Users can update moodboard images in their company projects" ON moodboard_images;
DROP POLICY IF EXISTS "Users can delete moodboard images from their company projects" ON moodboard_images;

CREATE POLICY "Users can view moodboard images from their company projects"
  ON moodboard_images
  FOR SELECT
  TO authenticated
  USING (
    moodboard_id IN (
      SELECT id FROM moodboards WHERE company_id = public.get_user_company_id()
    )
  );

CREATE POLICY "Users can insert moodboard images to their company projects"
  ON moodboard_images
  FOR INSERT
  TO authenticated
  WITH CHECK (
    moodboard_id IN (
      SELECT id FROM moodboards WHERE company_id = public.get_user_company_id()
    )
  );

CREATE POLICY "Users can update moodboard images in their company projects"
  ON moodboard_images
  FOR UPDATE
  TO authenticated
  USING (
    moodboard_id IN (
      SELECT id FROM moodboards WHERE company_id = public.get_user_company_id()
    )
  )
  WITH CHECK (
    moodboard_id IN (
      SELECT id FROM moodboards WHERE company_id = public.get_user_company_id()
    )
  );

CREATE POLICY "Users can delete moodboard images from their company projects"
  ON moodboard_images
  FOR DELETE
  TO authenticated
  USING (
    moodboard_id IN (
      SELECT id FROM moodboards WHERE company_id = public.get_user_company_id()
    )
  );

-- ====================
-- PROJECT_HISTORY TABLE
-- ====================
DROP POLICY IF EXISTS "Users can view project history from their company" ON project_history;
DROP POLICY IF EXISTS "Users can insert project history to their company projects" ON project_history;

CREATE POLICY "Users can view project history from their company"
  ON project_history
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE company_id = public.get_user_company_id()
    )
  );

CREATE POLICY "Users can insert project history to their company projects"
  ON project_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE company_id = public.get_user_company_id()
    )
  );

-- ====================
-- DOCUMENT_TEMPLATES TABLE
-- ====================
DROP POLICY IF EXISTS "Users can view company templates" ON document_templates;
DROP POLICY IF EXISTS "Users can create templates" ON document_templates;
DROP POLICY IF EXISTS "Users can update company templates" ON document_templates;
DROP POLICY IF EXISTS "Users can delete company templates" ON document_templates;

CREATE POLICY "Users can view company templates"
  ON document_templates
  FOR SELECT
  TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can create templates"
  ON document_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Users can update company templates"
  ON document_templates
  FOR UPDATE
  TO authenticated
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Users can delete company templates"
  ON document_templates
  FOR DELETE
  TO authenticated
  USING (company_id = public.get_user_company_id());

-- ====================
-- PROFESSIONAL_DOCUMENTS TABLE
-- ====================
DROP POLICY IF EXISTS "Users can view documents in their company" ON professional_documents;
DROP POLICY IF EXISTS "Users can create documents in their company" ON professional_documents;
DROP POLICY IF EXISTS "Users can update documents in their company" ON professional_documents;
DROP POLICY IF EXISTS "Users can delete documents in their company" ON professional_documents;

CREATE POLICY "Users can view documents in their company"
  ON professional_documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE user_id = (select auth.uid()) AND company_id = professional_documents.company_id
    )
  );

CREATE POLICY "Users can create documents in their company"
  ON professional_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE user_id = (select auth.uid()) AND company_id = professional_documents.company_id
    )
  );

CREATE POLICY "Users can update documents in their company"
  ON professional_documents
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE user_id = (select auth.uid()) AND company_id = professional_documents.company_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE user_id = (select auth.uid()) AND company_id = professional_documents.company_id
    )
  );

CREATE POLICY "Users can delete documents in their company"
  ON professional_documents
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE user_id = (select auth.uid()) AND company_id = professional_documents.company_id
    )
  );