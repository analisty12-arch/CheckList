import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
} from "@/components/ui/form";
import {
    UserMinus,
    Briefcase,
    Monitor,
    FileSpreadsheet,
    Save,
    Calendar,
    AlertCircle
} from "lucide-react";

// Schemas
const secaoRHSchema = z.object({
    nome_completo: z.string().min(1, "Nome é obrigatório"),
    cargo: z.string().optional(),
    departamento: z.string().optional(),
    data_comunicado: z.string().optional(),
    ultimo_dia: z.string().optional(),
    motivo_desligamento: z.string().optional(),
    tipo_aviso: z.string().optional(),
    observacoes_rh: z.string().optional(),
    lista_equipamentos: z.string().optional(),
});

const secaoGestorSchema = z.object({
    equipamentos_devolvidos: z.enum(["Sim", "Nao", "Parcial"]).optional(),
    lista_pendencias: z.string().optional(),
    backup_realizado: z.enum(["Sim", "Nao", "NaoAplica"]).optional(),
    projeto_transferido: z.enum(["Sim", "Nao", "NaoAplica"]).optional(),
    chave_acesso_entregue: z.enum(["Sim", "Nao", "NaoAplica"]).optional(),
    observacoes_gestor: z.string().optional(),
});

const secaoTISchema = z.object({
    conta_ad_bloqueada: z.boolean().default(false),
    email_bloqueado: z.boolean().default(false),
    acesso_vpn_revogado: z.boolean().default(false),
    licencas_removidas: z.boolean().default(false),
    equipamentos_recolhidos: z.boolean().default(false),
    observacoes_ti: z.string().optional(),
});

const fullSchema = secaoRHSchema.merge(secaoGestorSchema).merge(secaoTISchema);
type FormData = z.infer<typeof fullSchema>;

const sections = [
    { id: 1, title: "Dados do Desligamento", icon: UserMinus, role: "RH" },
    { id: 2, title: "Gestão & Equipamentos", icon: Briefcase, role: "Gestor" },
    { id: 3, title: "Bloqueios TI", icon: Monitor, role: "TI" },
    { id: 4, title: "Homologação & Pagto", icon: FileSpreadsheet, role: "DP" },
];

interface DemissaoFlowProps {
    data: any;
    onUpdate: (data: any) => void;
    isReadOnly?: boolean;
}

