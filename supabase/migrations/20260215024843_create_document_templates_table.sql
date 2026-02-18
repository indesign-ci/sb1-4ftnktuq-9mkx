/*
  # Create Document Templates Table

  1. New Tables
    - `document_templates`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `name` (text) - Template name
      - `type` (text) - Document type (contrat, cahier_charges, note_honoraires, etc.)
      - `content` (text) - HTML/Markdown template content
      - `variables` (jsonb) - Available variables for the template
      - `category` (text) - Category (legal, technical, commercial, etc.)
      - `is_default` (boolean) - Whether this is a default template
      - `created_by` (uuid, foreign key to profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `document_templates` table
    - Add policies for company-based access
*/

CREATE TABLE IF NOT EXISTS document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  content text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb,
  category text DEFAULT 'general',
  is_default boolean DEFAULT false,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company templates"
  ON document_templates
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create templates"
  ON document_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update company templates"
  ON document_templates
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete company templates"
  ON document_templates
  FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Insert default templates for all companies
DO $$
DECLARE
  company_record RECORD;
  first_profile_id uuid;
BEGIN
  FOR company_record IN SELECT id FROM companies LOOP
    -- Get the first profile for this company
    SELECT id INTO first_profile_id FROM profiles WHERE company_id = company_record.id LIMIT 1;
    
    IF first_profile_id IS NOT NULL THEN
      -- Contrat de prestations d'architecture d'intérieur
      INSERT INTO document_templates (company_id, name, type, content, category, is_default, created_by, variables)
      VALUES (
        company_record.id,
        'Contrat de prestations',
        'contrat',
        '<div class="document">
  <div class="header">
    <h1>CONTRAT DE PRESTATIONS D''ARCHITECTURE D''INTÉRIEUR</h1>
  </div>
  
  <div class="parties">
    <h2>Entre les soussignés :</h2>
    <p><strong>{{company_name}}</strong></p>
    <p>{{company_address}}</p>
    <p>SIRET : {{company_siret}}</p>
    <p>Représentée par {{architect_name}}</p>
    
    <p style="margin-top: 20px;">Ci-après dénommée « L''Architecte d''intérieur »</p>
    
    <p style="margin-top: 30px;"><strong>Et :</strong></p>
    <p><strong>{{client_name}}</strong></p>
    <p>{{client_address}}</p>
    
    <p style="margin-top: 20px;">Ci-après dénommé(e) « Le Client »</p>
  </div>
  
  <div class="article">
    <h2>ARTICLE 1 - OBJET DU CONTRAT</h2>
    <p>Le présent contrat a pour objet la réalisation d''un projet d''architecture d''intérieur pour :</p>
    <p><strong>Projet :</strong> {{project_name}}</p>
    <p><strong>Adresse :</strong> {{project_address}}</p>
    <p><strong>Surface :</strong> {{project_surface}} m²</p>
  </div>
  
  <div class="article">
    <h2>ARTICLE 2 - MISSIONS</h2>
    <p>Les prestations comprennent :</p>
    <ul>
      <li>Visite technique et prise de mesures</li>
      <li>Élaboration du projet d''aménagement</li>
      <li>Présentation des planches d''ambiance et moodboards</li>
      <li>Plans 2D et modélisations 3D</li>
      <li>Dossier de consultation des entreprises</li>
      <li>Suivi de chantier</li>
    </ul>
  </div>
  
  <div class="article">
    <h2>ARTICLE 3 - HONORAIRES</h2>
    <p><strong>Montant total :</strong> {{total_amount}} FCFA</p>
    <p><strong>Acompte à la signature :</strong> {{deposit_amount}} FCFA ({{deposit_percent}}%)</p>
    <p><strong>Modalités de paiement :</strong> {{payment_terms}}</p>
  </div>
  
  <div class="article">
    <h2>ARTICLE 4 - DÉLAIS</h2>
    <p><strong>Date de début :</strong> {{start_date}}</p>
    <p><strong>Date de fin prévisionnelle :</strong> {{end_date}}</p>
  </div>
  
  <div class="signatures">
    <div class="signature-block">
      <p>Fait à {{city}}, le {{date}}</p>
      <p style="margin-top: 40px;">Le Client</p>
      <p>(Précédé de la mention « Lu et approuvé »)</p>
    </div>
    <div class="signature-block">
      <p style="margin-top: 60px;">L''Architecte d''intérieur</p>
    </div>
  </div>
</div>',
        'legal',
        true,
        first_profile_id,
        '[
          {"name": "company_name", "label": "Nom de l''entreprise", "type": "text"},
          {"name": "company_address", "label": "Adresse de l''entreprise", "type": "text"},
          {"name": "company_siret", "label": "SIRET", "type": "text"},
          {"name": "architect_name", "label": "Nom de l''architecte", "type": "text"},
          {"name": "client_name", "label": "Nom du client", "type": "text"},
          {"name": "client_address", "label": "Adresse du client", "type": "text"},
          {"name": "project_name", "label": "Nom du projet", "type": "text"},
          {"name": "project_address", "label": "Adresse du projet", "type": "text"},
          {"name": "project_surface", "label": "Surface du projet", "type": "number"},
          {"name": "total_amount", "label": "Montant total", "type": "number"},
          {"name": "deposit_amount", "label": "Montant de l''acompte", "type": "number"},
          {"name": "deposit_percent", "label": "Pourcentage d''acompte", "type": "number"},
          {"name": "payment_terms", "label": "Modalités de paiement", "type": "text"},
          {"name": "start_date", "label": "Date de début", "type": "date"},
          {"name": "end_date", "label": "Date de fin", "type": "date"},
          {"name": "city", "label": "Ville", "type": "text"},
          {"name": "date", "label": "Date", "type": "date"}
        ]'::jsonb
      );

      -- Cahier des charges
      INSERT INTO document_templates (company_id, name, type, content, category, is_default, created_by, variables)
      VALUES (
        company_record.id,
        'Cahier des charges technique',
        'cahier_charges',
        '<div class="document">
  <div class="header">
    <h1>CAHIER DES CHARGES TECHNIQUE</h1>
    <h2>{{project_name}}</h2>
  </div>
  
  <div class="section">
    <h2>1. PRÉSENTATION DU PROJET</h2>
    <p><strong>Client :</strong> {{client_name}}</p>
    <p><strong>Adresse :</strong> {{project_address}}</p>
    <p><strong>Surface :</strong> {{project_surface}} m²</p>
    <p><strong>Budget prévisionnel :</strong> {{budget}} FCFA</p>
  </div>
  
  <div class="section">
    <h2>2. CONCEPT ET AMBIANCE</h2>
    <p><strong>Style :</strong> {{style}}</p>
    <p><strong>Couleurs dominantes :</strong> {{colors}}</p>
    <p><strong>Ambiance recherchée :</strong> {{ambiance}}</p>
  </div>
  
  <div class="section">
    <h2>3. TRAVAUX À RÉALISER</h2>
    <h3>3.1 Démolition / Gros œuvre</h3>
    <p>{{demolition_works}}</p>
    
    <h3>3.2 Électricité</h3>
    <p>{{electrical_works}}</p>
    
    <h3>3.3 Plomberie</h3>
    <p>{{plumbing_works}}</p>
    
    <h3>3.4 Menuiserie</h3>
    <p>{{carpentry_works}}</p>
    
    <h3>3.5 Peinture et revêtements</h3>
    <p>{{painting_works}}</p>
  </div>
  
  <div class="section">
    <h2>4. FOURNITURES</h2>
    <p>{{materials_list}}</p>
  </div>
  
  <div class="section">
    <h2>5. PLANNING PRÉVISIONNEL</h2>
    <p><strong>Date de début :</strong> {{start_date}}</p>
    <p><strong>Date de fin :</strong> {{end_date}}</p>
    <p><strong>Durée estimée :</strong> {{duration}} semaines</p>
  </div>
</div>',
        'technical',
        true,
        first_profile_id,
        '[
          {"name": "project_name", "label": "Nom du projet", "type": "text"},
          {"name": "client_name", "label": "Nom du client", "type": "text"},
          {"name": "project_address", "label": "Adresse du projet", "type": "text"},
          {"name": "project_surface", "label": "Surface", "type": "number"},
          {"name": "budget", "label": "Budget", "type": "number"},
          {"name": "style", "label": "Style", "type": "text"},
          {"name": "colors", "label": "Couleurs", "type": "text"},
          {"name": "ambiance", "label": "Ambiance", "type": "textarea"},
          {"name": "demolition_works", "label": "Travaux de démolition", "type": "textarea"},
          {"name": "electrical_works", "label": "Travaux électriques", "type": "textarea"},
          {"name": "plumbing_works", "label": "Travaux de plomberie", "type": "textarea"},
          {"name": "carpentry_works", "label": "Menuiserie", "type": "textarea"},
          {"name": "painting_works", "label": "Peinture", "type": "textarea"},
          {"name": "materials_list", "label": "Liste des matériaux", "type": "textarea"},
          {"name": "start_date", "label": "Date de début", "type": "date"},
          {"name": "end_date", "label": "Date de fin", "type": "date"},
          {"name": "duration", "label": "Durée (semaines)", "type": "number"}
        ]'::jsonb
      );

      -- Compte-rendu de visite technique
      INSERT INTO document_templates (company_id, name, type, content, category, is_default, created_by, variables)
      VALUES (
        company_record.id,
        'Compte-rendu de visite technique',
        'compte_rendu_visite',
        '<div class="document">
  <div class="header">
    <h1>COMPTE-RENDU DE VISITE TECHNIQUE</h1>
  </div>
  
  <div class="section">
    <h2>INFORMATIONS GÉNÉRALES</h2>
    <p><strong>Date de visite :</strong> {{visit_date}}</p>
    <p><strong>Lieu :</strong> {{project_address}}</p>
    <p><strong>Client :</strong> {{client_name}}</p>
    <p><strong>Présents :</strong> {{attendees}}</p>
  </div>
  
  <div class="section">
    <h2>OBSERVATIONS</h2>
    <h3>État général des lieux</h3>
    <p>{{general_state}}</p>
    
    <h3>Contraintes techniques identifiées</h3>
    <p>{{technical_constraints}}</p>
    
    <h3>Points d''attention particuliers</h3>
    <p>{{attention_points}}</p>
  </div>
  
  <div class="section">
    <h2>MESURES RELEVÉES</h2>
    <p>{{measurements}}</p>
  </div>
  
  <div class="section">
    <h2>SOUHAITS DU CLIENT</h2>
    <p>{{client_wishes}}</p>
  </div>
  
  <div class="section">
    <h2>CONCLUSIONS ET RECOMMANDATIONS</h2>
    <p>{{conclusions}}</p>
  </div>
  
  <div class="section">
    <h2>PROCHAINES ÉTAPES</h2>
    <p>{{next_steps}}</p>
  </div>
  
  <div class="footer">
    <p>Établi par {{architect_name}}</p>
    <p>Le {{date}}</p>
  </div>
</div>',
        'technical',
        true,
        first_profile_id,
        '[
          {"name": "visit_date", "label": "Date de visite", "type": "date"},
          {"name": "project_address", "label": "Adresse", "type": "text"},
          {"name": "client_name", "label": "Client", "type": "text"},
          {"name": "attendees", "label": "Présents", "type": "text"},
          {"name": "general_state", "label": "État général", "type": "textarea"},
          {"name": "technical_constraints", "label": "Contraintes techniques", "type": "textarea"},
          {"name": "attention_points", "label": "Points d''attention", "type": "textarea"},
          {"name": "measurements", "label": "Mesures", "type": "textarea"},
          {"name": "client_wishes", "label": "Souhaits du client", "type": "textarea"},
          {"name": "conclusions", "label": "Conclusions", "type": "textarea"},
          {"name": "next_steps", "label": "Prochaines étapes", "type": "textarea"},
          {"name": "architect_name", "label": "Architecte", "type": "text"},
          {"name": "date", "label": "Date", "type": "date"}
        ]'::jsonb
      );
    END IF;
  END LOOP;
END $$;
