-- =========================================================================
-- SCRIPT DE EXPORTAÇÃO: FUNCIONÁRIOS (EMPLOYEES)
-- =========================================================================
-- Instruções:
-- 1. Copie este script.
-- 2. Execute-o no SQL Editor do projeto ANTIGO (onde estão os 104 funcionários).
-- 3. O resultado será uma lista de comandos INSERT.
-- 4. Copie o resultado e execute no SQL Editor do projeto NOVO.
-- =========================================================================

SELECT 
    'INSERT INTO public.employees (' ||
    'id, ' ||
    'full_name, ' ||
    'cpf, ' ||
    'email, ' ||
    'phone, ' ||
    'hire_date, ' ||
    'status, ' ||
    'created_at' ||
    ') VALUES (' ||
    quote_literal(id) || ', ' ||
    quote_literal(full_name) || ', ' ||
    quote_literal(cpf) || ', ' ||
    quote_literal(email) || ', ' ||
    COALESCE(quote_literal(phone), 'NULL') || ', ' ||
    quote_literal(hire_date) || ', ' ||
    quote_literal(status) || '::employee_status, ' ||
    quote_literal(created_at) || 
    ') ON CONFLICT (id) DO NOTHING;' as comando_sql
FROM 
    public.employees;

-- Observação: Este script assume que os departamentos e cargos já existem ou não são 
-- estritamente obrigatórios para a importação inicial (FKs podem precisar de ajuste se os IDs diferirem).
-- Se necessário, podemos ajustar para exportar também positions/departments.
