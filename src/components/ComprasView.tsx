import { useState } from 'react'
import {
    Plus,
    Users,
    CheckCircle2,
    Clock,
    FileText,
    Search,
    Eye,
    MoreVertical,
    ArrowRight,
    ShoppingBag
} from 'lucide-react'
import type { ChecklistData } from './ChecklistView'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface ComprasViewProps {
    checklists: ChecklistData[];
    onSelect: (id: string) => void;
    onCreate: (templateId: string, title?: string) => void;
    user: any;
}

export function ComprasView({ checklists, onSelect, onCreate, user }: ComprasViewProps) {
    const [activeTab, setActiveTab] = useState<'ANDAMENTO' | 'CONCLUIDO'>('ANDAMENTO');
    const [searchTerm, setSearchTerm] = useState('');

    // Filter for Compras department
    const departmentChecklists = checklists.filter(c => {
        const data = c.data || {};
        return data.setor_departamento === 'Compras' || c.type.includes('Compras');
    });

    const stats = {
        andamento: departmentChecklists.filter(c => !c.items.every(i => i.isCompleted)).length,
        concluidos: departmentChecklists.filter(c => c.items.length > 0 && c.items.every(i => i.isCompleted)).length
    };

    const filteredChecklists = departmentChecklists.filter(c => {
        const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase());
        const isFinished = c.items.length > 0 && c.items.every(i => i.isCompleted);

        if (activeTab === 'CONCLUIDO') return matchesSearch && isFinished;
        return matchesSearch && !isFinished;
    });

    return (
        <div className="container mx-auto p-6 max-w-7xl animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-serif text-rose-gold-dark flex items-center gap-2">
                        <ShoppingBag className="w-8 h-8 text-rose-gold" />
                        Compras - Gestão
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Gerencie requisições e processos de compras
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => {
                            const title = prompt("Título da Requisição:", "Nova Compra");
                            if (title) onCreate('compras', title);
                        }}
                        className="bg-rose-gold hover:bg-rose-gold-dark text-white gap-2 h-11"
                    >
                        <Plus className="w-5 h-5" />
                        Nova Requisição
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                    icon={Clock}
                    label="Em Andamento"
                    value={stats.andamento}
                    color="text-amber-600"
                    bgColor="bg-amber-100 dark:bg-amber-900/20"
                />
                <StatCard
                    icon={CheckCircle2}
                    label="Concluídos"
                    value={stats.concluidos}
                    color="text-sage-dark"
                    bgColor="bg-sage/20"
                />
            </div>

            {/* List Control */}
            <Card className="mb-0 border-none bg-transparent shadow-none">
                <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="flex p-1 bg-muted/30 rounded-lg w-fit border border-border/50">
                            <TabButton
                                active={activeTab === 'ANDAMENTO'}
                                onClick={() => setActiveTab('ANDAMENTO')}
                                label="Em Andamento"
                                icon={Clock}
                                count={stats.andamento}
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
                                placeholder="Buscar requisição..."
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
                                <p className="text-muted-foreground font-medium">Nenhum processo encontrado.</p>
                            </div>
                        ) : (
                            filteredChecklists.map((list) => (
                                <ListItem
                                    key={list.id}
                                    list={list}
                                    onSelect={() => onSelect(list.id)}
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

    return (
        <Card
            className="group hover:border-rose-gold/50 cursor-pointer shadow-soft hover:shadow-card transition-all"
            onClick={onSelect}
        >
            <CardContent className="p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-rose-gold/10 flex items-center justify-center text-rose-gold">
                    <ShoppingBag className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-lg truncate">{list.title}</h4>
                        <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground uppercase tracking-wider">
                            ID: {list.id.slice(0, 5)}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Criado em: {new Date(list.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                </div>

                <div className="hidden md:flex flex-col items-end gap-2 px-6 border-l border-r border-border/50">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-rose-gold rounded-full transition-all duration-1000"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className="text-xs text-muted-foreground">{Math.round(progress)}% Concluído</span>
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
