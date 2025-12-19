import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { Mail, Lock, User, Eye, EyeOff, Gift } from "lucide-react";
import { ThemeSelector } from "@/components/ThemeSelector";
import OrkadiaLogo from "@/assets/Orkadia-logo.png";

const signupSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string()
    .min(8, "Senha deve ter no mínimo 8 caracteres")
    .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
    .regex(/[0-9]/, "Senha deve conter pelo menos um número"),
  username: z.string()
    .min(3, "Nome de usuário deve ter no mínimo 3 caracteres")
    .max(20, "Nome de usuário deve ter no máximo 20 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "Nome de usuário só pode conter letras, números e _"),
  displayName: z.string()
    .min(2, "Nome de exibição deve ter no mínimo 2 caracteres")
    .max(50, "Nome de exibição deve ter no máximo 50 caracteres"),
});

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

const Auth = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const inviteCodeFromUrl = searchParams.get('invite');
  
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(inviteCodeFromUrl ? 'signup' : initialMode);
  
  // Debug log para verificar se os parâmetros estão sendo capturados
  useEffect(() => {
    if (inviteCodeFromUrl) {
      console.log('Código de convite detectado:', inviteCodeFromUrl);
      toast.success(`🎉 Código de convite detectado: ${inviteCodeFromUrl}`);
    }
  }, [inviteCodeFromUrl]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  
  // Signup form
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState(inviteCodeFromUrl || '');
  const [signupLoading, setSignupLoading] = useState(false);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      loginSchema.parse({ email: loginEmail, password: loginPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[`login_${err.path[0]}`] = err.message;
          }
        });
        setErrors(newErrors);
        return;
      }
    }
    
    setLoginLoading(true);

    try {
      const { error } = await signIn(loginEmail, loginPassword);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou senha incorretos');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Login realizado com sucesso!');
      }
    } catch (error) {
      toast.error('Ocorreu um erro. Tente novamente.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    if (signupPassword !== confirmPassword) {
      setErrors({ confirm_password: 'As senhas não coincidem' });
      return;
    }
    
    try {
      signupSchema.parse({ 
        email: signupEmail, 
        password: signupPassword, 
        username: signupUsername, 
        displayName: signupUsername 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[`signup_${err.path[0]}`] = err.message;
          }
        });
        setErrors(newErrors);
        return;
      }
    }
    
    setSignupLoading(true);

    try {
      const { error } = await signUp(signupEmail, signupPassword, signupUsername, signupUsername, inviteCode || undefined);
      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('Este email já está cadastrado');
        } else {
          toast.error(error.message);
        }
      } else {
        if (inviteCode) {
          toast.success('🎉 Conta criada com convite aplicado! Redirecionando...');
        } else {
          toast.success('Conta criada! Redirecionando...');
        }
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('Ocorreu um erro. Tente novamente.');
    } finally {
      setSignupLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center p-4">
      {/* Theme Selector - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeSelector />
      </div>
      
      <div className="w-full max-w-md">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img src={OrkadiaLogo} alt="Orkadia Logo" className="w-48 h-auto" />
          </div>
          
          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-1 flex">
              <button
                onClick={() => setActiveTab('login')}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  activeTab === 'login'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Entrar
              </button>
              <button
                onClick={() => setActiveTab('signup')}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  activeTab === 'signup'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Registrar
              </button>
            </div>
          </div>
        </div>

        {/* Login Form */}
        {activeTab === 'login' && (
          <Card className="bg-card/95 backdrop-blur-sm shadow-elevated">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-3xl bg-gradient-orkut bg-clip-text text-transparent">
                Entrar na Orkadia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="E-mail"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="pl-10 h-12"
                  />
                  {errors.login_email && (
                    <p className="text-xs text-destructive mt-1">{errors.login_email}</p>
                  )}
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Senha"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="pl-10 pr-10 h-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                  {errors.login_password && (
                    <p className="text-xs text-destructive mt-1">{errors.login_password}</p>
                  )}
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Esqueceu sua senha?
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full h-12 bg-gradient-orkut hover:opacity-90 text-white font-semibold"
                >
                  {loginLoading ? 'Entrando...' : 'Entrar'}
                </Button>

                <div className="text-center">
                  <span className="text-sm text-muted-foreground">Não tem uma conta? </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('signup')}
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    Registrar
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Signup Form */}
        {activeTab === 'signup' && (
          <Card className="bg-card/95 backdrop-blur-sm shadow-elevated">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-3xl bg-gradient-orkut bg-clip-text text-transparent">
                Registrar na Orkadia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Nome de Usuário"
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    className="pl-10 h-12"
                  />
                  {errors.signup_username && (
                    <p className="text-xs text-destructive mt-1">{errors.signup_username}</p>
                  )}
                </div>

                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="E-mail"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="pl-10 h-12"
                  />
                  {errors.signup_email && (
                    <p className="text-xs text-destructive mt-1">{errors.signup_email}</p>
                  )}
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Senha"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="pl-10 pr-10 h-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                  {errors.signup_password && (
                    <p className="text-xs text-destructive mt-1">{errors.signup_password}</p>
                  )}
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirmar Senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 h-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                  {errors.confirm_password && (
                    <p className="text-xs text-destructive mt-1">{errors.confirm_password}</p>
                  )}
                </div>

                <div className="relative">
                  <Gift className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Código de Convite (opcional)"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="pl-10 h-12"
                  />
                  {inviteCode && (
                    <p className="text-xs text-green-600 mt-1">🎉 Código de convite aplicado!</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={signupLoading}
                  className="w-full h-12 bg-gradient-orkut hover:opacity-90 text-white font-semibold"
                >
                  {signupLoading ? 'Criando Conta...' : 'Criar Conta'}
                </Button>

                <div className="text-center">
                  <span className="text-sm text-muted-foreground">Já tem uma conta? </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    Entrar
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            Voltar para o início
          </button>
          <div className="text-xs text-muted-foreground mt-2">
            Ao criar uma conta, você concorda com nossos{' '}
            <Link to="/terms" className="text-primary hover:underline">Termos de Uso</Link>
            {' '}e{' '}
            <Link to="/privacy" className="text-primary hover:underline">Política de Privacidade</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;