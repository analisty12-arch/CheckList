-- Drop tables if they exist to allow clean reset
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS positions CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- Create Enums (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_module') THEN
        CREATE TYPE app_module AS ENUM ('admin', 'rh', 'financeiro', 'marketing', 'comercial', 'logistica', 'juridico', 'tech', 'ecommerce');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'employee_status') THEN
        CREATE TYPE employee_status AS ENUM ('onboarding', 'active', 'on_leave', 'suspended', 'offboarding', 'terminated');
    END IF;
END$$;

-- Departamentos
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  module app_module NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Cargos
CREATE TABLE public.positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100) NOT NULL,
  department_id UUID REFERENCES public.departments(id),
  level INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Funcionários
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(200) NOT NULL,
  cpf VARCHAR(14) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  hire_date DATE NOT NULL,
  position_id UUID REFERENCES public.positions(id),
  department_id UUID REFERENCES public.departments(id),
  status employee_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- SEED DATA -----------------------------------------------------

-- Departments
INSERT INTO departments (id, name, code, module) VALUES
('11111111-1111-1111-1111-111111111111', 'Recursos Humanos', 'RH', 'rh'),
('22222222-2222-2222-2222-222222222222', 'Tecnologia da Informação', 'TI', 'tech'),
('33333333-3333-3333-3333-333333333333', 'Financeiro', 'FIN', 'financeiro'),
('44444444-4444-4444-4444-444444444444', 'Comercial', 'COM', 'comercial'),
('55555555-5555-5555-5555-555555555555', 'Marketing', 'MKT', 'marketing'),
('66666666-6666-6666-6666-666666666666', 'Logística', 'LOG', 'logistica');

-- Positions
INSERT INTO positions (id, title, department_id, level) VALUES
-- RH
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Gerente de RH', '11111111-1111-1111-1111-111111111111', 3),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Analista de RH Pleno', '11111111-1111-1111-1111-111111111111', 2),
-- TI
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Desenvolvedor Senior', '22222222-2222-2222-2222-222222222222', 2),
-- Financeiro
('99999999-9999-9999-9999-999999999999', 'Diretor Financeiro', '33333333-3333-3333-3333-333333333333', 4),
-- Comercial
('00000000-0000-0000-0000-000000000002', 'Vendedor Sênior', '44444444-4444-4444-4444-444444444444', 2),
-- Marketing
('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'Head de Marketing', '55555555-5555-5555-5555-555555555555', 3);


-- Generate 104 Employees
DO $$
DECLARE
    first_names TEXT[] := ARRAY['Ana', 'Bruno', 'Carlos', 'Daniela', 'Eduardo', 'Fernanda', 'Gabriel', 'Helena', 'Igor', 'Julia', 'Lucas', 'Mariana', 'Nicolas', 'Olivia', 'Pedro', 'Rafaela', 'Samuel', 'Tatiane', 'Vinicius', 'Yasmin'];
    last_names TEXT[] := ARRAY['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa'];
    depts UUID[] := ARRAY['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555', '66666666-6666-6666-6666-666666666666'];
    pos_rh UUID[] := ARRAY['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'];
    pos_ti UUID[] := ARRAY['ffffffff-ffff-ffff-ffff-ffffffffffff'];
    i INT;
    random_dept UUID;
    random_pos UUID;
    random_name TEXT;
BEGIN
    FOR i IN 1..104 LOOP
        random_dept := depts[1 + floor(random() * array_length(depts, 1))::int];
        
        -- Assign position based on dept (simplified logic)
        IF random_dept = '11111111-1111-1111-1111-111111111111' THEN
             random_pos := pos_rh[1 + floor(random() * array_length(pos_rh, 1))::int];
        ELSIF random_dept = '22222222-2222-2222-2222-222222222222' THEN
             random_pos := 'ffffffff-ffff-ffff-ffff-ffffffffffff';
        ELSIF random_dept = '33333333-3333-3333-3333-333333333333' THEN
             random_pos := '99999999-9999-9999-9999-999999999999';
        ELSIF random_dept = '44444444-4444-4444-4444-444444444444' THEN
             random_pos := '00000000-0000-0000-0000-000000000002';
        ELSE
             random_pos := 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
        END IF;

        random_name := first_names[1 + floor(random() * array_length(first_names, 1))::int] || ' ' || last_names[1 + floor(random() * array_length(last_names, 1))::int];

        INSERT INTO employees (
            full_name, 
            cpf, 
            email, 
            phone, 
            hire_date, 
            position_id, 
            department_id, 
            status
        ) VALUES (
            random_name,
            lpad((floor(random() * 99999999999)::text), 11, '0'),
            lower(replace(random_name, ' ', '.')) || i || '@medbeauty.com.br',
            '(11) 9' || floor(random() * 8999 + 1000)::text || '-' || floor(random() * 8999 + 1000)::text,
            CURRENT_DATE - (floor(random() * 365 * 2) || ' days')::interval,
            random_pos,
            random_dept,
            'active'
        );
    END LOOP;
END $$;
