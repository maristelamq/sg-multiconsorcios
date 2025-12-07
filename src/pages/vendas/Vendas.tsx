import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Eye, FileText, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Venda {
  id: string;
  data_venda: string;
  valor_credito: number;
  valor_total: number;
  situacao: string;
  docs_status: string;
  observacao: string | null;
  cliente: { nome: string } | null;
  vendedor: { nome: string } | null;
  empresa: { nome: string } | null;
  cota: { codigo: string; grupo: string } | null;
}

export default function Vendas() {
  const navigate = useNavigate();
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroSituacao, setFiltroSituacao] = useState<string>("all");
  const [filtroDocsStatus, setFiltroDocsStatus] = useState<string>("all");
  const [resumo, setResumo] = useState({
    total: 0,
    valorCredito: 0,
    ativas: 0,
    docsPendentes: 0,
  });

  useEffect(() => {
    fetchVendas();
  }, [filtroSituacao, filtroDocsStatus]);

  async function fetchVendas() {
    setLoading(true);
    let query = supabase
      .from("vendas")
      .select(`
        *,
        cliente:clientes(nome),
        vendedor:vendedores(nome),
        empresa:empresas(nome),
        cota:cotas(codigo, grupo)
      `)
      .order("data_venda", { ascending: false });

    if (filtroSituacao !== "all") {
      query = query.eq("situacao", filtroSituacao);
    }
    if (filtroDocsStatus !== "all") {
      query = query.eq("docs_status", filtroDocsStatus);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao buscar vendas:", error);
    } else {
      setVendas(data || []);
      
      // Calcular resumo
      const allVendas = data || [];
      setResumo({
        total: allVendas.length,
        valorCredito: allVendas.reduce((acc, v) => acc + Number(v.valor_credito || 0), 0),
        ativas: allVendas.filter(v => v.situacao === "ATIVO").length,
        docsPendentes: allVendas.filter(v => v.docs_status === "PENDENTE").length,
      });
    }
    setLoading(false);
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getDocsStatusBadge = (status: string) => {
    switch (status) {
      case "APROVADO":
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case "EM_ANALISE":
        return <Badge variant="secondary" className="bg-blue-600 text-white"><Clock className="w-3 h-3 mr-1" />Em Análise</Badge>;
      case "REJEITADO":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge variant="outline" className="border-amber-500 text-amber-600"><AlertCircle className="w-3 h-3 mr-1" />Pendente</Badge>;
    }
  };

  const getSituacaoBadge = (situacao: string) => {
    switch (situacao) {
      case "ATIVO":
        return <Badge variant="default">Ativo</Badge>;
      case "CANCELADO":
        return <Badge variant="destructive">Cancelado</Badge>;
      case "QUITADO":
        return <Badge variant="secondary" className="bg-green-600 text-white">Quitado</Badge>;
      default:
        return <Badge variant="outline">{situacao}</Badge>;
    }
  };

  const filteredVendas = vendas.filter(venda => {
    const searchLower = search.toLowerCase();
    return (
      venda.cliente?.nome?.toLowerCase().includes(searchLower) ||
      venda.vendedor?.nome?.toLowerCase().includes(searchLower) ||
      venda.cota?.codigo?.toLowerCase().includes(searchLower) ||
      venda.empresa?.nome?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Vendas</h1>
          <p className="text-muted-foreground">Gerencie as vendas e controle documental</p>
        </div>
        <Button onClick={() => navigate("/vendas/nova")}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Venda
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{resumo.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valor em Crédito</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{formatCurrency(resumo.valorCredito)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vendas Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{resumo.ativas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Docs Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{resumo.docsPendentes}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, vendedor, cota..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filtroSituacao} onValueChange={setFiltroSituacao}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Situação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Situações</SelectItem>
                <SelectItem value="ATIVO">Ativo</SelectItem>
                <SelectItem value="QUITADO">Quitado</SelectItem>
                <SelectItem value="CANCELADO">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroDocsStatus} onValueChange={setFiltroDocsStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status Docs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="PENDENTE">Pendente</SelectItem>
                <SelectItem value="EM_ANALISE">Em Análise</SelectItem>
                <SelectItem value="APROVADO">Aprovado</SelectItem>
                <SelectItem value="REJEITADO">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Cota</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead className="text-right">Valor Crédito</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead>Documentos</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Carregando vendas...
                  </TableCell>
                </TableRow>
              ) : filteredVendas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhuma venda encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredVendas.map((venda) => (
                  <TableRow key={venda.id}>
                    <TableCell>
                      {format(new Date(venda.data_venda), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-medium">{venda.cliente?.nome || "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{venda.cota?.codigo || "-"}</span>
                        <span className="text-xs text-muted-foreground">{venda.cota?.grupo}</span>
                      </div>
                    </TableCell>
                    <TableCell>{venda.vendedor?.nome || "-"}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(venda.valor_credito)}
                    </TableCell>
                    <TableCell>{getSituacaoBadge(venda.situacao)}</TableCell>
                    <TableCell>{getDocsStatusBadge(venda.docs_status || "PENDENTE")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/vendas/${venda.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/vendas/${venda.id}?tab=documentos`)}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                      </div>
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
