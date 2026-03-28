import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRestaurantStore } from '@/store/restaurant-store';
import { CATEGORIES } from '@/types/restaurant';
import { Package, Plus, Minus, AlertTriangle, QrCode, X, ArrowLeft } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const LOW_STOCK_THRESHOLD = 5;

const EstoquePage = () => {
  const { products, addProduct, updateProductStock, toggleProductAvailability } = useRestaurantStore();
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [adjustQty, setAdjustQty] = useState<Record<string, string>>({});
  const [showQR, setShowQR] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // New product form
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState(CATEGORIES[0]);
  const [newStock, setNewStock] = useState('');

  const cardapioUrl = `${window.location.origin}/cardapio`;

  const handleAdjust = (productId: string, delta: number) => {
    updateProductStock(productId, delta);
  };

  const handleManualEntry = (productId: string) => {
    const qty = parseInt(adjustQty[productId] || '0');
    if (qty > 0) {
      updateProductStock(productId, qty);
      setAdjustQty((prev) => ({ ...prev, [productId]: '' }));
    }
  };

  const handleAddProduct = () => {
    if (!newName.trim() || !newPrice) return;
    addProduct({
      id: crypto.randomUUID(),
      name: newName.trim(),
      price: parseFloat(newPrice),
      category: newCategory,
      available: true,
      stock: parseInt(newStock) || 0,
    });
    setNewName('');
    setNewPrice('');
    setNewStock('');
    setNewCategory(CATEGORIES[0]);
    setShowAddForm(false);
  };

  const lowStockItems = products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD && p.stock > 0);
  const outOfStockItems = products.filter((p) => p.stock === 0);

  if (showQR) {
    return (
      <div className="flex flex-col items-center gap-6 p-6">
        <Button variant="ghost" size="sm" onClick={() => setShowQR(false)} className="self-start gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <h2 className="font-display text-2xl font-bold">Cardápio Digital</h2>
        <p className="text-muted-foreground text-center">
          Escaneie o QR Code para acessar o cardápio
        </p>
        <div className="rounded-2xl border-2 border-primary/20 bg-card p-6 shadow-lg">
          <QRCodeSVG
            value={cardapioUrl}
            size={220}
            bgColor="transparent"
            fgColor="hsl(var(--foreground))"
            level="H"
          />
        </div>
        <p className="text-xs text-muted-foreground break-all text-center max-w-xs">{cardapioUrl}</p>
        <Button variant="outline" onClick={() => navigator.clipboard.writeText(cardapioUrl)}>
          Copiar Link
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-2xl font-bold">Estoque</h2>
        <div className="flex gap-2">
          <Button variant="default" size="lg" onClick={() => setShowAddForm(true)} className="gap-2">
            <Plus className="h-5 w-5" /> <span className="hidden sm:inline">Novo Item</span><span className="sm:hidden">Novo</span>
          </Button>
          <Button variant="secondary" size="lg" onClick={() => setShowQR(true)} className="gap-2">
            <QrCode className="h-5 w-5" /> <span className="hidden sm:inline">QR Cardápio</span><span className="sm:hidden">QR</span>
          </Button>
        </div>
      </div>

      {/* Add product modal/form */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
          <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-border bg-card p-5 space-y-4 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">Adicionar Produto</h3>
              <Button variant="ghost" size="icon-lg" onClick={() => setShowAddForm(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <input
              placeholder="Nome do produto"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full rounded-md border border-input bg-muted px-3 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Preço (R$)</label>
                <input
                  type="number"
                  step="0.50"
                  placeholder="0.00"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full rounded-md border border-input bg-muted px-3 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Estoque inicial</label>
                <input
                  type="number"
                  placeholder="0"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  className="w-full rounded-md border border-input bg-muted px-3 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Categoria</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <Button
                    key={cat}
                    variant={newCategory === cat ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => setNewCategory(cat)}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>
            <Button
              size="xl"
              className="w-full"
              onClick={handleAddProduct}
              disabled={!newName.trim() || !newPrice}
            >
              <Plus className="h-5 w-5" /> Adicionar Produto
            </Button>
          </div>
        </div>
      )}

      {/* Alerts */}
      {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
        <div className="space-y-2">
          {outOfStockItems.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <span className="text-sm font-medium text-destructive">
                {outOfStockItems.length} item(ns) esgotado(s): {outOfStockItems.map((p) => p.name).join(', ')}
              </span>
            </div>
          )}
          {lowStockItems.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <span className="text-sm font-medium text-warning">
                Estoque baixo: {lowStockItems.map((p) => `${p.name} (${p.stock})`).join(', ')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Categories */}
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

      {/* Product list */}
      <div className="grid gap-3">
        {products
          .filter((p) => p.category === activeCategory)
          .map((p) => (
            <div
              key={p.id}
              className={`rounded-lg border bg-card p-4 transition-opacity ${
                p.stock === 0 ? 'border-destructive/30 opacity-60' : p.stock <= LOW_STOCK_THRESHOLD ? 'border-warning/30' : 'border-border'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    p.stock === 0 ? 'bg-destructive/10' : 'bg-primary/10'
                  }`}>
                    <Package className={`h-5 w-5 ${p.stock === 0 ? 'text-destructive' : 'text-primary'}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-sm text-muted-foreground">R$ {p.price.toFixed(2)}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className={`font-display text-2xl font-bold ${
                    p.stock === 0 ? 'text-destructive' : p.stock <= LOW_STOCK_THRESHOLD ? 'text-warning' : 'text-foreground'
                  }`}>
                    {p.stock}
                  </p>
                  <p className="text-xs text-muted-foreground">unid.</p>
                </div>
              </div>

              {/* Controls - responsive layout */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon-lg"
                    onClick={() => handleAdjust(p.id, -1)}
                    disabled={p.stock === 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon-lg" onClick={() => handleAdjust(p.id, 1)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-[140px]">
                  <input
                    type="number"
                    placeholder="Qtd"
                    value={adjustQty[p.id] || ''}
                    onChange={(e) => setAdjustQty((prev) => ({ ...prev, [p.id]: e.target.value }))}
                    className="w-16 sm:w-20 rounded-md border border-input bg-muted px-2 py-2 text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button variant="secondary" size="sm" onClick={() => handleManualEntry(p.id)}>
                    Entrada
                  </Button>
                </div>
                <Button
                  variant={p.available ? 'outline' : 'destructive'}
                  size="sm"
                  onClick={() => toggleProductAvailability(p.id)}
                >
                  {p.available ? 'Ativo' : 'Inativo'}
                </Button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default EstoquePage;
