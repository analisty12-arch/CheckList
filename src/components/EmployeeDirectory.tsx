import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, X, Users, Laptop, Smartphone, Cpu, Tablet } from 'lucide-react';
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

export function EmployeeDirectory({ standalone = true }: { standalone?: boolean }) {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Form data
    const [newEmployee, setNewEmployee] = useState<any>({});
    const [departments, setDepartments] = useState<Department[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [allAssets, setAllAssets] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);

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

                // Find Gestor for this department
                // Simplified: first gestor found for the department
                const gestor = (userData || []).find(u => u.department === emp.department?.name)?.name;

                const nb = empAssets.find(a => a.device_type === 'notebook');
                const sm = empAssets.find(a => a.device_type === 'smartphone');
                const tb = empAssets.find(a => a.device_type === 'tablet');

                return {
                    ...emp,
                    notebook: nb ? { tag: nb.asset_tag, serial: nb.serial_number } : undefined,
                    smartphone: sm ? { tag: sm.asset_tag, serial: sm.serial_number } : undefined,
                    tablet: tb ? { tag: tb.asset_tag, serial: tb.serial_number } : undefined,
                    chip: empAssets.find(a => a.device_type === 'chip')?.asset_tag,
                    gestor: gestor || 'A definir'
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
                <Button
                    onClick={async () => {
                        await fetchMetadata();
                        setIsDialogOpen(true);
                    }}
                    className="bg-rose-gold hover:bg-rose-gold-dark text-white gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Novo Colaborador
                </Button>
            </div>

            <div className="relative w-full max-w-md mb-8">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    className="pl-10 bg-white"
                    placeholder="Buscar por nome, cargo ou setor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
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
            )}

            {/* Modal de Cadastro Simplificado */}
            {isDialogOpen && (
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
                                            <SelectValue placeholder="Selecione..." />
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
                                            <SelectValue placeholder="Selecione..." />
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
            )}
        </div>
    );

    return content;
}
