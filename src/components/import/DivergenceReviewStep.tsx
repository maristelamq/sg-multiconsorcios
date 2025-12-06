import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  AlertTriangle, 
  ArrowLeft, 
  Download, 
  FileSpreadsheet, 
  Check, 
  X, 
  Edit2,
  Filter,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { ImportData } from "@/pages/Import";
import type { ValidationResult, ValidationWarning, ValidationError } from "@/lib/import/validators";
import * as XLSX from "xlsx";

export interface DivergenceItem {
  id: string;
  row: number;
  type: 'error' | 'warning' | 'divergence' | 'inadimplencia' | 'cancelamento' | 'estorno';
  column: string;
  originalValue: any;
  adjustedValue: any;
  message: string;
  status: 'pending' | 'ignored' | 'adjusted';
  adjustment?: string;
}

interface DivergenceReviewStepProps {
  importData: ImportData;
  validationResult: ValidationResult | null;
  divergences: DivergenceItem[];
  setDivergences: (items: DivergenceItem[]) => void;
  onNext: () => void;
  onBack: () => void;
}

type FilterType = 'all' | 'error' | 'warning' | 'divergence' | 'inadimplencia' | 'cancelamento' | 'estorno' | 'pending' | 'ignored' | 'adjusted';

const DivergenceReviewStep = ({
  importData,
  validationResult,
  divergences,
  setDivergences,
  onNext,
  onBack,
}: DivergenceReviewStepProps) => {
  const { toast } = useToast();
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<DivergenceItem | null>(null);
  const [adjustmentValue, setAdjustmentValue] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const filteredDivergences = useMemo(() => {
    if (filter === 'all') return divergences;
    if (['pending', 'ignored', 'adjusted'].includes(filter)) {
      return divergences.filter(d => d.status === filter);
    }
    return divergences.filter(d => d.type === filter);
  }, [divergences, filter]);

  const stats = useMemo(() => ({
    total: divergences.length,
    pending: divergences.filter(d => d.status === 'pending').length,
    ignored: divergences.filter(d => d.status === 'ignored').length,
    adjusted: divergences.filter(d => d.status === 'adjusted').length,
    errors: divergences.filter(d => d.type === 'error').length,
    warnings: divergences.filter(d => d.type === 'warning').length,
    divergencias: divergences.filter(d => d.type === 'divergence').length,
    inadimplencias: divergences.filter(d => d.type === 'inadimplencia').length,
    cancelamentos: divergences.filter(d => d.type === 'cancelamento').length,
    estornos: divergences.filter(d => d.type === 'estorno').length,
  }), [divergences]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredDivergences.map(d => d.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
  };

  const handleIgnoreSelected = () => {
    const updated = divergences.map(d => 
      selectedItems.has(d.id) ? { ...d, status: 'ignored' as const } : d
    );
    setDivergences(updated);
    setSelectedItems(new Set());
    toast({
      title: "Itens ignorados",
      description: `${selectedItems.size} divergência(s) marcada(s) como ignorada(s)`,
    });
  };

  const handleRestoreSelected = () => {
    const updated = divergences.map(d => 
      selectedItems.has(d.id) ? { ...d, status: 'pending' as const, adjustedValue: null, adjustment: undefined } : d
    );
    setDivergences(updated);
    setSelectedItems(new Set());
    toast({
      title: "Itens restaurados",
      description: `${selectedItems.size} divergência(s) restaurada(s)`,
    });
  };

  const handleOpenAdjustment = (item: DivergenceItem) => {
    setEditingItem(item);
    setAdjustmentValue(item.adjustedValue?.toString() || item.originalValue?.toString() || "");
  };

  const handleSaveAdjustment = () => {
    if (!editingItem) return;
    
    const updated = divergences.map(d => 
      d.id === editingItem.id 
        ? { ...d, status: 'adjusted' as const, adjustedValue: adjustmentValue, adjustment: adjustmentValue } 
        : d
    );
    setDivergences(updated);
    setEditingItem(null);
    setAdjustmentValue("");
    toast({
      title: "Ajuste salvo",
      description: "O valor foi ajustado com sucesso",
    });
  };

  const handleExportCSV = () => {
    const exportData = divergences.map(d => ({
      'Linha': d.row,
      'Tipo': getTypeLabel(d.type),
      'Coluna': d.column || '-',
      'Valor Original': d.originalValue || '-',
      'Valor Ajustado': d.adjustedValue || '-',
      'Mensagem': d.message,
      'Status': getStatusLabel(d.status),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Divergências");
    
    const fileName = `divergencias_${importData.file?.name?.replace(/\.[^/.]+$/, '') || 'export'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    toast({
      title: "Exportação concluída",
      description: `Arquivo ${fileName} gerado com sucesso`,
    });
  };

  const handleExportCSVOnly = () => {
    const exportData = divergences.map(d => ({
      'Linha': d.row,
      'Tipo': getTypeLabel(d.type),
      'Coluna': d.column || '-',
      'Valor Original': d.originalValue || '-',
      'Valor Ajustado': d.adjustedValue || '-',
      'Mensagem': d.message,
      'Status': getStatusLabel(d.status),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `divergencias_${importData.file?.name?.replace(/\.[^/.]+$/, '') || 'export'}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast({
      title: "Exportação CSV concluída",
      description: "Arquivo CSV gerado com sucesso",
    });
  };

  const toggleRowExpand = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      error: 'Erro',
      warning: 'Aviso',
      divergence: 'Divergência',
      inadimplencia: 'Inadimplência',
      cancelamento: 'Cancelamento',
      estorno: 'Estorno',
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      ignored: 'Ignorado',
      adjusted: 'Ajustado',
    };
    return labels[status] || status;
  };

  const getTypeBadgeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      case 'divergence': return 'outline';
      default: return 'default';
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'ignored': return 'outline';
      case 'adjusted': return 'default';
      default: return 'secondary';
    }
  };

  const canProceed = stats.errors === 0 || divergences.filter(d => d.type === 'error' && d.status === 'pending').length === 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-foreground">
          Revisão de Divergências
        </h2>
        <p className="mt-2 text-muted-foreground">
          Revise, ajuste ou ignore as divergências encontradas antes de importar
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="p-4 border-border">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{stats.total}</p>
        </Card>
        <Card className="p-4 border-warning/50 bg-warning/5">
          <p className="text-sm text-muted-foreground">Pendentes</p>
          <p className="mt-1 text-2xl font-bold text-warning">{stats.pending}</p>
        </Card>
        <Card className="p-4 border-muted">
          <p className="text-sm text-muted-foreground">Ignorados</p>
          <p className="mt-1 text-2xl font-bold text-muted-foreground">{stats.ignored}</p>
        </Card>
        <Card className="p-4 border-success/50 bg-success/5">
          <p className="text-sm text-muted-foreground">Ajustados</p>
          <p className="mt-1 text-2xl font-bold text-success">{stats.adjusted}</p>
        </Card>
      </div>

      {/* Type breakdown */}
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6 mb-6">
        <Badge variant="destructive" className="justify-center py-2">
          Erros: {stats.errors}
        </Badge>
        <Badge variant="secondary" className="justify-center py-2">
          Avisos: {stats.warnings}
        </Badge>
        <Badge variant="outline" className="justify-center py-2">
          Divergências: {stats.divergencias}
        </Badge>
        <Badge variant="secondary" className="justify-center py-2 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
          Inadimplências: {stats.inadimplencias}
        </Badge>
        <Badge variant="secondary" className="justify-center py-2">
          Cancelamentos: {stats.cancelamentos}
        </Badge>
        <Badge variant="secondary" className="justify-center py-2">
          Estornos: {stats.estornos}
        </Badge>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-wrap gap-4 mb-6 items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="ignored">Ignorados</SelectItem>
                <SelectItem value="adjusted">Ajustados</SelectItem>
                <SelectItem value="error">Erros</SelectItem>
                <SelectItem value="warning">Avisos</SelectItem>
                <SelectItem value="divergence">Divergências</SelectItem>
                <SelectItem value="inadimplencia">Inadimplências</SelectItem>
                <SelectItem value="cancelamento">Cancelamentos</SelectItem>
                <SelectItem value="estorno">Estornos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {selectedItems.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedItems.size} selecionado(s)
              </span>
              <Button variant="outline" size="sm" onClick={handleIgnoreSelected}>
                <X className="mr-1 h-3 w-3" />
                Ignorar
              </Button>
              <Button variant="outline" size="sm" onClick={handleRestoreSelected}>
                <Check className="mr-1 h-3 w-3" />
                Restaurar
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSVOnly}>
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
        </div>
      </div>

      {/* Table */}
      {filteredDivergences.length > 0 ? (
        <Card className="border-border overflow-hidden">
          <div className="max-h-[400px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedItems.size === filteredDivergences.length && filteredDivergences.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-16">Linha</TableHead>
                  <TableHead className="w-32">Tipo</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead className="w-32">Valor Original</TableHead>
                  <TableHead className="w-32">Valor Ajustado</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDivergences.map((item) => (
                  <TableRow 
                    key={item.id} 
                    className={item.status === 'ignored' ? 'opacity-50' : ''}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedItems.has(item.id)}
                        onCheckedChange={(checked) => handleSelectItem(item.id, !!checked)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">{item.row}</TableCell>
                    <TableCell>
                      <Badge variant={getTypeBadgeVariant(item.type)}>
                        {getTypeLabel(item.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-md">
                        <p className="text-sm truncate" title={item.message}>
                          {item.message}
                        </p>
                        {item.column && (
                          <p className="text-xs text-muted-foreground">
                            Coluna: {item.column}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {item.originalValue !== null && item.originalValue !== undefined
                        ? typeof item.originalValue === 'number' 
                          ? formatCurrency(item.originalValue)
                          : String(item.originalValue)
                        : '-'}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-primary">
                      {item.adjustedValue !== null && item.adjustedValue !== undefined
                        ? String(item.adjustedValue)
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(item.status)}>
                        {getStatusLabel(item.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenAdjustment(item)}
                          title="Ajustar valor"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            const updated = divergences.map(d => 
                              d.id === item.id 
                                ? { ...d, status: item.status === 'ignored' ? 'pending' as const : 'ignored' as const }
                                : d
                            );
                            setDivergences(updated);
                          }}
                          title={item.status === 'ignored' ? 'Restaurar' : 'Ignorar'}
                        >
                          {item.status === 'ignored' ? (
                            <Check className="h-4 w-4 text-success" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        <Card className="p-8 border-success/50 bg-success/5 text-center">
          <Check className="h-12 w-12 mx-auto text-success mb-4" />
          <p className="text-lg font-medium text-success">Nenhuma divergência encontrada</p>
          <p className="text-sm text-muted-foreground mt-2">
            Todos os dados estão prontos para importação
          </p>
        </Card>
      )}

      {/* Warning about pending errors */}
      {stats.errors > 0 && divergences.filter(d => d.type === 'error' && d.status === 'pending').length > 0 && (
        <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="font-medium text-destructive">
                Existem {divergences.filter(d => d.type === 'error' && d.status === 'pending').length} erro(s) pendente(s)
              </p>
              <p className="text-sm text-destructive/80 mt-1">
                Você precisa ignorar ou ajustar todos os erros antes de prosseguir com a importação.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Adjustment Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Valor</DialogTitle>
            <DialogDescription>
              Linha {editingItem?.row}: {editingItem?.message}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-muted-foreground">Valor Original</Label>
              <p className="font-mono text-lg">
                {editingItem?.originalValue !== null && editingItem?.originalValue !== undefined
                  ? String(editingItem.originalValue)
                  : '-'}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="adjustment">Novo Valor</Label>
              <Input
                id="adjustment"
                value={adjustmentValue}
                onChange={(e) => setAdjustmentValue(e.target.value)}
                placeholder="Digite o valor ajustado"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveAdjustment}>
              Salvar Ajuste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Navigation */}
      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button onClick={onNext} disabled={!canProceed} size="lg">
          Próximo: Confirmar Importação
        </Button>
      </div>
    </motion.div>
  );
};

export default DivergenceReviewStep;
