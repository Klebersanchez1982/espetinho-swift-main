import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRestaurantStore } from '@/store/restaurant-store';
import { Order, OrderItem, CATEGORIES } from '@/types/restaurant';
import { Plus, Minus, ShoppingCart, ArrowLeft, ClipboardList, MessageCircle } from 'lucide-react';

const GarcomPage = () => {
  const { products, orders, addOrder, addItemToOrder } = useRestaurantStore();
  const [view, setView] = useState<'list' | 'new' | 'detail'>('list');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [table, setTable] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);

  const openOrders = orders.filter((o) => o.status !== 'fechada');

  const addToCart = (productId: string) => {
    setCart((c) => ({ ...c, [productId]: (c[productId] || 0) + 1 }));
  };

  const removeFromCart = (productId: string) => {
    setCart((c) => {
      const n = (c[productId] || 0) - 1;
      if (n <= 0) {
        const { [productId]: _, ...rest } = c;
        return rest;
      }
      return { ...c, [productId]: n };
    });
  };

  const cartTotal = Object.entries(cart).reduce((sum, [pid, qty]) => {
    const p = products.find((p) => p.id === pid);
    return sum + (p ? p.price * qty : 0);
  }, 0);

  const cartCount = Object.values(cart).reduce((s, q) => s + q, 0);

  const submitOrder = () => {
    if (!table && !clientName) return;
    const items: OrderItem[] = Object.entries(cart).map(([pid, qty]) => {
      const p = products.find((p) => p.id === pid)!;
      return {
        id: crypto.randomUUID(),
        productId: pid,
        productName: p.name,
        quantity: qty,
        price: p.price,
        status: 'pendente' as const,
      };
    });
    const order: Order = {
      id: crypto.randomUUID(),
      table: table || 'Balcão',
      client: { name: clientName, phone: clientPhone },
      items,
      status: 'aberta',
      createdAt: new Date(),
    };
    addOrder(order);
    setCart({});
    setTable('');
    setClientName('');
    setClientPhone('');
    setView('list');
  };

  const addItemsToExisting = (orderId: string) => {
    Object.entries(cart).forEach(([pid, qty]) => {
      const p = products.find((p) => p.id === pid)!;
      const item: OrderItem = {
        id: crypto.randomUUID(),
        productId: pid,
        productName: p.name,
        quantity: qty,
        price: p.price,
        status: 'pendente' as const,
      };
      addItemToOrder(orderId, item);
    });
    setCart({});
    setView('list');
  };

  const detailOrder = selectedOrder ? orders.find((o) => o.id === selectedOrder) : null;

  const sendWhatsApp = (o: typeof detailOrder) => {
    if (!o) return;
    const orderTotal = o.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const items = o.items.map((i) => `${i.quantity}x ${i.productName} - R$${(i.price * i.quantity).toFixed(2)}`).join('%0A');
    const msg = `📋 *Comanda - Na Brasa*%0A%0ACliente: ${o.client.name}%0AMesa: ${o.table}%0A%0A${items}%0A%0A*Total: R$${orderTotal.toFixed(2)}*`;
    const phone = o.client.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone ? '55' + phone : ''}?text=${msg}`, '_blank');
  };

  const statusColors: Record<string, string> = {
    pendente: 'bg-warning/20 text-warning',
    preparo: 'bg-primary/20 text-primary',
    pronto: 'bg-success/20 text-success',
  };

  if (view === 'detail' && detailOrder) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Button variant="ghost" size="sm" onClick={() => setView('list')} className="self-start gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="font-display text-xl font-bold">Mesa {detailOrder.table}</h2>
          <p className="text-sm text-muted-foreground">{detailOrder.client.name}</p>
          <div className="mt-4 space-y-2">
            {detailOrder.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-md bg-muted p-3">
                <div>
                  <span className="font-medium">{item.quantity}x {item.productName}</span>
                  <span className="ml-2 text-muted-foreground">R$ {(item.price * item.quantity).toFixed(2)}</span>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusColors[item.status]}`}>
                  {item.status === 'pendente' ? 'Pendente' : item.status === 'preparo' ? 'Em preparo' : 'Pronto'}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <span className="font-display text-lg font-bold">Total</span>
            <span className="font-display text-xl font-bold text-primary">
              R$ {detailOrder.items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}
            </span>
          </div>
        </div>
        {detailOrder.client.phone && (
          <Button
            size="xl"
            className="bg-[#25D366] hover:bg-[#1da851] text-white gap-2"
            onClick={() => sendWhatsApp(detailOrder)}
          >
            <MessageCircle className="h-5 w-5" /> Enviar Comanda via WhatsApp
          </Button>
        )}
        <Button size="xl" onClick={() => { setSelectedOrder(detailOrder.id); setView('new'); }}>
          <Plus className="h-5 w-5" /> Adicionar Itens
        </Button>
      </div>
    );
  }

  if (view === 'new') {
    return (
      <div className="flex flex-col gap-4 p-4 pb-32">
        <Button variant="ghost" size="sm" onClick={() => { setView('list'); setSelectedOrder(null); }} className="self-start gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        {!selectedOrder && (
          <div className="space-y-3 rounded-lg border border-border bg-card p-4">
            <h2 className="font-display text-lg font-bold">Dados da Comanda</h2>
            <input
              placeholder="Mesa (ex: 5) ou Balcão"
              value={table}
              onChange={(e) => setTable(e.target.value)}
              className="w-full rounded-md border border-input bg-muted px-3 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              placeholder="Nome do cliente"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full rounded-md border border-input bg-muted px-3 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              placeholder="WhatsApp (opcional)"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              className="w-full rounded-md border border-input bg-muted px-3 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {products
            .filter((p) => p.category === activeCategory && p.available && p.stock > 0)
            .map((p) => {
              const inCart = cart[p.id] || 0;
              const canAdd = inCart < p.stock;
              return (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-sm text-primary font-semibold">R$ {p.price.toFixed(2)}</p>
                    <p className={`text-xs ${p.stock <= 5 ? 'text-warning font-semibold' : 'text-muted-foreground'}`}>
                      Estoque: {p.stock}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {inCart > 0 && (
                      <>
                        <Button variant="outline" size="icon-lg" onClick={() => removeFromCart(p.id)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-bold text-lg">{inCart}</span>
                      </>
                    )}
                    <Button variant="default" size="icon-lg" onClick={() => addToCart(p.id)} disabled={!canAdd}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
        </div>

        {cartCount > 0 && (
          <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card p-4 shadow-2xl">
            <div className="mx-auto flex max-w-lg items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{cartCount} itens</p>
                <p className="font-display text-xl font-bold text-primary">R$ {cartTotal.toFixed(2)}</p>
              </div>
              <Button
                size="xl"
                onClick={() => selectedOrder ? addItemsToExisting(selectedOrder) : submitOrder()}
                disabled={!selectedOrder && !table && !clientName}
              >
                <ShoppingCart className="h-5 w-5" />
                {selectedOrder ? 'Adicionar' : 'Enviar Pedido'}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">Comandas</h2>
        <Button size="lg" onClick={() => { setSelectedOrder(null); setView('new'); }}>
          <Plus className="h-5 w-5" /> Nova Comanda
        </Button>
      </div>

      {openOrders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <ClipboardList className="h-12 w-12" />
          <p>Nenhuma comanda aberta</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {openOrders.map((o) => (
            <div
              key={o.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4 cursor-pointer hover:border-primary/30 transition-colors"
              onClick={() => { setSelectedOrder(o.id); setView('detail'); }}
            >
              <div>
                <p className="font-display font-bold text-lg">Mesa {o.table}</p>
                <p className="text-sm text-muted-foreground">{o.client.name} · {o.items.length} itens</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">R$ {o.items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}</p>
                <div className="flex gap-1 mt-1">
                  {o.items.some(i => i.status === 'pendente') && <span className="h-2 w-2 rounded-full bg-warning" />}
                  {o.items.some(i => i.status === 'preparo') && <span className="h-2 w-2 rounded-full bg-primary" />}
                  {o.items.some(i => i.status === 'pronto') && <span className="h-2 w-2 rounded-full bg-success" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GarcomPage;
