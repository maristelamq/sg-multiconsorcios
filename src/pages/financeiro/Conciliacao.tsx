import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Search, AlertTriangle, CheckCircle, XCircle, Scale, TrendingUp, TrendingDown } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Divergencia {
  id: string;
  venda_id: string;
  tipo: string;
  valor_esperado: number | null;
  valor_real: number | null;
  diferenca: number;
  observacao: string | null;
  created_at: string;
  venda: {
    id: string;
    cliente: { nome: string } | null;
    cota: { codigo: string } | null;
  } | null;
}

interface ResumoMes {
  totalRecebido: number;
  totalEsperado: number;
  divergencias: number;
  percentualConciliado: number;
}

export default function Conciliacao() {
  const [divergencias, setDivergencias] = useState<Divergencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [resumo, setResumo] = useState<ResumoMes>({
    totalRecebido: 0,
    totalEsperado: 0,
    divergencias: 0,
    percentualConciliado: 0,
  });
  const [showAjusteDialog, setShowAjusteDialog] = useState(false);
  const [selectedDivergencia, setSelectedDivergencia] = useState<Divergencia | null>(null);
  const [observacao, setObservacao] = useState("");

  const competencia = format(currentMonth, "yyyy-MM");

  useEffect(() => {
    fetchDados();
  }, [competencia]);

  async function fetchDados() {
    setLoading(true);
    
    // Buscar divergências do mês
    const startDate = format(currentMonth, "yyyy-MM-01");
    const endDate = format(addMonths(currentMonth, 1), "yyyy-MM-01");
    
    const { data: divData, error: divError } = await supabase
      .from("ajustes_conciliacao")
      .select(`
        *,
        venda:vendas(id, cliente:clientes(nome), cota:cotas(codigo))
      `)
      .gte("created_at", startDate)
      .lt("created_at", endDate)
      .order("created_at", { ascending: false });

    if (divError) {
      console.error("Erro ao buscar divergências:", divError);
    } else {
      setDivergencias(divData || []);
    }

    // Buscar resumo de recebimentos
    const { data: recData } = await supabase
      .from("recebimentos")
      .select("valor_recebido, conciliado")
      .gte("data_credito", startDate)
      .lt("data_credito", endDate);

    const recebimentos = recData || [];
    const totalRecebido = recebimentos.reduce((acc, r) => acc + Number(r.valor_recebido), 0);
    const totalConciliado = recebimentos.filter(r => r.conciliado).reduce((acc, r) => acc + Number(r.valor_recebido), 0);

    setResumo({
      totalRecebido,
      totalEsperado: totalRecebido, // Ajustar conforme regra de negócio
      divergencias: divData?.length || 0,
      percentualConciliado: totalRecebido > 0 ? (totalConciliado / totalRecebido) * 100 : 0,
    });

    setLoading(false);
  }

  async function handleSalvarAjuste() {
    if (!selectedDivergencia) return;

    const { error } = await supabase
      .from("ajustes_conciliacao")
      .update({ observacao })
      .eq("id", selectedDivergencia.id);

    if (error) {
      toast.error("Erro ao salvar ajuste");
    } else {
      toast.success("Ajuste salvo com sucesso");
      setShowAjusteDialog(false);
      setSelectedDivergencia(null);
      setObservacao("");
      fetchDados();
    }
  }

  async function handleExcluirDivergencia(id: string) {
    const { error } = await supabase.from("ajustes_conciliacao").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir divergência");
    } else {
      toast.success("Divergência excluída");
      fetchDados();
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const filteredDivergencias = divergencias.filter(d => {
    const searchLower = search.toLowerCase();
    return (
      d.venda?.cliente?.nome?.toLowerCase().includes(searchLower) ||
      d.venda?.cota?.codigo?.toLowerCase().includes(searchLower) ||
      d.tipo?.toLowerCase().includes(searchLower)
    );
  });

  const getDiferencaColor = (diff: number) => {
    if (diff > 0) return "text-green-600";
    if (diff < 0) return "text-destructive";
    return "";
  };

  const openAjusteDialog = (divergencia: Divergencia) => {
    setSelectedDivergencia(divergencia);
    setObservacao(divergencia.observacao || "");
    setShowAjusteDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Conciliação</h1>
          <p className="text-muted-foreground">Painel de conciliação e divergências</p>
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
              <Scale className="w-4 h-4" />
              Total Recebido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(resumo.totalRecebido)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Conciliação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold">{resumo.percentualConciliado.toFixed(1)}%</p>
              <Progress value={resumo.percentualConciliado} className="h-2" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Divergências
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{resumo.divergencias}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            {resumo.percentualConciliado === 100 ? (
              <Badge variant="default" className="bg-green-600 text-lg px-3 py-1">
                <CheckCircle className="w-4 h-4 mr-2" />
                Conciliado
              </Badge>
            ) : (
              <Badge variant="outline" className="border-amber-500 text-amber-600 text-lg px-3 py-1">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Pendente
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar divergências..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Divergências */}
      <Card>
        <CardHeader>
          <CardTitle>Divergências Identificadas</CardTitle>
          <CardDescription>Diferenças entre valores esperados e valores reais</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente / Cota</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Esperado</TableHead>
                <TableHead className="text-right">Real</TableHead>
                <TableHead className="text-right">Diferença</TableHead>
                <TableHead>Observação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredDivergencias.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle className="w-12 h-12 text-green-600" />
                      <p>Nenhuma divergência encontrada</p>
                      <p className="text-sm">Todos os valores estão conciliados</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDivergencias.map((div) => (
                  <TableRow key={div.id}>
                    <TableCell>
                      {format(new Date(div.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{div.venda?.cliente?.nome || "-"}</span>
                        <span className="text-xs text-muted-foreground">{div.venda?.cota?.codigo}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{div.tipo}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {div.valor_esperado ? formatCurrency(div.valor_esperado) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {div.valor_real ? formatCurrency(div.valor_real) : "-"}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${getDiferencaColor(div.diferenca)}`}>
                      <div className="flex items-center justify-end gap-1">
                        {div.diferenca > 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : div.diferenca < 0 ? (
                          <TrendingDown className="w-4 h-4" />
                        ) : null}
                        {formatCurrency(div.diferenca)}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {div.observacao || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openAjusteDialog(div)}
                        >
                          Ajustar
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleExcluirDivergencia(div.id)}
                        >
                          <XCircle className="w-4 h-4" />
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

      {/* Dialog de Ajuste */}
      <Dialog open={showAjusteDialog} onOpenChange={setShowAjusteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Divergência</DialogTitle>
            <DialogDescription>
              Adicione uma observação para justificar a divergência
            </DialogDescription>
          </DialogHeader>
          {selectedDivergencia && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Esperado</p>
                  <p className="font-medium">
                    {selectedDivergencia.valor_esperado
                      ? formatCurrency(selectedDivergencia.valor_esperado)
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Real</p>
                  <p className="font-medium">
                    {selectedDivergencia.valor_real
                      ? formatCurrency(selectedDivergencia.valor_real)
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Diferença</p>
                  <p className={`font-medium ${getDiferencaColor(selectedDivergencia.diferenca)}`}>
                    {formatCurrency(selectedDivergencia.diferenca)}
                  </p>
                </div>
              </div>
              <div>
                <Label>Observação / Justificativa</Label>
                <Textarea
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Descreva o motivo da divergência..."
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAjusteDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarAjuste}>Salvar Ajuste</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
