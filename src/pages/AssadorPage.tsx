import { Button } from '@/components/ui/button';
import { useRestaurantStore } from '@/store/restaurant-store';
import { ChefHat, Clock, Flame as FireIcon, CheckCircle2 } from 'lucide-react';

const AssadorPage = () => {
  const { orders, updateItemStatus } = useRestaurantStore();

  const activeOrders = orders.filter((o) => o.status !== 'fechada');
  const pendingItems = activeOrders.flatMap((o) =>
    o.items.filter((i) => i.status !== 'pronto').map((i) => ({ ...i, orderId: o.id, table: o.table }))
  );

  const grouped = {
    pendente: pendingItems.filter((i) => i.status === 'pendente'),
    preparo: pendingItems.filter((i) => i.status === 'preparo'),
  };

  const readyItems = activeOrders.flatMap((o) =>
    o.items.filter((i) => i.status === 'pronto').map((i) => ({ ...i, orderId: o.id, table: o.table }))
  );

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center gap-3">
        <ChefHat className="h-7 w-7 text-primary" />
        <h2 className="font-display text-2xl font-bold">Cozinha</h2>
        {grouped.pendente.length > 0 && (
          <span className="ml-auto animate-pulse-glow rounded-full bg-warning/20 px-3 py-1 text-sm font-bold text-warning">
            {grouped.pendente.length} pendente{grouped.pendente.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Pendentes */}
      {grouped.pendente.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-warning">
            <Clock className="h-5 w-5" /> Pendentes
          </h3>
          <div className="grid gap-2">
            {grouped.pendente.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-warning/30 bg-warning/5 p-4">
                <div>
                  <p className="font-bold text-lg">{item.quantity}x {item.productName}</p>
                  <p className="text-sm text-muted-foreground">Mesa {item.table}</p>
                </div>
                <Button
                  variant="warning"
                  size="xl"
                  onClick={() => updateItemStatus(item.orderId, item.id, 'preparo')}
                >
                  <FireIcon className="h-5 w-5" /> Preparar
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Em preparo */}
      {grouped.preparo.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-primary">
            <FireIcon className="h-5 w-5" /> Em Preparo
          </h3>
          <div className="grid gap-2">
            {grouped.preparo.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-4">
                <div>
                  <p className="font-bold text-lg">{item.quantity}x {item.productName}</p>
                  <p className="text-sm text-muted-foreground">Mesa {item.table}</p>
                </div>
                <Button
                  variant="success"
                  size="xl"
                  onClick={() => updateItemStatus(item.orderId, item.id, 'pronto')}
                >
                  <CheckCircle2 className="h-5 w-5" /> Pronto
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Prontos */}
      {readyItems.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-success">
            <CheckCircle2 className="h-5 w-5" /> Prontos para Entregar
          </h3>
          <div className="grid gap-2">
            {readyItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-success/30 bg-success/5 p-3 opacity-80">
                <div>
                  <p className="font-medium">{item.quantity}x {item.productName}</p>
                  <p className="text-sm text-muted-foreground">Mesa {item.table}</p>
                </div>
                <span className="text-sm text-success font-semibold">✓ Pronto</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {pendingItems.length === 0 && readyItems.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <ChefHat className="h-12 w-12" />
          <p>Nenhum pedido no momento</p>
        </div>
      )}
    </div>
  );
};

export default AssadorPage;
