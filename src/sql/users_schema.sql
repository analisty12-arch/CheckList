-- Reset table for clean update
DROP TABLE IF EXISTS app_users;

-- Create app_users table
CREATE TABLE IF NOT EXISTS app_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- Storing plain text/simple hash for this local demo as requested
  name TEXT NOT NULL,
  role TEXT NOT NULL, -- 'Adm', 'RH', 'Gestor', 'TI'
  department TEXT, -- 'Financeiro', 'Marketing', 'Comercial', etc.
  region TEXT, -- For Comercial: 'Norte/Nordeste', 'Sul', etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Policies (Allow public access for this local demo simplicity, or restrict as needed)
CREATE POLICY "Allow public read access to app_users" ON app_users FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to app_users" ON app_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to app_users" ON app_users FOR UPDATE USING (true);

-- Seed Data (Updated to .com.br)
INSERT INTO app_users (email, password, name, role, department, region) VALUES
-- Admin
('adm@medbeauty.com.br', 'Medbeauty', 'Administrador', 'Adm', NULL, NULL),

-- RH
('rh@medbeauty.com.br', 'Medbeauty', 'Equipe RH', 'RH', 'RH', NULL),

-- TI
('ti@medbeauty.com.br', 'Medbeauty', 'Equipe Tech', 'TI', 'TI', NULL),

-- Gestores (Departments)
('financeiro@medbeauty.com.br', 'Medbeauty', 'Gestor Financeiro', 'Gestor', 'Financeiro', NULL),
('marketing@medbeauty.com.br', 'Medbeauty', 'Gestor Marketing', 'Gestor', 'Marketing', NULL),
('logistica@medbeauty.com.br', 'Medbeauty', 'Gestor Logística', 'Gestor', 'Logística', NULL),
('juridico@medbeauty.com.br', 'Medbeauty', 'Gestor Jurídico', 'Gestor', 'Jurídico', NULL),

-- Gestores (Comercial Regions)
('comercial.norte@medbeauty.com.br', 'Medbeauty', 'Gestor Comercial Norte', 'Gestor', 'Comercial', 'Norte/Nordeste'),
('comercial.sul@medbeauty.com.br', 'Medbeauty', 'Gestor Comercial Sul', 'Gestor', 'Comercial', 'Sul'),
('comercial.sudeste@medbeauty.com.br', 'Medbeauty', 'Gestor Comercial Sudeste', 'Gestor', 'Comercial', 'Sudeste'),
('comercial.centro@medbeauty.com.br', 'Medbeauty', 'Gestor Comercial Centro', 'Gestor', 'Comercial', 'Centro'),
('comercial.inside@medbeauty.com.br', 'Medbeauty', 'Gestor Inside Sales', 'Gestor', 'Comercial', 'Inside Sales');