export function DemissaoFlow({
    data,
    onUpdate,
    isReadOnly = false,
}: DemissaoFlowProps) {
    const [currentSection, setCurrentSection] = useState(data?.currentSection || 1);

    const form = useForm<FormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(fullSchema) as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        defaultValues: {
            nome_completo: data?.nome_completo || "",
            conta_ad_bloqueada: data?.conta_ad_bloqueada || false,
            email_bloqueado: data?.email_bloqueado || false,
            acesso_vpn_revogado: data?.acesso_vpn_revogado || false,
            licencas_removidas: data?.licencas_removidas || false,
            equipamentos_recolhidos: data?.equipamentos_recolhidos || false,
            ...data,
        } as any,
    });

    const handleSectionChange = (sectionId: number) => {
        setCurrentSection(sectionId);
        onUpdate({ ...form.getValues(), currentSection: sectionId });
    };

    const progress = (currentSection / sections.length) * 100;

    // Monitoramento em tempo real para atualização instantânea do checklist
    useEffect(() => {
        const subscription = form.watch((value) => {
            onUpdate({ ...value, currentSection });
        });
        return () => subscription.unsubscribe();
    }, [form, currentSection, onUpdate]);

    const handleSubmit = (values: FormData) => {
        onUpdate({ ...values, currentSection });
        alert("Dados salvos com sucesso!");
    };

    return (
        <div className="space-y-6">
            <Card className="border-rose-gold/20 bg-gradient-to-r from-rose-gold/5 to-transparent shadow-soft">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-serif text-rose-gold-dark flex items-center gap-2">
                                <UserMinus className="h-6 w-6 text-rose-gold" />
                                MEDBEAUTY — Checklist de Desligamento
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Encerramento de ciclo e devolução de ativos.
                                <br />
                                <span className="text-xs font-medium mt-1 inline-block">
                                    Fluxo: RH → Gestor → TI → DP
                                </span>
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-sm px-3 py-1 border-rose-gold/30 text-rose-gold-dark bg-rose-gold/5">
                            Seção {currentSection} de {sections.length}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            {sections.map((section) => (
                                <div
                                    key={section.id}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all cursor-pointer ${section.id === currentSection
                                        ? "bg-rose-gold text-white shadow-md"
                                        : "text-muted-foreground hover:bg-rose-gold/10 hover:text-rose-gold-dark"
                                        }`}
                                    onClick={() => handleSectionChange(section.id)}
                                >
                                    <section.icon className="h-4 w-4" />
                                    <span className="hidden sm:inline">{section.role}</span>
                                </div>
                            ))}
                        </div>
                        <Progress value={progress} className="h-2" indicatorClassName="bg-rose-gold" />
                    </div>
                </CardContent>
            </Card>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                    {currentSection === 1 && (
                        <Card className="border-none shadow-soft overflow-hidden">
                            <CardHeader className="bg-rose-gold/5">
                                <CardTitle className="text-lg font-medium flex items-center gap-2">
                                    <UserMinus className="h-5 w-5 text-rose-gold" />
                                    Dados do Desligamento (RH)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <FormField
                                    control={form.control}
                                    name="nome_completo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome Completo do Colaborador</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nome do colaborador..." {...field} disabled={isReadOnly} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="data_comunicado"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Data do Comunicado</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                        <Input type="date" className="pl-9" {...field} disabled={isReadOnly} />
                                                    </div>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="ultimo_dia"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Último Dia de Trabalho</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                        <Input type="date" className="pl-9" {...field} disabled={isReadOnly} />
                                                    </div>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="motivo_desligamento"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Motivo do Desligamento</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger disabled={isReadOnly}>
                                                        <SelectValue placeholder="Selecione o motivo" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="pedido_demissao">Pedido de Demissão</SelectItem>
                                                    <SelectItem value="sem_justa_causa">Dispensa Sem Justa Causa</SelectItem>
                                                    <SelectItem value="com_justa_causa">Dispensa Com Justa Causa</SelectItem>
                                                    <SelectItem value="termino_contrato">Término de Contrato</SelectItem>
                                                    <SelectItem value="acordo">Acordo entre as Partes</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="observacoes_rh"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Observações Adicionais</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Notas relevantes..." {...field} disabled={isReadOnly} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    )}

                    {currentSection === 2 && (
                        <Card className="border-none shadow-soft overflow-hidden">
                            <CardHeader className="bg-rose-gold/5">
                                <CardTitle className="text-lg font-medium flex items-center gap-2">
                                    <Briefcase className="h-5 w-5 text-rose-gold" />
                                    Gestão & Devolução de Equipamentos
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 flex gap-3 text-amber-800 text-sm">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p>O gestor deve validar a entrega física de todos os itens listados no termo de responsabilidade do colaborador.</p>
                                </div>
                                <FormField
                                    control={form.control}
                                    name="equipamentos_devolvidos"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Status de Devolução de Ativos</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger disabled={isReadOnly}>
                                                        <SelectValue placeholder="Selecione o motivo" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Sim">Sim, todos os equipamentos devolvidos</SelectItem>
                                                    <SelectItem value="Nao">Nenhum equipamento devolvido ainda</SelectItem>
                                                    <SelectItem value="Parcial">Devolução parcial (ver observações)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="backup_realizado"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Backup Arquivos?</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl><SelectTrigger disabled={isReadOnly}><SelectValue placeholder="Status" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Sim">Sim</SelectItem>
                                                        <SelectItem value="Nao">Não</SelectItem>
                                                        <SelectItem value="NaoAplica">N/A</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="projeto_transferido"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Passagem Bastão?</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl><SelectTrigger disabled={isReadOnly}><SelectValue placeholder="Status" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Sim">Sim</SelectItem>
                                                        <SelectItem value="Nao">Não</SelectItem>
                                                        <SelectItem value="NaoAplica">N/A</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="chave_acesso_entregue"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Chaves/Cartão?</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl><SelectTrigger disabled={isReadOnly}><SelectValue placeholder="Status" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Sim">Sim</SelectItem>
                                                        <SelectItem value="Nao">Não</SelectItem>
                                                        <SelectItem value="NaoAplica">N/A</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="lista_pendencias"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Pendências de Trabalho</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Liste tarefas não concluídas..." {...field} disabled={isReadOnly} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    )}

                    {currentSection === 3 && (
                        <Card className="border-none shadow-soft overflow-hidden">
                            <CardHeader className="bg-rose-gold/5">
                                <CardTitle className="text-lg font-medium flex items-center gap-2">
                                    <Monitor className="h-5 w-5 text-rose-gold" />
                                    Procedimentos Técnicos (TI)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="conta_ad_bloqueada"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center gap-3 space-y-0 border border-rose-gold/10 p-4 rounded-lg bg-white shadow-sm">
                                                <FormControl>
                                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isReadOnly} />
                                                </FormControl>
                                                <FormLabel className="font-medium">Bloquear Conta AD / Servidor</FormLabel>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="email_bloqueado"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center gap-3 space-y-0 border border-rose-gold/10 p-4 rounded-lg bg-white shadow-sm">
                                                <FormControl>
                                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isReadOnly} />
                                                </FormControl>
                                                <FormLabel className="font-medium">Remover/Bloquear Email Corporativo</FormLabel>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="acesso_vpn_revogado"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center gap-3 space-y-0 border border-rose-gold/10 p-4 rounded-lg bg-white shadow-sm">
                                                <FormControl>
                                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isReadOnly} />
                                                </FormControl>
                                                <FormLabel className="font-medium">Revogar Acessos Externos (VPN)</FormLabel>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="equipamentos_recolhidos"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center gap-3 space-y-0 border border-rose-gold/10 p-4 rounded-lg bg-white shadow-sm">
                                                <FormControl>
                                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isReadOnly} />
                                                </FormControl>
                                                <FormLabel className="font-medium">Confirmar Devolução de Hardware</FormLabel>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="observacoes_ti"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Notas de TI</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Números de série, pendências..." {...field} disabled={isReadOnly} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    )}

                    {!isReadOnly && (
                        <div className="flex justify-end pt-4">
                            <Button type="submit" className="gap-2 bg-rose-gold hover:bg-rose-gold-dark text-white">
                                <Save className="w-4 h-4" />
                                Salvar Alterações
                            </Button>
                        </div>
                    )}
                </form>
            </Form>
        </div>
    );
}
