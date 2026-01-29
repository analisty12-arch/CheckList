import { useState, useEffect, useCallback, useRef } from 'react'
import { Dashboard } from './components/Dashboard'
import { ChecklistView, type ChecklistData } from './components/ChecklistView'
import { LoginPage } from './components/LoginPage'
import { SocialFeed } from './components/SocialFeed'
import { UserManagement } from './components/UserManagement'
import { EmployeeDirectory } from './components/EmployeeDirectory'
import { templates } from './data/templates'
import { supabase } from './lib/supabase'
import { Shield, ClipboardList, LogOut, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import './App.css'

function App() {
  const [checklists, setChecklists] = useState<ChecklistData[]>([]);
  const [activeChecklistId, setActiveChecklistId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [view, setView] = useState<'login' | 'feed' | 'dashboard' | 'admin' | 'employees'>('login');


  // Fetch initial data
  useEffect(() => {
    fetchChecklists();
  }, []);

  async function fetchChecklists() {
    // Fetch checklists
    const { data: checklistsData, error: checklistsError } = await supabase
      .from('checklists')
      .select('*')
      .order('created_at', { ascending: false });

    if (checklistsError) {
      console.error('Error fetching checklists:', checklistsError);
      return;
    }

    if (!checklistsData) {
      return;
    }

    // Fetch all tasks
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('*');

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      return;
    }

    // Combine data
    const combined: ChecklistData[] = checklistsData.map(c => ({
      id: c.id,
      title: c.title,
      type: c.type,
      data: c.data,
      createdAt: new Date(c.created_at).getTime(),
      items: (tasksData || [])
        .filter(t => t.checklist_id === c.id)
        .map(t => ({
          id: t.id,
          text: t.text,
          role: t.role || undefined, // Handle null role
          isCompleted: t.completed,
          createdAt: new Date(t.created_at).getTime()
        }))
    }));

    setChecklists(combined);
  }

  const handleCreate = async (templateId: string, title?: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template && templateId !== 'custom') return;

    const listTitle = title || (template ? template.title : 'New Checklist');
    const listType = template ? template.title : 'Custom List';

    // 1. Create Checklist
    const { data: newList, error: createError } = await supabase
      .from('checklists')
      .insert({ title: listTitle, type: listType })
      .select()
      .single();

    if (createError || !newList) {
      console.error('Error creating checklist:', createError);
      return;
    }

    // 2. Create items if template exists
    let items: any[] = [];
    if (template) {
      const tasksToInsert = template.steps.map(step => ({
        checklist_id: newList.id,
        text: step.text,
        role: step.role,
        completed: false
      }));

      const { data: newTasks, error: tasksError } = await supabase
        .from('tasks')
        .insert(tasksToInsert)
        .select();

      if (tasksError) {
        console.error('Error creating tasks:', tasksError);
      } else {
        items = newTasks || [];
      }
    }

    // Update local state
    const newChecklistLocal: ChecklistData = {
      id: newList.id,
      title: newList.title,
      type: newList.type,
      data: newList.data,
      createdAt: new Date(newList.created_at).getTime(),
      items: items.map(t => ({
        id: t.id,
        text: t.text,
        role: t.role || undefined,
        isCompleted: t.completed,
        createdAt: new Date(t.created_at).getTime()
      }))
    };

    setChecklists([newChecklistLocal, ...checklists]);
    setActiveChecklistId(newList.id);
  };

  const handleTaskAdd = async (checklistId: string, text: string) => {
    const { data } = await supabase.from('tasks').insert({
      checklist_id: checklistId,
      text,
      completed: false
    }).select().single();

    if (data) {
      const newItem = {
        id: data.id,
        text: data.text,
        role: data.role || undefined,
        isCompleted: data.completed,
        createdAt: new Date(data.created_at).getTime()
      };
      setChecklists(prev => prev.map(c => {
        if (c.id === checklistId) {
          return { ...c, items: [newItem, ...c.items] };
        }
        return c;
      }));
    }
  };

  const handleTaskToggle = async (taskId: string, currentStatus: boolean) => {
    // Optimistic
    setChecklists(prev => prev.map(c => ({
      ...c,
      items: c.items.map(i => i.id === taskId ? { ...i, completed: !currentStatus } : i)
    })));

    await supabase.from('tasks').update({ completed: !currentStatus }).eq('id', taskId);
  };

  const handleTaskDelete = async (taskId: string) => {
    // Optimistic
    setChecklists(prev => prev.map(c => ({
      ...c,
      items: c.items.filter(i => i.id !== taskId)
    })));

    await supabase.from('tasks').delete().eq('id', taskId);
  };




  const dbUpdateTimeoutRef = useRef<any>(null);

  const handleChecklistUpdate = useCallback(async (id: string, updates: Partial<ChecklistData>) => {
    // Optimistic - Immediate UI update
    setChecklists(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));

    // Debounced Supabase Sync
    if (dbUpdateTimeoutRef.current) clearTimeout(dbUpdateTimeoutRef.current);

    dbUpdateTimeoutRef.current = setTimeout(async () => {
      const dbUpdates: any = {};
      if (updates.title) dbUpdates.title = updates.title;
      if (updates.data) dbUpdates.data = updates.data;
      if (updates.type) dbUpdates.type = updates.type;

      if (Object.keys(dbUpdates).length > 0) {
        await supabase.from('checklists').update(dbUpdates).eq('id', id);
      }
    }, 1000); // 1 second debounce
  }, []);

  if (view === 'login') {
    return <LoginPage onLogin={(user) => { setCurrentUser(user); setView('feed'); }} />;
  }

  if (view === 'feed') {
    const pendingManager = checklists.filter(c => c.data?.currentSection === 2).length;
    return (
      <SocialFeed
        user={currentUser}
        onLogout={() => { setCurrentUser(null); setView('login'); }}
        onOpenChecklists={() => setView('dashboard')}
        onNavigateToEmployees={() => setView('employees')}
        pendingManager={pendingManager}
      />
    );
  }

  const activeChecklist = checklists.find(c => c.id === activeChecklistId);

  if (activeChecklist) {
    return (
      <ChecklistView
        checklist={activeChecklist}
        onUpdate={(updates) => handleChecklistUpdate(activeChecklist.id, updates)}
        onBack={() => setActiveChecklistId(null)}
        onTaskAdd={(text) => handleTaskAdd(activeChecklist.id, text)}
        onTaskToggle={(taskId, status) => handleTaskToggle(taskId, status)}
        onTaskDelete={(taskId) => handleTaskDelete(taskId)}
        user={currentUser}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('dashboard')}>
            <div className="bg-rose-gold/10 p-2 rounded-lg">
              <ClipboardList className="w-6 h-6 text-rose-gold" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-rose-gold-dark to-rose-gold bg-clip-text text-transparent font-serif">
              MedBeauty
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setView('feed')}
              className="text-muted-foreground hidden md:flex"
            >
              Feed
            </Button>

            {currentUser?.role === 'RH' && (
              <Button
                variant="ghost"
                onClick={() => setView('employees')}
                className={view === 'employees' ? 'bg-rose-gold/10 text-rose-gold-dark' : 'text-muted-foreground'}
              >
                <Users className="w-4 h-4 mr-2" />
                Funcionários
              </Button>
            )}

            {currentUser?.role === 'Adm' && (
              <Button
                variant="ghost"
                onClick={() => setView(view === 'admin' ? 'dashboard' : 'admin')}
                className={view === 'admin' ? 'bg-rose-gold/10 text-rose-gold-dark' : 'text-muted-foreground'}
              >
                <Shield className="w-4 h-4 mr-2" />
                Painel Admin
              </Button>
            )}

            <div className="flex items-center gap-3 px-3 py-1.5 bg-secondary/50 rounded-full">
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-foreground">{currentUser?.name}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{currentUser?.role}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => { setCurrentUser(null); setView('login'); }} className="rounded-full w-8 h-8">
                <LogOut className="w-4 h-4 text-muted-foreground hover:text-destructive transition-colors" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {view === 'admin' ? (
        <UserManagement />
      ) : view === 'employees' ? (
        <EmployeeDirectory />
      ) : (
        <div className="flex-1">
          <Dashboard
            checklists={checklists}
            onSelect={setActiveChecklistId}
            onCreate={handleCreate}
            user={currentUser}
          />
        </div>
      )}
    </div>
  );
}

export default App
