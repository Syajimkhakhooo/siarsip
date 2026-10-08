-- BMU Digital Archive - Supabase SQL Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DOCUMENT CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS document_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('peserta', 'lembaga', 'perusahaan', 'umum')),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default categories
INSERT INTO document_categories (name, code, type) VALUES
  ('Identitas', 'IDN', 'peserta'),
  ('Pendidikan', 'PDK', 'peserta'),
  ('Pelatihan', 'PLT', 'peserta'),
  ('Sertifikat', 'SRT', 'peserta'),
  ('Kesehatan', 'KSH', 'peserta'),
  ('Kontrak', 'KON', 'peserta'),
  ('Keberangkatan', 'KBG', 'peserta'),
  ('Visa', 'VSA', 'peserta'),
  ('Dokumen Lainnya', 'DLN', 'peserta'),
  ('Legalitas', 'LGL', 'lembaga'),
  ('Surat Masuk', 'SMK', 'lembaga'),
  ('Surat Keluar', 'SKL', 'lembaga'),
  ('SOP', 'SOP', 'lembaga'),
  ('Administrasi', 'ADM', 'lembaga'),
  ('Keuangan', 'KEU', 'lembaga'),
  ('Kerja Sama', 'KSM', 'lembaga'),
  ('Kegiatan', 'KGT', 'lembaga'),
  ('Dokumentasi', 'DOK', 'lembaga'),
  ('Profil Perusahaan', 'PPH', 'perusahaan'),
  ('Job Order', 'JO', 'perusahaan'),
  ('Kontrak Perusahaan', 'KOP', 'perusahaan'),
  ('Requirement', 'REQ', 'perusahaan'),
  ('Surat Perusahaan', 'SPH', 'perusahaan'),
  ('Dokumen Pendukung', 'DPD', 'perusahaan')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- COMPANIES
-- ============================================
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT,
  city TEXT,
  address TEXT,
  pic TEXT,
  contact TEXT,
  email TEXT,
  industry TEXT,
  notes TEXT,
  status TEXT DEFAULT 'aktif' CHECK (status IN ('aktif', 'tidak aktif')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- JOB ORDERS
-- ============================================
CREATE TABLE IF NOT EXISTS job_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  jo_number TEXT UNIQUE NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  position TEXT,
  industry TEXT,
  location TEXT,
  quota INTEGER DEFAULT 0,
  deadline DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'aktif', 'recruitment', 'selesai', 'dibatalkan')),
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PARTICIPANTS
-- ============================================
CREATE TABLE IF NOT EXISTS participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  full_name TEXT NOT NULL,
  nik TEXT UNIQUE,
  passport_number TEXT,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('L', 'P')),
  address TEXT,
  phone TEXT,
  program TEXT,
  class TEXT,
  sensei TEXT,
  status TEXT DEFAULT 'pendaftar' CHECK (status IN (
    'pendaftar', 'aktif', 'pelatihan', 'lolos',
    'persiapan_keberangkatan', 'berangkat', 'selesai', 'alumni'
  )),
  target_company_id UUID REFERENCES companies(id),
  job_order_id UUID REFERENCES job_orders(id),
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CHECKLIST TEMPLATES
-- ============================================
CREATE TABLE IF NOT EXISTS checklist_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  participant_status TEXT,
  document_name TEXT NOT NULL,
  is_required BOOLEAN DEFAULT TRUE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO checklist_templates (name, participant_status, document_name, order_index) VALUES
  ('Pelatihan', 'pelatihan', 'KTP', 1),
  ('Pelatihan', 'pelatihan', 'Kartu Keluarga', 2),
  ('Pelatihan', 'pelatihan', 'Ijazah', 3),
  ('Pelatihan', 'pelatihan', 'Pas Foto', 4),
  ('Pelatihan', 'pelatihan', 'Sertifikat Bahasa', 5),
  ('Persiapan Keberangkatan', 'persiapan_keberangkatan', 'KTP', 1),
  ('Persiapan Keberangkatan', 'persiapan_keberangkatan', 'Kartu Keluarga', 2),
  ('Persiapan Keberangkatan', 'persiapan_keberangkatan', 'Ijazah', 3),
  ('Persiapan Keberangkatan', 'persiapan_keberangkatan', 'Paspor', 4),
  ('Persiapan Keberangkatan', 'persiapan_keberangkatan', 'SKCK', 5),
  ('Persiapan Keberangkatan', 'persiapan_keberangkatan', 'Medical Check Up', 6),
  ('Persiapan Keberangkatan', 'persiapan_keberangkatan', 'Kontrak', 7),
  ('Persiapan Keberangkatan', 'persiapan_keberangkatan', 'COE', 8),
  ('Persiapan Keberangkatan', 'persiapan_keberangkatan', 'Visa', 9),
  ('Persiapan Keberangkatan', 'persiapan_keberangkatan', 'Tiket', 10)
ON CONFLICT DO NOTHING;

-- ============================================
-- DOCUMENT COUNTERS
-- ============================================
CREATE TABLE IF NOT EXISTS document_counters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category_code TEXT NOT NULL,
  year INTEGER NOT NULL,
  last_number INTEGER DEFAULT 0,
  UNIQUE(category_code, year)
);

CREATE TABLE IF NOT EXISTS archive_counters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  prefix TEXT NOT NULL,
  year INTEGER NOT NULL,
  last_number INTEGER DEFAULT 0,
  UNIQUE(prefix, year)
);

