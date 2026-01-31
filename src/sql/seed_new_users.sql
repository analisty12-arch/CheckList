-- Seed new department users
INSERT INTO app_users (email, password, name, role, department) VALUES
('compras@medbeauty.com.br', 'Medbeauty', 'Gestor Compras', 'Gestor', 'Compras'),
('franquias@medbeauty.com.br', 'Medbeauty', 'Gestor Franquias', 'Gestor', 'Franquias')
ON CONFLICT (email) DO NOTHING;
