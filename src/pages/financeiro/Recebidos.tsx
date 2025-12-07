import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, DollarSign, TrendingUp, Calendar } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Recebimento {
  id: string;
  parcela: number;
  valor_recebido: number;
  data_credito: string;
  venda: {
    id: string;
    valor_credito: number;
    cliente: { nome: string } | null;
    cota: { codigo: string; grupo: string } | null;
  } | null;
  empresa: { nome: string } | null;
  administradora: { nome: string } | null;
}

export default function Recebidos() {
  const [recebimentos, setRecebimentos] = useState<Recebimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [empresas, setEmpresas] = useState<{ id: string; nome: string }[]>([]);
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>("all");
  const [resumo, setResumo] = useState({
    total: 0,
    quantidade: 0,
    mediaValor: 0,
  });

  useEffect(() => {
    fetchEmpresas();
  }, []);

  useEffect(() => {
    fetchRecebimentos();
  }, [currentMonth, filtroEmpresa]);

  async function fetchEmpresas() {
    const { data } = await supabase.from("empresas").select("id, nome").order("nome");
    setEmpresas(data || []);
  }

  async function fetchRecebimentos() {
    setLoading(true);
    
    const startDate = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const endDate = format(endOfMonth(currentMonth), "yyyy-MM-dd");
    
    let query = supabase
      .from("recebimentos")
      .select(`
        *,
        venda:vendas(id, valor_credito, cliente:clientes(nome), cota:cotas(codigo, grupo)),
        empresa:empresas(nome),
        administradora:administradoras(nome)
      `)
      .eq("conciliado", true)
      .gte("data_credito", startDate)
      .lte("data_credito", endDate)
      .order("data_credito", { ascending: false });

    if (filtroEmpresa !== "all") {
      query = query.eq("empresa_id", filtroEmpresa);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao buscar recebimentos:", error);
    } else {
      setRecebimentos(data || []);
      
      const all = data || [];
      const total = all.reduce((acc, r) => acc + Number(r.valor_recebido), 0);
      setResumo({
        total,
        quantidade: all.length,
        mediaValor: all.length > 0 ? total / all.length : 0,
      });
    }
    setLoading(false);
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const filteredRecebimentos = recebimentos.filter(r => {
    const searchLower = search.toLowerCase();
    return (
      r.venda?.cliente?.nome?.toLowerCase().includes(searchLower) ||
      r.venda?.cota?.codigo?.toLowerCase().includes(searchLower) ||
      r.empresa?.nome?.toLowerCase().includes(searchLower) ||
      r.administradora?.nome?.toLowerCase().includes(searchLower)
    );
  });

  const handleExport = () => {
    // Criar CSV
    const headers = ["Data", "Cliente", "Cota", "Grupo", "Empresa", "Administradora", "Parcela", "Valor"];
    const rows = filteredRecebimentos.map(r => [
      format(new Date(r.data_credito), "dd/MM/yyyy"),
      r.venda?.cliente?.nome || "",
      r.venda?.cota?.codigo || "",
      r.venda?.cota?.grupo || "",
      r.empresa?.nome || "",
      r.administradora?.nome || "",
      r.parcela.toString(),
      r.valor_recebido.toString().replace(".", ","),
    ]);

    const csv = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `recebidos_${format(currentMonth, "yyyy-MM")}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Recebidos</h1>
          <p className="text-muted-foreground">Histórico de recebimentos conciliados</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            ← Anterior
          </Button>
          <span className="px-4 py-2 bg-muted rounded-lg font-medium capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </span>
          <Button variant="outline" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            Próximo →
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Recebido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(resumo.total)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Quantidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{resumo.quantidade} parcelas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Média por Parcela
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(resumo.mediaValor)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente, cota, empresa..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filtroEmpresa} onValueChange={setFiltroEmpresa}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Empresas</SelectItem>
                  {empresas.map((empresa) => (
                    <SelectItem key={empresa.id} value={empresa.id}>{empresa.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data Crédito</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Cota</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Administradora</TableHead>
                <TableHead>Parcela</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredRecebimentos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhum recebimento encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecebimentos.map((rec) => (
                  <TableRow key={rec.id}>
                    <TableCell>{format(new Date(rec.data_credito), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                    <TableCell className="font-medium">{rec.venda?.cliente?.nome || "-"}</TableCell>
                    <TableCell>{rec.venda?.cota?.codigo || "-"}</TableCell>
                    <TableCell>{rec.venda?.cota?.grupo || "-"}</TableCell>
                    <TableCell>{rec.empresa?.nome || "-"}</TableCell>
                    <TableCell>{rec.administradora?.nome || "-"}</TableCell>
                    <TableCell>{rec.parcela}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(rec.valor_recebido)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
