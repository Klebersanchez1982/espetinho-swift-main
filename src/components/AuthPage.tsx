import { useState } from 'react';
import { Flame, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MASTER_DEFAULT_PASSWORD, MASTER_USERNAME, signInOrCreateMaster, signInWithUsername } from '@/lib/auth';

const AuthPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Preencha usuario e senha.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (username.trim().toLowerCase() === MASTER_USERNAME && password === MASTER_DEFAULT_PASSWORD) {
        await signInOrCreateMaster();
        return;
      }

      await signInWithUsername(username.trim(), password);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Falha de autenticacao.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleMaster = async () => {
    setLoading(true);
    setError('');

    try {
      await signInOrCreateMaster();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Falha no acesso master.';
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

        <p className="mb-4 text-sm text-muted-foreground">
          Entre com usuario e senha cadastrados no modulo Usuarios do Caixa.
        </p>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
            {loading ? 'Aguarde...' : 'Entrar'}
          </Button>

          <Button size="lg" variant="secondary" className="w-full" disabled={loading} onClick={handleMaster}>
            <Wrench className="h-4 w-4" /> Entrar com usuario master
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
