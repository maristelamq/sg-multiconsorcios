import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronDown, ChevronRight, Calendar, DollarSign, User, FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { ParsedRowData, ParcelaData } from "@/lib/import/validators";

interface DataPreviewTableProps {
  data: ParsedRowData[];
  maxRows?: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatDate = (date: Date | null) => {
  if (!date) return '-';
  try {
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return '-';
  }
};

const ParcelasDetail = ({ parcelas }: { parcelas: ParcelaData[] }) => {
  if (parcelas.length === 0) {
    return <span className="text-muted-foreground text-xs">Sem parcelas</span>;
  }

  return (
    <div className="space-y-1">
      {parcelas.map((p) => (
        <div key={p.numero} className="flex items-center gap-2 text-xs">
          <Badge variant="outline" className="text-xs px-1.5 py-0">
            P{p.numero}
          </Badge>
          <span className="text-foreground font-medium">
            {formatCurrency(p.valorRecebido)}
          </span>
          {p.dataCredito && (
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(p.dataCredito)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

const ExpandableRow = ({ row, index }: { row: ParsedRowData; index: number }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getStatusBadge = () => {
    if (row.isCancelamento) return <Badge variant="destructive">Cancelado</Badge>;
    if (row.isEstorno) return <Badge variant="secondary">Estorno</Badge>;
    if (row.isNegativo) return <Badge variant="destructive">Inadimplente</Badge>;
    if (row.valorDivergencia > 0) return <Badge variant="outline" className="border-warning text-warning">Divergência</Badge>;
    return <Badge variant="default" className="bg-success">OK</Badge>;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <TableRow className="hover:bg-muted/50">
        <TableCell className="w-10">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
        </TableCell>
        <TableCell className="font-mono text-xs">{index + 1}</TableCell>
        <TableCell className="text-xs">{formatDate(row.dataVenda)}</TableCell>
        <TableCell className="text-xs font-medium">{row.grupo}/{row.cota}</TableCell>
        <TableCell className="text-xs">{row.administradora || '-'}</TableCell>
        <TableCell className="text-xs">{row.cliente || '-'}</TableCell>
        <TableCell className="text-xs font-medium">{formatCurrency(row.valorCredito)}</TableCell>
        <TableCell className="text-xs">{formatCurrency(row.valorTotal)}</TableCell>
        <TableCell className="text-xs">
          <Badge variant="outline" className="text-xs">
            {row.parcelas.length} parcelas
          </Badge>
        </TableCell>
        <TableCell>{getStatusBadge()}</TableCell>
      </TableRow>
      <CollapsibleContent asChild>
        <TableRow className="bg-muted/30">
          <TableCell colSpan={10} className="p-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Vendedores */}
              <Card className="p-3 border-border">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground">Vendedores</span>
                </div>
                <div className="space-y-1 text-xs">
                  {row.vendedor1 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{row.vendedor1}</span>
                      <span className="font-medium">{row.vendedor1Percentual}%</span>
                    </div>
                  )}
                  {row.vendedor2 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{row.vendedor2}</span>
                      <span className="font-medium">{row.vendedor2Percentual}%</span>
                    </div>
                  )}
                  {!row.vendedor1 && !row.vendedor2 && (
                    <span className="text-muted-foreground">Nenhum vendedor</span>
                  )}
                </div>
              </Card>

              {/* Comissões */}
              <Card className="p-3 border-border">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-success" />
                  <span className="text-xs font-semibold text-foreground">Comissões</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Comissão 1:</span>
                    <span className="font-medium">{row.comissao1}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Comissão 2:</span>
                    <span className="font-medium">{row.comissao2}%</span>
                  </div>
                </div>
              </Card>

              {/* Parcelas Recebidas */}
              <Card className="p-3 border-border col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground">
                    Parcelas Recebidas ({row.parcelas.length})
                  </span>
                </div>
                <ScrollArea className="max-h-32">
                  <ParcelasDetail parcelas={row.parcelas} />
                </ScrollArea>
              </Card>

              {/* Observações */}
              {(row.observacao || row.representante || row.segmento) && (
                <Card className="p-3 border-border col-span-full">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-semibold text-foreground">Detalhes</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3 text-xs">
                    {row.representante && (
                      <div>
                        <span className="text-muted-foreground">Representante: </span>
                        <span className="font-medium">{row.representante}</span>
                      </div>
                    )}
                    {row.segmento && (
                      <div>
                        <span className="text-muted-foreground">Segmento: </span>
                        <span className="font-medium">{row.segmento}</span>
                      </div>
                    )}
                    {row.situacao && (
                      <div>
                        <span className="text-muted-foreground">Situação: </span>
                        <span className="font-medium">{row.situacao}</span>
                      </div>
                    )}
                    {row.observacao && (
                      <div className="col-span-full">
                        <span className="text-muted-foreground">Obs: </span>
                        <span>{row.observacao}</span>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </TableCell>
        </TableRow>
      </CollapsibleContent>
    </Collapsible>
  );
};

const DataPreviewTable = ({ data, maxRows = 50 }: DataPreviewTableProps) => {
  const [showAll, setShowAll] = useState(false);
  const displayData = showAll ? data : data.slice(0, maxRows);
  
  const totalParcelas = data.reduce((sum, row) => sum + row.parcelas.length, 0);
  const totalRecebido = data.reduce((sum, row) => 
    sum + row.parcelas.reduce((s, p) => s + p.valorRecebido, 0), 0
  );

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            Exibindo <span className="font-semibold text-foreground">{displayData.length}</span> de{" "}
            <span className="font-semibold text-foreground">{data.length}</span> registros
          </span>
          <Badge variant="outline">
            {totalParcelas} parcelas detectadas
          </Badge>
          <Badge variant="secondary">
            {formatCurrency(totalRecebido)} recebido
          </Badge>
        </div>
        {data.length > maxRows && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Mostrar menos' : `Ver todos (${data.length})`}
          </Button>
        )}
      </div>

      {/* Table */}
      <Card className="border-border">
        <ScrollArea className="max-h-[500px]">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-10"></TableHead>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Data Venda</TableHead>
                <TableHead>Grupo/Cota</TableHead>
                <TableHead>Administradora</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Crédito</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Parcelas</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((row, index) => (
                <ExpandableRow key={index} row={row} index={index} />
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>
    </div>
  );
};

export default DataPreviewTable;
