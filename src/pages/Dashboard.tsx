import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  Receipt, 
  Users, 
  AlertTriangle,
  DollarSign,
  Building2,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  RefreshCw
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface DashboardStats {
  totalVendas: number;
  valorTotalCredito: number;
  valorTotalRecebido: number;
  totalComissoes: number;
  valorComissoes: number;
  totalInadimplencias: number;
  valorInadimplencias: number;
  totalDivergencias: number;
  valorDivergencias: number;
  totalAdministradoras: number;
  totalVendedores: number;
  totalClientes: number;
}

interface VendaPorMes {
  mes: string;
  vendas: number;
  valor: number;
}

interface VendaPorSituacao {
  situacao: string;
  quantidade: number;
  valor: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [vendasPorMes, setVendasPorMes] = useState<VendaPorMes[]>([]);
  const [vendasPorSituacao, setVendasPorSituacao] = useState<VendaPorSituacao[]>([]);
  const [recentImports, setRecentImports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = async () => {
    setIsLoading(true);
    
    try {
      // Load stats
      const [
        vendasRes,
        recebimentosRes,
        comissoesRes,
        inadimplenciasRes,
        ajustesRes,
        administradorasRes,
        vendedoresRes,
        clientesRes,
        importsRes
      ] = await Promise.all([
        supabase.from('vendas').select('*'),
        supabase.from('recebimentos').select('valor_recebido'),
        supabase.from('comissoes_pagas').select('valor_pago'),
        supabase.from('inadimplencias').select('valor'),
        supabase.from('ajustes_conciliacao').select('diferenca'),
        supabase.from('administradoras').select('id'),
        supabase.from('vendedores').select('id'),
        supabase.from('clientes').select('id'),
        supabase.from('import_logs').select('*').order('created_at', { ascending: false }).limit(5)
      ]);

      const vendas = vendasRes.data || [];
      const recebimentos = recebimentosRes.data || [];
      const comissoes = comissoesRes.data || [];
      const inadimplencias = inadimplenciasRes.data || [];
      const ajustes = ajustesRes.data || [];

      setStats({
        totalVendas: vendas.length,
        valorTotalCredito: vendas.reduce((sum, v) => sum + (v.valor_credito || 0), 0),
        valorTotalRecebido: recebimentos.reduce((sum, r) => sum + (r.valor_recebido || 0), 0),
        totalComissoes: comissoes.length,
        valorComissoes: comissoes.reduce((sum, c) => sum + (c.valor_pago || 0), 0),
        totalInadimplencias: inadimplencias.length,
        valorInadimplencias: inadimplencias.reduce((sum, i) => sum + (i.valor || 0), 0),
        totalDivergencias: ajustes.length,
        valorDivergencias: ajustes.reduce((sum, a) => sum + Math.abs(a.diferenca || 0), 0),
        totalAdministradoras: administradorasRes.data?.length || 0,
        totalVendedores: vendedoresRes.data?.length || 0,
        totalClientes: clientesRes.data?.length || 0
      });

      setRecentImports(importsRes.data || []);

      // Group vendas por mês
      const vendasByMonth = new Map<string, { vendas: number; valor: number }>();
      vendas.forEach(v => {
        const date = new Date(v.data_venda);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const current = vendasByMonth.get(monthKey) || { vendas: 0, valor: 0 };
        vendasByMonth.set(monthKey, {
          vendas: current.vendas + 1,
          valor: current.valor + (v.valor_credito || 0)
        });
      });

      const sortedMonths = Array.from(vendasByMonth.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-12)
        .map(([mes, data]) => ({
          mes: new Date(mes + '-01').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
          ...data
        }));

      setVendasPorMes(sortedMonths);

      // Group vendas por situação
      const vendasBySituacao = new Map<string, { quantidade: number; valor: number }>();
      vendas.forEach(v => {
        const situacao = v.situacao || 'ATIVO';
        const current = vendasBySituacao.get(situacao) || { quantidade: 0, valor: 0 };
        vendasBySituacao.set(situacao, {
          quantidade: current.quantidade + 1,
          valor: current.valor + (v.valor_credito || 0)
        });
      });

      setVendasPorSituacao(
        Array.from(vendasBySituacao.entries()).map(([situacao, data]) => ({
          situacao,
          ...data
        }))
      );

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatCurrencyShort = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}K`;
    }
    return formatCurrency(value);
  };

  const COLORS = ['hsl(var(--success))', 'hsl(var(--primary))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--muted-foreground))'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw className="h-8 w-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Painel de Conciliação
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Visão geral de vendas, comissões e inadimplências
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={loadDashboardData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button asChild>
                <Link to="/import">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Nova Importação
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Main Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <Card className="p-6 border-success/30 bg-gradient-to-br from-success/5 to-transparent">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Vendas</p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {stats?.totalVendas.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-sm text-success mt-1">
                    {formatCurrencyShort(stats?.valorTotalCredito || 0)} em crédito
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                  <Receipt className="h-6 w-6 text-success" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Valor Recebido</p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {formatCurrencyShort(stats?.valorTotalRecebido || 0)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <ArrowUpRight className="h-4 w-4 text-success" />
                    <span className="text-sm text-success">
                      {stats && stats.valorTotalCredito > 0 
                        ? ((stats.valorTotalRecebido / stats.valorTotalCredito) * 100).toFixed(1)
                        : 0}% do crédito
                    </span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 border-warning/30 bg-gradient-to-br from-warning/5 to-transparent">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Comissões Pagas</p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {stats?.totalComissoes.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-sm text-warning mt-1">
                    {formatCurrencyShort(stats?.valorComissoes || 0)} total
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-warning" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6 border-destructive/30 bg-gradient-to-br from-destructive/5 to-transparent">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Inadimplências</p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {stats?.totalInadimplencias.toLocaleString('pt-BR')}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <ArrowDownRight className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-destructive">
                      {formatCurrencyShort(stats?.valorInadimplencias || 0)}
                    </span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Secondary Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Administradoras</p>
                <p className="text-xl font-bold text-foreground">{stats?.totalAdministradoras}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Vendedores</p>
                <p className="text-xl font-bold text-foreground">{stats?.totalVendedores}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Clientes</p>
                <p className="text-xl font-bold text-foreground">{stats?.totalClientes}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-5 w-5 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">Divergências</p>
                <p className="text-xl font-bold text-warning">{stats?.totalDivergencias}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="vendas" className="space-y-6">
          <TabsList>
            <TabsTrigger value="vendas">Vendas por Mês</TabsTrigger>
            <TabsTrigger value="situacao">Por Situação</TabsTrigger>
            <TabsTrigger value="imports">Importações Recentes</TabsTrigger>
          </TabsList>

          <TabsContent value="vendas">
            <Card className="p-6">
              <h3 className="font-semibold text-foreground mb-4">Evolução de Vendas</h3>
              {vendasPorMes.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={vendasPorMes}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="mes" className="text-muted-foreground" fontSize={12} />
                    <YAxis className="text-muted-foreground" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number, name: string) => [
                        name === 'valor' ? formatCurrency(value) : value,
                        name === 'valor' ? 'Valor' : 'Vendas'
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="vendas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Quantidade" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  Nenhum dado disponível
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="situacao">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="p-6">
                <h3 className="font-semibold text-foreground mb-4">Distribuição por Situação</h3>
                {vendasPorSituacao.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={vendasPorSituacao}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ situacao, percent }) => `${situacao} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="quantidade"
                      >
                        {vendasPorSituacao.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Nenhum dado disponível
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold text-foreground mb-4">Detalhamento</h3>
                <div className="space-y-4">
                  {vendasPorSituacao.map((item, index) => (
                    <div key={item.situacao} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div>
                          <p className="font-medium text-foreground">{item.situacao}</p>
                          <p className="text-sm text-muted-foreground">{item.quantidade} vendas</p>
                        </div>
                      </div>
                      <p className="font-semibold text-foreground">{formatCurrency(item.valor)}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="imports">
            <Card className="p-6">
              <h3 className="font-semibold text-foreground mb-4">Últimas Importações</h3>
              {recentImports.length > 0 ? (
                <div className="space-y-3">
                  {recentImports.map((imp) => (
                    <div 
                      key={imp.id} 
                      className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileSpreadsheet className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{imp.nome_arquivo}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(imp.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium text-foreground">{imp.linhas_validas} linhas</p>
                          <p className="text-sm text-muted-foreground">
                            {imp.linhas_rejeitadas > 0 && (
                              <span className="text-destructive">{imp.linhas_rejeitadas} rejeitadas</span>
                            )}
                          </p>
                        </div>
                        <Badge variant={imp.tipo_importacao === 'historico' ? 'default' : 'secondary'}>
                          {imp.tipo_importacao === 'historico' ? 'Histórico' : 'Pagamento'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
                  <FileSpreadsheet className="h-12 w-12 mb-3 opacity-50" />
                  <p>Nenhuma importação realizada ainda</p>
                  <Button asChild className="mt-4" variant="outline">
                    <Link to="/import">Fazer primeira importação</Link>
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
