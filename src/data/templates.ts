export type Role = 'RH' | 'Gestor' | 'TI' | 'Colaborador' | 'DP';

export interface TemplateStep {
    text: string;
    role: Role;
}

export interface Template {
    id: string;
    title: string;
    description: string;
    steps: TemplateStep[];
}

export const templates: Template[] = [
    {
        id: 'admissao',
        title: 'Processo de Admissão',
        description: 'Checklist completo para entrada de novos colaboradores (RH, Gestor, TI)',
        steps: [
            { role: 'RH', text: 'Coletar Nome Completo, CPF e Dados Pessoais' },
            { role: 'RH', text: 'Definição de Data de Admissão e Início' },
            { role: 'RH', text: 'Definição de Depto, Cargo e Gestor Direto' },
            { role: 'Gestor', text: 'Definir Buddy/Mentor para o novo colaborador' },
            { role: 'Gestor', text: 'Solicitar Equipamentos (Notebook, Monitor, etc.)' },
            { role: 'Gestor', text: 'Solicitar Acessos Específicos (Pastas, Sistemas)' },
            { role: 'TI', text: 'Criar Conta no AD (Active Directory)' },
            { role: 'TI', text: 'Criar E-mail Corporativo' },
            { role: 'TI', text: 'Configurar VPN (se aplicável)' },
            { role: 'TI', text: 'Criar Usuário no SAP B1' },
            { role: 'TI', text: 'Criar Perfil no Salesforce' },
            { role: 'TI', text: 'Liberar Acesso a Pastas de Rede' },
            { role: 'TI', text: 'Configurar Impressoras' },
            { role: 'TI', text: 'Realizar Testes Gerais de Acesso' },
            { role: 'Colaborador', text: 'Confirmar Recebimento de Equipamentos' },
            { role: 'Colaborador', text: 'Confirmar Funcionamento de Acessos' },
            { role: 'Colaborador', text: 'Receber Orientação Inicial de Sistemas' },
        ]
    },
    {
        id: 'demissao',
        title: 'Processo de Demissão',
        description: 'Fluxo de desligamento de colaboradores e revogação de acessos',
        steps: [
            { role: 'RH', text: 'Receber Carta de Demissão ou Comunicar Colaborador' },
            { role: 'RH', text: 'Definir Último Dia de Trabalho' },
            { role: 'RH', text: 'Agendar Exame Demissional' },
            { role: 'Gestor', text: 'Recolher Equipamentos Físicos (Notebook, Celular)' },
            { role: 'Gestor', text: 'Validar Pendências de Trabalho' },
            { role: 'TI', text: 'Bloquear Conta AD Imediatamente após saída' },
            { role: 'TI', text: 'Bloquear E-mail Corporativo' },
            { role: 'TI', text: 'Revogar Acesso VPN' },
            { role: 'TI', text: 'Inativar Usuário SAP B1' },
            { role: 'TI', text: 'Inativar Usuário Salesforce' },
            { role: 'DP', text: 'Calcular Verbas Rescisórias' },
            { role: 'DP', text: 'Emitir Guias de Recolhimento' },
            { role: 'DP', text: 'Realizar Baixa na CTPS' },
            { role: 'DP', text: 'Arquivar Documentação de Desligamento' },
        ]
    }
];
