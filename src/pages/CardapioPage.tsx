import { useRestaurantStore } from '@/store/restaurant-store';
import { CATEGORIES } from '@/types/restaurant';
import { Flame, UtensilsCrossed } from 'lucide-react';
import { useState } from 'react';

const CardapioPage = () => {
  const products = useRestaurantStore((s) => s.products);
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur p-4">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Flame className="h-7 w-7 text-primary" />
          <h1 className="font-display text-2xl font-bold">Na Brasa</h1>
        </div>
        <div className="mx-auto mt-3 flex max-w-lg gap-2 overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                activeCategory === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-lg p-4">
        <div className="grid gap-3">
          {products
            .filter((p) => p.category === activeCategory)
            .map((p) => (
              <div
                key={p.id}
                className={`flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-opacity ${
                  !p.available || p.stock === 0 ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <UtensilsCrossed className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{p.name}</p>
                    {(!p.available || p.stock === 0) && (
                      <span className="text-xs text-destructive font-semibold">Esgotado</span>
                    )}
                  </div>
                </div>
                <p className="font-display text-lg font-bold text-primary">
                  R$ {p.price.toFixed(2)}
                </p>
              </div>
            ))}
        </div>
      </main>

      <footer className="border-t border-border p-4 text-center text-sm text-muted-foreground">
        Cardápio apenas para consulta · Faça seu pedido no balcão
      </footer>
    </div>
  );
};

export default CardapioPage;
