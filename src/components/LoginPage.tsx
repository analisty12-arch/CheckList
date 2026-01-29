import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Lock, User } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface LoginProps {
    onLogin: (user: any) => void;
}

export function LoginPage({ onLogin }: LoginProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Verify credentials in our custom users table
            const { data: user, error } = await supabase
                .from('app_users')
                .select('*')
                .eq('email', email)
                .eq('password', password) // Validating plain text for this local demo
                .single();

            if (error || !user) {
                console.error('Login error:', error);
                alert("Login falhou! Verifique suas credenciais.");
                setLoading(false);
                return;
            }

            // 2. Login successful - pass full user object with role/dept
            // Simulate a token/session delay if needed, or just proceed
            setTimeout(() => {
                onLogin(user);
                setLoading(false);
            }, 500);

        } catch (err) {
            console.error('Unexpected error:', err);
            alert("Erro ao tentar fazer login.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-gold/10 via-white to-sage/10 flex items-center justify-center p-4">
            <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-8">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-rose-gold mb-4 shadow-lg shadow-rose-gold/20">
                        <CheckCircle2 className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-serif font-bold text-rose-gold-dark">MEDBEAUTY</h1>
                    <p className="text-muted-foreground mt-2 font-medium">Portal Interno de Processos</p>
                </div>

                <Card className="border-none shadow-premium bg-white/80 backdrop-blur-md overflow-hidden">
                    <div className="h-1.5 bg-gradient-to-r from-rose-gold via-sage to-rose-gold" />
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-2xl font-serif">Bem-vindo(a)</CardTitle>
                        <CardDescription>
                            Acesse com suas credenciais corporativas
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium ml-1">Email</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-gold pointer-events-none" />
                                    <Input
                                        type="email"
                                        placeholder="usuario@medbeauty.com"
                                        className="pl-10 h-11 border-rose-gold/20 focus-visible:ring-rose-gold bg-white/50"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium ml-1">Senha</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-gold pointer-events-none" />
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-10 h-11 border-rose-gold/20 focus-visible:ring-rose-gold bg-white/50"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-11 bg-rose-gold hover:bg-rose-gold-dark text-white font-semibold transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-70 mt-4"
                                disabled={loading}
                            >
                                {loading ? "Conectando..." : "Entrar no Portal"}
                            </Button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-rose-gold/10 text-center">
                            <p className="text-xs text-muted-foreground">
                                © 2026 MedBeauty S.A. — Talentos & Processos Digital
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
