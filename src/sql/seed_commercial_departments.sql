-- Seed Commercial Departments
INSERT INTO departments (name) VALUES
('Comercial Norte/Nordeste'),
('Comercial Sul'),
('Comercial Sudeste'),
('Comercial Centro'),
('Inside Sales')
ON CONFLICT (name) DO NOTHING;
