-- 1. Adicionar 'chip' ao enum tech_device_type
ALTER TYPE public.tech_device_type ADD VALUE IF NOT EXISTS 'chip';

-- 2. Adicionar coluna 'company' à tabela tech_assets caso não exista
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tech_assets' AND column_name = 'company') THEN
        ALTER TABLE public.tech_assets ADD COLUMN company TEXT;
    END IF;
END $$;
