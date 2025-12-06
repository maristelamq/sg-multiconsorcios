import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  ArrowLeft, 
  Loader2, 
  Database, 
  FileDown, 
  AlertTriangle,
  TrendingUp,
  Users,
  Building2,
  Receipt,
  AlertCircle,
  FileSpreadsheet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { ImportData } from "@/pages/Import";
import { processImport, ImportProgress, ImportResult } from "@/lib/import/importService";
import type { DivergenceItem } from "@/components/import/DivergenceReviewStep";
import * as XLSX from "xlsx";

interface ConfirmationStepProps {
  importData: ImportData;
  divergences?: DivergenceItem[];
  onBack: () => void;
  onComplete: () => void;
}

const ConfirmationStep = ({
  importData,
  divergences = [],
  onBack,
  onComplete,
}: ConfirmationStepProps) => {
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleProgressUpdate = useCallback((p: ImportProgress) => {
    setProgress(p);
  }, []);

  const handleImport = async () => {
    if (!importData.file || !importData.type) return;

    setIsImporting(true);
    setProgress({
      phase: 'preparing',
      currentRow: 0,
      totalRows: importData.data.length,
      percentage: 0,
      message: 'Iniciando importação...'
    });

    try {
      const columns = Object.keys(importData.data[0] || {});
      
      const importResult = await processImport(
        importData.data as Record<string, any>[],
        columns,
        importData.type,
        importData.file.name,
        handleProgressUpdate
      );

      setResult(importResult);

      if (importResult.success) {
        toast({
          title: "Importação concluída!",
          description: `${importResult.stats.vendasCriadas} vendas criadas com sucesso`,
        });
      } else {
        toast({
          title: "Importação parcial",
          description: `${importResult.stats.vendasCriadas} vendas criadas, ${importResult.errors.length} erros`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro na importação",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
      setProgress({
        phase: 'error',
        currentRow: 0,
        totalRows: importData.data.length,
        percentage: 0,
        message: 'Erro na importação'
      });
    }

    setIsImporting(false);
  };

  const handleExportLog = () => {
    if (!result) return;

    const logContent = {
      arquivo: importData.file?.name,
      tipo: importData.type,
      dataImportacao: new Date().toISOString(),
      estatisticas: result.stats,
      erros: result.errors,
      avisos: result.warnings
    };

    const blob = new Blob([JSON.stringify(logContent, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import-log-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const typeLabel =
    importData.type === "historico"
      ? "Histórico Geral"
      : importData.type === "pagamento"
      ? "Pagamento de Comissões"
      : "Não identificado";

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Show result screen after import
  if (result) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="p-8"
      >
        <div className="mb-8 text-center">
          {result.success ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <CheckCircle2 className="mx-auto h-20 w-20 text-success" />
            </motion.div>
          ) : (
            <AlertTriangle className="mx-auto h-20 w-20 text-warning" />
          )}
          <h2 className="mt-4 text-2xl font-semibold text-foreground">
            {result.success ? 'Importação Concluída!' : 'Importação Parcial'}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {result.success 
              ? 'Todos os dados foram importados com sucesso'
              : `${result.errors.length} registros com erro`}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card className="border-success/50 bg-success/5 p-4">
            <div className="flex items-center gap-3">
              <Receipt className="h-8 w-8 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Vendas</p>
                <p className="text-2xl font-bold text-success">{result.stats.vendasCriadas}</p>
              </div>
            </div>
          </Card>

          <Card className="border-primary/50 bg-primary/5 p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Recebimentos</p>
                <p className="text-2xl font-bold text-primary">{result.stats.recebimentosCriados}</p>
              </div>
            </div>
          </Card>

          <Card className="border-secondary/50 bg-secondary/5 p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-secondary-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Comissões</p>
                <p className="text-2xl font-bold text-foreground">{result.stats.comissoesCriadas}</p>
              </div>
            </div>
          </Card>

          <Card className="border-warning/50 bg-warning/5 p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">Ajustes</p>
                <p className="text-2xl font-bold text-warning">{result.stats.ajustesCriados}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Additional Stats */}
        <Card className="border-border p-4 mb-6">
          <h3 className="font-semibold text-foreground mb-4">Entidades Criadas</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex justify-between items-center p-2 rounded bg-muted/50">
              <span className="text-sm text-muted-foreground">Administradoras</span>
              <Badge variant="outline">{result.stats.administradorasCriadas}</Badge>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-muted/50">
              <span className="text-sm text-muted-foreground">Vendedores</span>
              <Badge variant="outline">{result.stats.vendedoresCriados}</Badge>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-muted/50">
              <span className="text-sm text-muted-foreground">Clientes</span>
              <Badge variant="outline">{result.stats.clientesCriados}</Badge>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-muted/50">
              <span className="text-sm text-muted-foreground">Cotas</span>
              <Badge variant="outline">{result.stats.cotasCriadas}</Badge>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-muted/50">
              <span className="text-sm text-muted-foreground">Representantes</span>
              <Badge variant="outline">{result.stats.representantesCriados}</Badge>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-muted/50">
              <span className="text-sm text-muted-foreground">Inadimplências</span>
              <Badge variant="destructive">{result.stats.inadimplenciasCriadas}</Badge>
            </div>
          </div>
        </Card>

        {/* Errors if any */}
        {result.errors.length > 0 && (
          <Card className="border-destructive/50 bg-destructive/5 p-4 mb-6">
            <h3 className="font-semibold text-destructive mb-2">
              Erros ({result.errors.length})
            </h3>
            <ul className="space-y-1 max-h-40 overflow-y-auto">
              {result.errors.slice(0, 20).map((error, i) => (
                <li key={i} className="text-sm text-destructive/90">• {error}</li>
              ))}
              {result.errors.length > 20 && (
                <li className="text-sm text-destructive/90">... e mais {result.errors.length - 20} erros</li>
              )}
            </ul>
          </Card>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={handleExportLog}>
            <FileDown className="mr-2 h-4 w-4" />
            Exportar Log
          </Button>
          <Button onClick={onComplete} size="lg" className="bg-success hover:bg-success/90">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Concluir
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8"
    >
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground">
          Confirmação e Resumo
        </h2>
        <p className="mt-2 text-muted-foreground">
          Revise os dados antes de finalizar a importação
        </p>
      </div>

      {!isImporting ? (
        <div className="space-y-6">
          {/* Summary */}
          <Card className="border-border bg-gradient-to-br from-card to-muted/30 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Arquivo</p>
                  <p className="text-lg font-medium text-foreground">
                    {importData.file?.name}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo</p>
                    <p className="font-medium text-foreground">{typeLabel}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Registros</p>
                    <p className="font-medium text-foreground">
                      {importData.validationResults?.totalRows.toLocaleString('pt-BR') || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Registros Válidos</p>
                    <p className="font-medium text-success">
                      {importData.validationResults?.validRows.toLocaleString('pt-BR') || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Preview */}
          <Card className="border-border p-6">
            <h3 className="mb-4 font-semibold text-foreground">
              Prévia dos Dados (Primeiros 5 registros)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {importData.data[0] &&
                      Object.keys(importData.data[0])
                        .slice(0, 5)
                        .map((key) => (
                          <th
                            key={key}
                            className="px-4 py-2 text-left font-medium text-muted-foreground"
                          >
                            {key}
                          </th>
                        ))}
                  </tr>
                </thead>
                <tbody>
                  {importData.data.slice(0, 5).map((row: any, index) => (
                    <tr key={index} className="border-b border-border/50">
                      {Object.values(row)
                        .slice(0, 5)
                        .map((value: any, i) => (
                          <td key={i} className="px-4 py-2 text-foreground">
                            {String(value).slice(0, 25)}
                            {String(value).length > 25 ? "..." : ""}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Divergences Summary */}
          {divergences.length > 0 && (
            <Card className="border-border p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <h3 className="font-semibold text-foreground">Resumo de Divergências</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex justify-between items-center p-3 rounded bg-warning/10 border border-warning/30">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <Badge variant="secondary">{divergences.length}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 rounded bg-muted/50">
                  <span className="text-sm text-muted-foreground">Ignorados</span>
                  <Badge variant="outline">{divergences.filter(d => d.status === 'ignored').length}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 rounded bg-success/10 border border-success/30">
                  <span className="text-sm text-muted-foreground">Ajustados</span>
                  <Badge variant="default">{divergences.filter(d => d.status === 'adjusted').length}</Badge>
                </div>
              </div>
            </Card>
          )}

          {/* Warning */}
          <div className="rounded-lg border border-warning/50 bg-warning/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-warning">Atenção</p>
                <p className="text-sm text-warning/90 mt-1">
                  Esta ação criará registros no banco de dados. 
                  {importData.type === 'historico' && ' Dados históricos não serão sobrescritos.'}
                  {divergences.filter(d => d.status === 'ignored').length > 0 && 
                    ` ${divergences.filter(d => d.status === 'ignored').length} divergência(s) serão ignoradas.`}
                  {' '}Certifique-se de que os dados estão corretos antes de prosseguir.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 py-8">
          <div className="flex flex-col items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="h-16 w-16 text-primary" />
            </motion.div>
            <p className="mt-4 text-lg font-medium text-foreground">
              {progress?.message || 'Importando dados...'}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {progress?.currentRow.toLocaleString('pt-BR') || 0} de {progress?.totalRows.toLocaleString('pt-BR') || 0} registros
            </p>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              animate={{ width: `${progress?.percentage || 0}%` }}
              transition={{ duration: 0.3 }}
              className="h-full bg-gradient-to-r from-primary to-primary-glow"
            />
          </div>

          <p className="text-center text-xs text-muted-foreground">
            {progress?.percentage || 0}% concluído
          </p>
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isImporting}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button
          onClick={handleImport}
          disabled={isImporting}
          size="lg"
          className="bg-success hover:bg-success/90"
        >
          {isImporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importando...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Confirmar Importação
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};

export default ConfirmationStep;
