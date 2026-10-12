/*
# Create feedback tables for Al Mannat Hospital patient feedback system

1. New Tables
- `feedback`: Stores all patient feedback submissions
  - `id` (uuid, primary key)
  - `department` (text, not null) - e.g. Orthopaedic Care, General Physician, Physiotherapy, Front Desk & Billing, General Care
  - `doctor_name` (text, nullable) - optional doctor name
  - `rating` (integer, 1-5, not null) - star rating
  - `is_positive` (boolean, not null) - true if rating >= 4 (Google redirect path)
  - `google_review_clicked` (boolean, default false) - whether patient clicked through to Google
  - `feedback_tags` (text[], nullable) - quick tags like "Waiting Time", "Staff Behavior", etc.
  - `message` (text, nullable) - detailed feedback text
  - `patient_name` (text, nullable) - for internal feedback
  - `patient_mobile` (text, nullable) - for internal feedback
  - `patient_room` (text, nullable) - room/OPD number for internal feedback
  - `status` (text, default 'pending') - pending, resolved, archived
  - `created_at` (timestamptz, default now())

2. Settings table
- `app_settings`: Stores configurable hospital settings (single row)
  - `id` (int, primary key, default 1)
  - `google_review_url` (text)
  - `whatsapp_number` (text)
  - `hospital_name` (text)
  - `hospital_address` (text)
  - `hospital_phone` (text)
  - `updated_at` (timestamptz, default now())

3. Security
- Enable RLS on both tables.
- This is a no-auth public kiosk app (patients scan QR and submit feedback).
- Policies use `TO anon, authenticated` so the anon-key client can read/write.
- The feedback table is intentionally public for inserts (patients submit without login).
- SELECT is open since this is a demo kiosk app; in production, admin access would be behind auth.
*/

CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department text NOT NULL,
  doctor_name text,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  is_positive boolean NOT NULL,
  google_review_clicked boolean NOT NULL DEFAULT false,
  feedback_tags text[],
  message text,
  patient_name text,
  patient_mobile text,
  patient_room text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  google_review_url text NOT NULL DEFAULT 'https://maps.app.goo.gl/F8DsCdTSHzyxJaZLA',
  whatsapp_number text NOT NULL DEFAULT '919355410932',
  hospital_name text NOT NULL DEFAULT 'Al Mannat Hospital Pvt. Ltd.',
  hospital_address text NOT NULL DEFAULT 'F-166, Ground/Upper Ground Floor, Shaheen Bagh, Jamia Nagar, New Delhi - 110025',
  hospital_phone text NOT NULL DEFAULT '09355410932',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_feedback" ON feedback;
CREATE POLICY "anon_select_feedback" ON feedback FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_feedback" ON feedback;
CREATE POLICY "anon_insert_feedback" ON feedback FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_feedback" ON feedback;
CREATE POLICY "anon_update_feedback" ON feedback FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_feedback" ON feedback;
CREATE POLICY "anon_delete_feedback" ON feedback FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_settings" ON app_settings;
CREATE POLICY "anon_select_settings" ON app_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_update_settings" ON app_settings;
CREATE POLICY "anon_update_settings" ON app_settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Insert default settings row if it doesn't exist
INSERT INTO app_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_department ON feedback (department);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback (rating);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback (status);
