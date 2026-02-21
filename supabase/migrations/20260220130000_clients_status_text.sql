-- Permettre tous les statuts client du formulaire (prospect, first_contact, quote_sent, project_signed, active, completed, inactive)
-- Si la colonne status est un enum, la convertir en TEXT pour accepter ces valeurs.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'status') THEN
      -- Convertir enum -> TEXT si nécessaire (évite "invalid input value for enum client_status")
      BEGIN
        ALTER TABLE clients
          ALTER COLUMN status TYPE TEXT USING status::text;
      EXCEPTION WHEN OTHERS THEN
        -- Si déjà TEXT ou autre erreur, ne rien faire
        NULL;
      END;
    END IF;
  END IF;
END $$;