-- ============================================
-- DOCUMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  archive_code TEXT UNIQUE,
  document_number TEXT UNIQUE,
  name TEXT NOT NULL,
  category_id UUID REFERENCES document_categories(id),
  document_type TEXT,
  participant_id UUID REFERENCES participants(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  job_order_id UUID REFERENCES job_orders(id) ON DELETE SET NULL,
  document_date DATE,
  valid_from DATE,
  valid_until DATE,
  status TEXT DEFAULT 'aktif' CHECK (status IN ('aktif', 'tidak aktif', 'kedaluwarsa', 'draft')),
  security_level TEXT DEFAULT 'internal' CHECK (security_level IN ('internal', 'confidential', 'highly_confidential')),
  version INTEGER DEFAULT 1,
  current_version_id UUID,
  notes TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DOCUMENT VERSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_path TEXT,
  file_name TEXT,
  file_size BIGINT,
  mime_type TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DOCUMENT ACTIVITIES
-- ============================================
CREATE TABLE IF NOT EXISTS document_activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES participants(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DOCUMENT FAVORITES
-- ============================================
CREATE TABLE IF NOT EXISTS document_favorites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(document_id, user_id)
);

-- ============================================
-- PARTICIPANT DOCUMENT REQUIREMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS participant_document_requirements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  is_required BOOLEAN DEFAULT TRUE,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INCOMING LETTERS
-- ============================================
CREATE TABLE IF NOT EXISTS incoming_letters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  letter_number TEXT,
  letter_date DATE,
  sender TEXT,
  subject TEXT,
  category TEXT,
  file_path TEXT,
  file_name TEXT,
  notes TEXT,
  status TEXT DEFAULT 'baru',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- OUTGOING LETTERS
-- ============================================
CREATE TABLE IF NOT EXISTS outgoing_letters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  letter_number TEXT UNIQUE,
  letter_date DATE,
  recipient TEXT,
  subject TEXT,
  category TEXT,
  file_path TEXT,
  file_name TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SYSTEM SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO system_settings (key, value, description) VALUES
  ('org_name', 'LPK Bahtera Mitra Unggulan', 'Nama Lembaga'),
  ('org_short', 'BMU', 'Singkatan Lembaga'),
  ('doc_number_prefix', 'BMU', 'Prefix Nomor Dokumen'),
  ('expiry_warning_days', '90', 'Hari peringatan kedaluwarsa'),
  ('expiry_critical_days', '30', 'Hari peringatan kritis kedaluwarsa')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- AUDIT LOG
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  resource_name TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_job_orders_updated_at BEFORE UPDATE ON job_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_participants_updated_at BEFORE UPDATE ON participants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_incoming_letters_updated_at BEFORE UPDATE ON incoming_letters FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_outgoing_letters_updated_at BEFORE UPDATE ON outgoing_letters FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to generate document number
CREATE OR REPLACE FUNCTION generate_document_number(p_category_code TEXT, p_year INTEGER)
RETURNS TEXT AS $$
DECLARE
  v_next_number INTEGER;
  v_number TEXT;
BEGIN
  INSERT INTO document_counters (category_code, year, last_number)
  VALUES (p_category_code, p_year, 1)
  ON CONFLICT (category_code, year)
  DO UPDATE SET last_number = document_counters.last_number + 1
  RETURNING last_number INTO v_next_number;

  v_number := 'BMU/' || p_category_code || '/' || p_year || '/' || LPAD(v_next_number::TEXT, 3, '0');
  RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate archive code
CREATE OR REPLACE FUNCTION generate_archive_code(p_prefix TEXT, p_year INTEGER)
RETURNS TEXT AS $$
DECLARE
  v_next_number INTEGER;
  v_code TEXT;
BEGIN
  INSERT INTO archive_counters (prefix, year, last_number)
  VALUES (p_prefix, p_year, 1)
  ON CONFLICT (prefix, year)
  DO UPDATE SET last_number = archive_counters.last_number + 1
  RETURNING last_number INTO v_next_number;

  v_code := 'ARS-' || p_prefix || '-' || p_year || '-' || LPAD(v_next_number::TEXT, 6, '0');
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_document_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE incoming_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE outgoing_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;

-- Policies: authenticated users can access all data
CREATE POLICY "auth_all" ON profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON documents FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON document_versions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON document_activities FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON document_favorites FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON document_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON participants FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON participant_document_requirements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON companies FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON job_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON incoming_letters FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON outgoing_letters FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON system_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON document_counters FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON archive_counters FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON checklist_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- STORAGE BUCKETS & POLICIES
-- ============================================
-- Pastikan bucket 'documents' terdaftar
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Berikan izin akses penuh ke bucket 'documents' (upload, download, view)
DROP POLICY IF EXISTS "Allow All on Documents Bucket" ON storage.objects;
DROP POLICY IF EXISTS "auth_storage" ON storage.objects;

CREATE POLICY "Allow All on Documents Bucket"
ON storage.objects
FOR ALL
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');

-- ============================================
-- PARTICIPANT DOCUMENT REQUIREMENTS (Checklist)
-- ============================================
CREATE TABLE IF NOT EXISTS participant_document_requirements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE participant_document_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all_requirements"
ON participant_document_requirements
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
