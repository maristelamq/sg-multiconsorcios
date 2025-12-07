import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, DollarSign, AlertTriangle, CheckCircle, Clock, Ban } from "lucide-react";

interface ComissaoReceber {
  id: string;
  parcela: number;
  total_parcelas: number;
  base_calculo: number;
  percentual: number;
  valor_previsto: number;
  competencia_origem: string;
  competencia_pagamento: string;
  tipo: string;
  status: string;
  motivo_bloqueio: string | null;
  vendedores?: { nome: string } | null;
  representantes?: { nome: string } | null;
  vendas?: { 
    data_venda: string;
    cotas?: { grupo: string; codigo: string } | null;
  } | null;
}

export default function ComissoesReceber() {
  const [comissoes, setComissoes] = useState<ComissaoReceber[]>([]);
  const [loading, setLoading] = useState(true);
  const [competencia, setCompetencia] = useState(format(new Date(), 'yyyy-MM'));
  const [filtroStatus, setFiltroStatus] = useState<string>("TODOS");
  const [filtroTipo, setFiltroTipo] = useState<string>("TODOS");
  const [resumo, setResumo] = useState({ pendente: 0, bloqueado: 0, pago: 0, total: 0 });

  useEffect(() => {
    fetchComissoes();
  }, [competencia, filtroStatus, filtroTipo]);

  const fetchComissoes = async () => {
    setLoading(true);
    
    let query = supabase
      .from('comissoes_receber')
      .select('*, vendedores(nome), representantes(nome), vendas(data_venda, cotas(grupo, codigo))')
      .eq('competencia_pagamento', competencia)
      .order('created_at', { ascending: false });

    if (filtroStatus !== "TODOS") {
      query = query.eq('status', filtroStatus);
    }

    if (filtroTipo !== "TODOS") {
      query = query.eq('tipo', filtroTipo);
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Erro ao carregar comissões");
      setLoading(false);
      return;
    }

    setComissoes(data || []);

    // Calcular resumo
    const pendente = (data || []).filter(c => c.status === 'PENDENTE').reduce((s, c) => s + Number(c.valor_previsto), 0);
    const bloqueado = (data || []).filter(c => c.status === 'BLOQUEADO').reduce((s, c) => s + Number(c.valor_previsto), 0);
    const pago = (data || []).filter(c => c.status === 'PAGO').reduce((s, c) => s + Number(c.valor_pago || c.valor_previsto), 0);
    
    setResumo({
      pendente,
      bloqueado,
      pago,
      total: pendente + bloqueado + pago
    });

    setLoading(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const date = new Date(competencia + '-01');
    const newDate = direction === 'prev' ? subMonths(date, 1) : addMonths(date, 1);
    setCompetencia(format(newDate, 'yyyy-MM'));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      PENDENTE: { variant: "secondary", icon: Clock },
      LIBERADO: { variant: "default", icon: CheckCircle },
      BLOQUEADO: { variant: "destructive", icon: AlertTriangle },
      PAGO: { variant: "outline", icon: DollarSign },
      CANCELADO: { variant: "outline", icon: Ban }
    };

    const { variant, icon: Icon } = config[status] || config.PENDENTE;

    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const handleMarcarPago = async (id: string) => {
    const { error } = await supabase
      .from('comissoes_receber')
      .update({ 
        status: 'PAGO', 
        data_pagamento: new Date().toISOString() 
      })
      .eq('id', id);

    if (error) {
      toast.error("Erro ao marcar como pago");
      return;
    }
    toast.success("Comissão marcada como paga");
    fetchComissoes();
  };

  const competenciaFormatted = format(new Date(competencia + '-01'), "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Comissões a Receber</h1>
            <p className="text-muted-foreground">Gerencie as comissões pendentes e pagas</p>
          </div>
        </div>
      </div>

      {/* Navegação de competência */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium text-lg capitalize min-w-[200px] text-center">
            {competenciaFormatted}
          </span>
          <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              <SelectItem value="VENDEDOR">Vendedor</SelectItem>
              <SelectItem value="REPRESENTANTE">Representante</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              <SelectItem value="PENDENTE">Pendente</SelectItem>
              <SelectItem value="BLOQUEADO">Bloqueado</SelectItem>
              <SelectItem value="PAGO">Pago</SelectItem>
              <SelectItem value="CANCELADO">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pendente</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">{formatCurrency(resumo.pendente)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Bloqueado</CardDescription>
            <CardTitle className="text-2xl text-destructive">{formatCurrency(resumo.bloqueado)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pago</CardDescription>
            <CardTitle className="text-2xl text-green-600">{formatCurrency(resumo.pago)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(resumo.total)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Comissões ({comissoes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : comissoes.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma comissão para esta competência</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Beneficiário</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cota</TableHead>
                  <TableHead>Parcela</TableHead>
                  <TableHead>Base</TableHead>
                  <TableHead>%</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comissoes.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      {c.tipo === 'VENDEDOR' ? c.vendedores?.nome : c.representantes?.nome}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.tipo === 'VENDEDOR' ? 'default' : 'secondary'}>
                        {c.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {c.vendas?.cotas ? `${c.vendas.cotas.grupo}-${c.vendas.cotas.codigo}` : '-'}
                    </TableCell>
                    <TableCell>{c.parcela}/{c.total_parcelas}</TableCell>
                    <TableCell>{formatCurrency(c.base_calculo)}</TableCell>
                    <TableCell>{c.percentual}%</TableCell>
                    <TableCell className="font-medium">{formatCurrency(c.valor_previsto)}</TableCell>
                    <TableCell>
                      {getStatusBadge(c.status)}
                      {c.motivo_bloqueio && (
                        <span className="block text-xs text-destructive mt-1">{c.motivo_bloqueio}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {c.status === 'PENDENTE' && (
                        <Button size="sm" variant="outline" onClick={() => handleMarcarPago(c.id)}>
                          Pagar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
