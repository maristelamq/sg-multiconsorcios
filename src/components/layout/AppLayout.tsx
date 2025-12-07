import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Menu
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Importar", href: "/import", icon: Upload },
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
                <span className="text-primary-foreground font-bold text-sm">ERP</span>
              </div>
              <span className="font-semibold text-lg">Consórcios</span>
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
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
