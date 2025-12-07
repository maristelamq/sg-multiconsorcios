import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, CreditCard, Clock, CheckCircle, Ban, DollarSign } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface ComissaoAPagar {
  id: string;
  parcela: number;
  valor_previsto: number;
  status: string;
  tipo: string;
  competencia_pagamento: string;
  motivo_bloqueio: string | null;
  vendedor: { id: string; nome: string } | null;
  representante: { id: string; nome: string } | null;
  venda: {
    id: string;
    cliente: { nome: string } | null;
    cota: { codigo: string } | null;
  } | null;
}

const FORMAS_PAGAMENTO = [
  { value: "PIX", label: "PIX" },
  { value: "TED", label: "TED" },
  { value: "BOLETO", label: "Boleto" },
  { value: "DINHEIRO", label: "Dinheiro" },
];

export default function ContasPagar() {
  const [comissoes, setComissoes] = useState<ComissaoAPagar[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("all");
  const [filtroStatus, setFiltroStatus] = useState<string>("PENDENTE");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showPagamentoDialog, setShowPagamentoDialog] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState("PIX");
  const [resumo, setResumo] = useState({
    totalPendente: 0,
    totalBloqueado: 0,
    totalPago: 0,
    qtdPendente: 0,
  });

  const competencia = format(currentMonth, "yyyy-MM");

  useEffect(() => {
    fetchComissoes();
  }, [competencia, filtroTipo, filtroStatus]);

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
      .order("parcela", { ascending: true });

    if (filtroTipo !== "all") {
      query = query.eq("tipo", filtroTipo);
    }
    if (filtroStatus !== "all") {
      query = query.eq("status", filtroStatus);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao buscar comissões:", error);
    } else {
      setComissoes(data || []);
      
      const all = data || [];
      setResumo({
        totalPendente: all.filter(c => c.status === "PENDENTE").reduce((acc, c) => acc + Number(c.valor_previsto), 0),
        totalBloqueado: all.filter(c => c.status === "BLOQUEADO").reduce((acc, c) => acc + Number(c.valor_previsto), 0),
        totalPago: all.filter(c => c.status === "PAGO").reduce((acc, c) => acc + Number(c.valor_previsto), 0),
        qtdPendente: all.filter(c => c.status === "PENDENTE").length,
      });
    }
    setLoading(false);
  }

  async function handlePagar() {
    if (selectedIds.length === 0) return;

    const { error } = await supabase
      .from("comissoes_receber")
      .update({
        status: "PAGO",
        data_pagamento: new Date().toISOString(),
        valor_pago: comissoes.filter(c => selectedIds.includes(c.id)).reduce((acc, c) => acc + Number(c.valor_previsto), 0),
      })
      .in("id", selectedIds);

    if (error) {
      toast.error("Erro ao registrar pagamento");
    } else {
      toast.success(`${selectedIds.length} comissão(ões) paga(s)`);
      setSelectedIds([]);
      setShowPagamentoDialog(false);
      fetchComissoes();
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAGO":
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Pago</Badge>;
      case "BLOQUEADO":
        return <Badge variant="destructive"><Ban className="w-3 h-3 mr-1" />Bloqueado</Badge>;
      default:
        return <Badge variant="outline" className="border-amber-500 text-amber-600"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
    }
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

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const pendentes = filteredComissoes.filter(c => c.status === "PENDENTE");
    if (selectedIds.length === pendentes.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendentes.map(c => c.id));
    }
  };

  const totalSelecionado = comissoes
    .filter(c => selectedIds.includes(c.id))
    .reduce((acc, c) => acc + Number(c.valor_previsto), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Contas a Pagar</h1>
          <p className="text-muted-foreground">Comissões pendentes de pagamento</p>
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
              <Clock className="w-4 h-4 text-amber-600" />
              Pendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(resumo.totalPendente)}</p>
            <p className="text-xs text-muted-foreground">{resumo.qtdPendente} comissões</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Ban className="w-4 h-4 text-destructive" />
              Bloqueado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(resumo.totalBloqueado)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(resumo.totalPago)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Selecionado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalSelecionado)}</p>
            <p className="text-xs text-muted-foreground">{selectedIds.length} selecionados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Ações */}
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
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="VENDEDOR">Vendedor</SelectItem>
                  <SelectItem value="REPRESENTANTE">Representante</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="PENDENTE">Pendente</SelectItem>
                  <SelectItem value="BLOQUEADO">Bloqueado</SelectItem>
                  <SelectItem value="PAGO">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedIds.length > 0 && (
              <Button onClick={() => setShowPagamentoDialog(true)}>
                <CreditCard className="w-4 h-4 mr-2" />
                Pagar {selectedIds.length} ({formatCurrency(totalSelecionado)})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.length === filteredComissoes.filter(c => c.status === "PENDENTE").length && selectedIds.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Beneficiário</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cliente / Cota</TableHead>
                <TableHead>Parcela</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredComissoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma comissão encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredComissoes.map((com) => (
                  <TableRow key={com.id}>
                    <TableCell>
                      {com.status === "PENDENTE" && (
                        <Checkbox
                          checked={selectedIds.includes(com.id)}
                          onCheckedChange={() => toggleSelect(com.id)}
                        />
                      )}
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
                    <TableCell className="text-right font-medium">{formatCurrency(com.valor_previsto)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {getStatusBadge(com.status)}
                        {com.motivo_bloqueio && (
                          <span className="text-xs text-destructive">{com.motivo_bloqueio}</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de Pagamento */}
      <Dialog open={showPagamentoDialog} onOpenChange={setShowPagamentoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Total a pagar</p>
              <p className="text-2xl font-bold">{formatCurrency(totalSelecionado)}</p>
              <p className="text-sm text-muted-foreground">{selectedIds.length} comissão(ões)</p>
            </div>
            <div>
              <Label>Forma de Pagamento</Label>
              <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMAS_PAGAMENTO.map((forma) => (
                    <SelectItem key={forma.value} value={forma.value}>{forma.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPagamentoDialog(false)}>Cancelar</Button>
            <Button onClick={handlePagar}>Confirmar Pagamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
