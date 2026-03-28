import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRestaurantStore } from '@/store/restaurant-store';
import { Order } from '@/types/restaurant';
import { Receipt, CreditCard, Banknote, Smartphone, MessageCircle, ArrowLeft, BarChart3 } from 'lucide-react';

const CaixaPage = () => {
  const { orders, closeOrder } = useRestaurantStore();
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<Order['paymentMethod']>('dinheiro');
  const [paidAmount, setPaidAmount] = useState('');
  const [showReport, setShowReport] = useState(false);

  const openOrders = orders.filter((o) => o.status !== 'fechada');
  const closedOrders = orders.filter((o) => o.status === 'fechada');
  const order = selectedOrder ? orders.find((o) => o.id === selectedOrder) : null;

  const total = order ? order.items.reduce((s, i) => s + i.price * i.quantity, 0) : 0;
  const paid = parseFloat(paidAmount) || 0;
  const change = payMethod === 'dinheiro' ? Math.max(0, paid - total) : 0;

  const handleClose = () => {
    if (!order) return;
    closeOrder(order.id, payMethod, paid || total);
    setSelectedOrder(null);
    setPaidAmount('');
  };

  const sendWhatsApp = (o: Order, isReceipt: boolean) => {
    const orderTotal = o.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const items = o.items.map((i) => `${i.quantity}x ${i.productName} - R$${(i.price * i.quantity).toFixed(2)}`).join('%0A');
    const msg = isReceipt
      ? `🧾 *Comprovante - Na Brasa*%0A%0ACliente: ${o.client.name}%0AMesa: ${o.table}%0A%0A${items}%0A%0A*Total: R$${orderTotal.toFixed(2)}*%0APagamento: ${o.paymentMethod}%0AData: ${o.closedAt ? new Date(o.closedAt).toLocaleString('pt-BR') : ''}`
      : `📋 *Comanda - Na Brasa*%0A%0ACliente: ${o.client.name}%0AMesa: ${o.table}%0A%0A${items}%0A%0A*Total: R$${orderTotal.toFixed(2)}*`;
    const phone = o.client.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone ? '55' + phone : ''}?text=${msg}`, '_blank');
  };

  if (showReport) {
    const todayTotal = closedOrders.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.price * i.quantity, 0), 0);
    const byMethod = { dinheiro: 0, pix: 0, cartao: 0 };
    closedOrders.forEach((o) => {
      if (o.paymentMethod) {
        byMethod[o.paymentMethod] += o.items.reduce((s, i) => s + i.price * i.quantity, 0);
      }
    });
    const productSales: Record<string, number> = {};
    closedOrders.forEach((o) => o.items.forEach((i) => {
      productSales[i.productName] = (productSales[i.productName] || 0) + i.quantity;
    }));
    const topProducts = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return (
      <div className="flex flex-col gap-4 p-4">
        <Button variant="ghost" size="sm" onClick={() => setShowReport(false)} className="self-start gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <h2 className="font-display text-2xl font-bold">Relatório do Dia</h2>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-muted-foreground text-sm">Total vendido</p>
          <p className="font-display text-3xl font-bold text-primary">R$ {todayTotal.toFixed(2)}</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border bg-card p-3 text-center">
            <Banknote className="mx-auto h-5 w-5 text-success mb-1" />
            <p className="text-xs text-muted-foreground">Dinheiro</p>
            <p className="font-bold">R$ {byMethod.dinheiro.toFixed(2)}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 text-center">
            <Smartphone className="mx-auto h-5 w-5 text-primary mb-1" />
            <p className="text-xs text-muted-foreground">Pix</p>
            <p className="font-bold">R$ {byMethod.pix.toFixed(2)}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 text-center">
            <CreditCard className="mx-auto h-5 w-5 text-accent mb-1" />
            <p className="text-xs text-muted-foreground">Cartão</p>
            <p className="font-bold">R$ {byMethod.cartao.toFixed(2)}</p>
          </div>
        </div>
        {topProducts.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-display font-bold mb-3">Mais Vendidos</h3>
            {topProducts.map(([name, qty], i) => (
              <div key={name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-muted-foreground">{i + 1}.</span>
                <span className="flex-1 ml-2 font-medium">{name}</span>
                <span className="font-bold text-primary">{qty}x</span>
              </div>
            ))}
          </div>
        )}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-display font-bold mb-3">Histórico ({closedOrders.length} comandas)</h3>
          {closedOrders.map((o) => (
            <div key={o.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className="font-medium">Mesa {o.table} - {o.client.name}</p>
                <p className="text-xs text-muted-foreground">{o.closedAt ? new Date(o.closedAt).toLocaleString('pt-BR') : ''}</p>
              </div>
              <p className="font-bold">R$ {o.items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (order && order.status !== 'fechada') {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(null)} className="self-start gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="font-display text-xl font-bold">Mesa {order.table}</h2>
          <p className="text-sm text-muted-foreground">{order.client.name}</p>
          <div className="mt-4 space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-md bg-muted p-3">
                <span>{item.quantity}x {item.productName}</span>
                <span className="font-semibold">R$ {(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <span className="font-display text-lg font-bold">Total</span>
            <span className="font-display text-2xl font-bold text-primary">R$ {total.toFixed(2)}</span>
          </div>
        </div>

        {order.client.phone && (
          <Button size="lg" className="gap-2 bg-[#25D366] hover:bg-[#1da851] text-white" onClick={() => sendWhatsApp(order, false)}>
            <MessageCircle className="h-5 w-5" /> Enviar Comanda via WhatsApp
          </Button>
        )}

        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-display font-bold mb-3">Forma de Pagamento</h3>
          <div className="grid grid-cols-3 gap-2">
            {([['dinheiro', 'Dinheiro', Banknote], ['pix', 'Pix', Smartphone], ['cartao', 'Cartão', CreditCard]] as const).map(([method, label, Icon]) => (
              <Button
                key={method}
                variant={payMethod === method ? 'default' : 'outline'}
                size="lg"
                className="flex-col h-auto py-4 gap-1"
                onClick={() => setPayMethod(method)}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs">{label}</span>
              </Button>
            ))}
          </div>

          {payMethod === 'dinheiro' && (
            <div className="mt-4 space-y-2">
              <label className="text-sm text-muted-foreground">Valor pago</label>
              <input
                type="number"
                placeholder="0.00"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="w-full rounded-md border border-input bg-muted px-3 py-3 text-foreground text-lg font-bold placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {paid > 0 && (
                <div className="flex items-center justify-between rounded-md bg-success/10 p-3">
                  <span className="text-success font-medium">Troco</span>
                  <span className="text-success font-display text-xl font-bold">R$ {change.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <Button size="xl" onClick={handleClose} className="mt-2">
          <Receipt className="h-5 w-5" /> Fechar Comanda
        </Button>
      </div>
    );
  }

  if (order && order.status === 'fechada') {
    return (
      <div className="flex flex-col items-center gap-4 p-4 py-8">
        <div className="rounded-full bg-success/20 p-4">
          <Receipt className="h-10 w-10 text-success" />
        </div>
        <h2 className="font-display text-2xl font-bold">Comanda Fechada!</h2>
        <p className="text-muted-foreground">Mesa {order.table} - {order.client.name}</p>
        <p className="font-display text-3xl font-bold text-primary">
          R$ {order.items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}
        </p>
        {order.client.phone && (
          <Button size="lg" className="gap-2 bg-[#25D366] hover:bg-[#1da851] text-white" onClick={() => sendWhatsApp(order, true)}>
            <MessageCircle className="h-5 w-5" /> Enviar Comprovante WhatsApp
          </Button>
        )}
        <Button variant="secondary" size="lg" onClick={() => setSelectedOrder(null)}>
          Voltar ao Caixa
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">Caixa</h2>
        <Button variant="secondary" size="lg" onClick={() => setShowReport(true)}>
          <BarChart3 className="h-5 w-5" /> Relatório
        </Button>
      </div>

      {openOrders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <Receipt className="h-12 w-12" />
          <p>Nenhuma comanda aberta</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {openOrders.map((o) => {
            const oTotal = o.items.reduce((s, i) => s + i.price * i.quantity, 0);
            return (
              <div
                key={o.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-4 cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => setSelectedOrder(o.id)}
              >
                <div>
                  <p className="font-display font-bold text-lg">Mesa {o.table}</p>
                  <p className="text-sm text-muted-foreground">{o.client.name} · {o.items.length} itens</p>
                </div>
                <p className="font-display font-bold text-xl text-primary">R$ {oTotal.toFixed(2)}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CaixaPage;
