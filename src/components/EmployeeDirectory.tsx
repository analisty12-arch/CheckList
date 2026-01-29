import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Briefcase, Mail, Plus, X, Users } from 'lucide-react';

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
}

interface Position {
    id: string;
    title: string;
}

interface Department {
    id: string;
    name: string;
}

function getInitials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

export function EmployeeDirectory() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Form data
    const [newEmployee, setNewEmployee] = useState<any>({});
    const [departments, setDepartments] = useState<Department[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchEmployees();
        fetchMetadata();
    }, []);

    const fetchEmployees = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('employees')
            .select(`
                *,
                position:positions(title),
                department:departments(name)
            `);

        if (error) {
            console.error('Error fetching employees:', error);
        } else {
            setEmployees(data || []);
        }
        setLoading(false);
    };

    const fetchMetadata = async () => {
        const { data: deps } = await supabase.from('departments').select('id, name');
        if (deps) setDepartments(deps);

        const { data: pos } = await supabase.from('positions').select('id, title');
        if (pos) setPositions(pos);
    };

    const handleSave = async () => {
        if (!newEmployee.full_name || !newEmployee.email || !newEmployee.department_id || !newEmployee.position_id) {
            alert('Preencha os campos obrigatórios');
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase.from('employees').insert({
                full_name: newEmployee.full_name,
                email: newEmployee.email,
                cpf: newEmployee.cpf || '00000000000', // Mock if empty
                hire_date: newEmployee.hire_date || new Date().toISOString().split('T')[0],
                department_id: newEmployee.department_id,
                position_id: newEmployee.position_id,
                status: 'active'
            });

            if (error) throw error;
            setIsDialogOpen(false);
            setNewEmployee({});
            fetchEmployees();
        } catch (error: any) {
            alert('Erro ao salvar: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.position?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container mx-auto p-6 max-w-7xl animate-in fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-serif text-primary flex items-center gap-2">
                        <Users className="w-8 h-8 text-rose-gold" />
                        Nossa Comunidade
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Conecte-se com seus colegas de trabalho
                    </p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)} className="bg-rose-gold hover:bg-rose-gold-dark text-white gap-2">
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
                <div className="text-center py-20">Carregando colaboradores...</div>
            ) : filteredEmployees.length === 0 ? (
                <div className="text-center py-20 bg-muted/20 rounded-xl border-2 border-dashed border-muted">
                    <p className="text-muted-foreground">Nenhum colaborador encontrado.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredEmployees.map((employee) => (
                        <Card
                            key={employee.id}
                            className="group hover:shadow-xl transition-all duration-300 border-none bg-white shadow-sm overflow-hidden"
                        >
                            <div className="h-20 bg-gradient-to-r from-rose-gold/20 to-rose-gold/5 group-hover:to-rose-gold/20 transition-all" />
                            <CardContent className="relative pt-0 flex flex-col items-center">
                                <div className="h-24 w-24 -mt-12 rounded-full border-4 border-white shadow-lg bg-rose-gold/10 flex items-center justify-center text-rose-gold font-bold text-2xl">
                                    {getInitials(employee.full_name)}
                                </div>

                                <div className="mt-4 text-center space-y-1">
                                    <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors text-foreground">
                                        {employee.full_name}
                                    </h3>
                                    <p className="text-sm text-muted-foreground font-medium">
                                        {employee.position?.title || 'Cargo não definido'}
                                    </p>
                                </div>

                                <div className="mt-4 flex flex-wrap justify-center gap-2">
                                    <Badge variant="secondary" className="font-normal text-[10px] bg-slate-100 text-slate-700 hover:bg-slate-200">
                                        {employee.department?.name || 'Geral'}
                                    </Badge>
                                    <Badge variant="outline" className="text-[10px] font-normal border-rose-gold/30 text-rose-gold-dark">
                                        {employee.status === 'active' ? 'Ativo' : 'Ausente'}
                                    </Badge>
                                </div>

                                <div className="mt-6 w-full flex items-center justify-center gap-4 text-muted-foreground">
                                    <span title={employee.email} className="cursor-pointer">
                                        <Mail className="h-4 w-4 hover:text-rose-gold transition-colors" />
                                    </span>
                                    <MapPin className="h-4 w-4 hover:text-rose-gold transition-colors cursor-pointer" />
                                    <Briefcase className="h-4 w-4 hover:text-rose-gold transition-colors cursor-pointer" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal de Cadastro Simplificado */}
            {isDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-[600px] rounded-lg shadow-lg border border-border animate-in zoom-in-95 duration-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b pb-4">
                            <h3 className="text-lg font-semibold">Novo Colaborador</h3>
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
}
