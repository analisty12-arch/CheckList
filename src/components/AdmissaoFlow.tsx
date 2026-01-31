import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Form,
    FormControl,
    // FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    User,
    Briefcase,
    Monitor,
    CheckCircle2,
    Save,
    Send,
    ClipboardList
} from "lucide-react";

// Departments
const DEPARTAMENTOS = [
    { value: "Financeiro", label: "Financeiro" },
    { value: "Marketing", label: "Marketing" },
    { value: "Comercial", label: "Comercial" },
    { value: "Logística", label: "Logística" },
    { value: "Jurídico", label: "Jurídico" },
    { value: "TI", label: "Tech Digital" },
    { value: "RH", label: "Recursos Humanos" },
];

const REGIOES_COMERCIAL = [
    { value: "Norte/Nordeste", label: "Norte/Nordeste" },
    { value: "Sul", label: "Sul" },
    { value: "Sudeste", label: "Sudeste" },
    { value: "Centro", label: "Centro" },
    { value: "Inside Sales", label: "Inside Sales" },
];

// Schema Section 1 - RH
const secaoRHSchema = z.object({
    nome_completo: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    nome_exibicao: z.string().min(1, "Nome de exibição é obrigatório"),
    cpf: z.string().optional(),
    data_admissao: z.string().min(1, "Data de admissão é obrigatória"),
    data_inicio: z.string().catch(""),
    tipo_contratacao: z.string().catch(""),
    setor_departamento: z.string().catch(""),
    filial_unidade: z.string().optional(),
    gestor_direto: z.string().optional(),
    email_gestor: z.string().email("Email inválido").optional().or(z.literal("")),
    cargo_funcao: z.string().min(1, "Cargo é obrigatório"),
    regime_trabalho: z.enum(["Presencial", "Híbrido", "Remoto", ""]).optional(),
    regiao_comercial: z.string().optional(),
    observacoes_rh: z.string().optional(),
});

// Schema Section 2 - Gestor
const secaoGestorSchema = z.object({
    buddy_mentor: z.string().optional().nullable(),
    equipamentos_necessarios: z.array(z.string()).optional().default([]).nullable(),
    softwares_necessarios: z.array(z.string()).optional().default([]).nullable(),
    acessos_necessarios: z.array(z.string()).optional().default([]).nullable(),
    sharepoint_pasta: z.string().optional().nullable(),
    outros_acessos: z.string().optional().nullable(),
    necessita_impressora: z.enum(["Sim", "Nao", ""]).optional().nullable(),
    necessita_vpn: z.enum(["Sim", "Nao", ""]).optional().nullable(),
    observacoes_gestor: z.string().optional().nullable(),
});

// Options
const EQUIPAMENTOS_OPTIONS = [
    { value: "Notebook", label: "Notebook" },
    { value: "Desktop", label: "Desktop" },
    { value: "Celular", label: "Celular" },
    { value: "Monitor", label: "Monitor" },
    { value: "HeadSet", label: "HeadSet" },
    { value: "Mouse", label: "Mouse" },
    { value: "Teclado", label: "Teclado" },
    { value: "Webcam", label: "Webcam" },
];

const SOFTWARES_OPTIONS = [
    { value: "Microsoft 365", label: "Microsoft 365 (Office, Teams, Email)" },
    { value: "SAP B1", label: "SAP B1" },
    { value: "Salesforce", label: "Salesforce" },
    { value: "Adobe CC", label: "Adobe Creative Cloud" },
    { value: "Power BI", label: "Power BI" },
    { value: "Visual Studio", label: "Visual Studio" },
];

const ACESSOS_OPTIONS = [
    { value: "Rede Corporativa", label: "Acesso à Rede" },
    { value: "VPN", label: "VPN (Acesso Remoto)" },
    { value: "Sharepoint", label: "Sharepoint / Pastas" },
    { value: "Impressão", label: "Impressoras" },
];

