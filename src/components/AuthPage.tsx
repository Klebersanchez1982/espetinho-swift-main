import { useState } from 'react';
import { Flame, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { registerWithEmail, signInWithEmail } from '@/lib/auth';

const AuthPage = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Preencha email e senha.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        await signInWithEmail(email.trim(), password);
      } else {
        await registerWithEmail(email.trim(), password);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Falha de autenticacao.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-6 flex items-center gap-3 text-primary">
          <Flame className="h-8 w-8" />
          <h1 className="font-display text-2xl font-bold">Na Brasa</h1>
        </div>

        <div className="mb-4 flex gap-2">
          <Button
            variant={mode === 'login' ? 'default' : 'secondary'}
            className="flex-1"
            onClick={() => setMode('login')}
          >
            <LogIn className="h-4 w-4" /> Entrar
          </Button>
          <Button
            variant={mode === 'register' ? 'default' : 'secondary'}
            className="flex-1"
            onClick={() => setMode('register')}
          >
            <UserPlus className="h-4 w-4" /> Criar conta
          </Button>
        </div>

        <div className="space-y-3">
          <input
            type="email"
            placeholder="email@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-input bg-muted px-3 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-input bg-muted px-3 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button size="xl" className="w-full" disabled={loading} onClick={submit}>
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
