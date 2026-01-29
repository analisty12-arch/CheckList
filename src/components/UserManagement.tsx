import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Search, Shield, Briefcase, MapPin, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AppUser {
    id: string;
    email: string;
    password?: string;
    name: string;
    role: 'Adm' | 'RH' | 'Gestor' | 'TI';
    department?: string;
    region?: string;
    created_at?: string;
}

const ROLES = ['Adm', 'RH', 'Gestor', 'TI'];
const DEPARTMENTS = ['Financeiro', 'Marketing', 'Comercial', 'Logística', 'Jurídico', 'TI', 'RH'];
const REGIONS = ['Norte/Nordeste', 'Sul', 'Sudeste', 'Centro', 'Inside Sales'];

export function UserManagement() {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<Partial<AppUser>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('app_users')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error fetching users:', error);
            alert('Erro ao carregar usuários.');
        } else {
            setUsers(data || []);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!currentUser.email || !currentUser.name || !currentUser.role) {
            alert('Preencha os campos obrigatórios.');
            return;
        }

        setActionLoading(true);
        try {
            if (isEditing && currentUser.id) {
                // Update
                const { error } = await supabase
                    .from('app_users')
                    .update({
                        email: currentUser.email,
                        name: currentUser.name,
                        role: currentUser.role,
                        department: currentUser.department || null,
                        region: currentUser.region || null,
                        // Only update password if provided (simple logic for this demo)
                        ...(currentUser.password ? { password: currentUser.password } : {})
                    })
                    .eq('id', currentUser.id);

                if (error) throw error;
            } else {
                // Create
                if (!currentUser.password) {
                    alert('Senha é obrigatória para novos usuários.');
                    setActionLoading(false);
                    return;
                }

                const { error } = await supabase
                    .from('app_users')
                    .insert({
                        email: currentUser.email,
                        password: currentUser.password,
                        name: currentUser.name,
                        role: currentUser.role,
                        department: currentUser.department || null,
                        region: currentUser.region || null,
                    });

                if (error) throw error;
            }

            setIsDialogOpen(false);
            fetchUsers();
            resetForm();
        } catch (error: any) {
            console.error('Error saving user:', error);
            alert('Erro ao salvar usuário: ' + error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

        try {
            const { error } = await supabase.from('app_users').delete().eq('id', id);
            if (error) throw error;
            fetchUsers();
        } catch (error: any) {
            console.error('Error deleting user:', error);
            alert('Erro ao excluir usuário.');
        }
    };

    const resetForm = () => {
        setCurrentUser({});
        setIsEditing(false);
    };

    const openNewUserDialog = () => {
        resetForm();
        setIsEditing(false);
        setIsDialogOpen(true);
    };

    const openEditUserDialog = (user: AppUser) => {
        setCurrentUser(user);
        setIsEditing(true);
        setIsDialogOpen(true);
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container mx-auto p-6 max-w-7xl animate-in fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-serif text-rose-gold-dark flex items-center gap-2">
                        <Shield className="w-8 h-8 text-rose-gold" />
                        Gerenciamento de Usuários
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Controle total sobre acessos e perfis do sistema.
                    </p>
                </div>
                <Button onClick={openNewUserDialog} className="bg-rose-gold hover:bg-rose-gold-dark text-white gap-2">
                    <Plus className="w-4 h-4" />
                    Novo Usuário
                </Button>
            </div>

            <Card className="border-rose-gold/20 shadow-soft">
                <CardHeader className="bg-muted/10 border-b border-border/50 pb-4">
                    <div className="flex items-center gap-2 w-full max-w-md">
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nome ou email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white"
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/20 hover:bg-muted/20">
                                <TableHead className="pl-6">Nome / Email</TableHead>
                                <TableHead>Perfil</TableHead>
                                <TableHead>Departamento</TableHead>
                                <TableHead>Região</TableHead>
                                <TableHead className="text-right pr-6">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">Carregando...</TableCell>
                                </TableRow>
                            ) : filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Nenhum usuário encontrado.</TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                    <TableRow key={user.id} className="hover:bg-rose-gold/5 transition-colors">
                                        <TableCell className="pl-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-foreground">{user.name}</span>
                                                <span className="text-xs text-muted-foreground">{user.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`
                                                ${user.role === 'Adm' ? 'border-red-200 bg-red-50 text-red-700' : ''}
                                                ${user.role === 'RH' ? 'border-purple-200 bg-purple-50 text-purple-700' : ''}
                                                ${user.role === 'TI' ? 'border-blue-200 bg-blue-50 text-blue-700' : ''}
                                                ${user.role === 'Gestor' ? 'border-amber-200 bg-amber-50 text-amber-700' : ''}
                                            `}>
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                {user.department && <Briefcase className="w-3 h-3" />}
                                                {user.department || '-'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                {user.region && <MapPin className="w-3 h-3" />}
                                                {user.region || '-'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                    onClick={() => openEditUserDialog(user)}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    onClick={() => handleDelete(user.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Custom Modal */}
            {isDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-card w-full max-w-[500px] rounded-lg shadow-lg border border-border animate-in zoom-in-95 duration-200 p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-lg font-semibold leading-none tracking-tight">{isEditing ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                                <p className="text-sm text-muted-foreground">
                                    Preencha os dados abaixo para {isEditing ? 'atualizar' : 'criar'} o acesso.
                                </p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setIsDialogOpen(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="grid gap-4 py-2">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Nome</Label>
                                <Input
                                    id="name"
                                    value={currentUser.name || ''}
                                    onChange={(e) => setCurrentUser({ ...currentUser, name: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={currentUser.email || ''}
                                    onChange={(e) => setCurrentUser({ ...currentUser, email: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="password" className="text-right">Senha</Label>
                                <Input
                                    id="password"
                                    type="text"
                                    placeholder={isEditing ? '(Manter atual)' : 'Definir senha'}
                                    value={currentUser.password || ''}
                                    onChange={(e) => setCurrentUser({ ...currentUser, password: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="role" className="text-right">Perfil</Label>
                                <Select
                                    value={currentUser.role}
                                    onValueChange={(val: any) => setCurrentUser({ ...currentUser, role: val })}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Selecione o perfil" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ROLES.map(role => (
                                            <SelectItem key={role} value={role}>{role}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {(currentUser.role === 'Gestor' || currentUser.role === 'TI' || currentUser.role === 'RH') && (
                                <div className="grid grid-cols-4 items-center gap-4 animate-in fade-in slide-in-from-top-1">
                                    <Label htmlFor="dept" className="text-right">Depto</Label>
                                    <Select
                                        value={currentUser.department || ''}
                                        onValueChange={(val) => setCurrentUser({ ...currentUser, department: val })}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Selecione o departamento" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {DEPARTMENTS.map(d => (
                                                <SelectItem key={d} value={d}>{d}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {currentUser.department === 'Comercial' && (
                                <div className="grid grid-cols-4 items-center gap-4 animate-in fade-in slide-in-from-top-1">
                                    <Label htmlFor="region" className="text-right">Região</Label>
                                    <Select
                                        value={currentUser.region || ''}
                                        onValueChange={(val) => setCurrentUser({ ...currentUser, region: val })}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Selecione a região" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {REGIONS.map(r => (
                                                <SelectItem key={r} value={r}>{r}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSave} disabled={actionLoading} className="bg-rose-gold text-white hover:bg-rose-gold-dark">
                                {actionLoading ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Criar Usuário')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
