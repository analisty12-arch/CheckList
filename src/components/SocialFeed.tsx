import { useState } from "react";
import {
    Heart,
    MessageCircle,
    Share2,
    MoreHorizontal,
    Plus,
    Image as ImageIcon,
    Users,
    Calendar,
    Briefcase,
    TrendingUp,
    Settings,
    LogOut,
    Search,
    Bell,
    CheckCircle2,
    AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Post {
    id: string;
    author: {
        name: string;
        role: string;
        avatar?: string;
    };
    content: string;
    timestamp: string;
    likes: number;
    comments: number;
    type: 'admissao' | 'demissao' | 'update';
    tag?: string;
}

interface SocialFeedProps {
    user: { name: string; avatar?: string };
    onLogout: () => void;
    onOpenChecklists: () => void;
    pendingManager?: number;
}

const MOCK_POSTS: Post[] = [
    {
        id: "1",
        author: { name: "RH MedBeauty", role: "Recursos Humanos", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=RH" },
        content: "Boas-vindas ao nosso novo Analista de Marketing! Iniciando hoje em nossa filial de São Paulo. 🚀",
        timestamp: "2h atrás",
        likes: 12,
        comments: 3,
        type: 'admissao',
        tag: "Novo Colaborador"
    },
    {
        id: "2",
        author: { name: "Gestão TI", role: "Tecnologia", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=TI" },
        content: "Checklist de infraestrutura para o setor Comercial finalizado. Acessos SAP e CRM liberados.",
        timestamp: "5h atrás",
        likes: 8,
        comments: 1,
        type: 'update',
        tag: "TI Stats"
    },
    {
        id: "3",
        author: { name: "Maria Oliveira", role: "Diretoria", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria" },
        content: "Obrigada a todos pelo empenho no fechamento dos desligamentos do mês. Ciclos encerrados com sucesso e respeito.",
        timestamp: "Ontem",
        likes: 24,
        comments: 5,
        type: 'demissao',
        tag: "Encerramento"
    }
];

export function SocialFeed({ user, onLogout, onOpenChecklists, pendingManager = 0 }: SocialFeedProps) {
    const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
    const [newPost, setNewPost] = useState("");

    const handlePost = () => {
        if (!newPost.trim()) return;
        const post: Post = {
            id: Date.now().toString(),
            author: { name: user.name, role: "Colaborador", avatar: user.avatar },
            content: newPost,
            timestamp: "Agora",
            likes: 0,
            comments: 0,
            type: 'update'
        };
        setPosts([post, ...posts]);
        setNewPost("");
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full bg-white border-b border-rose-gold/10 shadow-sm">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
                            <div className="bg-rose-gold p-1.5 rounded-lg">
                                <CheckCircle2 className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-serif font-bold text-rose-gold-dark hidden md:block">MEDBEAUTY</span>
                        </div>
                        <div className="relative hidden lg:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Pesquisar processos..."
                                className="pl-10 w-80 bg-slate-50 border-none focus-visible:ring-rose-gold/30 h-9"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="text-rose-gold hover:bg-rose-gold/10">
                            <Bell className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-rose-gold hover:bg-rose-gold/10 relative" onClick={onOpenChecklists}>
                            <Briefcase className="h-5 w-5" />
                            {pendingManager > 0 && (
                                <span className="absolute top-1 right-1 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                            )}
                        </Button>
                        <div className="h-8 w-[1px] bg-rose-gold/20 mx-2" />
                        <div className="flex items-center gap-3 pl-2">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold leading-none">{user.name}</p>
                                <p className="text-xs text-muted-foreground mt-1">Meu Perfil</p>
                            </div>
                            <Avatar className="h-9 w-9 border-2 border-rose-gold/20">
                                <AvatarImage src={user.avatar} />
                                <AvatarFallback className="bg-rose-gold text-white">{user.name[0]}</AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Sidebar Left */}
                    <div className="lg:col-span-3 hidden lg:block space-y-4">
                        <Card className="border-none shadow-soft overflow-hidden">
                            <div className="h-20 bg-gradient-to-r from-rose-gold to-sage" />
                            <CardContent className="pt-0 -mt-10 px-4 pb-6">
                                <div className="text-center">
                                    <Avatar className="h-20 w-20 border-4 border-white mx-auto shadow-md">
                                        <AvatarImage src={user.avatar} />
                                        <AvatarFallback className="text-2xl">{user.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <h3 className="mt-3 font-bold text-lg">{user.name}</h3>
                                    <p className="text-sm text-muted-foreground">Portal Interno</p>
                                </div>
                                <div className="mt-6 space-y-3 pt-6 border-t border-rose-gold/10">
                                    <div className="flex justify-between text-sm group cursor-pointer hover:text-rose-gold transition-colors">
                                        <span className="text-muted-foreground group-hover:text-rose-gold">Processos Ativos</span>
                                        <span className="font-bold text-rose-gold">14</span>
                                    </div>
                                    <div className="flex justify-between text-sm group cursor-pointer hover:text-rose-gold transition-colors">
                                        <span className="text-muted-foreground group-hover:text-rose-gold">Pendente TI</span>
                                        <span className="font-bold text-rose-gold">3</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-1">
                            {[
                                { icon: Users, label: "Equipe", active: true },
                                { icon: TrendingUp, label: "Analytics" },
                                { icon: Calendar, label: "Calendário" },
                                { icon: Settings, label: "Configurações" },
                            ].map((item) => (
                                <Button
                                    key={item.label}
                                    variant="ghost"
                                    className={`w-full justify-start gap-3 h-11 px-4 hover:bg-rose-gold/5 ${item.active ? 'bg-rose-gold/10 text-rose-gold font-bold' : 'text-slate-600'}`}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.label}
                                </Button>
                            ))}
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-3 h-11 px-4 text-destructive hover:bg-destructive/5 mt-4"
                                onClick={onLogout}
                            >
                                <LogOut className="h-5 w-5" />
                                Sair
                            </Button>
                        </div>
                    </div>

                    {/* Main Feed */}
                    <div className="lg:col-span-6 space-y-6">
                        {/* New Post Creator */}
                        <Card className="border-none shadow-soft overflow-hidden">
                            <CardContent className="p-4">
                                <div className="flex gap-4">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-3">
                                        <Input
                                            placeholder={`O que está acontecendo no RH hoje, ${user.name}?`}
                                            className="border-none bg-slate-50 focus-visible:ring-rose-gold/20 text-lg py-6"
                                            value={newPost}
                                            onChange={(e) => setNewPost(e.target.value)}
                                        />
                                        <div className="flex items-center justify-between pt-2 border-t border-rose-gold/5">
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="sm" className="gap-2 text-rose-gold hover:bg-rose-gold/5">
                                                    <ImageIcon className="h-4 w-4" />
                                                    <span className="hidden sm:inline">Foto/Vídeo</span>
                                                </Button>
                                                <Button variant="ghost" size="sm" className="gap-2 text-rose-gold hover:bg-rose-gold/5 font-medium" onClick={onOpenChecklists}>
                                                    <Plus className="h-4 w-4" />
                                                    <span className="hidden sm:inline">Admissão/Demissão</span>
                                                </Button>
                                            </div>
                                            <Button
                                                className="bg-rose-gold hover:bg-rose-gold-dark text-white px-6 rounded-full font-bold shadow-md shadow-rose-gold/20"
                                                onClick={handlePost}
                                            >
                                                Publicar
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Feed Filter */}
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            <Badge className="bg-rose-gold text-white cursor-pointer px-4 py-1.5 h-auto transition-all">Tudo</Badge>
                            <Badge variant="secondary" className="bg-white border text-slate-600 cursor-pointer px-4 py-1.5 h-auto hover:bg-rose-gold/10 transition-all">Admissões</Badge>
                            <Badge variant="secondary" className="bg-white border text-slate-600 cursor-pointer px-4 py-1.5 h-auto hover:bg-rose-gold/10 transition-all">Demissões</Badge>
                            <Badge variant="secondary" className="bg-white border text-slate-600 cursor-pointer px-4 py-1.5 h-auto hover:bg-rose-gold/10 transition-all">TI Updates</Badge>
                        </div>

                        {/* Posts */}
                        <div className="space-y-4">
                            {posts.map((post) => (
                                <Card key={post.id} className="border-none shadow-soft animate-in slide-in-from-bottom-4 duration-500">
                                    <div className="p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={post.author.avatar} />
                                                    <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-[15px]">{post.author.name}</h4>
                                                        {post.tag && (
                                                            <Badge variant="outline" className="text-[10px] h-4 bg-rose-gold/5 text-rose-gold border-rose-gold/20 uppercase tracking-wider px-1">
                                                                {post.tag}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">{post.author.role} • {post.timestamp}</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                                                <MoreHorizontal className="h-5 w-5" />
                                            </Button>
                                        </div>

                                        <p className="text-[15px] leading-relaxed mb-4 text-slate-700 whitespace-pre-wrap">
                                            {post.content}
                                        </p>

                                        {post.type === 'admissao' && (
                                            <div className="mb-4 rounded-xl overflow-hidden border border-rose-gold/10 bg-slate-50 p-6 flex flex-col items-center text-center space-y-3">
                                                <div className="h-16 w-16 rounded-full bg-rose-gold/10 flex items-center justify-center">
                                                    <Users className="h-8 w-8 text-rose-gold" />
                                                </div>
                                                <div>
                                                    <h5 className="font-bold">Integration Quest em Aberto</h5>
                                                    <p className="text-xs text-muted-foreground px-4">Complete as tarefas de integração para este novo colaborador.</p>
                                                </div>
                                                <Button size="sm" variant="outline" className="border-rose-gold text-rose-gold hover:bg-rose-gold hover:text-white" onClick={onOpenChecklists}>
                                                    Ver Checklist
                                                </Button>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between pt-3 border-t border-rose-gold/5">
                                            <div className="flex gap-6">
                                                <button className="flex items-center gap-2 text-rose-gold hover:text-rose-gold-dark transition-colors group">
                                                    <Heart className={`h-5 w-5 ${post.likes > 0 ? 'fill-rose-gold' : ''} group-hover:scale-110 transition-transform`} />
                                                    <span className="text-sm font-medium">{post.likes}</span>
                                                </button>
                                                <button className="flex items-center gap-2 text-slate-500 hover:text-rose-gold transition-colors group">
                                                    <MessageCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                                    <span className="text-sm font-medium">{post.comments}</span>
                                                </button>
                                            </div>
                                            <button className="flex items-center gap-2 text-slate-500 hover:text-rose-gold transition-colors">
                                                <Share2 className="h-5 w-5" />
                                                <span className="text-sm font-medium hidden sm:inline">Compartilhar</span>
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="lg:col-span-3 hidden lg:block space-y-6">
                        <Card className="border-none shadow-soft">
                            <CardHeader className="pb-3 pt-4">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Próximas Admissões</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {[
                                    { name: "João Silva", date: "01/02", role: "Vendas" },
                                    { name: "Ana Paula", date: "03/02", role: "Marketing" },
                                    { name: "Ricardo M.", date: "05/02", role: "TI" },
                                ].map((item) => (
                                    <div key={item.name} className="flex items-center gap-3 group hover:bg-rose-gold/5 p-1 rounded-lg transition-colors cursor-pointer">
                                        <div className="h-10 w-10 rounded-full bg-rose-gold/10 text-rose-gold flex items-center justify-center font-bold">
                                            {item.date.split('/')[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">{item.name}</p>
                                            <p className="text-xs text-muted-foreground">{item.role}</p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-soft bg-rose-gold/5 border border-rose-gold/10 overflow-hidden relative">
                            {pendingManager > 0 && (
                                <div className="absolute top-0 right-0 p-2">
                                    <Badge className="bg-red-500 hover:bg-red-600 animate-pulse text-[10px] px-1.5 h-4">
                                        Pendente
                                    </Badge>
                                </div>
                            )}
                            <CardContent className="p-4 text-center space-y-3">
                                <div className="relative inline-block">
                                    <Briefcase className="h-8 w-8 text-rose-gold mx-auto" />
                                    {pendingManager > 0 && (
                                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border-2 border-white">
                                            {pendingManager}
                                        </div>
                                    )}
                                </div>
                                <h4 className="font-bold text-rose-gold-dark leading-tight">Central de Checklists</h4>
                                <p className="text-xs text-muted-foreground">Gerencie o fluxo completo de admissões e demissões em um só lugar.</p>

                                <div className="pt-1">
                                    <Button className="w-full bg-rose-gold hover:bg-rose-gold-dark text-white font-bold h-9 gap-2 relative group overflow-hidden" onClick={onOpenChecklists}>
                                        Acessar Dashboard
                                        {pendingManager > 0 && (
                                            <div className="flex items-center gap-1 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full animate-bounce">
                                                <AlertTriangle className="h-2.5 w-2.5" />
                                                <span>Atenção</span>
                                            </div>
                                        )}
                                    </Button>
                                    {pendingManager > 0 && (
                                        <p className="text-[10px] text-red-500 font-bold mt-2 animate-in fade-in slide-in-from-top-1">
                                            Aguardando preenchimento do Gestor!
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
