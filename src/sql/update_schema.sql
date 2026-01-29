-- Add data column to checklists to store form fields (JSON)
ALTER TABLE checklists ADD COLUMN data JSONB DEFAULT '{}'::jsonb;
