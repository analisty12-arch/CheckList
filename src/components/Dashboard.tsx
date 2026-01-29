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
}

export function Dashboard({ checklists, onSelect, onCreate }: DashboardProps) {
    const [activeTab, setActiveTab] = useState<'REVISAO' | 'ANDAMENTO' | 'CONCLUIDO'>('ANDAMENTO');
    const [searchTerm, setSearchTerm] = useState('');

    // Stats calculation
    const stats = {
        andamento: checklists.filter(c => !c.items.every(i => i.isCompleted)).length,
        concluidos: checklists.filter(c => c.items.length > 0 && c.items.every(i => i.isCompleted)).length,
        aguardandoGestor: checklists.filter(c => c.type.includes('Admissão') && c.data?.currentSection === 2).length,
        aguardandoTI: checklists.filter(c => c.type.includes('Admissão') && c.data?.currentSection === 3).length,
        paraRevisao: checklists.filter(c => !c.data || c.data?.currentSection === 1).length
    };

    const filteredChecklists = checklists.filter(c => {
        const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase());
        const isFinished = c.items.length > 0 && c.items.every(i => i.isCompleted);

        if (activeTab === 'CONCLUIDO') return matchesSearch && isFinished;
        if (activeTab === 'REVISAO') return matchesSearch && (!c.data || c.data?.currentSection === 1) && !isFinished;
        return matchesSearch && !isFinished;
    });

    return (
        <div className="container mx-auto p-6 max-w-7xl animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-serif text-rose-gold-dark flex items-center gap-2">
                        <Users className="w-8 h-8 text-rose-gold" />
                        Admissão - RH
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Inicie processos de admissão e acompanhe o fluxo por departamento
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => {
                            const name = prompt("Nome do Colaborador:", "Novo Candidato");
                            if (name) onCreate('admissao', name);
                        }}
                        className="bg-rose-gold hover:bg-rose-gold-dark text-white gap-2 h-11"
                    >
                        <Plus className="w-5 h-5" />
                        Nova Admissão
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                    icon={Users}
                    label="Em Andamento"
                    value={stats.andamento}
                    color="text-rose-gold"
                    bgColor="bg-rose-gold/10"
                />
                <StatCard
                    icon={CheckCircle2}
                    label="Concluídos"
                    value={stats.concluidos}
                    color="text-sage-dark"
                    bgColor="bg-sage/20"
                />
                <StatCard
                    icon={Clock}
                    label="Aguardando Gestor"
                    value={stats.aguardandoGestor}
                    color="text-amber-600"
                    bgColor="bg-amber-100 dark:bg-amber-900/20"
                />
                <StatCard
                    icon={Monitor}
                    label="Aguardando TI"
                    value={stats.aguardandoTI}
                    color="text-blue-600"
                    bgColor="bg-blue-100 dark:bg-blue-900/20"
                />
            </div>

            {/* List Control */}
            <Card className="mb-0 border-none bg-transparent shadow-none">
                <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="flex p-1 bg-muted/30 rounded-lg w-fit border border-border/50">
                            <TabButton
                                active={activeTab === 'REVISAO'}
                                onClick={() => setActiveTab('REVISAO')}
                                label="Para Revisão"
                                count={stats.paraRevisao}
                                icon={FileText}
                            />
                            <TabButton
                                active={activeTab === 'ANDAMENTO'}
                                onClick={() => setActiveTab('ANDAMENTO')}
                                label="Em Andamento"
                                icon={Users}
                            />
                            <TabButton
                                active={activeTab === 'CONCLUIDO'}
                                onClick={() => setActiveTab('CONCLUIDO')}
                                label="Concluídos"
                                icon={CheckCircle2}
                            />
                        </div>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar colaborador..."
                                className="pl-9 bg-white dark:bg-card border-rose-gold/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
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
                </CardContent>
            </Card>
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
