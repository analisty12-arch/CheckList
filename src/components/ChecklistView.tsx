import { useState, type KeyboardEvent } from 'react';
import { ArrowLeft, Plus, Trash2, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AdmissaoFlow } from './AdmissaoFlow';
import { DemissaoFlow } from './DemissaoFlow';

export interface ChecklistItem {
    id: string;
    text: string;
    isCompleted: boolean;
    role: string;
}

export interface ChecklistData {
    id: string;
    title: string;
    type: string;
    createdAt: number;
    items: ChecklistItem[];
    data?: any;
}

interface ChecklistViewProps {
    checklist: ChecklistData;
    onUpdate: (updates: Partial<ChecklistData>) => void;
    onBack: () => void;
    onTaskAdd: (text: string) => void;
    onTaskToggle: (taskId: string, isCompleted: boolean) => void;
    onTaskDelete: (taskId: string) => void;
    user: any;
}

export function ChecklistView({
    checklist,
    onUpdate,
    onBack,
    onTaskAdd,
    onTaskToggle,
    onTaskDelete,
    user
}: ChecklistViewProps) {
    const [newItemText, setNewItemText] = useState('');

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            addItem();
        }
    };

    const addItem = () => {
        if (newItemText.trim()) {
            onTaskAdd(newItemText);
            setNewItemText('');
        }
    };

    const isAdmissao = checklist.type === 'Processo de Admissão' || checklist.title.includes('Admissão');
    const isDemissao = checklist.type === 'Processo de Demissão' || checklist.title.includes('Demissão');

    const syncItems = (items: ChecklistItem[], data: any, type: 'admissao' | 'demissao'): ChecklistItem[] => {
        return items.map(item => {
            let isCompleted = item.isCompleted;
            const text = item.text.toLowerCase();

            if (type === 'admissao') {
                if (text.includes('nome completo')) isCompleted = !!(data.nome_completo && (data.nome_exibicao || data.cpf));
                if (text.includes('data de admissão')) isCompleted = !!(data.data_admissao && data.data_inicio);
                if (text.includes('depto, cargo')) isCompleted = !!(data.setor_departamento && data.cargo_funcao);
                if (text.includes('buddy/mentor')) isCompleted = !!data.buddy_mentor;
                if (text.includes('solicitar equipamentos')) isCompleted = data.equipamentos_necessarios?.length > 0;
                if (text.includes('solicitar acessos')) isCompleted = data.acessos_necessarios?.length > 0 || !!data.sharepoint_pasta;
                if (text.includes('conta no ad')) isCompleted = data.conta_ad_criada === 'Sim';
                if (text.includes('e-mail corporativo')) isCompleted = data.email_corporativo_criado === 'Sim';
                if (text.includes('vpn')) isCompleted = data.vpn_configurada === 'Sim';
                if (text.includes('sap b1')) isCompleted = data.usuario_sap_criado === 'Sim';
                if (text.includes('salesforce')) isCompleted = data.perfil_salesforce_criado === 'Sim';
                if (text.includes('pastas de rede')) isCompleted = data.pastas_rede_liberadas === 'Sim';
                if (text.includes('impressoras')) isCompleted = data.impressoras_configuradas === 'Sim';
                if (text.includes('testes gerais')) isCompleted = data.testes_gerais_realizados === 'Sim';
                if (text.includes('recebimento de equipamentos')) isCompleted = data.confirma_recebimento_equipamentos === 'Sim';
                if (text.includes('funcionamento de acessos')) isCompleted = data.confirma_funcionamento_acessos === 'Sim';
                if (text.includes('orientação inicial')) isCompleted = data.recebeu_orientacao_sistemas === 'Sim';
            } else if (type === 'demissao') {
                if (text.includes('carta de demissão') || text.includes('comunicar')) isCompleted = !!data.nome_completo;
                if (text.includes('último dia')) isCompleted = !!data.ultimo_dia;
                if (text.includes('equipamentos físicos')) isCompleted = data.equipamentos_devolvidos === 'Sim' || data.equipamentos_recolhidos === true;
                if (text.includes('pendências de trabalho')) isCompleted = !!data.lista_pendencias;
                if (text.includes('bloquear conta ad')) isCompleted = data.conta_ad_bloqueada === true;
                if (text.includes('bloquear e-mail')) isCompleted = data.email_bloqueado === true;
                if (text.includes('revogar acesso vpn')) isCompleted = data.acesso_vpn_revogado === true;
            }
            return { ...item, isCompleted };
        });
    };

    if (isAdmissao || isDemissao) {
        return (
            <div className="container mx-auto p-4 max-w-4xl animate-in fade-in">
                <div className="mb-6 flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-2xl font-bold font-serif text-rose-gold-dark">{checklist.title}</h1>
                </div>

                {isAdmissao && (
                    <AdmissaoFlow
                        data={checklist.data || {}}
                        onUpdate={(flowData) => {
                            const updatedItems = syncItems(checklist.items, flowData, 'admissao');
                            onUpdate({ data: flowData, items: updatedItems });
                        }}
                        user={user}
                    />
                )}

                {isDemissao && (
                    <DemissaoFlow
                        data={checklist.data || {}}
                        onUpdate={(flowData) => {
                            const updatedItems = syncItems(checklist.items, flowData, 'demissao');
                            onUpdate({ data: flowData, items: updatedItems });
                        }}
                    />
                )}

                <div className="mt-12 pt-8 border-t border-rose-gold/10">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-rose-gold-dark font-serif">
                        <CheckSquare className="w-5 h-5 text-rose-gold" /> Status do Checklist
                    </h2>
                    <Card className="border-rose-gold/20 shadow-soft">
                        <CardContent className="p-6">
                            <div className="space-y-3">
                                {checklist.items.map(item => (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-4 p-4 bg-card border border-rose-gold/5 rounded-xl hover:border-rose-gold/30 transition-all duration-300 group"
                                    >
                                        <Checkbox
                                            checked={item.isCompleted}
                                            disabled={true} // Automatic based on form
                                            className="h-5 w-5 border-rose-gold/50 data-[state=checked]:bg-rose-gold data-[state=checked]:border-rose-gold"
                                        />
                                        <span className={`flex-1 text-sm font-medium transition-colors ${item.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                            {item.text}
                                        </span>
                                        {item.role && (
                                            <Badge variant="secondary" className="bg-rose-gold/10 text-rose-gold-dark border-none font-semibold text-[10px] tracking-wider">
                                                {item.role}
                                            </Badge>
                                        )}
                                    </div>
                                ))}
                                {checklist.items.length === 0 && (
                                    <p className="text-center text-muted-foreground py-12 italic">
                                        Nenhuma tarefa configurada para este fluxo.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    // Default View (fallback)
    return (
        <div className="h-screen flex flex-col bg-background">
            <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 h-16 flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            {checklist.title}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {checklist.items.filter(i => i.isCompleted).length} of {checklist.items.length} completed
                        </p>
                    </div>
                </div>
            </header>

            <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
                <Card className="border-primary/20 shadow-lg shadow-primary/5">
                    <CardContent className="p-6">
                        <div className="flex gap-2 mb-6">
                            <Input
                                type="text"
                                placeholder="Add new task..."
                                value={newItemText}
                                onChange={(e) => setNewItemText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="flex-1"
                            />
                            <Button onClick={addItem}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {checklist.items.map(item => (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-3 p-3 bg-card border rounded-lg hover:border-primary/50 transition-colors group"
                                >
                                    <Checkbox
                                        checked={item.isCompleted}
                                        onCheckedChange={(checked: boolean) => onTaskToggle(item.id, checked)}
                                    />
                                    <span className={`flex-1 ${item.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                                        {item.text}
                                    </span>
                                    {item.role && (
                                        <span className="text-xs px-2 py-1 bg-secondary rounded-full text-secondary-foreground">
                                            {item.role}
                                        </span>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => onTaskDelete(item.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                            {checklist.items.length === 0 && (
                                <div className="text-center py-12 text-muted-foreground">
                                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary mb-4">
                                        <CheckSquare className="h-6 w-6" />
                                    </div>
                                    <p>No tasks yet. Add one above!</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
