import { Toaster } from "@/components/ui/toaster";
import Dashboard from "@/pages/Dashboard";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Import from "./pages/Import";
import NotFound from "./pages/NotFound";
import AppLayout from "./components/layout/AppLayout";
import Empresas from "./pages/cadastros/Empresas";
import Administradoras from "./pages/cadastros/Administradoras";
import Representantes from "./pages/cadastros/Representantes";
import Vendedores from "./pages/cadastros/Vendedores";
import Clientes from "./pages/cadastros/Clientes";
import Cotas from "./pages/cadastros/Cotas";
import RegrasComissao from "./pages/comissoes/RegrasComissao";
import ComissoesReceber from "./pages/comissoes/ComissoesReceber";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/import" element={<Import />} />
            <Route path="/cadastros/empresas" element={<Empresas />} />
            <Route path="/cadastros/administradoras" element={<Administradoras />} />
            <Route path="/cadastros/representantes" element={<Representantes />} />
            <Route path="/cadastros/vendedores" element={<Vendedores />} />
            <Route path="/cadastros/clientes" element={<Clientes />} />
            <Route path="/cadastros/cotas" element={<Cotas />} />
            <Route path="/comissoes/regras" element={<RegrasComissao />} />
            <Route path="/comissoes/receber" element={<ComissoesReceber />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
