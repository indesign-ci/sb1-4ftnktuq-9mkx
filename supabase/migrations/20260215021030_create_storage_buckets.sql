/*
  # Create Storage Buckets

  1. Purpose
    - Create storage buckets for application assets
    - Photos bucket: company logos, moodboard images, material photos
    
  2. Buckets
    - `photos`: Public bucket for all images
    
  3. Security
    - Public read access for all images
    - Authenticated users can upload to their company folder
    - File size limit of 10MB
*/

-- Create photos bucket for all images (company logos, moodboards, materials)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photos',
  'photos',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'photos');

-- Allow authenticated users to update their own photos
CREATE POLICY "Users can update their photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'photos');

-- Allow authenticated users to delete their own photos
CREATE POLICY "Users can delete their photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'photos');

-- Allow public read access to all photos
CREATE POLICY "Public can view photos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'photos');
