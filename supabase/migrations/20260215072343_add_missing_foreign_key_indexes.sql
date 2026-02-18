/*
  # Add Missing Foreign Key Indexes for Performance Optimization

  1. Performance Improvements
    - Add indexes to all foreign key columns that currently lack them
    - This significantly improves JOIN performance and query execution
    - Essential for RLS policy performance at scale

  2. Tables Affected
    - activities, budget_items, categories, document_templates
    - documents, events, invoice_lines, invoices
    - materials, moodboard_images, moodboards, payments
    - professional_documents, project_history, project_phases
    - projects, quote_lines, quote_sections, quotes
    - suppliers, tasks

  3. Security & Performance
    - All indexes use IF NOT EXISTS to prevent errors
    - Indexes improve RLS policy evaluation speed
    - Essential for production-scale performance
*/

-- Activities table
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);

-- Budget items table
CREATE INDEX IF NOT EXISTS idx_budget_items_project_id ON budget_items(project_id);

-- Categories table
CREATE INDEX IF NOT EXISTS idx_categories_company_id ON categories(company_id);

-- Document templates table
CREATE INDEX IF NOT EXISTS idx_document_templates_company_id ON document_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_document_templates_created_by ON document_templates(created_by);

-- Documents table
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_company_id ON documents(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);

-- Events table
CREATE INDEX IF NOT EXISTS idx_events_client_id ON events(client_id);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_project_id ON events(project_id);

-- Invoice lines table
CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice_id ON invoice_lines(invoice_id);

-- Invoices table
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON invoices(created_by);
CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_quote_id ON invoices(quote_id);

-- Materials table
CREATE INDEX IF NOT EXISTS idx_materials_company_id ON materials(company_id);
CREATE INDEX IF NOT EXISTS idx_materials_supplier_id ON materials(supplier_id);

-- Moodboard images table
CREATE INDEX IF NOT EXISTS idx_moodboard_images_moodboard_id ON moodboard_images(moodboard_id);

-- Moodboards table
CREATE INDEX IF NOT EXISTS idx_moodboards_company_id ON moodboards(company_id);
CREATE INDEX IF NOT EXISTS idx_moodboards_project_id ON moodboards(project_id);

-- Payments table
CREATE INDEX IF NOT EXISTS idx_payments_created_by ON payments(created_by);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);

-- Professional documents table
CREATE INDEX IF NOT EXISTS idx_professional_documents_created_by ON professional_documents(created_by);

-- Project history table
CREATE INDEX IF NOT EXISTS idx_project_history_project_id ON project_history(project_id);
CREATE INDEX IF NOT EXISTS idx_project_history_user_id ON project_history(user_id);

-- Project phases table
CREATE INDEX IF NOT EXISTS idx_project_phases_project_id ON project_phases(project_id);

-- Projects table
CREATE INDEX IF NOT EXISTS idx_projects_architect_id ON projects(architect_id);

-- Quote lines table
CREATE INDEX IF NOT EXISTS idx_quote_lines_quote_id ON quote_lines(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_lines_section_id ON quote_lines(section_id);

-- Quote sections table
CREATE INDEX IF NOT EXISTS idx_quote_sections_quote_id ON quote_sections(quote_id);

-- Quotes table
CREATE INDEX IF NOT EXISTS idx_quotes_created_by ON quotes(created_by);
CREATE INDEX IF NOT EXISTS idx_quotes_project_id ON quotes(project_id);

-- Suppliers table
CREATE INDEX IF NOT EXISTS idx_suppliers_company_id ON suppliers(company_id);

-- Tasks table
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);