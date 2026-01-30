-- INTEGRACAO_INVENTARIO_MEDBEAUTY.sql
-- Este script cria a estrutura de tabelas necessária para o Inventário e Controle de Ativos TI
-- Sincronizado com o padrão MedBeauty

-- 1. ENUMS E TIPOS
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tech_device_type') THEN
        CREATE TYPE tech_device_type AS ENUM ('notebook', 'tablet', 'smartphone', 'monitor', 'peripherals', 'chip', 'other');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tech_asset_status') THEN
        CREATE TYPE tech_asset_status AS ENUM ('available', 'in_use', 'maintenance', 'broken', 'retired', 'lost');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_module') THEN
        CREATE TYPE app_module AS ENUM ('admin', 'rh', 'financeiro', 'marketing', 'comercial', 'logistica', 'juridico', 'tech', 'ecommerce');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. CATEGORIAS DE PRODUTOS
CREATE TABLE IF NOT EXISTS public.product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. PRODUTOS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    long_description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    original_price DECIMAL(10,2),
    category_id UUID REFERENCES public.product_categories(id),
    image_url TEXT,
    images TEXT[],
    sku TEXT UNIQUE,
    stock INTEGER DEFAULT 0,
    in_stock BOOLEAN DEFAULT true,
    rating DECIMAL(3,2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    badge TEXT, -- 'new', 'bestseller', 'limited', 'sale'
    tags TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. DEPÓSITOS (WAREHOUSES)
CREATE TABLE IF NOT EXISTS public.warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    address JSONB,
    is_active BOOLEAN DEFAULT true,
    sap_warehouse_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. ESTOQUE (INVENTORY)
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL, -- Pode ser UUID ou Código SAP
    warehouse_id UUID REFERENCES public.warehouses(id),
    sku TEXT NOT NULL,
    quantity_available INTEGER DEFAULT 0,
    quantity_reserved INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    location TEXT, -- Posição no estoque (ex: PR-A1)
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(product_id, warehouse_id)
);

-- 6. ATIVOS TECH (EQUIPAMENTOS)
CREATE TABLE IF NOT EXISTS public.tech_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_tag TEXT UNIQUE NOT NULL, -- MB-NB-001
    serial_number TEXT,
    hostname TEXT,
    model TEXT NOT NULL,
    brand TEXT NOT NULL,
    device_type tech_device_type NOT NULL,
    status tech_asset_status DEFAULT 'available',
    assigned_to_name TEXT, -- Nome do colaborador (flexibilidade se não houver user_id)
    assigned_to UUID, -- Referência opcional ao app_users
    location TEXT, -- Setor ou Unidade
    company TEXT, -- Empresa (ex: MedBeauty)
    purchase_date DATE,
    warranty_expiration DATE,
    specifications JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. HISTÓRICO DE ATIVOS
CREATE TABLE IF NOT EXISTS public.tech_asset_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES public.tech_assets(id) ON DELETE CASCADE,
    changed_by UUID,
    action_type TEXT NOT NULL, -- 'assign', 'return', 'maintenance', 'update'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. DADOS INICIAIS (SEED)
-- Categorias
INSERT INTO public.product_categories (name, slug, description) VALUES
('Fios', 'fios', 'Fios de PDO para bioestimulação'),
('Preenchimentos', 'preenchimentos', 'Ácido Hialurônico e Volumizadores'),
('Skincare', 'skincare', 'Dermocosméticos Premium'),
('Instrumentais', 'instrumentais', 'Cânulas e Agulhas')
ON CONFLICT (slug) DO NOTHING;

-- Depósitos
INSERT INTO public.warehouses (code, name, sap_warehouse_code) VALUES
('CD-SP', 'CD Principal - São Paulo', 'WRH-001'),
('FIL-RJ', 'Filial - Rio de Janeiro', 'WRH-002')
ON CONFLICT (code) DO NOTHING;

-- Exemplo de Ativos TI
INSERT INTO public.tech_assets (asset_tag, model, brand, device_type, status, location, specifications) VALUES
('MB-NB-001', 'Galaxy Book Pro', 'Samsung', 'notebook', 'available', 'TI', '{"ram": "16GB", "ssd": "512GB"}'::jsonb),
('MB-NB-002', 'Latitude 3420', 'Dell', 'notebook', 'in_use', 'Comercial', '{"ram": "8GB", "ssd": "256GB"}'::jsonb),
('MB-TAB-001', 'Galaxy Tab A7', 'Samsung', 'tablet', 'available', 'Estoque', '{"color": "Gray"}'::jsonb),
('MB-SM-001', 'iPhone 13', 'Apple', 'smartphone', 'available', 'Marketing', '{"storage": "128GB"}'::jsonb)
ON CONFLICT (asset_tag) DO NOTHING;

-- Habilitar RLS (Opcional, seguindo padrão MedBeauty)
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tech_assets ENABLE ROW LEVEL SECURITY;

-- Políticas Simples (Acesso para autenticados)
DROP POLICY IF EXISTS "Public Read" ON public.product_categories;
CREATE POLICY "Public Read" ON public.product_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read" ON public.products;
CREATE POLICY "Public Read" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin All" ON public.tech_assets;
CREATE POLICY "Admin All" ON public.tech_assets FOR ALL USING (true);
