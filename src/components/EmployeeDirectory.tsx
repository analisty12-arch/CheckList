import { useState, useEffect, useRef } from 'react';
import { useDocuSign } from '@/hooks/useDocuSign';
import { generateAssetTermBase64 } from '@/utils/generateAssetTerm';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, X, Users, Laptop, Smartphone, Cpu, Tablet, Upload, FileSpreadsheet, Link, Mail, Settings, PenTool } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface AssetInfo {
    tag: string;
    serial?: string;
}

interface Employee {
    id: string;
    full_name: string;
    cpf: string;
    email: string;
    phone: string;
    hire_date: string;
    status: string;
    position: {
        title: string;
    };
    department: {
        name: string;
    };
    department_id?: string;
    position_id?: string;
    notebook?: AssetInfo;
    smartphone?: AssetInfo;
    tablet?: AssetInfo;
    chip?: string;
    gestor?: string;
}

interface Position {
    id: string;
    title: string;
}

interface Department {
    id: string;
    name: string;
}

export function EmployeeDirectory({ standalone = true, currentUser }: { standalone?: boolean; currentUser?: any }) {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Form data
    const [newEmployee, setNewEmployee] = useState<any>({});
    const [departments, setDepartments] = useState<Department[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [allAssets, setAllAssets] = useState<any[]>([]);
    const [showImport, setShowImport] = useState(false);
    const [importing, setImporting] = useState(false);
    const [docusignLink, setDocusignLink] = useState(''); // State for the transient DocuSign link
    const { login, sendEnvelope, isAuthenticated, clientId, setClientId } = useDocuSign();
    const [sendingDocuSign, setSendingDocuSign] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Access Control Logic
    // Admins, RH, or TI can manage the directory
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'Admin';
    const isRH = currentUser?.department === 'RH' || currentUser?.department === 'Recursos Humanos';
    const isTI = currentUser?.department === 'TI' || currentUser?.department === 'Tecnologia';

    const canManage = isAdmin || isRH || isTI;

    useEffect(() => {
        fetchEmployees();
        fetchMetadata();
    }, []);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            // 1. Fetch Employees
            const { data: empData, error: empError } = await supabase
                .from('employees')
                .select(`
                    *,
                    position:positions(title),
                    department:departments(name)
                `);

            if (empError) throw empError;

            // 2. Fetch Assets
            const { data: assetData, error: assetError } = await supabase
                .from('tech_assets')
                .select('assigned_to_name, asset_tag, device_type, serial_number');

            if (assetError) console.error('Error fetching assets:', assetError);

            // 3. Fetch Gestores (from app_users)
            const { data: userData, error: userError } = await supabase
                .from('app_users')
                .select('name, role, department, region')
                .eq('role', 'Gestor');

            if (userError) console.error('Error fetching gestores:', userError);

            // 4. Combine data
            const enrichedEmployees = (empData || []).map((emp: any) => {
                const empAssets = (assetData || []).filter(a => a.assigned_to_name === emp.full_name);

                // Definitive Manager Map (User provided)
                const DEPT_MANAGERS: Record<string, string> = {
                    'cientifica hof': 'Pedro Miguel',
                    'cientifica': 'Pedro Miguel',
                    'científica': 'Pedro Miguel',
                    'cientifica med': 'Pedro Miguel',
                    'científica med': 'Pedro Miguel',
                    'comercial centro': 'Laice Santos',
                    'comercial norte/nordeste': 'Thiago Carvalho',
                    'comercial anterior': 'Thiago Carvalho',
                    'comercial sul': 'Jaqueline Grasel',
                    'comercial sudeste': 'Milena Fireman',
                    'compras': 'Gilcimar Gil',
                    'gestor comercial centro': 'Massillon Araujo',
                    'gestor comercial sul': 'Massillon Araujo',
                    'gestor comercial sudeste': 'Massillon Araujo',
                    'franquias': 'Anderson Gomes',
                    'gestor franquias': 'Anderson Gomes',
                    'gestor inside sales': 'Massillon Araujo',
                    'inside sales': 'Cesar Camargo',
                    'juridico': 'Denis Ranieri',
                    'logistica': 'Luciana Borri',
                    'marketing': 'Viviane Toledo',
                    'rh': 'Gleice Silva',
                    'gestor rh': 'Pedro Miguel',
                    'ceo': 'Pedro Miguel',
                    'comex': 'Danielle Moura',
                    'gestor comex': 'Massillon Araujo',
                    'financeiro': 'Lucas Voltarelli',
                    'gestor financeiro': 'Pedro Miguel',
                    'marketing': 'Viviane Toledo',
                    'gestor marketing': 'Viviane Toledo',
                    'logistica': 'Luciana Borri',
                    'logística': 'Luciana Borri',
                    'gestor logistica': 'Luciana Borri',
                    'gestor logística': 'Luciana Borri',
                    'tech digital': 'Marcelo Ravagnani',
                    'gestor tech digital': 'Marcelo Ravagnani',
                    'diretor': 'Pedro Miguel'
                };

                // Find Gestor logic
                let gestorName = null;

                // Strategy 0: Direct Map Lookup
                const deptName = emp.department?.name?.toLowerCase();
                if (deptName && DEPT_MANAGERS[deptName]) {
                    gestorName = DEPT_MANAGERS[deptName];
                }

                // Fallback strategies if not in map
                if (!gestorName) {
                    gestorName = (userData || []).find(u => u.department === emp.department?.name)?.name;
                }

                if (!gestorName && empData) {
                    // Strategy 1: Look for a manager in the SAME department
                    // matches regex for leadership positions
                    const managerInDept = empData.find((e: any) =>
                        e.department_id === emp.department_id &&
                        e.id !== emp.id &&
                        /gestor|gerente|diretor|ceo|head|coordenador/i.test(e.position?.title || '')
                    );

                    if (managerInDept) {
                        gestorName = managerInDept.full_name;
                    } else {
                        // Strategy 2: Look for a manager in a "Gestor [Dept]" department
                        // e.g. Dept: "Comercial Sul" -> Look for Dept "Gestor Comercial Sul"
                        const targetDeptName = `Gestor ${emp.department?.name || ''}`;
                        const managerInRelDept = empData.find((e: any) =>
                            e.department?.name?.toLowerCase() === targetDeptName.toLowerCase()
                        );
                        if (managerInRelDept) {
                            gestorName = managerInRelDept.full_name;
                        }
                    }
                }

                const nb = empAssets.find(a => a.device_type === 'notebook');
                const sm = empAssets.find(a => a.device_type === 'smartphone');
                const tb = empAssets.find(a => a.device_type === 'tablet');

                return {
                    ...emp,
                    notebook: nb ? { tag: nb.asset_tag, serial: nb.serial_number } : undefined,
                    smartphone: sm ? { tag: sm.asset_tag, serial: sm.serial_number } : undefined,
                    tablet: tb ? { tag: tb.asset_tag, serial: tb.serial_number } : undefined,
                    chip: empAssets.find(a => a.device_type === 'chip')?.asset_tag,
                    gestor: gestorName || 'A definir'
                };
            });

            setEmployees(enrichedEmployees);
        } catch (error: any) {
            console.error('Error in fetchEmployees:', error);
        }
        setLoading(false);
    };

    const fetchMetadata = async () => {
        const { data: deps } = await supabase.from('departments').select('id, name');
        if (deps) setDepartments(deps);

        const { data: pos } = await supabase.from('positions').select('id, title');
        if (pos) setPositions(pos);

        const { data: assets } = await supabase.from('tech_assets').select('*');
        if (assets) setAllAssets(assets);
    };

    const handleSave = async () => {
        if (!newEmployee.full_name || !newEmployee.email || !newEmployee.department_id || !newEmployee.position_id) {
            alert('Preencha os campos obrigatórios');
            return;
        }

        setSaving(true);
        try {
            let employeeId = newEmployee.id;

            // 1. Save Employee
            if (employeeId) {
                const { error } = await supabase.from('employees').update({
                    full_name: newEmployee.full_name,
                    email: newEmployee.email,
                    cpf: newEmployee.cpf,
                    hire_date: newEmployee.hire_date,
                    department_id: newEmployee.department_id,
                    position_id: newEmployee.position_id,
                    status: newEmployee.status || 'active'
                }).eq('id', employeeId);
                if (error) throw error;
            } else {
                const { data, error } = await supabase.from('employees').insert({
                    full_name: newEmployee.full_name,
                    email: newEmployee.email,
                    cpf: newEmployee.cpf || '00000000000',
                    hire_date: newEmployee.hire_date || new Date().toISOString().split('T')[0],
                    department_id: newEmployee.department_id,
                    position_id: newEmployee.position_id,
                    status: 'active'
                }).select().single();
                if (error) throw error;
                employeeId = data.id;
            }

            // 2. Handle Hardware Updates
            // Simplified logic: 
            // - Find which assets were previously assigned to this person and set them to available
            // - Assign the new ones

            // First, find current employee name (if editing)
            const oldEmployee = employees.find(e => e.id === employeeId);
            const oldName = oldEmployee?.full_name || newEmployee.full_name;

            // Mark old assets as available
            await supabase.from('tech_assets')
                .update({ assigned_to_name: null, status: 'available' })
                .eq('assigned_to_name', oldName);

            // Mark new assets as in use
            const hardwareTags = [
                newEmployee.notebook_tag,
                newEmployee.smartphone_tag,
                newEmployee.tablet_tag,
                newEmployee.chip_tag
            ].filter(Boolean);

            if (hardwareTags.length > 0) {
                await supabase.from('tech_assets')
                    .update({
                        assigned_to_name: newEmployee.full_name,
                        status: 'in_use'
                    })
                    .in('asset_tag', hardwareTags);
            }

            setIsDialogOpen(false);
            setNewEmployee({});
            fetchEmployees();
        } catch (error: any) {
            alert('Erro ao salvar: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = async (emp: Employee) => {
        setLoading(true); // Small visual feedback
        await fetchMetadata(); // Refresh assets to get latest availability
        setNewEmployee({
            id: emp.id,
            full_name: emp.full_name,
            email: emp.email,
            cpf: emp.cpf,
            department_id: emp.department_id,
            position_id: emp.position_id,
            hire_date: emp.hire_date,
            status: emp.status,
            notebook_tag: emp.notebook?.tag,
            notebook_serial: emp.notebook?.serial,
            smartphone_tag: emp.smartphone?.tag,
            smartphone_serial: emp.smartphone?.serial,
            tablet_tag: emp.tablet?.tag,
            tablet_serial: emp.tablet?.serial,
            chip_tag: emp.chip
        });
        setLoading(false);
        setIsDialogOpen(true);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        try {
            // Fetch fresh metadata directly to ensure we have the latest (state might be stale)
            const { data: freshDepartments } = await supabase.from('departments').select('id, name');
            const { data: freshPositions } = await supabase.from('positions').select('id, title');

            if (freshDepartments) setDepartments(freshDepartments);
            if (freshPositions) setPositions(freshPositions);

            // Fetch current employees for matching
            const { data: currentEmployees, error: fetchError } = await supabase
                .from('employees')
                .select('id, full_name');

            if (fetchError) throw fetchError;
            console.log('Funcionários no banco:', currentEmployees?.length);

            const reader = new FileReader();
            reader.onload = async (evt) => {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                // Debug headers
                if (data.length > 0) {
                    console.log('Cabeçalhos detectados:', Object.keys(data[0] as object));
                }

                if (data.length === 0) {
                    alert('Arquivo vazio ou formato inválido.');
                    setImporting(false);
                    return;
                }

                let updatedCount = 0;
                let skippedCount = 0;
                let errorCount = 0;

                for (const row of data as any[]) {
                    // Normalize keys
                    const normalizedRow: any = {};
                    Object.keys(row).forEach(key => {
                        const cleanKey = key.trim().toLowerCase();
                        normalizedRow[cleanKey] = row[key];
                    });

                    // Update mapping to include 'nome assinatura'
                    const name = normalizedRow['nome'] || normalizedRow['nome completo'] || normalizedRow['funcionario'] || normalizedRow['nome assinatura'];
                    const email = normalizedRow['email'] || normalizedRow['e-mail'];
                    const cpf = normalizedRow['cpf'];
                    const deptName = normalizedRow['setor'] || normalizedRow['departamento'] || normalizedRow['area'];
                    const posTitle = normalizedRow['cargo'] || normalizedRow['funcao'];

                    // Helper to normalize strings (remove accents, lowercase, trim)
                    const normalize = (str: string) =>
                        str ? str.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : '';

                    if (!name) {
                        skippedCount++;
                        continue;
                    }

                    // Find existing employee (ignoring accents)
                    const existingEmp = currentEmployees?.find(e =>
                        normalize(e.full_name) === normalize(name)
                    );

                    if (!existingEmp) {
                        skippedCount++;
                        continue;
                    }

                    const updates: any = {};
                    if (cpf) updates.cpf = String(cpf).replace(/\D/g, '');

                    if (deptName) {
                        const dept = (freshDepartments || departments).find(d => normalize(d.name) === normalize(deptName.toString()));
                        if (dept) updates.department_id = dept.id;
                    }

                    if (posTitle) {
                        const pos = (freshPositions || positions).find(p => normalize(p.title) === normalize(posTitle.toString()));
                        if (pos) updates.position_id = pos.id;
                    }

                    if (email) updates.email = email;

                    if (Object.keys(updates).length > 0) {
                        const { error } = await supabase
                            .from('employees')
                            .update(updates)
                            .eq('id', existingEmp.id);

                        if (error) {
                            console.error(`Error updating ${name}:`, error);
                            errorCount++;
                        } else {
                            updatedCount++;
                        }
                    } else {
                        skippedCount++;
                    }
                }

                alert(`Processamento concluído!\nAtualizados: ${updatedCount}\nIgnorados: ${skippedCount}\nErros: ${errorCount}`);
                fetchEmployees();
                setImporting(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            };
            reader.readAsBinaryString(file);
        } catch (error) {
            console.error('Import error:', error);
            alert('Erro ao processar arquivo.');
            setImporting(false);
        }
    };

    const seedCommercialDepartments = async () => {
        const rawDepts = [
            'Comercial Norte/Nordeste',
            'Comercial Sul',
            'Comercial Sudeste',
            'Comercial Suldeste', // Sic (from user image)
            'Comercial Centro',
            'Inside Sales',
            'INSIDE SALES', // Case variance often exists
            'CIENTIFICA HOF',
            'CIENTIFICA MED',
            'Compras',
            'Gestor Comercial Centro',
            'Gestor Comercial Sul',
            'Gestor Comercial Suldeste',
            'Gestor Inside sales',
            'Juridico',
            'Logistica',
            'Marketing',
            'RH',
            'CEO',
            'COMEX',
            'SUPPLY CHAIN',
            'FINANCEIRO',
            'Diretor',
            'Tech Digital',
            'FRANQUIAS'
        ];

        // Deduplicate input list (case insensitive)
        const uniqueNames = new Set<string>();
        const newDepts: string[] = [];
        rawDepts.forEach(name => {
            const normalized = name.trim().toLowerCase();
            if (!uniqueNames.has(normalized)) {
                uniqueNames.add(normalized);
                newDepts.push(name.trim());
            }
        });

        // Refresh departments first to be sure
        const { data: latestDepts } = await supabase.from('departments').select('id, name, code');
        const currentDepts = latestDepts || departments;

        // Track used codes from DB + newly added
        const usedCodes = new Set<string>(currentDepts.map(d => d.code || ''));

        let addedCount = 0;
        let errors: string[] = [];

        // Get module
        const { data: existingOne } = await supabase
            .from('departments')
            .select('module')
            .limit(1)
            .maybeSingle();
        const defaultModule = existingOne?.module || 'GERAL';

        for (const name of newDepts) {
            // Check if exists by Name
            const existing = currentDepts.find(d => d.name.toLowerCase() === name.toLowerCase());

            if (!existing) {
                // Generate base code
                let baseCode = name
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, "")
                    .toUpperCase()
                    .replace(/[^A-Z0-9]+/g, '_')
                    .replace(/^_|_$/g, '');

                // Truncate to 18 chars to leave room for suffix just in case
                if (baseCode.length > 20) baseCode = baseCode.substring(0, 20);

                // Ensure uniqueness
                let finalCode = baseCode;
                let counter = 1;
                while (usedCodes.has(finalCode)) {
                    // If collision, truncate more to make room for suffix
                    const suffix = `_${counter}`;
                    const maxBase = 20 - suffix.length;
                    finalCode = baseCode.substring(0, maxBase) + suffix;
                    counter++;
                }

                const { error } = await supabase.from('departments').insert({
                    name,
                    code: finalCode,
                    module: defaultModule
                });

                if (!error) {
                    addedCount++;
                    usedCodes.add(finalCode); // Mark as used
                } else {
                    console.error('Error adding dept:', name, error);
                    // Ignore "duplicate key" if it's name collision we missed, but report others
                    if (!error.message.includes('duplicate key')) {
                        errors.push(`${name}: ${error.message}`);
                    }
                }
            }
        }

        if (errors.length > 0) {
            alert(`Erro ao criar alguns departamentos:\n${errors.slice(0, 3).join('\n')}\n(Ver console para mais detalhes)`);
            await fetchMetadata();
        } else if (addedCount > 0) {
            alert(`${addedCount} departamentos adicionados com sucesso! A lista será atualizada.`);
            await fetchMetadata();
        } else {
            alert('Todos os departamentos validados.');
            await fetchMetadata();
        }
    };

    const seedPositions = async () => {
        const rawPositions = [
            'CEO',
            'Gestor Comercial Centro',
            'Gestor Comercial Norte/Nordeste',
            'Gestor Comercial Sul',
            'Gestor Comercial Sudeste',
            'Gestor de Compras',
            'Diretor',
            'Gestor Inside Sales',
            'Gestor Marketing',
            'Gestor Financeiro',
            'Gestor Jurídico',
            'Gestor RH',
            'Gestor Comex',
            'Gestor Logistica',
            'Gestor Tech Digital',
            'Suporte Infra',
            'Consultor de Vendas',
            'Analista de Marketing',
            'Suporte Sistemas',
            'Analista Financeiro',
            'Estagiário',
            'Científica',
            'Analista Logístico'
        ];

        // Call the secure RPC function to handle syncing
        try {
            const { data, error } = await supabase.rpc('sync_positions', {
                allowed_titles: rawPositions
            });

            if (error) {
                console.error('Error syncing positions:', error);
                alert(`Erro ao sincronizar cargos: ${error.message || JSON.stringify(error)}`);
            } else {
                console.log('Sync result:', data);
                alert(data || 'Cargos sincronizados com sucesso!');
                await fetchMetadata();
            }
        } catch (e: any) {
            console.error('Unexpected error:', e);
            alert(`Erro inesperado ao sincronizar cargos: ${e.message}`);
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.position?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const content = (
        <div className={`${standalone ? 'container mx-auto p-6 max-w-7xl' : ''} animate-in fade-in`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-serif text-primary flex items-center gap-2">
                        <Users className="w-8 h-8 text-rose-gold" />
                        {standalone ? 'Nossa Comunidade' : 'Gestão de Colaboradores'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {standalone
                            ? 'Conecte-se com seus colegas de trabalho'
                            : 'Gerencie o cadastro completo de funcionários e seus departamentos.'}
                    </p>
                </div>
                {canManage && (
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={seedCommercialDepartments}>
                            Atualizar Deptos
                        </Button>
                        <Button variant="outline" size="sm" onClick={seedPositions}>
                            Atualizar Cargos
                        </Button>
                        <Button variant="outline" className="text-rose-gold border-rose-gold/20 hover:bg-rose-gold/10" onClick={() => setShowImport(!showImport)}>
                            <Upload className="w-4 h-4 mr-2" />
                            Importar Excel
                        </Button>
                        <Button className="bg-rose-gold hover:bg-rose-gold-dark text-white shadow-lg shadow-rose-gold/20" onClick={() => { setSelectedEmployee(null); setIsModalOpen(true); }}>
                            <Plus className="w-4 h-4 mr-2" />
                            Novo Colaborador
                        </Button>
                    </div>
                )}
            </div >

            <div className="relative w-full max-w-md mb-8">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    className="pl-10 bg-white"
                    placeholder="Buscar por nome, cargo ou setor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {
                loading ? (
                    <div className="text-center py-20 flex flex-col items-center gap-4">
                        <div className="w-8 h-8 border-4 border-rose-gold border-t-transparent rounded-full animate-spin" />
                        <p className="text-muted-foreground">Carregando colaboradores...</p>
                    </div>
                ) : filteredEmployees.length === 0 ? (
                    <div className="text-center py-20 bg-muted/20 rounded-xl border-2 border-dashed border-muted">
                        <p className="text-muted-foreground">Nenhum colaborador encontrado.</p>
                    </div>
                ) : (
                    <Card className="border-rose-gold/20 shadow-soft overflow-hidden">
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                                        <TableHead className="pl-6 h-12">Nome</TableHead>
                                        <TableHead className="h-12">CPF</TableHead>
                                        <TableHead className="h-12">Setor</TableHead>
                                        <TableHead className="h-12">Gestor</TableHead>
                                        <TableHead className="h-12 text-center"><Laptop className="w-4 h-4 mx-auto mb-1 text-muted-foreground" /> Notebook</TableHead>
                                        <TableHead className="h-12 text-center"><Smartphone className="w-4 h-4 mx-auto mb-1 text-muted-foreground" /> Smartphones</TableHead>
                                        <TableHead className="h-12 text-center"><Tablet className="w-4 h-4 mx-auto mb-1 text-muted-foreground" /> Tablet</TableHead>
                                        <TableHead className="h-12 text-center"><Cpu className="w-4 h-4 mx-auto mb-1 text-muted-foreground" /> Chip</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredEmployees.map((employee) => (
                                        <TableRow
                                            key={employee.id}
                                            className="hover:bg-rose-gold/5 transition-colors group cursor-pointer"
                                            onClick={() => handleEdit(employee)}
                                        >
                                            <TableCell className="pl-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-foreground group-hover:text-rose-gold-dark transition-colors">{employee.full_name}</span>
                                                    <span className="text-[10px] text-muted-foreground uppercase">{employee.position?.title || 'Cargo não definido'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-muted-foreground font-mono">{employee.cpf || '-'}</span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-normal text-[11px] bg-slate-100 text-slate-700">
                                                    {employee.department?.name || 'Geral'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-slate-600 font-medium">{employee.gestor}</span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {employee.notebook ? (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <Badge variant="outline" className="text-[10px] border-blue-200 bg-blue-50 text-blue-700">
                                                            {employee.notebook.tag}
                                                        </Badge>
                                                        <span className="text-[9px] text-muted-foreground font-mono">{employee.notebook.serial || 'S/N: -'}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {employee.smartphone ? (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <Badge variant="outline" className="text-[10px] border-green-200 bg-green-50 text-green-700">
                                                            {employee.smartphone.tag}
                                                        </Badge>
                                                        <span className="text-[9px] text-muted-foreground font-mono">{employee.smartphone.serial || 'S/N: -'}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {employee.tablet ? (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <Badge variant="outline" className="text-[10px] border-purple-200 bg-purple-50 text-purple-700">
                                                            {employee.tablet.tag}
                                                        </Badge>
                                                        <span className="text-[9px] text-muted-foreground font-mono">{employee.tablet.serial || 'S/N: -'}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {employee.chip ? (
                                                    <Badge variant="outline" className="text-[10px] border-amber-200 bg-amber-50 text-amber-700">
                                                        {employee.chip}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-[10px] text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )
            }

            {/* Modal de Cadastro Simplificado */}
            {
                isDialogOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white w-full max-w-[700px] rounded-lg shadow-lg border border-border animate-in zoom-in-95 duration-200 p-6 space-y-4 max-h-[95vh] overflow-y-auto">
                            <div className="flex items-center justify-between border-b pb-4">
                                <h3 className="text-lg font-semibold">{newEmployee.id ? 'Editar Colaborador' : 'Novo Colaborador'}</h3>
                                <Button variant="ghost" size="icon" onClick={() => setIsDialogOpen(false)}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="grid gap-4 py-2">
                                <div className="grid gap-2">
                                    <Label>Nome Completo</Label>
                                    <Input
                                        value={newEmployee.full_name || ''}
                                        onChange={e => setNewEmployee({ ...newEmployee, full_name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Email Corporativo</Label>
                                        <Input
                                            type="email"
                                            value={newEmployee.email || ''}
                                            onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>CPF</Label>
                                        <Input
                                            value={newEmployee.cpf || ''}
                                            onChange={e => setNewEmployee({ ...newEmployee, cpf: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Departamento</Label>
                                        <Select
                                            value={newEmployee.department_id || ''}
                                            onValueChange={(val) => setNewEmployee({ ...newEmployee, department_id: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione...">
                                                    {departments.find(d => d.id === newEmployee.department_id)?.name || 'Selecione...'}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {departments.map(d => (
                                                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Cargo</Label>
                                        <Select
                                            value={newEmployee.position_id || ''}
                                            onValueChange={(val) => setNewEmployee({ ...newEmployee, position_id: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione...">
                                                    {positions.find(p => p.id === newEmployee.position_id)?.title || 'Selecione...'}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {positions.map(p => (
                                                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Data de Admissão</Label>
                                    <Input
                                        type="date"
                                        value={newEmployee.hire_date || ''}
                                        onChange={e => setNewEmployee({ ...newEmployee, hire_date: e.target.value })}
                                    />
                                </div>

                                {/* Equipment Section */}
                                <div className="mt-4 pt-4 border-t border-dashed space-y-4">
                                    <h4 className="text-sm font-bold text-rose-gold flex items-center gap-2">
                                        <Laptop className="w-4 h-4" /> Equipamentos e Ativos
                                    </h4>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2 col-span-2 md:col-span-1">
                                            <Label className="text-xs uppercase text-muted-foreground">Notebook (Patrimônio)</Label>
                                            <Select
                                                value={newEmployee.notebook_tag || 'none'}
                                                onValueChange={(val) => {
                                                    const asset = allAssets.find(a => a.asset_tag === val);
                                                    setNewEmployee({ ...newEmployee, notebook_tag: val === 'none' ? null : val, notebook_serial: asset?.serial_number });
                                                }}
                                            >
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue placeholder="Selecione um Notebook..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Nenhum</SelectItem>
                                                    {allAssets
                                                        .filter(a => a.device_type === 'notebook' &&
                                                            ((a.status === 'available' && (!a.assigned_to_name || a.assigned_to_name === '*' || a.assigned_to_name === '**' || a.assigned_to_name === 'Disponível')) ||
                                                                a.asset_tag === employees.find(e => e.id === newEmployee.id)?.notebook?.tag))
                                                        .map(a => (
                                                            <SelectItem key={a.id} value={a.asset_tag}>
                                                                {a.asset_tag} - {a.model}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2 col-span-2 md:col-span-1">
                                            <Label className="text-xs uppercase text-muted-foreground">Notebook (Nº Série)</Label>
                                            <Input
                                                placeholder="S/N será preenchido..."
                                                value={newEmployee.notebook_serial || ''}
                                                readOnly
                                                className="bg-muted/30"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2 col-span-2 md:col-span-1">
                                            <Label className="text-xs uppercase text-muted-foreground">Smartphone (Patrimônio)</Label>
                                            <Select
                                                value={newEmployee.smartphone_tag || 'none'}
                                                onValueChange={(val) => {
                                                    const asset = allAssets.find(a => a.asset_tag === val);
                                                    setNewEmployee({ ...newEmployee, smartphone_tag: val === 'none' ? null : val, smartphone_serial: asset?.serial_number });
                                                }}
                                            >
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue placeholder="Selecione um Smartphone..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Nenhum</SelectItem>
                                                    {allAssets
                                                        .filter(a => a.device_type === 'smartphone' &&
                                                            ((a.status === 'available' && (!a.assigned_to_name || a.assigned_to_name === '*' || a.assigned_to_name === '**' || a.assigned_to_name === 'Disponível')) ||
                                                                a.asset_tag === employees.find(e => e.id === newEmployee.id)?.smartphone?.tag))
                                                        .map(a => (
                                                            <SelectItem key={a.id} value={a.asset_tag}>
                                                                {a.asset_tag} - {a.model}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2 col-span-2 md:col-span-1">
                                            <Label className="text-xs uppercase text-muted-foreground">Smartphone (Nº Série)</Label>
                                            <Input
                                                placeholder="IMEI será preenchido..."
                                                value={newEmployee.smartphone_serial || ''}
                                                readOnly
                                                className="bg-muted/30"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2 col-span-2 md:col-span-1">
                                            <Label className="text-xs uppercase text-muted-foreground">Tablet (Patrimônio)</Label>
                                            <Select
                                                value={newEmployee.tablet_tag || 'none'}
                                                onValueChange={(val) => {
                                                    const asset = allAssets.find(a => a.asset_tag === val);
                                                    setNewEmployee({ ...newEmployee, tablet_tag: val === 'none' ? null : val, tablet_serial: asset?.serial_number });
                                                }}
                                            >
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue placeholder="Selecione um Tablet..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Nenhum</SelectItem>
                                                    {allAssets
                                                        .filter(a => a.device_type === 'tablet' &&
                                                            ((a.status === 'available' && (!a.assigned_to_name || a.assigned_to_name === '*' || a.assigned_to_name === '**' || a.assigned_to_name === 'Disponível')) ||
                                                                a.asset_tag === employees.find(e => e.id === newEmployee.id)?.tablet?.tag))
                                                        .map(a => (
                                                            <SelectItem key={a.id} value={a.asset_tag}>
                                                                {a.asset_tag} - {a.model}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2 col-span-2 md:col-span-1">
                                            <Label className="text-xs uppercase text-muted-foreground">Tablet (Nº Série)</Label>
                                            <Input
                                                placeholder="S/N será preenchido..."
                                                value={newEmployee.tablet_serial || ''}
                                                readOnly
                                                className="bg-muted/30"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2 col-span-2 md:col-span-1">
                                            <Label className="text-xs uppercase text-muted-foreground">Chip (Número/Tag)</Label>
                                            <Select
                                                value={newEmployee.chip_tag || 'none'}
                                                onValueChange={(val) => setNewEmployee({ ...newEmployee, chip_tag: val === 'none' ? null : val })}
                                            >
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue placeholder="Selecione um Chip..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Nenhum</SelectItem>
                                                    {allAssets
                                                        .filter(a => a.device_type === 'chip' &&
                                                            ((a.status === 'available' && (!a.assigned_to_name || a.assigned_to_name === '*' || a.assigned_to_name === '**' || a.assigned_to_name === 'Disponível')) ||
                                                                a.asset_tag === employees.find(e => e.id === newEmployee.id)?.chip))
                                                        .map(a => (
                                                            <SelectItem key={a.id} value={a.asset_tag}>
                                                                {a.asset_tag}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs uppercase text-muted-foreground">Status do Colaborador</Label>
                                            <Select
                                                value={newEmployee.status || 'active'}
                                                onValueChange={(val) => setNewEmployee({ ...newEmployee, status: val })}
                                            >
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">Ativo</SelectItem>
                                                    <SelectItem value="on_leave">Licença</SelectItem>
                                                    <SelectItem value="terminated">Desligado</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-dashed">
                                            <h4 className="text-sm font-bold text-rose-gold flex items-center gap-2 mb-2">
                                                <PenTool className="w-4 h-4" /> Assinatura Digital (DocuSign)
                                            </h4>
                                            <div className="flex flex-col gap-3 p-3 bg-muted/20 rounded-md border border-muted">

                                                {!isAuthenticated ? (
                                                    <div className="flex items-center gap-2">
                                                        <Button variant="outline" size="sm" onClick={() => {
                                                            const key = prompt("Insira sua Integration Key (Client ID) do DocuSign:", clientId);
                                                            if (key) setClientId(key);
                                                        }}>
                                                            <Settings className="w-3 h-3 mr-2" /> Configurar
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className="bg-[#2461C0] hover:bg-[#1a4b96] text-white"
                                                            onClick={() => login(window.location.href)}
                                                        >
                                                            Conectar DocuSign
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">
                                                            DocuSign Conectado
                                                        </Badge>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                const key = prompt("Alterar Integration Key:", clientId);
                                                                if (key) setClientId(key);
                                                            }}
                                                        >
                                                            <Settings className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                )}

                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={async () => {
                                                            const assets = allAssets.filter(a =>
                                                                [newEmployee.notebook_tag, newEmployee.smartphone_tag, newEmployee.tablet_tag, newEmployee.chip_tag].includes(a.asset_tag)
                                                            );
                                                            const b64 = await generateAssetTermBase64(newEmployee, assets);
                                                            // Convert base64 to blob/download
                                                            const link = document.createElement('a');
                                                            link.href = `data:application/pdf;base64,${b64}`;
                                                            link.download = `Termo_${newEmployee.full_name}.pdf`;
                                                            link.click();
                                                        }}
                                                    >
                                                        <FileSpreadsheet className="w-4 h-4 mr-2" /> Baixar PDF
                                                    </Button>

                                                    {isAuthenticated && (
                                                        <Button
                                                            size="sm"
                                                            className="bg-[#2461C0] hover:bg-[#1a4b96] text-white flex-1"
                                                            disabled={sendingDocuSign}
                                                            onClick={async () => {
                                                                try {
                                                                    if (!newEmployee.email) return alert('Email obrigatório');
                                                                    setSendingDocuSign(true);
                                                                    const assets = allAssets.filter(a =>
                                                                        [newEmployee.notebook_tag, newEmployee.smartphone_tag, newEmployee.tablet_tag, newEmployee.chip_tag].includes(a.asset_tag)
                                                                    );
                                                                    const b64 = await generateAssetTermBase64(newEmployee, assets);
                                                                    await sendEnvelope(b64, newEmployee.full_name, newEmployee.email);
                                                                    alert('Envelope enviado com sucesso!');
                                                                } catch (err: any) {
                                                                    alert('Erro ao enviar: ' + err.message);
                                                                } finally {
                                                                    setSendingDocuSign(false);
                                                                }
                                                            }}
                                                        >
                                                            {sendingDocuSign ? 'Enviando...' : 'Enviar para Assinatura'}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-4 border-t">
                                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                                    <Button onClick={handleSave} disabled={saving} className="bg-rose-gold text-white hover:bg-rose-gold-dark">
                                        {saving ? 'Salvando...' : 'Cadastrar'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );

    return content;
}
