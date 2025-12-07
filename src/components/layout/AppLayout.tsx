import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { 
  LayoutDashboard, 
  Upload, 
  Building2, 
  Landmark, 
  Users, 
  UserCheck, 
  User, 
  FileText,
  ChevronLeft,
  ChevronRight,
  Settings2,
  DollarSign,
  ShoppingCart,
  Plus,
  Wallet,
  Receipt,
  CreditCard,
  CheckCircle,
  Scale,
  LogOut
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Importar", href: "/import", icon: Upload },
  { type: "divider", label: "Vendas" },
  { name: "Todas as Vendas", href: "/vendas", icon: ShoppingCart },
  { name: "Nova Venda", href: "/vendas/nova", icon: Plus },
  { type: "divider", label: "Comissões" },
  { name: "Regras", href: "/comissoes/regras", icon: Settings2 },
  { name: "A Receber", href: "/comissoes/receber", icon: DollarSign },
  { type: "divider", label: "Financeiro" },
  { name: "Contas a Receber", href: "/financeiro/receber", icon: Wallet },
  { name: "Recebidos", href: "/financeiro/recebidos", icon: Receipt },
  { name: "Contas a Pagar", href: "/financeiro/pagar", icon: CreditCard },
  { name: "Pagos", href: "/financeiro/pagos", icon: CheckCircle },
  { name: "Conciliação", href: "/financeiro/conciliacao", icon: Scale },
  { type: "divider", label: "Cadastros" },
  { name: "Empresas", href: "/cadastros/empresas", icon: Building2 },
  { name: "Administradoras", href: "/cadastros/administradoras", icon: Landmark },
  { name: "Representantes", href: "/cadastros/representantes", icon: Users },
  { name: "Vendedores", href: "/cadastros/vendedores", icon: UserCheck },
  { name: "Clientes", href: "/cadastros/clientes", icon: User },
  { name: "Cotas", href: "/cadastros/cotas", icon: FileText },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside 
        className={cn(
          "flex flex-col border-r bg-card transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!collapsed && (
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">SGC</span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm leading-tight">Sistema de Gestão</span>
                <span className="text-xs text-muted-foreground leading-tight">de Consórcios</span>
              </div>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(collapsed && "mx-auto")}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1 px-2">
            {navigation.map((item, index) => {
              if (item.type === "divider") {
                return (
                  <div key={index} className="pt-4 pb-2">
                    {!collapsed && (
                      <span className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {item.label}
                      </span>
                    )}
                    {collapsed && <div className="border-t mx-2" />}
                  </div>
                );
              }

              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.href}
                  to={item.href!}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    collapsed && "justify-center px-2"
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* User Profile & Logout */}
        <div className="border-t p-2">
          {!collapsed && profile && (
            <div className="px-3 py-2 mb-2">
              <p className="text-sm font-medium text-foreground truncate">{profile.nome}</p>
              <p className="text-xs text-muted-foreground truncate">{profile.cargo || 'Usuário'}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "default"}
            onClick={handleLogout}
            className={cn(
              "w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10",
              collapsed && "justify-center"
            )}
            title="Sair"
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span className="ml-2">Sair</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
