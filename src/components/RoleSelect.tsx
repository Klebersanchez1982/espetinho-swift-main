import { useMemo, useState } from 'react';
import { Flame, UtensilsCrossed, ChefHat, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useRestaurantStore } from '@/store/restaurant-store';
import { isAuthorizedAdmin } from '@/lib/authorized-admins';
import { UserRole } from '@/types/restaurant';

const roles: { role: Exclude<UserRole, 'caixa'>; label: string; icon: React.ReactNode; desc: string }[] = [
  { role: 'garcom', label: 'Garçom', icon: <UtensilsCrossed className="h-8 w-8" />, desc: 'Criar comandas e gerenciar pedidos' },
  { role: 'assador', label: 'Assador', icon: <ChefHat className="h-8 w-8" />, desc: 'Visualizar e preparar pedidos' },
];

const RoleSelect = () => {
  const setRole = useRestaurantStore((s) => s.setRole);
  const authEmail = useRestaurantStore((s) => s.authEmail);
  const [secretOpen, setSecretOpen] = useState(false);
  const [secretCode, setSecretCode] = useState('');
  const [secretError, setSecretError] = useState('');

  const expectedSecret = useMemo(() => (import.meta.env.VITE_ADMIN_SECRET ?? '').trim(), []);
  const isAuthorized = isAuthorizedAdmin(authEmail);

  const handleSecretSubmit = () => {
    if (!isAuthorized) {
      setSecretError('Este e-mail nao esta autorizado para acessar a area de admin.');
      return;
    }

    if (!expectedSecret) {
      setSecretError('Entrada admin nao configurada. Defina VITE_ADMIN_SECRET no ambiente.');
      return;
    }

    if (secretCode.trim() !== expectedSecret) {
      setSecretError('Codigo secreto invalido.');
      return;
    }

    setSecretError('');
    setSecretCode('');
    setSecretOpen(false);
    setRole('caixa');
  };

  const canAccessAdmin = isAuthorized && expectedSecret;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <div className="flex items-center gap-3 text-primary">
        <Flame className="h-10 w-10" />
        <h1 className="font-display text-4xl font-bold tracking-tight">Na Brasa</h1>
      </div>
      <p className="text-muted-foreground text-lg">Selecione seu perfil para começar</p>
      <div className="grid w-full max-w-lg gap-4">
        {roles.map((r) => (
          <Button
            key={r.role}
            variant="outline"
            size="xl"
            className="flex h-auto flex-col items-start gap-1 border-border/50 p-6 text-left hover:border-primary/50 hover:bg-primary/5"
            onClick={() => setRole(r.role)}
          >
            <div className="flex items-center gap-3 text-primary">
              {r.icon}
              <span className="font-display text-xl font-bold">{r.label}</span>
            </div>
            <span className="pl-11 text-sm text-muted-foreground">{r.desc}</span>
          </Button>
        ))}
      </div>

      {canAccessAdmin && (
        <Dialog open={secretOpen} onOpenChange={setSecretOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              <KeyRound className="h-4 w-4" /> Entrada admin (Caixa)
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Area administrativa</DialogTitle>
              <DialogDescription>
                Digite o codigo secreto para liberar acesso de Caixa.
              </DialogDescription>
            </DialogHeader>

            <input
              type="password"
              value={secretCode}
              onChange={(e) => {
                setSecretCode(e.target.value);
                setSecretError('');
              }}
              placeholder="Codigo secreto"
              className="w-full rounded-md border border-input bg-muted px-3 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />

            {secretError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {secretError}
              </div>
            )}

            <DialogFooter>
              <Button variant="secondary" onClick={() => setSecretOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSecretSubmit}>Entrar como admin</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default RoleSelect;
