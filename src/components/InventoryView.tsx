import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import * as XLSX from 'xlsx';
import {
    Plus,
    Search,
    X,
    FileUp,
    Laptop,
    Smartphone,
    Tablet,
    Monitor,
    Package,
    Cpu,
    Trash2,
    Loader2,
    Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";

// --- TYPES ---
// --- TYPES ---

interface TechAsset {
    id: string;
    asset_tag: string;
    serial_number?: string;
    hostname?: string;
    model: string;
    brand: string;
    device_type: string;
    status: string;
    assigned_to_name?: string;
    location?: string;
    company?: string;
    notes?: string;
}

export function InventoryView() {
    const [activeSubTab, setActiveSubTab] = useState<'notebook' | 'tablet' | 'smartphone' | 'chip'>('notebook');
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    // Data States
    // Data States
    const [assets, setAssets] = useState<TechAsset[]>([]);

    // Edit Modal States
    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<Partial<TechAsset> | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    useEffect(() => {
        fetchData();
    }, [activeSubTab]);

    async function fetchData() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('tech_assets')
                .select('*')
                .eq('device_type', activeSubTab);

            if (error) {
                console.warn(`Table 'tech_assets' might not exist, using mock data for ${activeSubTab}`, error);
                setAssets(MOCK_ASSETS.filter(a => a.device_type === activeSubTab));
            } else {
                setAssets(data || []);
            }
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    }



    async function handleSaveAsset() {
        if (!editingAsset?.asset_tag) return;
        setActionLoading(true);
        try {
            if (editingAsset.id) {
                const { error } = await supabase.from('tech_assets').update({
                    asset_tag: editingAsset.asset_tag,
                    model: editingAsset.model,
                    brand: editingAsset.brand,
                    hostname: editingAsset.hostname,
                    serial_number: editingAsset.serial_number,
                    assigned_to_name: editingAsset.assigned_to_name,
                    location: editingAsset.location,
                    status: editingAsset.status,
                    device_type: editingAsset.device_type,
                    company: editingAsset.company,
                    notes: editingAsset.notes
                }).eq('id', editingAsset.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('tech_assets').insert([{
                    asset_tag: editingAsset.asset_tag,
                    model: editingAsset.model || "",
                    brand: editingAsset.brand || "",
                    hostname: editingAsset.hostname,
                    serial_number: editingAsset.serial_number,
                    assigned_to_name: editingAsset.assigned_to_name,
                    location: editingAsset.location,
                    status: editingAsset.status || "available",
                    device_type: activeSubTab,
                    company: editingAsset.company,
                    notes: editingAsset.notes
                }]);
                if (error) throw error;
            }
            setIsAssetModalOpen(false);
            fetchData();
        } catch (err) {
            console.error("Save asset error:", err);
            alert("Erro ao salvar equipamento");
        } finally {
            setActionLoading(false);
        }
    }



    const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        console.log("Arquivo selecionado:", file.name);
        setActionLoading(true);
        const reader = new FileReader();

        reader.onload = async (event) => {
            try {
                console.log("Arquivo lido, processando XLSX...");
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });

                if (!workbook.SheetNames.length) {
                    throw new Error("O arquivo Excel está vazio ou não tem planilhas.");
                }

                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

                console.log(`Linhas encontradas: ${jsonData.length}`);

                if (jsonData.length === 0) {
                    alert("A planilha selecionada está vazia.");
                    return;
                }

                // Função auxiliar para encontrar dados mesmo com nomes de colunas variados
                const findValue = (row: any, synonyms: string[]) => {
                    const keys = Object.keys(row);
                    const foundKey = keys.find(k =>
                        synonyms.some(s => k.toLowerCase().trim() === s.toLowerCase().trim())
                    );
                    return foundKey ? row[foundKey] : null;
                };

                const assetsToImport = jsonData.map((row) => {
                    // Mapeamento Inteligente
                    const asset_tag = findValue(row, [
                        'Patrimônio', 'Patrimonio', 'Tag', 'Asset Tag', 'ID', 'Codigo', 'Código', 'Patrimonio/Ativo',
                        'Número da Linha', 'Número', 'Linha', 'Numero', 'Telefone', 'Celular', 'Sim Card', 'ICCID', 'Linha Vivo', 'Linha Claro', 'Linha Tim'
                    ]) || `MB-IMP-${Math.random().toString(36).substr(2, 5)}`;
                    const model = findValue(row, ['Equipamento', 'Modelo', 'Model', 'Descrição', 'Descricao', 'Aparelho', 'Plano', 'Pacote']) || 'Não Especificado';
                    const brand = findValue(row, ['Marca', 'Brand', 'Fabricante', 'Fabric']) || 'Outros';
                    const hostname = findValue(row, ['Hostname', 'Nome do Computador', 'PC Name', 'Nome', 'Host']) || '';
                    const assigned_to_name = findValue(row, ['Responsável', 'Responsavel', 'Usuário', 'Usuario', 'Colaborador', 'Owner', 'Pessoa']) || 'Disponível';
                    const location = findValue(row, ['Setor', 'Departamento', 'Unidade', 'Local', 'Location', 'Dept', 'Área']) || '';
                    const company = findValue(row, ['Empresa', 'Company', 'Organization', 'Org']) || '';
                    const notes = findValue(row, ['Observações', 'Observacoes', 'Notes', 'Obs', 'Comentários', 'Comentarios']) || '';
                    const serial_number = findValue(row, ['Série', 'Serie', 'Serial', 'S/N', 'Serial Number']) || '';

                    // Normalização de Status
                    let rawStatus = findValue(row, ['Status', 'Situação', 'Situacao', 'Estado', 'Status do Ativo']) || 'available';
                    let status = 'available';
                    rawStatus = rawStatus.toString().toLowerCase();

                    if (rawStatus.includes('uso') || rawStatus.includes('use') || rawStatus.includes('atribuido')) {
                        status = 'in_use';
                    } else if (rawStatus.includes('manutencao') || rawStatus.includes('conserto') || rawStatus.includes('maintenance')) {
                        status = 'maintenance';
                    } else if (rawStatus.includes('quebrado') || rawStatus.includes('defeito') || rawStatus.includes('broken')) {
                        status = 'broken';
                    } else if (rawStatus.includes('perda') || rawStatus.includes('extravio') || rawStatus.includes('lost')) {
                        status = 'lost';
                    }

                    // Regra de Negócio: Se tem usuário (e não é * ou **), o status é Em Uso
                    if (assigned_to_name &&
                        assigned_to_name !== 'Disponível' &&
                        assigned_to_name !== '*' &&
                        assigned_to_name !== '**') {
                        status = 'in_use';
                    }

                    // Normalização de Tipo
                    let rawType = findValue(row, ['Tipo', 'Categoria', 'Type', 'Device Type', 'Tipo de Equipamento']) || '';
                    let device_type: string = activeSubTab;

                    if (rawType) {
                        rawType = rawType.toString().toLowerCase();
                        if (rawType.includes('celular') || rawType.includes('phone') || rawType.includes('mobile') || rawType.includes('smartphone')) {
                            device_type = 'smartphone';
                        } else if (rawType.includes('tablet') || rawType.includes('ipad')) {
                            device_type = 'tablet';
                        } else if (rawType.includes('monitor') || rawType.includes('tela')) {
                            device_type = 'monitor';
                        } else if (rawType.includes('chip') || rawType.includes('sim') || rawType.includes('linha')) {
                            device_type = 'chip';
                        } else if (rawType.includes('note') || rawType.includes('lap') || rawType.includes('computador')) {
                            device_type = 'notebook';
                        }
                    }

                    // Regra de Ouro: Se hostname começa com LAP -> Sempre Notebook (independente da aba ou tipo na planilha)
                    if (hostname.toUpperCase().startsWith('LAP')) {
                        device_type = 'notebook';
                    }

                    return {
                        asset_tag,
                        model,
                        brand,
                        hostname,
                        assigned_to_name,
                        location,
                        status,
                        device_type,
                        company,
                        notes,
                        serial_number
                    };
                });

                // Deduplicação dentro do arquivo: evita erro de tentar atualizar a mesma linha duas vezes em uma transação
                const uniqueAssets = Array.from(
                    assetsToImport.reduce((map, asset) => {
                        map.set(asset.asset_tag, asset);
                        return map;
                    }, new Map<string, any>()).values()
                );

                console.log(`Enviando ${uniqueAssets.length} registros únicos para o Supabase...`);
                const { error } = await supabase
                    .from('tech_assets')
                    .upsert(uniqueAssets, { onConflict: 'asset_tag' });

                if (error) {
                    console.error("Erro Supabase:", error);
                    throw error;
                }

                alert(`${assetsToImport.length} equipamentos importados com sucesso!`);
                fetchData();
            } catch (err: any) {
                console.error("Erro detalhado na importação:", err);
                alert(`Erro ao importar: ${err.message || 'Verifique o formato do arquivo'}`);
            } finally {
                setActionLoading(false);
                // Limpa o input para permitir selecionar o mesmo arquivo novamente se necessário
                e.target.value = '';
            }
        };

        reader.onerror = (err) => {
            console.error("Erro na leitura do arquivo:", err);
            alert("Erro ao ler o arquivo físico.");
            setActionLoading(false);
        };

        reader.readAsArrayBuffer(file);
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (items: any[]) => {
        if (selectedIds.length === items.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(items.map(i => i.id));
        }
    };

    async function handleBulkDelete() {
        if (selectedIds.length === 0) return;
        if (!confirm(`Deseja excluir os ${selectedIds.length} itens selecionados?`)) return;

        setActionLoading(true);
        try {
            const { error } = await supabase.from('tech_assets').delete().in('id', selectedIds);
            if (error) throw error;

            alert('Itens excluídos com sucesso!');
            setSelectedIds([]);
            fetchData();
        } catch (err) {
            console.error("Bulk delete error:", err);
            alert("Erro ao excluir itens.");
        } finally {
            setActionLoading(false);
        }
    }



    const filteredItems = assets.filter(a => a.model.toLowerCase().includes(searchTerm.toLowerCase()) || a.asset_tag.toLowerCase().includes(searchTerm.toLowerCase()) || a.assigned_to_name?.toLowerCase().includes(searchTerm.toLowerCase()));

    const getDeviceIcon = (item: TechAsset) => {
        const type = item.device_type.toLowerCase();
        const host = (item.hostname || "").toUpperCase();

        if (host.startsWith('LAP') || type === 'notebook') return <Laptop className="h-4 w-4" />;

        switch (type) {
            case 'smartphone': return <Smartphone className="h-4 w-4" />;
            case 'tablet': return <Tablet className="h-4 w-4" />;
            case 'monitor': return <Monitor className="h-4 w-4" />;
            default: return <Package className="h-4 w-4" />;
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, string> = {
            'available': 'bg-green-500/10 text-green-600 border-green-500/20',
            'in_use': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
            'maintenance': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
            'broken': 'bg-red-500/10 text-red-600 border-red-500/20',
            'disponível': 'bg-green-500/10 text-green-600 border-green-500/20', // Portuguese support
            'em uso': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
        };
        const label: Record<string, string> = {
            'available': 'Disponível',
            'in_use': 'Em Uso',
            'maintenance': 'Manutenção',
            'broken': 'Defeito',
            'disponível': 'Disponível',
            'em uso': 'Em Uso',
        };
        return <Badge variant="outline" className={variants[status.toLowerCase()] || ""}>{label[status.toLowerCase()] || status}</Badge>;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex p-1 bg-muted/30 rounded-lg w-fit border border-border/50 overflow-x-auto">
                    <button
                        onClick={() => setActiveSubTab('notebook')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-md transition-all text-sm font-medium whitespace-nowrap ${activeSubTab === 'notebook' ? "bg-white dark:bg-card text-rose-gold-dark shadow-sm ring-1 ring-border/50" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        <Laptop className="w-4 h-4" />
                        Notebooks
                    </button>
                    <button
                        onClick={() => setActiveSubTab('tablet')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-md transition-all text-sm font-medium whitespace-nowrap ${activeSubTab === 'tablet' ? "bg-white dark:bg-card text-rose-gold-dark shadow-sm ring-1 ring-border/50" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        <Tablet className="w-4 h-4" />
                        Tablets
                    </button>
                    <button
                        onClick={() => setActiveSubTab('smartphone')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-md transition-all text-sm font-medium whitespace-nowrap ${activeSubTab === 'smartphone' ? "bg-white dark:bg-card text-rose-gold-dark shadow-sm ring-1 ring-border/50" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        <Smartphone className="w-4 h-4" />
                        Smartphones
                    </button>
                    <button
                        onClick={() => setActiveSubTab('chip')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-md transition-all text-sm font-medium whitespace-nowrap ${activeSubTab === 'chip' ? "bg-white dark:bg-card text-rose-gold-dark shadow-sm ring-1 ring-border/50" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        <Cpu className="w-4 h-4" />
                        Chips
                    </button>
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder={`Buscar ativo...`}
                        className="pl-9 bg-white dark:bg-card border-rose-gold/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card className="border-rose-gold/20 shadow-soft">
                <CardHeader className="bg-muted/10 border-b border-border/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-serif text-rose-gold-dark capitalize">
                                {`Gestão de ${activeSubTab}s`}
                            </CardTitle>
                            <CardDescription>
                                {`Acompanhamento de ${activeSubTab}s por colaborador.`}
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            {selectedIds.length > 0 && (
                                <Button
                                    variant="destructive"
                                    onClick={handleBulkDelete}
                                    className="gap-2"
                                    disabled={actionLoading}
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Excluir ({selectedIds.length})
                                </Button>
                            )}
                            <input
                                type="file"
                                id="excel-import"
                                className="hidden"
                                accept=".xlsx, .xls, .csv"
                                onChange={handleImportExcel}
                            />
                            <Button
                                variant="outline"
                                onClick={() => document.getElementById('excel-import')?.click()}
                                className="border-rose-gold/30 text-rose-gold-dark hover:bg-rose-gold/5 gap-2"
                                disabled={actionLoading}
                            >
                                <FileUp className="w-4 h-4" />
                                Importar Excel
                            </Button>
                            <Button
                                onClick={() => {
                                    setEditingAsset({});
                                    setIsAssetModalOpen(true);
                                }}
                                className="bg-rose-gold hover:bg-rose-gold-dark text-white gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Novo Ativo
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex h-64 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-rose-gold" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/20">
                                    <>
                                        <TableHead className="w-[40px] pl-6">
                                            <input
                                                type="checkbox"
                                                className="rounded border-rose-gold/30 text-rose-gold focus:ring-rose-gold"
                                                checked={filteredItems.length > 0 && selectedIds.length === filteredItems.length}
                                                onChange={() => handleSelectAll(filteredItems)}
                                            />
                                        </TableHead>
                                        {activeSubTab === 'chip' ? (
                                            <>
                                                <TableHead>Número da Linha</TableHead>
                                                <TableHead>Usuário</TableHead>
                                                <TableHead className="text-right pr-6">Status</TableHead>
                                            </>
                                        ) : activeSubTab === 'tablet' ? (
                                            <>
                                                <TableHead>Patrimônio</TableHead>
                                                <TableHead>Modelo</TableHead>
                                                <TableHead>Nº de Série</TableHead>
                                                <TableHead>Empresa</TableHead>
                                                <TableHead>Observações</TableHead>
                                                <TableHead className="text-right pr-6">Status</TableHead>
                                            </>
                                        ) : activeSubTab === 'smartphone' ? (
                                            <>
                                                <TableHead>Patrimônio</TableHead>
                                                <TableHead>Modelo</TableHead>
                                                <TableHead>Nº de Série</TableHead>
                                                <TableHead>Último User</TableHead>
                                                <TableHead className="text-right pr-6">Status</TableHead>
                                            </>
                                        ) : (
                                            <>
                                                <TableHead>Patrimônio</TableHead>
                                                <TableHead>Equipamento</TableHead>
                                                <TableHead>Hostname</TableHead>
                                                <TableHead>Responsável</TableHead>
                                                <TableHead>Setor</TableHead>
                                                <TableHead>Status</TableHead>
                                            </>
                                        )}
                                    </>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                            Nenhum item encontrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredItems.map((item: any) => (
                                        <TableRow
                                            key={item.id}
                                            className={`${selectedIds.includes(item.id) ? 'bg-rose-gold/10' : 'hover:bg-rose-gold/5'} transition-colors cursor-pointer`}
                                            onClick={(e) => {
                                                // Previne abrir o modal ao clicar apenas no checkbox
                                                if ((e.target as HTMLElement).tagName === 'INPUT') return;

                                                setEditingAsset(item);
                                                setIsAssetModalOpen(true);
                                            }}
                                        >
                                            <TableCell className="pl-6">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(item.id)}
                                                    onChange={() => toggleSelect(item.id)}
                                                    className="rounded border-rose-gold/30 text-rose-gold focus:ring-rose-gold"
                                                />
                                            </TableCell>
                                            {activeSubTab === 'chip' ? (
                                                <>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1.5 rounded-md bg-rose-gold/10 text-rose-gold">
                                                                {getDeviceIcon(item)}
                                                            </div>
                                                            <span className="text-sm font-medium">{item.asset_tag}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm font-medium text-slate-700">{item.assigned_to_name || "Disponível"}</TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        {getStatusBadge(
                                                            (item.assigned_to_name &&
                                                                item.assigned_to_name !== "Disponível" &&
                                                                item.assigned_to_name !== "*" &&
                                                                item.assigned_to_name !== "**")
                                                                ? 'in_use' : item.status
                                                        )}
                                                    </TableCell>
                                                </>
                                            ) : activeSubTab === 'tablet' ? (
                                                <>
                                                    <TableCell className="font-medium">
                                                        <div className="flex flex-col">
                                                            <span>{item.asset_tag}</span>
                                                            <span className="text-[10px] text-muted-foreground uppercase">{item.serial_number || 'S/N'}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1.5 rounded-md bg-rose-gold/10 text-rose-gold">
                                                                {getDeviceIcon(item)}
                                                            </div>
                                                            <span className="text-sm font-medium">{item.model}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm">{item.serial_number || "-"}</TableCell>
                                                    <TableCell className="text-sm">{item.company || "-"}</TableCell>
                                                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{item.notes || "-"}</TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        {getStatusBadge(item.status)}
                                                    </TableCell>
                                                </>
                                            ) : activeSubTab === 'smartphone' ? (
                                                <>
                                                    <TableCell className="font-medium">
                                                        <div className="flex flex-col">
                                                            <span>{item.asset_tag}</span>
                                                            <span className="text-[10px] text-muted-foreground uppercase">{item.serial_number || 'S/N'}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1.5 rounded-md bg-rose-gold/10 text-rose-gold">
                                                                {getDeviceIcon(item)}
                                                            </div>
                                                            <span className="text-sm font-medium">{item.model}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm">{item.serial_number || "-"}</TableCell>
                                                    <TableCell className="text-sm font-medium text-slate-700">{item.assigned_to_name || "Disponível"}</TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        {getStatusBadge(item.status)}
                                                    </TableCell>
                                                </>
                                            ) : (
                                                <>
                                                    <TableCell className="font-medium">
                                                        <div className="flex flex-col">
                                                            <span>{item.asset_tag}</span>
                                                            <span className="text-[10px] text-muted-foreground uppercase">{item.serial_number || 'S/N'}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1.5 rounded-md bg-rose-gold/10 text-rose-gold">
                                                                {getDeviceIcon(item)}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-bold leading-none">{item.brand}</span>
                                                                <span className="text-sm">{item.model}</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-xs font-mono text-muted-foreground">{item.hostname || "-"}</TableCell>
                                                    <TableCell className="text-sm font-medium text-slate-700">{item.assigned_to_name || "Disponível"}</TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">{item.location || "-"}</TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        {getStatusBadge(item.status)}
                                                    </TableCell>
                                                </>
                                            )}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Alert className="bg-rose-gold/5 border-rose-gold/20">
                <Info className="h-4 w-4 text-rose-gold" />
                <AlertDescription className="text-rose-gold-dark text-xs">
                    <b>Dica:</b> O inventário é sincronizado com o banco de dados principal da MedBeauty.
                    Para movimentações em massa, utilize o modo de importação CSV disponível no painel avançado.
                </AlertDescription>
            </Alert>



            {/* Modal Editar Equipamento */}
            {
                isAssetModalOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                        <Card className="bg-white dark:bg-card w-full max-w-[500px] border-rose-gold/20 shadow-2xl">
                            <CardHeader className="bg-muted/10 border-b border-rose-gold/10">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl font-serif text-rose-gold-dark">
                                        {editingAsset?.id ? 'Editar Equipamento' : 'Novo Equipamento'}
                                    </CardTitle>
                                    <Button variant="ghost" size="icon" onClick={() => setIsAssetModalOpen(false)}><X className="h-4 w-4" /></Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="grid gap-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Patrimônio</Label>
                                            <Input value={editingAsset?.asset_tag || ''} onChange={e => setEditingAsset({ ...editingAsset, asset_tag: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Hostname</Label>
                                            <Input value={editingAsset?.hostname || ''} onChange={e => setEditingAsset({ ...editingAsset, hostname: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Marca</Label>
                                            <Input value={editingAsset?.brand || ''} onChange={e => setEditingAsset({ ...editingAsset, brand: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Modelo</Label>
                                            <Input value={editingAsset?.model || ''} onChange={e => setEditingAsset({ ...editingAsset, model: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Responsável</Label>
                                            <Input value={editingAsset?.assigned_to_name || ''} onChange={e => setEditingAsset({ ...editingAsset, assigned_to_name: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Empresa</Label>
                                            <Input value={editingAsset?.company || ''} onChange={e => setEditingAsset({ ...editingAsset, company: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Nº de Série</Label>
                                            <Input value={editingAsset?.serial_number || ''} onChange={e => setEditingAsset({ ...editingAsset, serial_number: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Setor</Label>
                                            <Input value={editingAsset?.location || ''} onChange={e => setEditingAsset({ ...editingAsset, location: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Status</Label>
                                            <Select value={editingAsset?.status || 'available'} onValueChange={v => setEditingAsset({ ...editingAsset, status: v })}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="available">Disponível</SelectItem>
                                                    <SelectItem value="in_use">Em Uso</SelectItem>
                                                    <SelectItem value="maintenance">Manutenção</SelectItem>
                                                    <SelectItem value="broken">Defeito</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {activeSubTab !== 'chip' && activeSubTab !== 'tablet' && (
                                            <div className="space-y-2">
                                                <Label>Tipo Dispositivo</Label>
                                                <Input disabled value={activeSubTab} className="bg-muted/50" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Observações</Label>
                                        <textarea
                                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-gold focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={editingAsset?.notes || ''}
                                            onChange={e => setEditingAsset({ ...editingAsset, notes: e.target.value })}
                                            placeholder="Informações adicionais..."
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-rose-gold/10">
                                    <Button variant="outline" onClick={() => setIsAssetModalOpen(false)}>Cancelar</Button>
                                    <Button onClick={handleSaveAsset} disabled={actionLoading} className="bg-rose-gold text-white hover:bg-rose-gold-dark">
                                        {actionLoading ? 'Salvando...' : 'Salvar'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )
            }
        </div>
    );
}

// --- MOCK DATA FOR FALLBACK ---


const MOCK_ASSETS: TechAsset[] = [
    { id: "1", asset_tag: "MB-NB-001", model: "Galaxy Book Pro", brand: "Samsung", device_type: "notebook", status: "available", location: "TI", hostname: "MB-TI-01" },
    { id: "2", asset_tag: "MB-NB-002", model: "Latitude 3420", brand: "Dell", device_type: "notebook", status: "in_use", assigned_to_name: "Osman Dennis", location: "Comercial", hostname: "MB-COM-02" },
    { id: "3", asset_tag: "MB-TAB-001", model: "Galaxy Tab A7", brand: "Samsung", device_type: "tablet", status: "available", location: "Logística", hostname: "MB-LOG-01" },
    { id: "4", asset_tag: "MB-SM-001", model: "iPhone 13", brand: "Apple", device_type: "smartphone", status: "in_use", assigned_to_name: "Viviane Toledo", location: "Marketing", hostname: "MB-MKT-01" },
];

function Alert({ children, className }: any) {
    return <div className={`p-4 rounded-lg flex gap-3 border ${className}`}>{children}</div>;
}

function AlertDescription({ children, className }: any) {
    return <div className={`text-sm ${className}`}>{children}</div>;
}
