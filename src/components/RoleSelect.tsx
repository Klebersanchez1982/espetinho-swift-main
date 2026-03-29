import { Flame, UtensilsCrossed, ChefHat, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRestaurantStore } from '@/store/restaurant-store';
import { isAuthorizedAdmin } from '@/lib/authorized-admins';
import { UserRole } from '@/types/restaurant';

const baseRoles: { role: Exclude<UserRole, 'caixa'>; label: string; icon: React.ReactNode; desc: string }[] = [
  { role: 'garcom', label: 'Garçom', icon: <UtensilsCrossed className="h-8 w-8" />, desc: 'Criar comandas e gerenciar pedidos' },
  { role: 'assador', label: 'Assador', icon: <ChefHat className="h-8 w-8" />, desc: 'Visualizar e preparar pedidos' },
];

const RoleSelect = () => {
  const setRole = useRestaurantStore((s) => s.setRole);
  const authEmail = useRestaurantStore((s) => s.authEmail);
  const availableRoles = useRestaurantStore((s) => s.availableRoles);
  const isAuthorized = isAuthorizedAdmin(authEmail);

  // Admins autorizados vão direto para caixa
  if (isAuthorized) {
    const caixaRole: UserRole = 'caixa';
    setRole(caixaRole);
    // Não renderiza este componente
    return null;
  }

  const roleMap: Record<UserRole, { role: UserRole; label: string; icon: React.ReactNode; desc: string }> = {
    garcom: {
      role: 'garcom',
      label: 'Garçom',
      icon: <UtensilsCrossed className="h-8 w-8" />,
      desc: 'Criar comandas e gerenciar pedidos',
    },
    assador: {
      role: 'assador',
      label: 'Assador',
      icon: <ChefHat className="h-8 w-8" />,
      desc: 'Visualizar e preparar pedidos',
    },
    caixa: {
      role: 'caixa',
      label: 'Caixa',
      icon: <Calculator className="h-8 w-8" />,
      desc: 'Acesso administrativo completo',
    },
  };

  const roles = availableRoles.length > 0
    ? availableRoles.map((role) => roleMap[role])
    : baseRoles;

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
    </div>
  );
};

export default RoleSelect;
