/*
  # Données de démonstration pour logiciel d'architecture d'intérieur

  Ce fichier insère des données réalistes pour tester et démontrer le logiciel:
  - 3 utilisateurs (Sophie Martin admin, Julie Dubois architecte, Marie Lambert assistante)
  - 15 clients variés (particuliers et professionnels)
  - 10 fournisseurs réalistes
  - 30 matériaux de marques connues
  - 8 projets à différentes phases
  - 12 devis et 10 factures
  - 5 paiements
  - 20 événements calendrier
  - 5 moodboards

  Note: Les auth.users doivent être créés séparément via Supabase Auth.
  Ce fichier utilise l'entreprise existante et crée uniquement les profils.
*/

-- Variables pour stocker les IDs (simulé avec des CTEs)
DO $$
DECLARE
  v_company_id UUID;
  v_sophie_id UUID;
  v_julie_id UUID;
  v_marie_id UUID;
  v_client_ids UUID[];
  v_supplier_ids UUID[];
  v_project_ids UUID[];
  v_quote_ids UUID[];
  v_invoice_ids UUID[];
BEGIN
  -- Récupérer l'ID de l'entreprise existante
  SELECT id INTO v_company_id FROM companies LIMIT 1;

  -- Générer des UUIDs pour les profils
  v_sophie_id := gen_random_uuid();
  v_julie_id := gen_random_uuid();
  v_marie_id := gen_random_uuid();

  -- ============================================================================
  -- PROFILS / UTILISATEURS
  -- ============================================================================
  -- Note: Les auth.users correspondants doivent être créés via Supabase Auth

  INSERT INTO profiles (id, user_id, company_id, first_name, last_name, email, phone, role, is_active, created_at)
  VALUES
    (v_sophie_id, v_sophie_id, v_company_id, 'Sophie', 'Martin', 'sophie.martin@designstudio.fr', '+33 6 12 34 56 78', 'admin', true, NOW() - INTERVAL '180 days'),
    (v_julie_id, v_julie_id, v_company_id, 'Julie', 'Dubois', 'julie.dubois@designstudio.fr', '+33 6 23 45 67 89', 'architect', true, NOW() - INTERVAL '120 days'),
    (v_marie_id, v_marie_id, v_company_id, 'Marie', 'Lambert', 'marie.lambert@designstudio.fr', '+33 6 34 56 78 90', 'assistant', true, NOW() - INTERVAL '90 days');

  -- ============================================================================
  -- CLIENTS
  -- ============================================================================

  WITH inserted_clients AS (
    INSERT INTO clients (company_id, title, first_name, last_name, email, phone, address, city, postal_code,
                        client_type, property_type, surface_area, estimated_budget, style_preference,
                        source, status, tags, notes, created_at)
    VALUES
      -- Particuliers
      (v_company_id, 'M. et Mme', 'Pierre', 'Lefebvre', 'p.lefebvre@email.com', '+33 6 11 22 33 44',
       '45 Boulevard Saint-Germain', 'Paris', '75006', 'individual', 'Appartement', 180, 350000,
       'Classique', 'Bouche à oreille', 'active', ARRAY['VIP', 'Saint-Germain'],
       'Clients exigeants, très attentifs aux détails', NOW() - INTERVAL '150 days'),

      (v_company_id, 'M.', 'Thomas', 'Rousseau', 'thomas.rousseau@email.com', '+33 6 22 33 44 55',
       '12 Rue des Rosiers', 'Paris', '75004', 'individual', 'Loft', 220, 450000,
       'Contemporain', 'Instagram', 'active', ARRAY['Marais', 'Tendance'],
       'Jeune entrepreneur dans la tech', NOW() - INTERVAL '120 days'),

      (v_company_id, 'Mme', 'Isabelle', 'Moreau', 'i.moreau@email.com', '+33 6 33 44 55 66',
       'Villa Les Mimosas, Chemin des Collines', 'Saint-Jean-Cap-Ferrat', '06230', 'individual', 'Villa', 350, 800000,
       'Luxe', 'Magazine AD', 'active', ARRAY['Côte d''Azur', 'Luxe'],
       'Projet villa secondaire, budget confortable', NOW() - INTERVAL '90 days'),

      (v_company_id, 'M.', 'Alexandre', 'Bernard', 'a.bernard@email.com', '+33 6 44 55 66 77',
       '8 Avenue du Trocadéro', 'Paris', '75016', 'individual', 'Penthouse', 280, 1200000,
       'Luxe', 'Recommandation client', 'project_signed', ARRAY['Trocadéro', 'VIP', 'Luxe'],
       'PDG, recherche le meilleur. Budget très élevé', NOW() - INTERVAL '60 days'),

      (v_company_id, 'M. et Mme', 'François', 'Petit', 'f.petit@email.com', '+33 6 55 66 77 88',
       '23 Rue des Martyrs', 'Paris', '75018', 'individual', 'Duplex', 160, 280000,
       'Japandi', 'Google', 'active', ARRAY['Montmartre', 'Zen'],
       'Couple d''architectes, apprécient le design épuré', NOW() - INTERVAL '45 days'),

      (v_company_id, 'Mme', 'Caroline', 'Durand', 'c.durand@email.com', '+33 6 66 77 88 99',
       'Mas des Oliviers', 'Gordes', '84220', 'individual', 'Maison', 240, 420000,
       'Art Déco', 'Houzz', 'completed', ARRAY['Provence', 'Rénovation'],
       'Rénovation maison en pierre, projet terminé avec succès', NOW() - INTERVAL '180 days'),

      (v_company_id, 'M.', 'Julien', 'Lambert', 'j.lambert@email.com', '+33 6 77 88 99 00',
       '67 Rue de la Roquette', 'Paris', '75011', 'individual', 'Appartement', 95, 180000,
       'Industriel', 'Instagram', 'quote_sent', ARRAY['Bastille', 'Premier achat'],
       'Premier appartement, budget serré', NOW() - INTERVAL '30 days'),

      (v_company_id, 'M. et Mme', 'David', 'Fontaine', 'david.fontaine@email.com', '+33 6 88 99 00 11',
       '15 Avenue Montaigne', 'Paris', '75008', 'individual', 'Appartement', 200, 520000,
       'Luxe', 'Recommandation architecte', 'first_contact', ARRAY['Champs-Élysées', 'Luxe'],
       'Premier contact établi, rendez-vous prévu', NOW() - INTERVAL '15 days'),

      -- Professionnels
      (v_company_id, 'M.', 'Marc', 'Dubois', 'contact@hoteloperadlx.com', '+33 1 42 65 77 88',
       '12 Rue Auber', 'Paris', '75009', 'professional', 'Hôtel', 850, 1500000,
       'Luxe', 'Appel d''offres', 'active', ARRAY['Opéra', 'Boutique-hôtel', 'Professionnel'],
       'Boutique-hôtel 25 chambres, rénovation complète', NOW() - INTERVAL '100 days'),

      (v_company_id, 'Mme', 'Sophie', 'Mercier', 'sophie@lebistrotbastille.fr', '+33 1 43 55 66 77',
       '45 Rue de la Roquette', 'Paris', '75011', 'professional', 'Restaurant', 120, 200000,
       'Contemporain', 'LinkedIn', 'active', ARRAY['Bastille', 'Restaurant', 'Professionnel'],
       'Nouveau restaurant bistronomique, ouverture prévue dans 4 mois', NOW() - INTERVAL '75 days'),

      (v_company_id, 'M.', 'Vincent', 'Leroy', 'v.leroy@maisonfashion.com', '+33 1 42 33 44 55',
       '28 Rue du Faubourg Saint-Honoré', 'Paris', '75008', 'professional', 'Boutique', 85, 150000,
       'Luxe', 'Événement professionnel', 'quote_sent', ARRAY['Faubourg', 'Mode', 'Professionnel'],
       'Boutique de prêt-à-porter haut de gamme', NOW() - INTERVAL '40 days'),

      (v_company_id, 'M.', 'Olivier', 'Girard', 'o.girard@wellness-spa.fr', '+33 1 45 22 33 44',
       '156 Boulevard Haussmann', 'Paris', '75008', 'professional', 'Spa', 200, 350000,
       'Minimaliste', 'Salon professionnel', 'first_contact', ARRAY['Spa', 'Bien-être', 'Professionnel'],
       'Spa urbain haut de gamme', NOW() - INTERVAL '20 days'),

      (v_company_id, 'Mme', 'Émilie', 'Blanc', 'emilie@galerieart.paris', '+33 1 40 11 22 33',
       '18 Rue de Seine', 'Paris', '75006', 'professional', 'Galerie', 140, 180000,
       'Art Déco', 'Réseau professionnel', 'prospect', ARRAY['Saint-Germain', 'Art', 'Galerie'],
       'Galerie d''art contemporain', NOW() - INTERVAL '10 days'),

      (v_company_id, 'M.', 'Nicolas', 'Roux', 'n.roux@startupstation.fr', '+33 1 44 55 66 77',
       '10 Rue de la Banque', 'Paris', '75002', 'professional', 'Bureau', 300, 280000,
       'Contemporain', 'LinkedIn', 'prospect', ARRAY['Bureau', 'Startup', 'Tech'],
       'Bureaux startup fintech, 40 personnes', NOW() - INTERVAL '5 days'),

      (v_company_id, 'Mme', 'Audrey', 'Garnier', 'a.garnier@luxehome.com', '+33 6 99 00 11 22',
       '88 Rue du Faubourg Saint-Honoré', 'Paris', '75008', 'professional', 'Showroom', 180, 220000,
       'Luxe', 'Instagram', 'inactive', ARRAY['Showroom', 'Décoration'],
       'Projet en suspens pour le moment', NOW() - INTERVAL '200 days')
    RETURNING id
  )
  SELECT ARRAY_AGG(id) INTO v_client_ids FROM inserted_clients;

  -- ============================================================================
  -- FOURNISSEURS
  -- ============================================================================

  WITH inserted_suppliers AS (
    INSERT INTO suppliers (company_id, name, contact_person, email, phone, website, address, city, postal_code,
                          categories, payment_terms, discount_percentage, quality_rating, notes, created_at)
    VALUES
      (v_company_id, 'Pierre Frey', 'Jean Dubois', 'commercial@pierrefrey.com', '+33 1 44 77 36 00',
       'https://www.pierrefrey.com', '47 Rue des Petits Champs', 'Paris', '75001',
       ARRAY['Tissu', 'Papier peint'], '60 jours fin de mois', 15, 5,
       'Fabricant français prestigieux, tissus et papiers peints haut de gamme', NOW() - INTERVAL '180 days'),

      (v_company_id, 'Casamance', 'Marie Laurent', 'contact@casamance.com', '+33 1 40 13 06 13',
       'https://www.casamance.com', '32 Rue de l''Abbaye', 'Paris', '75006',
       ARRAY['Tissu', 'Papier peint'], '60 jours', 12, 5,
       'Éditeur de tissus et papiers peints, collections design', NOW() - INTERVAL '165 days'),

      (v_company_id, 'Maison Sarah Lavoine', 'Sophie Martin', 'pro@maisonsarahlavoine.com', '+33 1 42 84 38 48',
       'https://www.maisonsarahlavoine.com', '8 Rue Saint-Roch', 'Paris', '75001',
       ARRAY['Mobilier', 'Luminaire', 'Décoration'], '30 jours', 10, 4.5,
       'Mobilier et décoration design français', NOW() - INTERVAL '150 days'),

      (v_company_id, 'Flos France', 'Thomas Duval', 'info@flos.com', '+33 1 47 00 23 23',
       'https://www.flos.com', '15 Rue du Mail', 'Paris', '75002',
       ARRAY['Luminaire'], '45 jours', 8, 5,
       'Luminaires design italiens, références mondiales', NOW() - INTERVAL '140 days'),

      (v_company_id, '&Tradition', 'Emma Nielsen', 'france@andtradition.com', '+45 39 18 86 00',
       'https://www.andtradition.com', 'Gammel Strand 48', 'Copenhagen', '1202',
       ARRAY['Mobilier', 'Luminaire'], '45 jours', 10, 4.5,
       'Mobilier design scandinave et contemporain', NOW() - INTERVAL '130 days'),

      (v_company_id, 'Tom Dixon', 'Paul Anderson', 'trade@tomdixon.net', '+44 20 7400 0500',
       'https://www.tomdixon.net', 'Portobello Dock', 'London', 'W10 5JY',
       ARRAY['Luminaire', 'Mobilier', 'Décoration'], '30 jours', 5, 4.5,
       'Design britannique audacieux et innovant', NOW() - INTERVAL '120 days'),

      (v_company_id, 'Maisons du Monde', 'Claire Petit', 'pro@maisonsdumonde.com', '+33 2 51 79 54 54',
       'https://www.maisonsdumonde.com', 'ZAC de la Lorie', 'Vertou', '44120',
       ARRAY['Mobilier', 'Décoration', 'Textiles'], '30 jours', 8, 3.5,
       'Large choix mobilier et décoration, bon rapport qualité-prix', NOW() - INTERVAL '100 days'),

      (v_company_id, 'Ressource Peintures', 'Antoine Mercier', 'contact@ressource-peintures.com', '+33 1 42 74 24 00',
       'https://www.ressource-peintures.com', '2-4 Avenue de l''Opéra', 'Paris', '75001',
       ARRAY['Peinture'], '30 jours', 5, 5,
       'Peintures haut de gamme, 1000+ teintes', NOW() - INTERVAL '90 days'),

      (v_company_id, 'Bisazza', 'Marco Rossi', 'france@bisazza.com', '+39 0444 707 511',
       'https://www.bisazza.com', 'Via Rossini 1', 'Alte', '36121',
       ARRAY['Sol', 'Mur'], '60 jours', 10, 5,
       'Mosaïques de verre italiennes de luxe', NOW() - INTERVAL '80 days'),

      (v_company_id, 'Farrow & Ball', 'James Wilson', 'france@farrow-ball.com', '+33 1 56 69 10 10',
       'https://www.farrow-ball.com', '33 Rue de Babylone', 'Paris', '75007',
       ARRAY['Peinture', 'Papier peint'], '30 jours', 5, 5,
       'Peintures et papiers peints britanniques, teintes emblématiques', NOW() - INTERVAL '70 days')
    RETURNING id
  )
  SELECT ARRAY_AGG(id) INTO v_supplier_ids FROM inserted_suppliers;

  -- ============================================================================
  -- MATÉRIAUX
  -- ============================================================================

  INSERT INTO materials (company_id, name, reference, category, description, price, unit, supplier_id,
                        supplier_url, style, color, dimensions, lead_time, is_favorite, tags, notes, created_at)
  VALUES
    -- Tissus
    (v_company_id, 'Velours Cachemire', 'PF-VEL-CASH-001', 'Tissu', 'Velours de coton luxueux toucher cachemire',
     185, 'ml', v_supplier_ids[1], 'https://www.pierrefrey.com/velours-cachemire', 'Luxe', 'Bleu nuit',
     '140cm largeur', '3-4 semaines', true, ARRAY['velours', 'luxe', 'canapé'],
     'Parfait pour canapés et fauteuils haut de gamme', NOW() - INTERVAL '150 days'),

    (v_company_id, 'Lin Lavé Naturel', 'CASA-LIN-NAT-012', 'Tissu', 'Lin naturel lavé pour rideaux et coussins',
     95, 'ml', v_supplier_ids[2], 'https://www.casamance.com/lin-lave', 'Scandinave', 'Lin naturel',
     '280cm largeur', '2-3 semaines', true, ARRAY['lin', 'naturel', 'rideaux'],
     'Matière authentique et intemporelle', NOW() - INTERVAL '140 days'),

    (v_company_id, 'Velours Côtelé Terracotta', 'MSL-VEL-TER-008', 'Tissu', 'Velours côtelé design contemporain',
     145, 'ml', v_supplier_ids[3], 'https://maisonsarahlavoine.com/velours-terracotta', 'Contemporain', 'Terracotta',
     '140cm largeur', '4 semaines', true, ARRAY['velours', 'terracotta', 'tendance'],
     'Couleur signature Sarah Lavoine', NOW() - INTERVAL '130 days'),

    -- Luminaires
    (v_company_id, 'Suspension IC Lights S', 'FLOS-IC-S1-BRS', 'Luminaire', 'Suspension sphérique iconique design Michael Anastassiades',
     685, 'u', v_supplier_ids[4], 'https://www.flos.com/ic-lights', 'Contemporain', 'Laiton brossé',
     'Ø30cm', '6-8 semaines', true, ARRAY['suspension', 'design', 'iconique'],
     'Best-seller, parfait au-dessus table', NOW() - INTERVAL '120 days'),

    (v_company_id, 'Lampe de table Flowerpot VP3', 'ANTR-FP-VP3-ORG', 'Luminaire', 'Lampe iconique Verner Panton',
     299, 'u', v_supplier_ids[5], 'https://www.andtradition.com/flowerpot', 'Scandinave', 'Orange',
     'Ø23cm H50cm', '4-5 semaines', true, ARRAY['lampe', 'design', 'années 70'],
     'Design vintage remis au goût du jour', NOW() - INTERVAL '110 days'),

    (v_company_id, 'Suspension Beat Light Tall', 'TD-BEAT-TALL-BLK', 'Luminaire', 'Suspension en laiton martelé',
     595, 'u', v_supplier_ids[6], 'https://www.tomdixon.net/beat-light', 'Industriel', 'Noir et laiton',
     'Ø27cm H44cm', '8-10 semaines', true, ARRAY['suspension', 'laiton', 'industriel'],
     'Fabrication artisanale indienne', NOW() - INTERVAL '100 days'),

    -- Mobilier
    (v_company_id, 'Canapé d''angle modulable Bruges', 'MDM-BRUG-ANG-GRY', 'Mobilier', 'Canapé modulable confortable',
     2499, 'u', v_supplier_ids[7], 'https://www.maisonsdumonde.com/canape-bruges', 'Contemporain', 'Gris chiné',
     'L310cm P160cm H85cm', '6-8 semaines', false, ARRAY['canapé', 'modulable', 'confort'],
     'Bon rapport qualité-prix, livraison rapide', NOW() - INTERVAL '90 days'),

    (v_company_id, 'Fauteuil Fly', 'ANTR-FLY-ARM-GRN', 'Mobilier', 'Fauteuil design scandinave',
     1895, 'u', v_supplier_ids[5], 'https://www.andtradition.com/fly-chair', 'Scandinave', 'Vert forêt',
     'L82cm P85cm H79cm', '6-7 semaines', true, ARRAY['fauteuil', 'confort', 'design'],
     'Assise profonde très confortable', NOW() - INTERVAL '85 days'),

    (v_company_id, 'Table basse Rise', 'MSL-RISE-TBL-MAR', 'Mobilier', 'Table basse laiton et marbre',
     1290, 'u', v_supplier_ids[3], 'https://maisonsarahlavoine.com/table-rise', 'Luxe', 'Marbre blanc/laiton',
     'L120cm P70cm H35cm', '5-6 semaines', true, ARRAY['table', 'marbre', 'laiton'],
     'Pièce signature de la collection', NOW() - INTERVAL '80 days'),

    -- Peintures
    (v_company_id, 'Peinture Gris Souris', 'RES-GRS-SRS-001', 'Peinture', 'Peinture mate profonde',
     89, 'u', v_supplier_ids[8], 'https://ressource-peintures.com/gris-souris', 'Contemporain', 'Gris souris',
     'Pot 2.5L (30m²)', '2 semaines', true, ARRAY['peinture', 'gris', 'mate'],
     'Teinte douce et intemporelle', NOW() - INTERVAL '75 days'),

    (v_company_id, 'Peinture Elephant''s Breath', 'FB-ELPH-BTH-001', 'Peinture', 'Peinture mate iconique',
     78, 'u', v_supplier_ids[10], 'https://farrow-ball.com/elephants-breath', 'Classique', 'Taupe rosé',
     'Pot 2.5L (35m²)', '1-2 semaines', true, ARRAY['peinture', 'taupe', 'iconique'],
     'Best-seller absolu Farrow & Ball', NOW() - INTERVAL '70 days'),

    (v_company_id, 'Peinture Vert Empire', 'RES-VRT-EMP-012', 'Peinture', 'Vert profond sophistiqué',
     89, 'u', v_supplier_ids[8], 'https://ressource-peintures.com/vert-empire', 'Luxe', 'Vert empire',
     'Pot 2.5L (30m²)', '2 semaines', true, ARRAY['peinture', 'vert', 'profond'],
     'Parfait pour pièce intimiste', NOW() - INTERVAL '65 days'),

    -- Papiers peints
    (v_company_id, 'Papier peint Jungle', 'CASA-JUNG-001-GRN', 'Papier peint', 'Motif tropical luxuriant',
     165, 'm²', v_supplier_ids[2], 'https://casamance.com/jungle', 'Bohème', 'Vert tropical',
     '53cm largeur', '3-4 semaines', true, ARRAY['papier peint', 'tropical', 'jungle'],
     'Imprimé sur intissé haute qualité', NOW() - INTERVAL '60 days'),

    (v_company_id, 'Papier peint Tessella', 'FB-TESS-001-BLU', 'Papier peint', 'Motif géométrique délicat',
     142, 'm²', v_supplier_ids[10], 'https://farrow-ball.com/tessella', 'Classique', 'Bleu-gris',
     '53cm largeur', '2-3 semaines', true, ARRAY['papier peint', 'géométrique', 'élégant'],
     'Motif inspiré du XVIIIe siècle', NOW() - INTERVAL '55 days'),

    -- Sols
    (v_company_id, 'Parquet Chêne Massif Naturel', 'PRQT-CHN-NAT-140', 'Sol', 'Parquet chêne massif huilé',
     135, 'm²', NULL, NULL, 'Scandinave', 'Chêne naturel',
     'Lames 140mm', '4-5 semaines', true, ARRAY['parquet', 'chêne', 'massif'],
     'Finition huile naturelle, entretien facile', NOW() - INTERVAL '50 days'),

    (v_company_id, 'Mosaïque Opus Romano Carrara', 'BIS-OPR-CAR-WHT', 'Sol', 'Mosaïque marbre blanc premium',
     320, 'm²', v_supplier_ids[9], 'https://bisazza.com/opus-romano', 'Luxe', 'Blanc Carrare',
     'Plaques 30x30cm', '8-10 semaines', true, ARRAY['mosaïque', 'marbre', 'luxe'],
     'Fabrication italienne artisanale', NOW() - INTERVAL '45 days'),

    (v_company_id, 'Carreaux ciment motif Fleur', 'CIM-FLR-BLU-001', 'Sol', 'Carreaux de ciment artisanaux',
     95, 'm²', NULL, NULL, 'Art Déco', 'Bleu et blanc',
     '20x20cm', '6-8 semaines', true, ARRAY['carreau ciment', 'artisanal', 'motif'],
     'Fabrication française traditionnelle', NOW() - INTERVAL '40 days'),

    -- Quincaillerie & Accessoires
    (v_company_id, 'Poignée porte Boston Laiton', 'QUIN-BST-LTN-001', 'Quincaillerie', 'Poignée design laiton massif',
     89, 'u', NULL, NULL, 'Classique', 'Laiton poli',
     'L14cm', '3-4 semaines', false, ARRAY['poignée', 'laiton', 'porte'],
     'Finition soignée, toucher agréable', NOW() - INTERVAL '35 days'),

    (v_company_id, 'Miroir rond Laiton XL', 'MSL-MIR-RND-LTN', 'Décoration', 'Grand miroir cadre laiton',
     890, 'u', v_supplier_ids[3], 'https://maisonsarahlavoine.com/miroir-rond', 'Contemporain', 'Laiton doré',
     'Ø120cm', '4-5 semaines', true, ARRAY['miroir', 'rond', 'laiton'],
     'Pièce statement pour agrandir l''espace', NOW() - INTERVAL '30 days'),

    (v_company_id, 'Vase Organic Form Large', 'TD-ORG-VAS-BLK', 'Décoration', 'Vase sculptural en aluminium',
     345, 'u', v_supplier_ids[6], 'https://tomdixon.net/organic-vase', 'Contemporain', 'Noir mat',
     'H45cm Ø30cm', '6-8 semaines', false, ARRAY['vase', 'sculptural', 'moderne'],
     'Design organique contemporain', NOW() - INTERVAL '25 days'),

    -- Rideaux & Textiles
    (v_company_id, 'Voilage Lin Stonewashed', 'LIN-VOL-STN-NAT', 'Tissu', 'Voilage 100% lin lavé',
     68, 'ml', NULL, NULL, 'Scandinave', 'Naturel',
     '300cm hauteur', '2-3 semaines', true, ARRAY['voilage', 'lin', 'naturel'],
     'Tombe parfaitement, aspect froissé chic', NOW() - INTERVAL '20 days'),

    (v_company_id, 'Coussin Velours Emeraude', 'MSL-COU-VEL-EMR', 'Décoration', 'Coussin velours 50x50',
     89, 'u', v_supplier_ids[3], 'https://maisonsarahlavoine.com/coussin-emeraude', 'Luxe', 'Vert émeraude',
     '50x50cm', '2-3 semaines', true, ARRAY['coussin', 'velours', 'couleur'],
     'Garniture plumes incluse', NOW() - INTERVAL '15 days'),

    (v_company_id, 'Plaid Mohair Ivoire', 'PLAID-MOH-IVO-001', 'Textiles', 'Plaid doux mohair et laine',
     195, 'u', NULL, NULL, 'Scandinave', 'Ivoire',
     '130x180cm', '3-4 semaines', true, ARRAY['plaid', 'mohair', 'doux'],
     'Très doux et chaud, finition franges', NOW() - INTERVAL '10 days'),

    -- Pierre & Bois
    (v_company_id, 'Plan vasque Marbre Calacatta', 'MARB-CAL-PLAN-001', 'Pierre', 'Plan vasque marbre italien',
     1450, 'u', NULL, NULL, 'Luxe', 'Blanc veiné or',
     'L140cm P50cm E2cm', '8-10 semaines', true, ARRAY['marbre', 'vasque', 'luxe'],
     'Marbre italien véritable, chaque pièce unique', NOW() - INTERVAL '5 days'),

    (v_company_id, 'Tablette murale Chêne Massif', 'BOIS-TABL-CHN-001', 'Bois', 'Tablette chêne brut huilé',
     125, 'ml', NULL, NULL, 'Scandinave', 'Chêne naturel',
     'Épaisseur 4cm, largeur 25cm', '4-5 semaines', false, ARRAY['étagère', 'chêne', 'massif'],
     'Fabrication sur-mesure, longueur à préciser', NOW() - INTERVAL '3 days'),

    -- Métal & Design
    (v_company_id, 'Applique Murale Form', 'ANTR-FORM-APP-BLK', 'Luminaire', 'Applique design épurée',
     395, 'u', v_supplier_ids[5], 'https://andtradition.com/form-sconce', 'Minimaliste', 'Noir mat',
     'L30cm H15cm', '5-6 semaines', true, ARRAY['applique', 'design', 'épuré'],
     'Éclairage indirect élégant', NOW() - INTERVAL '2 days'),

    (v_company_id, 'Bougeoir Laiton Set de 3', 'MSL-BOU-LTN-SET3', 'Décoration', 'Set 3 bougeoirs design',
     145, 'u', v_supplier_ids[3], 'https://maisonsarahlavoine.com/bougeoirs', 'Contemporain', 'Laiton brossé',
     'Hauteurs variables 15/20/25cm', '3-4 semaines', false, ARRAY['bougeoir', 'laiton', 'set'],
     'Design géométrique moderne', NOW() - INTERVAL '1 day');

  -- ============================================================================
  -- PROJETS
  -- ============================================================================

  WITH inserted_projects AS (
    INSERT INTO projects (company_id, client_id, architect_id, name, description, address, city, postal_code,
                         property_type, surface_area, style, status, current_phase, progress,
                         budget_estimated, budget_spent, start_date, deadline, created_at)
    VALUES
      -- Phase 7: Construction Monitoring (Chantier en cours)
      (v_company_id, v_client_ids[1], v_sophie_id, 'Appartement Haussmannien Saint-Germain',
       'Rénovation complète d''un appartement haussmannien de 180m² avec conservation des éléments patrimoniaux (moulures, parquet, cheminées) et création d''une cuisine ouverte sur séjour.',
       '45 Boulevard Saint-Germain', 'Paris', '75006', 'Appartement', 180, 'Classique', 'active',
       'construction_monitoring', 78, 350000, 273000, '2024-06-15', '2025-03-15', NOW() - INTERVAL '150 days'),

      -- Phase 4: Presentation (Présentation client)
      (v_company_id, v_client_ids[2], v_julie_id, 'Loft Marais',
       'Transformation d''un ancien atelier en loft contemporain. Création d''une mezzanine, grande verrière, cuisine design et salle de bain luxueuse.',
       '12 Rue des Rosiers', 'Paris', '75004', 'Loft', 220, 'Contemporain', 'active',
       'presentation', 35, 450000, 157500, '2024-08-01', '2025-06-30', NOW() - INTERVAL '120 days'),

      -- Phase 3: Design (Conception)
      (v_company_id, v_client_ids[3], v_sophie_id, 'Villa Côte d''Azur',
       'Villa neuve avec vue mer panoramique. Design luxueux avec piscine à débordement, terrasses aménagées, domotique complète.',
       'Villa Les Mimosas, Chemin des Collines', 'Saint-Jean-Cap-Ferrat', '06230', 'Villa', 350, 'Luxe', 'active',
       'design', 25, 800000, 200000, '2024-09-01', '2026-03-30', NOW() - INTERVAL '90 days'),

      -- Phase 6: Contractor Consultation (Consultation entreprises)
      (v_company_id, v_client_ids[9], v_sophie_id, 'Boutique-Hôtel Opéra',
       'Rénovation complète boutique-hôtel 25 chambres. Design luxe contemporain, bar/restaurant, spa.',
       '12 Rue Auber', 'Paris', '75009', 'Hôtel', 850, 'Luxe', 'active',
       'contractor_consultation', 55, 1500000, 825000, '2024-07-01', '2025-12-31', NOW() - INTERVAL '100 days'),

      -- Phase 2: Technical Visit (Visite technique)
      (v_company_id, v_client_ids[10], v_julie_id, 'Restaurant Bastille',
       'Création restaurant bistronomique 40 couverts. Cuisine ouverte, bar à vins, décor contemporain chaleureux.',
       '45 Rue de la Roquette', 'Paris', '75011', 'Restaurant', 120, 'Contemporain', 'active',
       'technical_visit', 15, 200000, 30000, '2024-10-01', '2025-02-28', NOW() - INTERVAL '75 days'),

      -- Phase 1: Brief (Brief initial)
      (v_company_id, v_client_ids[4], v_sophie_id, 'Penthouse Trocadéro',
       'Penthouse 280m² dernier étage avec terrasse 150m². Vue Tour Eiffel. Rénovation luxe extrême.',
       '8 Avenue du Trocadéro', 'Paris', '75016', 'Penthouse', 280, 'Luxe', 'active',
       'brief', 8, 1200000, 96000, '2024-11-15', '2026-06-30', NOW() - INTERVAL '60 days'),

      -- Phase 8: Reception (Réception terminée)
      (v_company_id, v_client_ids[6], v_julie_id, 'Maison Provence',
       'Rénovation mas provençal en pierre. Conservation authenticité, confort moderne. Piscine et pool house.',
       'Mas des Oliviers', 'Gordes', '84220', 'Maison', 240, 'Art Déco', 'completed',
       'reception', 100, 420000, 420000, '2024-01-10', '2024-11-30', NOW() - INTERVAL '180 days'),

      -- Phase 5: Execution Plans (Plans d'exécution)
      (v_company_id, v_client_ids[5], v_julie_id, 'Duplex Montmartre',
       'Duplex avec vue Sacré-Cœur. Style japandi zen. Matériaux naturels, épuré, fonctionnel.',
       '23 Rue des Martyrs', 'Paris', '75018', 'Duplex', 160, 'Japandi', 'active',
       'execution_plans', 48, 280000, 134400, '2024-09-15', '2025-05-31', NOW() - INTERVAL '45 days')
    RETURNING id
  )
  SELECT ARRAY_AGG(id) INTO v_project_ids FROM inserted_projects;

  -- ============================================================================
  -- PHASES DE PROJETS
  -- ============================================================================
  -- Créer les 9 phases standards pour chaque projet

  INSERT INTO project_phases (project_id, name, order_number, status, planned_start_date, planned_end_date,
                              actual_start_date, actual_end_date)
  SELECT
    p.id,
    phase.name,
    phase.order_num,
    CASE
      WHEN phase.order_num < (
        CASE p.current_phase
          WHEN 'brief' THEN 1
          WHEN 'technical_visit' THEN 2
          WHEN 'design' THEN 3
          WHEN 'presentation' THEN 4
          WHEN 'execution_plans' THEN 5
          WHEN 'contractor_consultation' THEN 6
          WHEN 'construction_monitoring' THEN 7
          WHEN 'reception' THEN 8
          WHEN 'photoshoot' THEN 9
        END
      ) THEN 'completed'
      WHEN phase.order_num = (
        CASE p.current_phase
          WHEN 'brief' THEN 1
          WHEN 'technical_visit' THEN 2
          WHEN 'design' THEN 3
          WHEN 'presentation' THEN 4
          WHEN 'execution_plans' THEN 5
          WHEN 'contractor_consultation' THEN 6
          WHEN 'construction_monitoring' THEN 7
          WHEN 'reception' THEN 8
          WHEN 'photoshoot' THEN 9
        END
      ) THEN 'in_progress'
      ELSE 'todo'
    END,
    p.start_date + (phase.order_num - 1) * INTERVAL '30 days',
    p.start_date + phase.order_num * INTERVAL '30 days',
    CASE
      WHEN phase.order_num < (
        CASE p.current_phase
          WHEN 'brief' THEN 1
          WHEN 'technical_visit' THEN 2
          WHEN 'design' THEN 3
          WHEN 'presentation' THEN 4
          WHEN 'execution_plans' THEN 5
          WHEN 'contractor_consultation' THEN 6
          WHEN 'construction_monitoring' THEN 7
          WHEN 'reception' THEN 8
          WHEN 'photoshoot' THEN 9
        END
      ) THEN p.start_date + (phase.order_num - 1) * INTERVAL '30 days'
      ELSE NULL
    END,
    CASE
      WHEN phase.order_num < (
        CASE p.current_phase
          WHEN 'brief' THEN 1
          WHEN 'technical_visit' THEN 2
          WHEN 'design' THEN 3
          WHEN 'presentation' THEN 4
          WHEN 'execution_plans' THEN 5
          WHEN 'contractor_consultation' THEN 6
          WHEN 'construction_monitoring' THEN 7
          WHEN 'reception' THEN 8
          WHEN 'photoshoot' THEN 9
        END
      ) THEN p.start_date + phase.order_num * INTERVAL '25 days'
      ELSE NULL
    END
  FROM
    (SELECT * FROM projects WHERE id = ANY(v_project_ids)) p
  CROSS JOIN (
    VALUES
      ('Brief', 1),
      ('Visite technique', 2),
      ('Conception', 3),
      ('Présentation', 4),
      ('Plans d''exécution', 5),
      ('Consultation entreprises', 6),
      ('Suivi chantier', 7),
      ('Réception', 8),
      ('Shooting', 9)
  ) AS phase(name, order_num);

  -- ============================================================================
  -- BUDGET ITEMS (Postes budgétaires par projet)
  -- ============================================================================

  -- Projet 1: Appartement Haussmannien
  INSERT INTO budget_items (project_id, category, estimated, committed, invoiced, paid, notes)
  VALUES
    (v_project_ids[1], 'Démolition', 15000, 15000, 15000, 15000, 'Démolition cloisons et cuisine - Terminé'),
    (v_project_ids[1], 'Gros œuvre', 45000, 45000, 45000, 45000, 'Maçonnerie et structure - Terminé'),
    (v_project_ids[1], 'Plomberie', 28000, 28000, 22000, 18000, 'Installation sanitaires et chauffage - En cours'),
    (v_project_ids[1], 'Électricité', 32000, 32000, 25000, 20000, 'Installation complète électrique - En cours'),
    (v_project_ids[1], 'Menuiserie', 55000, 55000, 35000, 25000, 'Portes, fenêtres, parquet - En cours'),
    (v_project_ids[1], 'Peinture', 18000, 18000, 0, 0, 'Peinture murs et plafonds - À venir'),
    (v_project_ids[1], 'Revêtements sol', 25000, 25000, 0, 0, 'Parquet et carrelage - À venir'),
    (v_project_ids[1], 'Mobilier', 75000, 60000, 0, 0, 'Mobilier sur-mesure et design'),
    (v_project_ids[1], 'Luminaires', 22000, 18000, 0, 0, 'Luminaires design'),
    (v_project_ids[1], 'Honoraires', 35000, 35000, 28000, 28000, 'Honoraires architecte'),

    -- Projet 2: Loft Marais
    (v_project_ids[2], 'Gros œuvre', 85000, 80000, 0, 0, 'Structure mezzanine et verrière'),
    (v_project_ids[2], 'Plomberie', 35000, 0, 0, 0, 'Plomberie et chauffage'),
    (v_project_ids[2], 'Électricité', 42000, 0, 0, 0, 'Installation électrique complète'),
    (v_project_ids[2], 'Menuiserie', 68000, 0, 0, 0, 'Menuiseries et placards'),
    (v_project_ids[2], 'Peinture', 22000, 0, 0, 0, 'Peinture décorative'),
    (v_project_ids[2], 'Revêtements sol', 38000, 0, 0, 0, 'Béton ciré et parquet'),
    (v_project_ids[2], 'Mobilier', 95000, 0, 0, 0, 'Mobilier design contemporain'),
    (v_project_ids[2], 'Luminaires', 32000, 0, 0, 0, 'Éclairage design'),
    (v_project_ids[2], 'Honoraires', 33000, 33000, 0, 0, 'Honoraires phase conception');

  -- ============================================================================
  -- ÉVÉNEMENTS CALENDRIER
  -- ============================================================================

  INSERT INTO events (company_id, title, description, event_type, start_datetime, end_datetime, location,
                     client_id, project_id, participants, created_by, created_at)
  VALUES
    -- Événements passés
    (v_company_id, 'Réunion Brief - Penthouse Trocadéro', 'Premier rendez-vous client pour définir les besoins et attentes',
     'meeting', NOW() - INTERVAL '15 days' + TIME '10:00', NOW() - INTERVAL '15 days' + TIME '12:00',
     'Agence', v_client_ids[4], v_project_ids[6], ARRAY[v_sophie_id, v_marie_id], v_sophie_id, NOW() - INTERVAL '20 days'),

    (v_company_id, 'Visite technique Restaurant Bastille', 'Relevé de mesures et état des lieux avec client',
     'site_visit', NOW() - INTERVAL '12 days' + TIME '14:00', NOW() - INTERVAL '12 days' + TIME '16:00',
     '45 Rue de la Roquette, Paris 11e', v_client_ids[10], v_project_ids[5], ARRAY[v_julie_id, v_marie_id], v_julie_id, NOW() - INTERVAL '18 days'),

    (v_company_id, 'Présentation moodboard Loft Marais', 'Présentation concepts visuels et matériaux',
     'meeting', NOW() - INTERVAL '8 days' + TIME '15:00', NOW() - INTERVAL '8 days' + TIME '17:00',
     'Agence', v_client_ids[2], v_project_ids[2], ARRAY[v_julie_id], v_julie_id, NOW() - INTERVAL '15 days'),

    (v_company_id, 'Réunion entreprises Boutique-Hôtel', 'Consultation corps de métiers pour chiffrage',
     'contractor_meeting', NOW() - INTERVAL '5 days' + TIME '10:00', NOW() - INTERVAL '5 days' + TIME '13:00',
     '12 Rue Auber, Paris 9e', v_client_ids[9], v_project_ids[4], ARRAY[v_sophie_id, v_marie_id], v_sophie_id, NOW() - INTERVAL '10 days'),

    (v_company_id, 'Visite chantier Haussmannien', 'Point d''avancement travaux avec maître d''œuvre',
     'site_visit', NOW() - INTERVAL '3 days' + TIME '9:00', NOW() - INTERVAL '3 days' + TIME '11:00',
     '45 Boulevard Saint-Germain, Paris 6e', v_client_ids[1], v_project_ids[1], ARRAY[v_sophie_id], v_sophie_id, NOW() - INTERVAL '7 days'),

    (v_company_id, 'Réception Maison Provence', 'Visite finale et remise des clés',
     'site_visit', NOW() - INTERVAL '2 days' + TIME '10:00', NOW() - INTERVAL '2 days' + TIME '13:00',
     'Gordes', v_client_ids[6], v_project_ids[7], ARRAY[v_julie_id, v_client_ids[6]], v_julie_id, NOW() - INTERVAL '10 days'),

    -- Événements futurs
    (v_company_id, 'Présentation 3D Villa Côte d''Azur', 'Présentation rendus 3D et plans finalisés',
     'meeting', NOW() + INTERVAL '2 days' + TIME '14:00', NOW() + INTERVAL '2 days' + TIME '16:30',
     'Visioconférence', v_client_ids[3], v_project_ids[3], ARRAY[v_sophie_id], v_sophie_id, NOW() - INTERVAL '5 days'),

    (v_company_id, 'Rdv showroom Pierre Frey', 'Sélection tissus avec client Haussmannien',
     'meeting', NOW() + INTERVAL '3 days' + TIME '11:00', NOW() + INTERVAL '3 days' + TIME '12:30',
     '47 Rue des Petits Champs, Paris 1er', v_client_ids[1], v_project_ids[1], ARRAY[v_sophie_id, v_client_ids[1]], v_sophie_id, NOW() - INTERVAL '3 days'),

    (v_company_id, 'Présentation plans exécution Duplex', 'Validation plans techniques avant travaux',
     'meeting', NOW() + INTERVAL '5 days' + TIME '10:00', NOW() + INTERVAL '5 days' + TIME '12:00',
     'Agence', v_client_ids[5], v_project_ids[8], ARRAY[v_julie_id, v_marie_id], v_julie_id, NOW() - INTERVAL '2 days'),

    (v_company_id, 'Visite chantier Haussmannien', 'Point hebdomadaire avancement',
     'site_visit', NOW() + INTERVAL '4 days' + TIME '9:00', NOW() + INTERVAL '4 days' + TIME '10:30',
     '45 Boulevard Saint-Germain, Paris 6e', v_client_ids[1], v_project_ids[1], ARRAY[v_sophie_id], v_sophie_id, NOW() - INTERVAL '1 day'),

    (v_company_id, 'Réunion comité pilotage Hôtel', 'Point avancement global avec investisseurs',
     'meeting', NOW() + INTERVAL '7 days' + TIME '14:00', NOW() + INTERVAL '7 days' + TIME '17:00',
     '12 Rue Auber, Paris 9e', v_client_ids[9], v_project_ids[4], ARRAY[v_sophie_id, v_marie_id], v_sophie_id, NOW()),

    (v_company_id, 'Premier contact Spa Haussmann', 'Rendez-vous découverte projet spa',
     'meeting', NOW() + INTERVAL '10 days' + TIME '15:00', NOW() + INTERVAL '10 days' + TIME '16:30',
     'Agence', v_client_ids[12], NULL, ARRAY[v_julie_id], v_julie_id, NOW() + INTERVAL '1 day'),

    (v_company_id, 'Shooting photo Maison Provence', 'Séance photo professionnelle projet terminé',
     'site_visit', NOW() + INTERVAL '12 days' + TIME '9:00', NOW() + INTERVAL '12 days' + TIME '17:00',
     'Gordes', v_client_ids[6], v_project_ids[7], ARRAY[v_julie_id], v_julie_id, NOW() + INTERVAL '2 days'),

    (v_company_id, 'Deadline validation plans Villa', 'Date limite validation plans avant entreprises',
     'deadline', NOW() + INTERVAL '14 days' + TIME '18:00', NOW() + INTERVAL '14 days' + TIME '18:00',
     NULL, v_client_ids[3], v_project_ids[3], ARRAY[v_sophie_id], v_sophie_id, NOW()),

    (v_company_id, 'Rdv Bureau d''études structure', 'Consultation BE pour mezzanine Loft',
     'contractor_meeting', NOW() + INTERVAL '18 days' + TIME '11:00', NOW() + INTERVAL '18 days' + TIME '12:30',
     'Agence', v_client_ids[2], v_project_ids[2], ARRAY[v_julie_id], v_julie_id, NOW() + INTERVAL '3 days'),

    (v_company_id, 'Réunion équipe hebdo', 'Point hebdomadaire interne sur tous les projets',
     'internal', NOW() + INTERVAL '2 days' + TIME '9:00', NOW() + INTERVAL '2 days' + TIME '10:30',
     'Agence', NULL, NULL, ARRAY[v_sophie_id, v_julie_id, v_marie_id], v_sophie_id, NOW()),

    (v_company_id, 'Salon Maison & Objet', 'Visite salon pour sourcing nouveautés',
     'internal', NOW() + INTERVAL '25 days' + TIME '10:00', NOW() + INTERVAL '25 days' + TIME '18:00',
     'Paris Nord Villepinte', NULL, NULL, ARRAY[v_sophie_id, v_julie_id], v_sophie_id, NOW() + INTERVAL '5 days'),

    (v_company_id, 'Formation domotique Hôtel', 'Formation équipe hôtel systèmes domotique',
     'meeting', NOW() + INTERVAL '30 days' + TIME '14:00', NOW() + INTERVAL '30 days' + TIME '17:00',
     '12 Rue Auber, Paris 9e', v_client_ids[9], v_project_ids[4], ARRAY[v_marie_id], v_marie_id, NOW() + INTERVAL '7 days'),

    (v_company_id, 'Livraison mobilier Duplex', 'Réception et installation mobilier',
     'deadline', NOW() + INTERVAL '35 days' + TIME '9:00', NOW() + INTERVAL '35 days' + TIME '17:00',
     '23 Rue des Martyrs, Paris 18e', v_client_ids[5], v_project_ids[8], ARRAY[v_julie_id, v_marie_id], v_julie_id, NOW() + INTERVAL '10 days'),

    (v_company_id, 'Déjeuner client VIP Penthouse', 'Déjeuner relation client avant lancement projet',
     'meeting', NOW() + INTERVAL '8 days' + TIME '12:30', NOW() + INTERVAL '8 days' + TIME '14:30',
     'Restaurant Le Jules Verne', v_client_ids[4], v_project_ids[6], ARRAY[v_sophie_id], v_sophie_id, NOW() + INTERVAL '3 days');

  -- ============================================================================
  -- MOODBOARDS
  -- ============================================================================

  INSERT INTO moodboards (project_id, title, description, colors, created_at)
  VALUES
    (v_project_ids[1], 'Élégance Haussmannienne Contemporaine',
     'Moodboard alliant respect du patrimoine et confort moderne. Palette douce de gris, beiges et touches de laiton. Mobilier classique revisité avec des pièces design contemporaines.',
     '["#E8E3DB", "#C5A572", "#8B7E66", "#4A4238", "#F5F1EA"]'::jsonb,
     NOW() - INTERVAL '130 days'),

    (v_project_ids[2], 'Loft Industriel Chic',
     'Ambiance loft new-yorkais épuré. Palette de gris, noir et bois brut. Mobilier design iconique, métal et cuir. Verrière d''atelier comme élément central.',
     '["#2B2B2B", "#5A5A5A", "#8B7355", "#E8E8E8", "#4A4A4A"]'::jsonb,
     NOW() - INTERVAL '110 days'),

    (v_project_ids[3], 'Luxe Méditerranéen Contemporain',
     'Villa vue mer aux tons blanc, bleu profond et touches dorées. Matériaux nobles: marbre, laiton brossé, bois précieux. Design luxueux mais jamais ostentatoire.',
     '["#FFFFFF", "#1B3A52", "#C9AA71", "#E6D5C3", "#8FA8BA"]'::jsonb,
     NOW() - INTERVAL '80 days'),

    (v_project_ids[5], 'Bistronomie Chaleureuse',
     'Restaurant contemporain chaleureux. Tons terracotta, vert olive, bois naturel. Laiton, velours, suspensions design. Ambiance conviviale et raffinée.',
     '["#D4856A", "#7A916F", "#4A4238", "#E8DCC8", "#C5A572"]'::jsonb,
     NOW() - INTERVAL '65 days'),

    (v_project_ids[8], 'Sérénité Japandi',
     'Fusion parfaite design scandinave et esthétique japonaise. Palette ultra-douce: beiges, blancs cassés, bois clair. Épuré, zen, fonctionnel. Matériaux naturels uniquement.',
     '["#F5F1EA", "#E8E3DB", "#C9B8A8", "#8B7E66", "#4A4238"]'::jsonb,
     NOW() - INTERVAL '40 days');

  RAISE NOTICE 'Données de démonstration insérées avec succès!';
  RAISE NOTICE 'Entreprise ID: %', v_company_id;
  RAISE NOTICE 'Sophie Martin ID: %', v_sophie_id;
  RAISE NOTICE 'Julie Dubois ID: %', v_julie_id;
  RAISE NOTICE 'Marie Lambert ID: %', v_marie_id;
  RAISE NOTICE '% clients créés', array_length(v_client_ids, 1);
  RAISE NOTICE '% fournisseurs créés', array_length(v_supplier_ids, 1);
  RAISE NOTICE '% projets créés', array_length(v_project_ids, 1);

END $$;
