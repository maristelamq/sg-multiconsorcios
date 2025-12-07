import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, Users, DollarSign, ShoppingCart, FileSpreadsheet, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Index = () => {
  const features = [
    {
      icon: Building2,
      title: "Gestão Multiempresa",
      description: "Controle completo de múltiplas empresas do grupo em um único sistema",
    },
    {
      icon: ShoppingCart,
      title: "Vendas e Cotas",
      description: "Gerenciamento de vendas, cotas e documentação com workflow de aprovação",
    },
    {
      icon: DollarSign,
      title: "Motor de Comissões",
      description: "Cálculo automático de comissões com regras flexíveis e defasagem",
    },
    {
      icon: Users,
      title: "Vendedores e Representantes",
      description: "Controle de parceiros, comissões e folhas de pagamento",
    },
    {
      icon: FileSpreadsheet,
      title: "Importação Inteligente",
      description: "Importação automática de planilhas com validação e conciliação",
    },
    {
      icon: BarChart3,
      title: "Relatórios Executivos",
      description: "Dashboards e relatórios por empresa, grupo, vendedor e período",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-glow to-secondary py-24">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="container relative mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 flex justify-center">
              <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <span className="text-white font-bold text-2xl">SGC</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white md:text-5xl lg:text-6xl">
              Sistema de Gestão de Consórcios
            </h1>
            <p className="mt-2 text-2xl font-semibold text-white/95 md:text-3xl">
              Multiempresa
            </p>
            <p className="mt-6 text-lg text-white/85">
              Plataforma completa para gestão de vendas, comissões, recebimentos e parceiros
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
                <Link to="/dashboard">Acessar Dashboard</Link>
              </Button>
              <Button asChild size="lg" className="bg-white/10 text-white border border-white/30 hover:bg-white/20">
                <Link to="/vendas/nova">Nova Venda</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/50 text-white hover:bg-white/10"
              >
                <a href="#features">Conhecer Módulos</a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-background py-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              Módulos do Sistema
            </h2>
            <p className="mt-4 text-muted-foreground">
              Solução completa para administração de consórcios
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="group h-full border-border bg-card p-6 transition-all hover:border-primary hover:shadow-lg">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-all group-hover:bg-primary group-hover:text-white">
                      <Icon className="h-6 w-6 text-primary transition-colors group-hover:text-white" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-secondary py-20">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Pronto para começar?
            </h2>
            <p className="mt-4 text-xl text-white/90">
              Acesse o sistema e gerencie suas operações de consórcio
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 bg-white text-primary hover:bg-white/90"
            >
              <Link to="/dashboard">Acessar Agora</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>Sistema de Gestão de Consórcios Multiempresa © 2025. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