// Schema Section 3 - TI
const secaoTISchema = z.object({
    conta_ad_criada: z.enum(["Sim", "Nao", "NaoAplica", ""]).optional().nullable(),
    email_corporativo_criado: z.enum(["Sim", "Nao", "NaoAplica", ""]).optional().nullable(),
    licencas_microsoft365: z.array(z.string()).optional().nullable(),
    vpn_configurada: z.enum(["Sim", "Nao", "NaoAplica", ""]).optional().nullable(),
    softwares_instalados: z.enum(["Sim", "Nao", ""]).optional().nullable(),
    usuario_sap_criado: z.enum(["Sim", "Nao", "NaoAplica", ""]).optional().nullable(),
    perfil_salesforce_criado: z.enum(["Sim", "Nao", "NaoAplica", ""]).optional().nullable(),
    pastas_rede_liberadas: z.enum(["Sim", "Nao", ""]).optional().nullable(),
    impressoras_configuradas: z.enum(["Sim", "Nao", ""]).optional().nullable(),
    testes_gerais_realizados: z.enum(["Sim", "Nao", ""]).optional().nullable(),
    observacoes_ti: z.string().optional().nullable(),
});

// Schema Section 4 - Colaborador
const secaoColaboradorSchema = z.object({
    confirma_recebimento_equipamentos: z.enum(["Sim", "Nao", ""]).optional().nullable(),
    confirma_funcionamento_acessos: z.enum(["Sim", "Nao", ""]).optional().nullable(),
    recebeu_orientacao_sistemas: z.enum(["Sim", "Nao", ""]).optional().nullable(),
    sabe_solicitar_suporte: z.enum(["Sim", "Nao", ""]).optional().nullable(),
    observacoes_colaborador: z.string().optional().nullable(),
});

const fullSchema = secaoRHSchema
    .merge(secaoGestorSchema)
    .merge(secaoTISchema)
    .merge(secaoColaboradorSchema);

type FormData = z.infer<typeof fullSchema>;

const sections = [
    { id: 1, title: "Dados do Colaborador", icon: User, role: "RH" },
    { id: 2, title: "Definições do Gestor", icon: Briefcase, role: "Gestor" },
    { id: 3, title: "Configuração TI", icon: Monitor, role: "TI" },
    { id: 4, title: "Documentos", icon: CheckCircle2, role: "Colaborador" },
];

interface AdmissaoFlowProps {
    data: any;
    onUpdate: (data: any) => void;
    isReadOnly?: boolean;
    user?: any;
}

