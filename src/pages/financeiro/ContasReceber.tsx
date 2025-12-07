import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, CheckCircle, AlertTriangle, Clock, DollarSign } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface RecebimentoPendente {
  id: string;
  parcela: number;
  valor_recebido: number;
  data_credito: string;
  conciliado: boolean;
  venda: {
    id: string;
    valor_credito: number;
    cliente: { nome: string } | null;
    cota: { codigo: string } | null;
  } | null;
  empresa: { nome: string } | null;
  administradora: { nome: string } | null;
}

export default function ContasReceber() {
  const [recebimentos, setRecebimentos] = useState<RecebimentoPendente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [resumo, setResumo] = useState({
    total: 0,
    recebido: 0,
    pendente: 0,
    conciliado: 0,
  });

  const competencia = format(currentMonth, "yyyy-MM");

  useEffect(() => {
    fetchRecebimentos();
  }, [competencia, filtroStatus]);

  async function fetchRecebimentos() {
    setLoading(true);
    
    // Buscar recebimentos do mês
    const startDate = format(currentMonth, "yyyy-MM-01");
    const endDate = format(addMonths(currentMonth, 1), "yyyy-MM-01");
    
    let query = supabase
      .from("recebimentos")
      .select(`
        *,
        venda:vendas(id, valor_credito, cliente:clientes(nome), cota:cotas(codigo)),
        empresa:empresas(nome),
        administradora:administradoras(nome)
      `)
      .gte("data_credito", startDate)
      .lt("data_credito", endDate)
      .order("data_credito", { ascending: true });

    if (filtroStatus === "conciliado") {
      query = query.eq("conciliado", true);
    } else if (filtroStatus === "pendente") {
      query = query.eq("conciliado", false);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao buscar recebimentos:", error);
    } else {
      setRecebimentos(data || []);
      
      const all = data || [];
      setResumo({
        total: all.reduce((acc, r) => acc + Number(r.valor_recebido), 0),
        recebido: all.filter(r => r.conciliado).reduce((acc, r) => acc + Number(r.valor_recebido), 0),
        pendente: all.filter(r => !r.conciliado).reduce((acc, r) => acc + Number(r.valor_recebido), 0),
        conciliado: all.filter(r => r.conciliado).length,
      });
    }
    setLoading(false);
  }

  async function handleConciliar(ids: string[]) {
    const { error } = await supabase
      .from("recebimentos")
      .update({ conciliado: true })
      .in("id", ids);

    if (error) {
      toast.error("Erro ao conciliar recebimentos");
    } else {
      toast.success(`${ids.length} recebimento(s) conciliado(s)`);
      setSelectedIds([]);
      fetchRecebimentos();
    }
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

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const pendentes = filteredRecebimentos.filter(r => !r.conciliado);
    if (selectedIds.length === pendentes.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendentes.map(r => r.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Contas a Receber</h1>
          <p className="text-muted-foreground">Recebimentos das administradoras</p>
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
              Total do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(resumo.total)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Conciliado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(resumo.recebido)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Pendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(resumo.pendente)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Qtd Conciliados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{resumo.conciliado} / {recebimentos.length}</p>
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
                  placeholder="Buscar por cliente, cota, empresa..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="conciliado">Conciliado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedIds.length > 0 && (
              <Button onClick={() => handleConciliar(selectedIds)}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Conciliar {selectedIds.length} selecionado(s)
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
                    checked={selectedIds.length === filteredRecebimentos.filter(r => !r.conciliado).length && selectedIds.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Data Crédito</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Cota</TableHead>
                <TableHead>Administradora</TableHead>
                <TableHead>Parcela</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredRecebimentos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Nenhum recebimento encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecebimentos.map((rec) => (
                  <TableRow key={rec.id}>
                    <TableCell>
                      {!rec.conciliado && (
                        <Checkbox
                          checked={selectedIds.includes(rec.id)}
                          onCheckedChange={() => toggleSelect(rec.id)}
                        />
                      )}
                    </TableCell>
                    <TableCell>{format(new Date(rec.data_credito), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                    <TableCell className="font-medium">{rec.venda?.cliente?.nome || "-"}</TableCell>
                    <TableCell>{rec.venda?.cota?.codigo || "-"}</TableCell>
                    <TableCell>{rec.administradora?.nome || "-"}</TableCell>
                    <TableCell>{rec.parcela}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(rec.valor_recebido)}</TableCell>
                    <TableCell>
                      {rec.conciliado ? (
                        <Badge variant="default" className="bg-green-600">Conciliado</Badge>
                      ) : (
                        <Badge variant="outline" className="border-amber-500 text-amber-600">Pendente</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!rec.conciliado && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleConciliar([rec.id])}
                        >
                          Conciliar
                        </Button>
                      )}
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
