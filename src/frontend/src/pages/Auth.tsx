import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { LogIn, UserPlus } from 'lucide-react';
import makenaIcon from '@/assets/makena-icon.png';

export default function Auth() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Estados para o Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Estados para o Registo (mantidos para preservar a UI)
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regCompany, setRegCompany] = useState('');
  const [regRole, setRegRole] = useState<'vendedor' | 'cliente'>('cliente');
  
  const [submitting, setSubmitting] = useState(false);

  // Se já tem sessão, vai direto para a home
  useEffect(() => {
    if (session) {
      navigate("/");
    }
  }, [session, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // O FastAPI espera Form Data com "username" e "password"
      const formData = new FormData();
      formData.append("username", loginEmail);
      formData.append("password", loginPassword);

      const response = await api.post("/auth/login", formData);
      
      // Guarda o token gerado pelo FastAPI
      localStorage.setItem("yale_token", response.data.access_token);
      
      toast({ title: 'Sucesso', description: 'Login realizado com sucesso!' });
      
      // O recarregamento forçado garante que o contexto leia o token imediatamente
      window.location.href = "/";
    } catch (err: any) {
      toast({ 
        title: 'Erro ao entrar', 
        description: err.response?.data?.detail || 'Credenciais inválidas. Tente novamente.', 
        variant: 'destructive' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Montamos o "pacote" exatamente como o Pydantic (Python) espera
      const payload = {
        name: regName,
        email: regEmail,
        password: regPassword,
        company: regCompany,
        role: regRole
      };

      // Disparamos para o backend
      await api.post("/auth/register", payload);
      
      // Se o backend disser 200 OK, comemoramos:
      toast({ 
        title: 'Cadastro realizado!', 
        description: 'Conta criada com sucesso. Por favor, faça o login.',
        variant: 'default' // ou 'success' se o seu tema suportar
      });

      // Limpamos o formulário para não deixar rastro
      setRegEmail('');
      setRegPassword('');
      setRegName('');
      setRegCompany('');
      
      // Opcional e elegante: Fazer um bypass e trocar a aba ativa para "login"
      // Se quiser isso, precisaremos adicionar um state para controlar a aba ativa do componente <Tabs>
      
    } catch (err: any) {
      // Se o Python chiar (ex: Email já cadastrado), mostramos o erro dele
      toast({ 
        title: 'Erro ao cadastrar', 
        description: err.response?.data?.detail || 'Ocorreu um erro de comunicação com o servidor.', 
        variant: 'destructive' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero flex-col justify-center items-center p-12">
        <div className="max-w-md text-center">
          <div className="flex flex-col items-center gap-4 mb-8">
            <img src={makenaIcon} alt="Grupo Makena" className="h-14" />
            <h1 className="text-3xl font-black text-primary-foreground tracking-tight">
              Peça <span className="text-gradient-brand">Certa</span>
            </h1>
          </div>
          <p className="text-lg text-primary-foreground/80 leading-relaxed">
            Catálogo inteligente de peças para empilhadeiras. Encontre a peça certa para cada modelo, de forma rápida e precisa.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            {['Yale', 'GLP/GDP', 'ERP/ERC', 'Motor', 'Transmissão', 'Hidráulica'].map(tag => (
              <span key={tag} className="px-3 py-1 rounded-full bg-secondary/20 text-primary-foreground/70 text-sm font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex flex-col items-center gap-2 mb-8">
            <img src={makenaIcon} alt="Grupo Makena" className="h-10" />
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              Peça <span className="text-secondary">Certa</span>
            </h1>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" className="gap-2"><LogIn className="h-4 w-4" />Entrar</TabsTrigger>
              <TabsTrigger value="register" className="gap-2"><UserPlus className="h-4 w-4" />Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="industrial-shadow">
                <CardHeader>
                  <CardTitle>Bem-vindo de volta</CardTitle>
                  <CardDescription>Entre com suas credenciais para acessar o catálogo</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input id="login-email" type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required placeholder="seu@email.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Senha</Label>
                      <Input id="login-password" type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required placeholder="••••••••" />
                    </div>
                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? 'Entrando...' : 'Entrar'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card className="industrial-shadow">
                <CardHeader>
                  <CardTitle>Criar conta</CardTitle>
                  <CardDescription>Cadastre-se para acessar o catálogo de peças</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-name">Nome completo</Label>
                      <Input id="reg-name" value={regName} onChange={e => setRegName(e.target.value)} required placeholder="João Silva" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">Email</Label>
                      <Input id="reg-email" type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} required placeholder="seu@email.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Senha</Label>
                      <Input id="reg-password" type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} required minLength={6} placeholder="Mínimo 6 caracteres" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-company">Empresa (opcional)</Label>
                      <Input id="reg-company" value={regCompany} onChange={e => setRegCompany(e.target.value)} placeholder="Nome da empresa" />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de conta</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <button type="button" onClick={() => setRegRole('cliente')}
                          className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${regRole === 'cliente' ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                          🏢 Cliente
                        </button>
                        <button type="button" onClick={() => setRegRole('vendedor')}
                          className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${regRole === 'vendedor' ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                          🔧 Vendedor
                        </button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? 'Cadastrando...' : 'Cadastrar'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}