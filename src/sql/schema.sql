-- Create checklists table
CREATE TABLE checklists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id UUID REFERENCES checklists(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  role TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access (for now, based on ANON key usage)
-- In a real app with auth, these would check auth.uid()
CREATE POLICY "Allow public read access to checklists" ON checklists FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to checklists" ON checklists FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to checklists" ON checklists FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to checklists" ON checklists FOR DELETE USING (true);

CREATE POLICY "Allow public read access to tasks" ON tasks FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to tasks" ON tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to tasks" ON tasks FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to tasks" ON tasks FOR DELETE USING (true);