export function AdmissaoFlow({
    data,
    onUpdate,
    isReadOnly = false,
    user
}: AdmissaoFlowProps) {
    const [currentSection, setCurrentSection] = useState(data?.currentSection || 1);
    const [isSendingEmail, setIsSendingEmail] = useState(false);

    // Determine permissions based on User Role
    const userRole = user?.role;
    const isAdm = userRole === 'Adm';

    // Current section role requirement
    const sectionRoles: Record<number, string[]> = {
        1: ['RH'],
        2: ['Gestor'],
        3: ['TI'],
        4: ['Colaborador'] // or generic/TI/RH if helper needed
    };

    const allowedRoles = sectionRoles[currentSection] || [];
    // Can edit if: passed isReadOnly is false AND (Admin OR User has required role)
    // For Gestor, we might want to enforce Department match, but simplified for now to Role check.
    const canEdit = !isReadOnly && (isAdm || allowedRoles.includes(userRole));

    // Disable inputs if cannot edit
    const isSectionReadOnly = !canEdit;

    const handleSectionChange = (sectionId: number) => {
        // Allow navigation to view, but editing is controlled by isSectionReadOnly logic above
        setCurrentSection(sectionId);
        // Don't auto-update on nav
    };

    const form = useForm<FormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(fullSchema) as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        defaultValues: {
            nome_completo: "",
            nome_exibicao: "",
            cpf: "",
            data_admissao: "",
            data_inicio: "",
            tipo_contratacao: "" as any,
            setor_departamento: "",
            filial_unidade: "",
            gestor_direto: "",
            email_gestor: "",
            cargo_funcao: "",
            regime_trabalho: "" as any,
            regiao_comercial: "",
            observacoes_rh: "",
            buddy_mentor: "",
            equipamentos_necessarios: [],
            softwares_necessarios: [],
            acessos_necessarios: [],
            sharepoint_pasta: "",
            outros_acessos: "",
            necessita_impressora: undefined,
            observacoes_gestor: "",
            conta_ad_criada: undefined,
            email_corporativo_criado: undefined,
            licencas_microsoft365: [],
            vpn_configurada: undefined,
            softwares_instalados: undefined,
            usuario_sap_criado: undefined,
            perfil_salesforce_criado: undefined,
            pastas_rede_liberadas: undefined,
            impressoras_configuradas: undefined,
            testes_gerais_realizados: undefined,
            observacoes_ti: "",
            confirma_recebimento_equipamentos: undefined,
            confirma_funcionamento_acessos: undefined,
            recebeu_orientacao_sistemas: undefined,
            sabe_solicitar_suporte: undefined,
            observacoes_colaborador: "",
            ...data,
        } as any,
    });

    const progress = (currentSection / sections.length) * 100;

    // Monitoramento em tempo real para atualização instantânea do checklist
    useEffect(() => {
        const subscription = form.watch((value) => {
            // Only emit updates if user has permission to edit this section
            if (canEdit) {
                onUpdate({ ...value, currentSection });
            }
        });
        return () => subscription.unsubscribe();
    }, [form, currentSection, onUpdate, canEdit]);

    const handleSubmit = async (values: FormData) => {
        if (!canEdit) {
            alert("Você não tem permissão para salvar nesta etapa.");
            return;
        }

        setIsSendingEmail(true);

        // Simulação de delay/envio
        await new Promise(resolve => setTimeout(resolve, 1500));

        let nextSection = currentSection;
        let successMessage = "";

        if (currentSection < sections.length) {
            nextSection = currentSection + 1;

            if (currentSection === 1) {
                successMessage = `Sucesso!\n\n1. Dados salvos no sistema.\n2. E-mail de notificação enviado para ${values.email_gestor || 'o gestor'}.\n\nO processo agora está na aba do Gestor.`;
            } else if (currentSection === 2) {
                successMessage = "Configurações do Gestor salvas! O processo foi enviado para o TI configurar os acessos.";
            } else if (currentSection === 3) {
                successMessage = "Configurações de TI concluídas! O checklist agora está pronto para a conferência final do Colaborador.";
            }
        } else {
            successMessage = "Processo concluído e salvo com sucesso!";
        }

        setIsSendingEmail(false);
        setCurrentSection(nextSection);
        onUpdate({ ...values, currentSection: nextSection });
        alert(successMessage);
    };

    const onFormError = (errors: any) => {
        console.error("Form Validation Errors:", errors);
        const errorFields = Object.keys(errors).map(field => {
            const msg = errors[field].message || "Campo inválido";
            return `- ${field}: ${msg}`;
        }).join("\n");
        alert("Ops! Alguns campos precisam de atenção:\n" + errorFields);
    };

    const getButtonText = () => {
        if (isSendingEmail) return "Processando...";
        switch (currentSection) {
            case 1: return "Enviar ao Gestor";
            case 2: return "Enviar para TI";
            case 3: return "Enviar para Colaborador";
            case 4: return "Finalizar Admissão";
            default: return "Salvar";
        }
    };

    // If section explicitly doesn't match role, show readonly banner? 
    // Or just rely on disabled inputs.

    // Specific logic for Department Validation can be added here if needed
    // e.g. if (userRole === 'Gestor' && user.department !== data.setor_departamento) canEdit = false;

    return (
        <div className="space-y-6">
            {!canEdit && (
                <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 rounded shadow-sm" role="alert">
                    <p className="font-bold">Modo de Visualização</p>
                    <p>Você não tem permissão para editar esta etapa ({sections.find(s => s.id === currentSection)?.role}).</p>
                </div>
            )}

            <Card className="border-rose-gold/20 bg-gradient-to-r from-rose-gold/5 to-transparent shadow-soft">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-serif text-rose-gold-dark flex items-center gap-2">
                                <User className="h-6 w-6 text-rose-gold" />
                                MEDBEAUTY — Checklist de Admissão
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Formulário oficial de admissão.
                                <br />
                                <span className="text-xs font-medium mt-1 inline-block">
                                    Fluxo: RH → Gestor → TI → Colaborador
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
                                    // onClick={() => handleSectionChange(section.id)} // Desabilitado para forçar o fluxo sequencial se desejar, ou manter para debug
                                    onClick={() => handleSectionChange(section.id)}
                                >
                                    <section.icon className="h-4 w-4" />
                                    <span className="hidden sm:inline">{section.role}</span>
                                </div>
                            ))}
                        </div>
                        <Progress value={progress} className="h-1 bg-rose-gold/20" indicatorClassName="bg-rose-gold" />
                    </div>
                </CardContent>
            </Card>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit, onFormError)} className="space-y-6">

                    {/* SECAO 1 - RH */}
                    {currentSection === 1 && (
                        <Card>
                            <CardHeader className="bg-rose-gold/10 dark:bg-rose-gold/20 rounded-t-lg border-b border-rose-gold/10">
                                <CardTitle>Dados do Colaborador (RH)</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="nome_completo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    1. Nome completo <span className="text-destructive">*</span>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Insira o nome completo" {...field} disabled={isSectionReadOnly} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="nome_exibicao"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    2. Nome Exibição <span className="text-destructive">*</span>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Como o colaborador será chamado" {...field} disabled={isSectionReadOnly} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="cargo_funcao"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    3. Cargo <span className="text-destructive">*</span>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ex: Analista de RH" {...field} disabled={isSectionReadOnly} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="setor_departamento"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>4. Setor <span className="text-destructive">*</span></FormLabel>
                                                <FormControl>
                                                    <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-2 gap-2" disabled={isSectionReadOnly}>
                                                        {DEPARTAMENTOS.map(d => (
                                                            <div key={d.value} className="flex items-center space-x-2">
                                                                <RadioGroupItem value={d.value} id={d.value} disabled={isSectionReadOnly} />
                                                                <Label htmlFor={d.value}>{d.label}</Label>
                                                            </div>
                                                        ))}
                                                    </RadioGroup>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {form.watch("setor_departamento") === "Comercial" && (
                                        <FormField
                                            control={form.control}
                                            name="regiao_comercial"
                                            render={({ field }) => (
                                                <FormItem className="animate-in slide-in-from-left-2 fade-in duration-300">
                                                    <FormLabel>4.1 Região Comercial <span className="text-destructive">*</span></FormLabel>
                                                    <FormControl>
                                                        <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-2 gap-2" disabled={isSectionReadOnly}>
                                                            {REGIOES_COMERCIAL.map(r => (
                                                                <div key={r.value} className="flex items-center space-x-2">
                                                                    <RadioGroupItem value={r.value} id={`regiao-${r.value}`} disabled={isSectionReadOnly} />
                                                                    <Label htmlFor={`regiao-${r.value}`}>{r.label}</Label>
                                                                </div>
                                                            ))}
                                                        </RadioGroup>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="tipo_contratacao"
                                        render={({ field }) => (
                                            <FormItem className="col-span-1 md:col-span-1">
                                                <FormLabel>5. Tipo Contratação <span className="text-destructive">*</span></FormLabel>
                                                <FormControl>
                                                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col gap-2" disabled={isSectionReadOnly}>
                                                        {["CLT", "PJ", "Estágio"].map(t => (
                                                            <div key={t} className="flex items-center space-x-2">
                                                                <RadioGroupItem value={t} id={t} disabled={isSectionReadOnly} />
                                                                <Label htmlFor={t}>{t}</Label>
                                                            </div>
                                                        ))}
                                                    </RadioGroup>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="data_admissao"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>6. Data Admissão <span className="text-destructive">*</span></FormLabel>
                                                <FormControl><Input type="date" {...field} disabled={isSectionReadOnly} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="data_inicio"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>7. Data de Início <span className="text-destructive">*</span></FormLabel>
                                                <FormControl><Input type="date" {...field} disabled={isSectionReadOnly} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* SECAO 2 - GESTOR */}
                    {currentSection === 2 && (
                        <Card>
                            <CardHeader className="bg-cream-dark dark:bg-warm-gray/20 rounded-t-lg border-b border-warm-gray/10"><CardTitle>Definições do Gestor</CardTitle></CardHeader>
                            <CardContent className="pt-6 space-y-8">
                                <FormField
                                    control={form.control}
                                    name="equipamentos_necessarios"
                                    render={() => (
                                        <FormItem>
                                            <FormLabel className="text-base font-semibold">1. Equipamentos Necessários</FormLabel>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-muted/20 p-4 rounded-lg">
                                                {EQUIPAMENTOS_OPTIONS.map((item) => (
                                                    <FormField
                                                        key={item.value}
                                                        control={form.control}
                                                        name="equipamentos_necessarios"
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={field.value?.includes(item.value) || false}
                                                                        onCheckedChange={(checked: boolean) => {
                                                                            const currentValues = Array.isArray(field.value) ? field.value : [];
                                                                            return checked
                                                                                ? field.onChange([...currentValues, item.value])
                                                                                : field.onChange(currentValues.filter((v: string) => v !== item.value))
                                                                        }}
                                                                        disabled={isSectionReadOnly}
                                                                    />
                                                                </FormControl>
                                                                <FormLabel className="font-normal">{item.label}</FormLabel>
                                                            </FormItem>
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                        </FormItem>
                                    )}
                                />

                                <div className="border-t pt-6">
                                    <FormLabel className="text-base font-semibold mb-3 block">2. Sistemas e Acessos</FormLabel>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="softwares_necessarios"
                                            render={() => (
                                                <FormItem>
                                                    <FormLabel>Softwares Necessários</FormLabel>
                                                    <div className="grid grid-cols-1 gap-2 border p-3 rounded-md">
                                                        {SOFTWARES_OPTIONS.map((item) => (
                                                            <FormField
                                                                key={item.value}
                                                                control={form.control}
                                                                name="softwares_necessarios"
                                                                render={({ field }) => (
                                                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                                        <FormControl>
                                                                            <Checkbox
                                                                                checked={field.value?.includes(item.value) || false}
                                                                                onCheckedChange={(checked: boolean) => {
                                                                                    const currentValues = Array.isArray(field.value) ? field.value : [];
                                                                                    return checked
                                                                                        ? field.onChange([...currentValues, item.value])
                                                                                        : field.onChange(currentValues.filter((v: string) => v !== item.value))
                                                                                }}
                                                                                disabled={isSectionReadOnly}
                                                                            />
                                                                        </FormControl>
                                                                        <FormLabel className="font-normal">{item.label}</FormLabel>
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        ))}
                                                    </div>
                                                </FormItem>
                                            )}
                                        />

                                        <div className="space-y-4">
                                            <FormField
                                                control={form.control}
                                                name="necessita_vpn"
                                                render={({ field }) => (
                                                    <FormItem className="space-y-2">
                                                        <FormLabel>Necessita VPN? (Acesso Remoto)</FormLabel>
                                                        <FormControl>
                                                            <RadioGroup onValueChange={field.onChange} value={field.value || ""} className="flex gap-4" disabled={isSectionReadOnly}>
                                                                <div className="flex items-center space-x-2">
                                                                    <RadioGroupItem value="Sim" id="vpn-sim" />
                                                                    <Label htmlFor="vpn-sim">Sim</Label>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <RadioGroupItem value="Nao" id="vpn-nao" />
                                                                    <Label htmlFor="vpn-nao">Não</Label>
                                                                </div>
                                                            </RadioGroup>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="necessita_impressora"
                                                render={({ field }) => (
                                                    <FormItem className="space-y-2">
                                                        <FormLabel>Necessita Acesso a Impressora?</FormLabel>
                                                        <FormControl>
                                                            <RadioGroup onValueChange={field.onChange} value={field.value || ""} className="flex gap-4" disabled={isSectionReadOnly}>
                                                                <div className="flex items-center space-x-2">
                                                                    <RadioGroupItem value="Sim" id="print-sim" />
                                                                    <Label htmlFor="print-sim">Sim</Label>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <RadioGroupItem value="Nao" id="print-nao" />
                                                                    <Label htmlFor="print-nao">Não</Label>
                                                                </div>
                                                            </RadioGroup>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="sharepoint_pasta"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Pastas de Rede / Sharepoint</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Especifique as pastas (ex: /Financeiro/Contas)" {...field} value={field.value || ""} disabled={isSectionReadOnly} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t pt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="buddy_mentor"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-base font-semibold">3. Buddy / Mentor</FormLabel>
                                                    <FormControl><Input placeholder="Nome do mentor" {...field} value={field.value ?? ""} disabled={isSectionReadOnly} /></FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="observacoes_gestor"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-base font-semibold">4. Observações Gerais</FormLabel>
                                                    <FormControl><Input placeholder="Outras necessidades..." {...field} value={field.value ?? ""} disabled={isSectionReadOnly} /></FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* SECAO 3 - TI */}
                    {currentSection === 3 && (
                        <div className="space-y-6">
                            {/* Summary of Requests */}
                            <Card className="bg-slate-50 border-slate-200">
                                <CardHeader className="pb-3 border-b border-slate-200">
                                    <CardTitle className="text-base text-slate-700 flex items-center gap-2">
                                        <ClipboardList className="h-4 w-4" /> Resumo da Solicitação
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4 grid gap-6 md:grid-cols-2">
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider">Dados do Colaborador (RH)</h4>
                                        <div className="space-y-1 text-sm">
                                            <p><span className="font-medium">Nome Completo:</span> {form.getValues("nome_completo") || "-"}</p>
                                            <p><span className="font-medium">Nome de Exibição:</span> {form.getValues("nome_exibicao") || "-"}</p>
                                            <p><span className="font-medium">Cargo:</span> {form.getValues("cargo_funcao") || "-"}</p>
                                            <p><span className="font-medium">Departamento:</span> {form.getValues("setor_departamento") || "-"}</p>
                                            <p><span className="font-medium">Data Início:</span> {form.getValues("data_inicio") ? new Date(form.getValues("data_inicio")).toLocaleDateString('pt-BR') : "-"}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider">Solicitações do Gestor</h4>
                                        <div className="space-y-2 text-sm">
                                            <div>
                                                <span className="font-medium block">Equipamentos:</span>
                                                {form.getValues("equipamentos_necessarios")?.length > 0
                                                    ? <div className="flex flex-wrap gap-1 mt-1">{form.getValues("equipamentos_necessarios")?.map(e => <Badge key={e} variant="outline" className="bg-white">{e}</Badge>)}</div>
                                                    : <span className="text-muted-foreground">Nenhum</span>}
                                            </div>
                                            <div>
                                                <span className="font-medium block">Softwares:</span>
                                                {form.getValues("softwares_necessarios")?.length > 0
                                                    ? <div className="flex flex-wrap gap-1 mt-1">{form.getValues("softwares_necessarios")?.map(s => <Badge key={s} variant="outline" className="bg-white">{s}</Badge>)}</div>
                                                    : <span className="text-muted-foreground">Nenhum</span>}
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                <div className="bg-white p-2 rounded border">
                                                    <span className="text-xs text-muted-foreground block">VPN</span>
                                                    <span className="font-medium">{form.getValues("necessita_vpn") || "Não"}</span>
                                                </div>
                                                <div className="bg-white p-2 rounded border">
                                                    <span className="text-xs text-muted-foreground block">Impressora</span>
                                                    <span className="font-medium">{form.getValues("necessita_impressora") || "Não"}</span>
                                                </div>
                                            </div>
                                            {form.getValues("sharepoint_pasta") && (
                                                <div className="mt-2 text-xs bg-amber-50 p-2 rounded border border-amber-100 text-amber-800">
                                                    <strong>Pastas/Sharepoint:</strong> {form.getValues("sharepoint_pasta")}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="bg-sage/10 dark:bg-sage/20 rounded-t-lg border-b border-sage/10"><CardTitle>Checklist de Configuração (TI)</CardTitle></CardHeader>
                                <CardContent className="pt-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="conta_ad_criada"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Conta AD Criada?</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                                                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
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
                                            name="email_corporativo_criado"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Email Corporativo Criado?</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                                                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
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

                                    {/* Additional TI Checks to match requirements */}
                                    <div className="space-y-4 pt-4 border-t">
                                        <h4 className="font-semibold text-sm">Configurações Baseadas na Solicitação</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {form.getValues("necessita_vpn") === 'Sim' && (
                                                <FormField
                                                    control={form.control}
                                                    name="vpn_configurada"
                                                    render={({ field }) => (
                                                        <FormItem className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                                            <FormLabel className="text-blue-900">VPN Configurada?</FormLabel>
                                                            <Select onValueChange={field.onChange} value={field.value ?? ""}>
                                                                <FormControl><SelectTrigger className="bg-white"><SelectValue placeholder="Status" /></SelectTrigger></FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="Sim">Sim, configurada</SelectItem>
                                                                    <SelectItem value="Nao">Pendente</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </FormItem>
                                                    )}
                                                />
                                            )}
                                            {form.getValues("necessita_impressora") === 'Sim' && (
                                                <FormField
                                                    control={form.control}
                                                    name="impressoras_configuradas"
                                                    render={({ field }) => (
                                                        <FormItem className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                                                            <FormLabel className="text-amber-900">Impressoras Mapeadas?</FormLabel>
                                                            <Select onValueChange={field.onChange} value={field.value ?? ""}>
                                                                <FormControl><SelectTrigger className="bg-white"><SelectValue placeholder="Status" /></SelectTrigger></FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="Sim">Sim, mapeadas</SelectItem>
                                                                    <SelectItem value="Nao">Pendente</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </FormItem>
                                                    )}
                                                />
                                            )}
                                            <FormField
                                                control={form.control}
                                                name="softwares_instalados"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Softwares Instalados?</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value ?? ""}>
                                                            <FormControl><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger></FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="Sim">Sim, todos</SelectItem>
                                                                <SelectItem value="Nao">Pendente</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <p className="text-xs text-muted-foreground mt-1">Conferir lista: {form.getValues("softwares_necessarios")?.join(", ") || "Nenhum"}</p>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="observacoes_ti"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Observações Técnicas</FormLabel>
                                                <FormControl><Input placeholder="Registro de chamado, patrimônios, etc." {...field} value={field.value || ""} /></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* SECAO 4 - COLABORADOR */}
                    {currentSection === 4 && (
                        <Card>
                            <CardHeader className="bg-blue-50/50 dark:bg-blue-900/20 rounded-t-lg border-b border-blue-100 dark:border-blue-900/30">
                                <CardTitle>Validação do Colaborador</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="confirma_recebimento_equipamentos"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Equipamentos Recebidos</FormLabel>
                                                    <CardDescription>
                                                        Confirmo que recebi todos os equipamentos listados.
                                                    </CardDescription>
                                                </div>
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value === "Sim"}
                                                        onCheckedChange={(checked) => field.onChange(checked ? "Sim" : "Nao")}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="confirma_funcionamento_acessos"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Acessos Funcionando</FormLabel>
                                                    <CardDescription>
                                                        Confirmo que testei meus acessos (Email, AD, etc) e estão ok.
                                                    </CardDescription>
                                                </div>
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value === "Sim"}
                                                        onCheckedChange={(checked) => field.onChange(checked ? "Sim" : "Nao")}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="recebeu_orientacao_sistemas"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Orientação de Sistemas</FormLabel>
                                                    <CardDescription>
                                                        Recebi orientações iniciais sobre os sistemas da empresa.
                                                    </CardDescription>
                                                </div>
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value === "Sim"}
                                                        onCheckedChange={(checked) => field.onChange(checked ? "Sim" : "Nao")}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="observacoes_colaborador"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Observações do Colaborador</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Alguma observação ou pendência?" {...field} value={field.value || ""} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="flex justify-end pt-4">
                        <Button
                            type="submit"
                            className="gap-2 bg-rose-gold hover:bg-rose-gold-dark text-white min-w-[160px]"
                            disabled={isSendingEmail}
                        >
                            {isSendingEmail ? (
                                <>
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Processando...
                                </>
                            ) : (
                                <>
                                    {currentSection < 4 ? <Send className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                    {getButtonText()}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </Form>
        </div >
    );
}
