import { Flame, UtensilsCrossed, ChefHat, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRestaurantStore } from '@/store/restaurant-store';
import { UserRole } from '@/types/restaurant';

const roles: { role: UserRole; label: string; icon: React.ReactNode; desc: string }[] = [
  { role: 'garcom', label: 'Garçom', icon: <UtensilsCrossed className="h-8 w-8" />, desc: 'Criar comandas e gerenciar pedidos' },
  { role: 'assador', label: 'Assador', icon: <ChefHat className="h-8 w-8" />, desc: 'Visualizar e preparar pedidos' },
  { role: 'caixa', label: 'Caixa', icon: <Calculator className="h-8 w-8" />, desc: 'Fechar comandas e pagamentos' },
];

const RoleSelect = () => {
  const setRole = useRestaurantStore((s) => s.setRole);

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
            <span className="text-sm text-muted-foreground pl-11">{r.desc}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default RoleSelect;
