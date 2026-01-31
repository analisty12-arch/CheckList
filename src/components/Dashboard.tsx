import { useState } from 'react'
import {
    Plus,
    Users,
    CheckCircle2,
    Clock,
    Monitor,
    FileText,
    Search,
    Eye,
    MoreVertical,
    ArrowRight
} from 'lucide-react'
import type { ChecklistData } from './ChecklistView'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface DashboardProps {
    checklists: ChecklistData[];
    onSelect: (id: string) => void;
    onCreate: (templateId: string, title?: string) => void;
    user: any;
}

export function Dashboard({ checklists, onSelect, onCreate, user }: DashboardProps) {
    // Role-based logic
    const roleConfig: Record<string, { title: string; pendingSection: number }> = {
        'RH': { title: 'Portal RH', pendingSection: 1 },
        'Gestor': { title: 'Portal do Gestor', pendingSection: 2 },
        'TI': { title: 'Portal TI', pendingSection: 3 },
        'Colaborador': { title: 'Portal do Colaborador', pendingSection: 4 },
        'Adm': { title: 'Visão Geral (Adm)', pendingSection: 0 } // Adm sees all
    };

    const currentRole = user?.role || 'RH'; // Fallback
    const config = roleConfig[currentRole] || roleConfig['RH'];
    const pendingSectionId = config.pendingSection;

    const [searchTerm, setSearchTerm] = useState('');

    const canAccessChecklist = (checklist: ChecklistData) => {
        // Adm view all
        if (!user || user.role === 'Adm') return true;

        const data = checklist.data || {};

        // RH: Sees all? Or maybe just starting ones? Usually RH sees everything for Admission.
        if (user.role === 'RH') return true;

        // TI: Sees all? Or only when it's their turn? Usually sees all active.
        if (user.role === 'TI') return true;

        if (user.role === 'Gestor') {
            // Must match department
            // If user has region, must match region too
            const deptMatch = data.setor_departamento === user.department;

            // If user has NO region, they see all for that department (e.g. Head of Comercial)
            // If user HAS region, they only see that region.
            // If Checklist has NO region (e.g. Financeiro), region check is skipped.
            let regionMatch = true;
            if (user.region && data.regiao_comercial) {
                regionMatch = data.regiao_comercial === user.region;
            }

            return deptMatch && regionMatch;
        }

        // Default: no access
        return false;
    };

    const accessibleChecklists = checklists.filter(canAccessChecklist);

    // Filter "My Pending Actions"
    const myPendingChecklists = accessibleChecklists.filter(c => {
        const currentSection = c.data?.currentSection || 1;
        // Adm sees all active
        if (currentRole === 'Adm') return !c.items.every(i => i.isCompleted);

        // Others see only if section matches their role responsibility
        return currentSection === pendingSectionId && !c.items.every(i => i.isCompleted);
    });

    const [activeTab, setActiveTab] = useState<'PENDENCIAS' | 'TODOS' | 'CONCLUIDO'>(myPendingChecklists.length > 0 ? 'PENDENCIAS' : 'TODOS');

    const filteredChecklists = accessibleChecklists.filter(c => {
        const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase());
        const isFinished = c.items.length > 0 && c.items.every(i => i.isCompleted);
        const currentSection = c.data?.currentSection || 1;

        if (activeTab === 'CONCLUIDO') return matchesSearch && isFinished;
        if (activeTab === 'PENDENCIAS') {
            // Specific logic for PENDENCIAS tab
            if (currentRole === 'Adm') return matchesSearch && !isFinished;
            return matchesSearch && currentSection === pendingSectionId && !isFinished;
        }
        // TODOS / ANDAMENTO
        return matchesSearch && !isFinished;
    });

    return (
        <div className="container mx-auto p-6 max-w-7xl animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-serif text-rose-gold-dark flex items-center gap-2">
                        {currentRole === 'TI' ? <Monitor className="w-8 h-8 text-rose-gold" /> :
                            currentRole === 'Gestor' ? <Users className="w-8 h-8 text-rose-gold" /> :
                                currentRole === 'Colaborador' ? <FileText className="w-8 h-8 text-rose-gold" /> :
                                    <Users className="w-8 h-8 text-rose-gold" />}
                        {config.title}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {myPendingChecklists.length > 0
                            ? `Você tem ${myPendingChecklists.length} processos aguardando sua ação.`
                            : "Nenhuma pendência prioritária no momento."}
                    </p>
                </div>
                <div className="flex gap-2">
                    {/* Only RH or Adm should create admissions */}
                    {(currentRole === 'RH' || currentRole === 'Adm') && (
                        <Button
                            onClick={() => {
                                const name = prompt("Nome do Colaborador:", "Novo Candidato");
                                if (name) onCreate('admissao', name);
                            }}
                            className="bg-rose-gold hover:bg-rose-gold-dark text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Nova Admissão
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats Cards - Simplified for relevant role */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {/* Only show "Minhas Pendências" count prominently */}
                <Card className="bg-rose-gold/10 border-none shadow-soft">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-rose-gold/20 rounded-full text-rose-gold-dark">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Minhas Pendências</p>
                                <h3 className="text-2xl font-bold text-rose-gold-dark">{myPendingChecklists.length}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                {/* Show total active for context */}
                <Card className="shadow-soft">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-100 rounded-full text-slate-600">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total em Andamento</p>
                                <h3 className="text-2xl font-bold text-slate-800">
                                    {accessibleChecklists.filter(c => !c.items.every(i => i.isCompleted)).length}
                                </h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-white"
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={activeTab === 'PENDENCIAS' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('PENDENCIAS')}
                        className={activeTab === 'PENDENCIAS' ? 'bg-rose-gold hover:bg-rose-gold-dark' : ''}
                    >
                        Minhas Pendências
                        {myPendingChecklists.length > 0 && (
                            <Badge variant="secondary" className="ml-2 bg-white/20 text-current">{myPendingChecklists.length}</Badge>
                        )}
                    </Button>
                    <Button
                        variant={activeTab === 'TODOS' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('TODOS')}
                        className={activeTab === 'TODOS' ? 'bg-rose-gold hover:bg-rose-gold-dark' : ''}
                    >
                        Todos
                    </Button>
                    <Button
                        variant={activeTab === 'CONCLUIDO' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('CONCLUIDO')}
                        className={activeTab === 'CONCLUIDO' ? 'bg-rose-gold hover:bg-rose-gold-dark' : ''}
                    >
                        Concluídos
                    </Button>
                </div>
            </div>
            {/* Checklists List */}
            <div className="space-y-3">
                {filteredChecklists.length === 0 ? (
                    <div className="text-center py-20 bg-rose-gold/5 rounded-2xl border-2 border-dashed border-rose-gold/20">
                        <FileText className="w-12 h-12 text-rose-gold/30 mx-auto mb-4" />
                        <p className="text-muted-foreground font-medium">Nenhum processo encontrado nesta categoria.</p>
                    </div>
                ) : (
                    filteredChecklists.map((list) => (
                        <ListItem
                            key={list.id}
                            list={list}
                            onSelect={() => onSelect(list.id)}
                        // onDelete={onDelete}
                        />
                    ))
                )}
            </div>
        </div>
    )
}

function StatCard({ icon: Icon, label, value, color, bgColor }: any) {
    return (
        <Card className="border-none shadow-soft hover:shadow-card transition-all">
            <CardContent className="p-6 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${bgColor}`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                </div>
            </CardContent>
        </Card>
    )
}

function TabButton({ active, onClick, label, count, icon: Icon }: any) {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm font-medium
                ${active
                    ? "bg-white dark:bg-card text-rose-gold-dark shadow-sm ring-1 ring-border/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/50"
                }
            `}
        >
            <Icon className="w-4 h-4" />
            {label}
            {count !== undefined && count > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${active ? 'bg-rose-gold text-white' : 'bg-rose-gold/20 text-rose-gold'}`}>
                    {count}
                </span>
            )}
        </button>
    )
}

