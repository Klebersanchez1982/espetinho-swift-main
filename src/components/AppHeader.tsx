import { Flame, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRestaurantStore } from '@/store/restaurant-store';
import { signOutUser } from '@/lib/auth';

const AppHeader = () => {
  const { role } = useRestaurantStore();

  const roleLabels = { garcom: 'Garçom', assador: 'Assador', caixa: 'Caixa' };

  if (!role) return null;

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur px-4 py-3">
      <div className="flex items-center gap-2 text-primary">
        <Flame className="h-6 w-6" />
        <span className="font-display text-lg font-bold">Na Brasa</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
          {roleLabels[role]}
        </span>
        <Button variant="ghost" size="icon-lg" onClick={() => void signOutUser()}>
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};

export default AppHeader;
