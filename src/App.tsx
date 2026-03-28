import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useRestaurantStore } from "@/store/restaurant-store";
import { subscribeAuthState } from "@/lib/auth";
import RoleSelect from "@/components/RoleSelect";
import AppHeader from "@/components/AppHeader";
import AuthPage from "@/components/AuthPage";
import GarcomPage from "@/pages/GarcomPage";
import AssadorPage from "@/pages/AssadorPage";
import CaixaPage from "@/pages/CaixaPage";
import EstoquePage from "@/pages/EstoquePage";
import CardapioPage from "@/pages/CardapioPage";
import AdminUsersPage from "@/pages/AdminUsersPage";
import { Button } from "@/components/ui/button";
import { Receipt, Package, ShieldCheck } from "lucide-react";

const queryClient = new QueryClient();
const AppRouter = import.meta.env.BASE_URL === "/" ? BrowserRouter : HashRouter;

const CaixaArea = () => {
  const [tab, setTab] = useState<'caixa' | 'estoque' | 'usuarios'>('caixa');

  return (
    <div>
      <div className="flex gap-2 p-4 pb-0">
        <Button
          variant={tab === 'caixa' ? 'default' : 'secondary'}
          size="lg"
          onClick={() => setTab('caixa')}
          className="gap-2"
        >
          <Receipt className="h-4 w-4" /> Caixa
        </Button>
        <Button
          variant={tab === 'estoque' ? 'default' : 'secondary'}
          size="lg"
          onClick={() => setTab('estoque')}
          className="gap-2"
        >
          <Package className="h-4 w-4" /> Estoque
        </Button>
        <Button
          variant={tab === 'usuarios' ? 'default' : 'secondary'}
          size="lg"
          onClick={() => setTab('usuarios')}
          className="gap-2"
        >
          <ShieldCheck className="h-4 w-4" /> Usuarios
        </Button>
      </div>
      {tab === 'caixa' && <CaixaPage />}
      {tab === 'estoque' && <EstoquePage />}
      {tab === 'usuarios' && <AdminUsersPage />}
    </div>
  );
};

const MainApp = () => {
  const authUserId = useRestaurantStore((s) => s.authUserId);
  const role = useRestaurantStore((s) => s.role);

  if (!authUserId) return <AuthPage />;
  if (!role) return <RoleSelect />;

  return (
    <div className="min-h-screen">
      <AppHeader />
      {role === 'garcom' && <GarcomPage />}
      {role === 'assador' && <AssadorPage />}
      {role === 'caixa' && <CaixaArea />}
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppBootstrap />
      <Toaster />
      <Sonner />
      <AppRouter>
        <Routes>
          <Route path="/cardapio" element={<CardapioPage />} />
          <Route path="*" element={<MainApp />} />
        </Routes>
      </AppRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

const AppBootstrap = () => {
  const setAuthUserId = useRestaurantStore((s) => s.setAuthUserId);
  const clearSession = useRestaurantStore((s) => s.clearSession);
  const initRoleSync = useRestaurantStore((s) => s.initRoleSync);
  const initProductsSync = useRestaurantStore((s) => s.initProductsSync);
  const initOrdersSync = useRestaurantStore((s) => s.initOrdersSync);

  useEffect(() => {
    let cleanupRole = () => {};
    let cleanupProducts = () => {};
    let cleanupOrders = () => {};
    const unsubscribeAuth = subscribeAuthState((user) => {
      cleanupRole();
      cleanupProducts();
      cleanupOrders();

      cleanupRole = () => {};
      cleanupProducts = () => {};
      cleanupOrders = () => {};

      if (!user) {
        clearSession();
        return;
      }

      setAuthUserId(user.uid);
      cleanupRole = initRoleSync(user.uid);
      cleanupProducts = initProductsSync();
      cleanupOrders = initOrdersSync();
    });

    return () => {
      unsubscribeAuth();
      cleanupRole();
      cleanupProducts();
      cleanupOrders();
    };
  }, [setAuthUserId, clearSession, initRoleSync, initProductsSync, initOrdersSync]);

  return null;
};

export default App;