function ListItem({ list, onSelect }: { list: ChecklistData, onSelect: () => void }) {
    const completedTasks = list.items.filter(i => i.isCompleted).length;
    const totalTasks = list.items.length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Determine current step badge
    let statusBadge = { label: 'Em Andamento', color: 'bg-rose-gold', textColor: 'text-white' };
    if (list.items.every(i => i.isCompleted) && totalTasks > 0) {
        statusBadge = { label: 'Concluído', color: 'bg-sage', textColor: 'text-sage-dark' };
    } else if (list.data?.currentSection === 2) {
        statusBadge = { label: 'Gestor', color: 'bg-amber-100', textColor: 'text-amber-700' };
    } else if (list.data?.currentSection === 3) {
        statusBadge = { label: 'TI', color: 'bg-blue-100', textColor: 'text-blue-700' };
    } else if (list.data?.currentSection === 4) {
        statusBadge = { label: 'Colaborador', color: 'bg-sage/30', textColor: 'text-sage-dark' };
    } else if (!list.data || list.data?.currentSection === 1) {
        statusBadge = { label: 'Revisão RH', color: 'bg-rose-gold/20', textColor: 'text-rose-gold-dark' };
    }

    return (
        <Card
            className="group hover:border-rose-gold/50 cursor-pointer shadow-soft hover:shadow-card transition-all"
            onClick={onSelect}
        >
            <CardContent className="p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-rose-gold/10 flex items-center justify-center text-rose-gold">
                    <Users className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-lg truncate">{list.title}</h4>
                        <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground uppercase tracking-wider">
                            ID: {list.id.slice(0, 5)}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>{list.data?.cargo_funcao || 'Cargo não definido'} • {list.data?.setor_departamento || 'Setor não definido'}</span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Início: {list.data?.data_inicio || 'A definir'}
                        </span>
                    </div>
                </div>

                <div className="hidden md:flex flex-col items-end gap-2 px-6 border-l border-r border-border/50">
                    <div className="flex items-center gap-2">
                        <span className={`${statusBadge.color} ${statusBadge.textColor} text-[11px] font-bold px-3 py-1 rounded-full uppercase`}>
                            {statusBadge.label}
                        </span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Setor: {list.data?.setor_departamento?.toUpperCase() || 'MARKETING'}</span>
                    </div>
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-rose-gold rounded-full transition-all duration-1000"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 pl-2">
                    <Button variant="ghost" size="icon" className="rounded-full shadow-soft hover:bg-rose-gold hover:text-white transition-all">
                        <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground">
                        <MoreVertical className="w-4 h-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
