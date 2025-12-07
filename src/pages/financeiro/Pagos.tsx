import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, DollarSign, Users, Briefcase } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ComissaoPaga {
  id: string;
  parcela: number;
  valor_previsto: number;
  valor_pago: number | null;
  data_pagamento: string | null;
  tipo: string;
  competencia_pagamento: string;
  vendedor: { id: string; nome: string } | null;
  representante: { id: string; nome: string } | null;
  venda: {
    id: string;
    cliente: { nome: string } | null;
    cota: { codigo: string } | null;
  } | null;
}

export default function Pagos() {
  const [comissoes, setComissoes] = useState<ComissaoPaga[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("all");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [resumo, setResumo] = useState({
    total: 0,
    vendedores: 0,
    representantes: 0,
    quantidade: 0,
  });

  const competencia = format(currentMonth, "yyyy-MM");

  useEffect(() => {
    fetchComissoes();
  }, [competencia, filtroTipo]);

  async function fetchComissoes() {
    setLoading(true);
    
    let query = supabase
      .from("comissoes_receber")
      .select(`
        *,
        vendedor:vendedores(id, nome),
        representante:representantes(id, nome),
        venda:vendas(id, cliente:clientes(nome), cota:cotas(codigo))
      `)
      .eq("competencia_pagamento", competencia)
      .eq("status", "PAGO")
      .order("data_pagamento", { ascending: false });

    if (filtroTipo !== "all") {
      query = query.eq("tipo", filtroTipo);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao buscar comissões pagas:", error);
    } else {
      setComissoes(data || []);
      
      const all = data || [];
      setResumo({
        total: all.reduce((acc, c) => acc + Number(c.valor_pago || c.valor_previsto), 0),
        vendedores: all.filter(c => c.tipo === "VENDEDOR").reduce((acc, c) => acc + Number(c.valor_pago || c.valor_previsto), 0),
        representantes: all.filter(c => c.tipo === "REPRESENTANTE").reduce((acc, c) => acc + Number(c.valor_pago || c.valor_previsto), 0),
        quantidade: all.length,
      });
    }
    setLoading(false);
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const filteredComissoes = comissoes.filter(c => {
    const searchLower = search.toLowerCase();
    return (
      c.vendedor?.nome?.toLowerCase().includes(searchLower) ||
      c.representante?.nome?.toLowerCase().includes(searchLower) ||
      c.venda?.cliente?.nome?.toLowerCase().includes(searchLower) ||
      c.venda?.cota?.codigo?.toLowerCase().includes(searchLower)
    );
  });

  const handleExport = () => {
    const headers = ["Data Pagamento", "Beneficiário", "Tipo", "Cliente", "Cota", "Parcela", "Valor"];
    const rows = filteredComissoes.map(c => [
      c.data_pagamento ? format(new Date(c.data_pagamento), "dd/MM/yyyy") : "",
      c.vendedor?.nome || c.representante?.nome || "",
      c.tipo,
      c.venda?.cliente?.nome || "",
      c.venda?.cota?.codigo || "",
      c.parcela.toString(),
      (c.valor_pago || c.valor_previsto).toString().replace(".", ","),
    ]);

    const csv = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `comissoes_pagas_${competencia}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Pagos</h1>
          <p className="text-muted-foreground">Histórico de comissões pagas</p>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(resumo.total)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Vendedores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(resumo.vendedores)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Representantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(resumo.representantes)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quantidade</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{resumo.quantidade} pagamentos</p>
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
                  placeholder="Buscar por beneficiário, cliente..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="VENDEDOR">Vendedor</SelectItem>
                  <SelectItem value="REPRESENTANTE">Representante</SelectItem>
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
                <TableHead>Data Pagamento</TableHead>
                <TableHead>Beneficiário</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cliente / Cota</TableHead>
                <TableHead>Parcela</TableHead>
                <TableHead className="text-right">Valor Pago</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredComissoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma comissão paga encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredComissoes.map((com) => (
                  <TableRow key={com.id}>
                    <TableCell>
                      {com.data_pagamento
                        ? format(new Date(com.data_pagamento), "dd/MM/yyyy", { locale: ptBR })
                        : "-"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {com.vendedor?.nome || com.representante?.nome || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={com.tipo === "VENDEDOR" ? "default" : "secondary"}>
                        {com.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{com.venda?.cliente?.nome || "-"}</span>
                        <span className="text-xs text-muted-foreground">{com.venda?.cota?.codigo}</span>
                      </div>
                    </TableCell>
                    <TableCell>{com.parcela}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {formatCurrency(com.valor_pago || com.valor_previsto)}
                    </TableCell>
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
