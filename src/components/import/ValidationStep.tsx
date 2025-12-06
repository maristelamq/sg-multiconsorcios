import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft, FileSpreadsheet, TrendingUp, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { ImportData } from "@/pages/Import";
import * as XLSX from "xlsx";
import { detectLayoutType, DetectedLayout } from "@/lib/import/mappingConfig";
import { validateAllRows, ValidationResult } from "@/lib/import/validators";

interface ValidationStepProps {
  importData: ImportData;
  setImportData: (data: ImportData) => void;
  onNext: () => void;
  onBack: () => void;
}

const ValidationStep = ({
  importData,
  setImportData,
  onNext,
  onBack,
}: ValidationStepProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [detectedLayout, setDetectedLayout] = useState<DetectedLayout | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  useEffect(() => {
    const processFile = async () => {
      if (!importData.file) return;

      setIsProcessing(true);
      setProgress(0);

      try {
        const progressInterval = setInterval(() => {
          setProgress((prev) => Math.min(prev + 5, 85));
        }, 150);

        const reader = new FileReader();
        reader.onload = (e) => {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          setProgress(70);

          // Get columns
          const firstRow = jsonData[0] as Record<string, any>;
          const columns = Object.keys(firstRow || {});

          // Detect layout type
          const layout = detectLayoutType(columns);
          setDetectedLayout(layout);

          let detectedType: "historico" | "pagamento" | null = null;
          if (layout) {
            detectedType = layout.type;
          }

          setProgress(85);

          // Validate all rows
          let validation: ValidationResult | null = null;
          const errors: string[] = [];
          const warnings: string[] = [];

          if (!detectedType) {
            errors.push("Não foi possível identificar o tipo de planilha automaticamente");
          } else {
            validation = validateAllRows(jsonData as Record<string, any>[], columns, detectedType);
            setValidationResult(validation);

            validation.errors.slice(0, 10).forEach(err => {
              errors.push(`Linha ${err.row}: ${err.message}`);
            });
            if (validation.errors.length > 10) {
              errors.push(`... e mais ${validation.errors.length - 10} erros`);
            }

            validation.warnings.slice(0, 10).forEach(warn => {
              warnings.push(`Linha ${warn.row}: ${warn.message}`);
            });
            if (validation.warnings.length > 10) {
              warnings.push(`... e mais ${validation.warnings.length - 10} avisos`);
            }
          }

          if (jsonData.length === 0) {
            errors.push("A planilha está vazia");
          }

          if (jsonData.length > 10000) {
            warnings.push(`Planilha grande (${jsonData.length} linhas) - processamento pode levar alguns minutos`);
          }

          clearInterval(progressInterval);
          setProgress(100);

          setImportData({
            ...importData,
            type: detectedType,
            data: jsonData,
            validationResults: {
              totalRows: jsonData.length,
              validRows: validation?.summary.validRows || 0,
              errors,
              warnings,
            },
          });

          setTimeout(() => {
            setIsProcessing(false);
            if (errors.length === 0) {
              toast({
                title: "Validação concluída",
                description: `${jsonData.length} registros prontos para importação`,
              });
            } else {
              toast({
                title: "Atenção aos avisos",
                description: "Revise os avisos antes de prosseguir",
                variant: "destructive",
              });
            }
          }, 300);
        };

        reader.readAsBinaryString(importData.file);
      } catch (error) {
        setIsProcessing(false);
        toast({
          title: "Erro ao processar arquivo",
          description: "Verifique se o arquivo está no formato correto",
          variant: "destructive",
        });
      }
    };

    processFile();
  }, [importData.file]);

  const canProceed =
    !isProcessing &&
    importData.validationResults &&
    importData.type !== null;

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
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground">
          Validação e Reconhecimento
        </h2>
        <p className="mt-2 text-muted-foreground">
          Analisando estrutura, mapeando colunas e validando dados
        </p>
      </div>

      {isProcessing ? (
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <p className="mt-4 text-lg font-medium text-foreground">
              Processando arquivo...
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {progress < 70 ? 'Lendo dados da planilha...' : 
               progress < 85 ? 'Detectando tipo de importação...' : 
               'Validando registros...'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {progress}% concluído
            </p>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-primary to-primary-glow"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Layout Detection */}
          {detectedLayout && (
            <Card className="border-primary/50 bg-primary/5 p-4">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    Tipo Detectado: {detectedLayout.type === 'historico' ? 'Histórico Geral' : 'Pagamento de Comissões'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Confiança: {(detectedLayout.confidence * 100).toFixed(0)}% • 
                    {detectedLayout.matchedColumns.length} colunas mapeadas
                  </p>
                </div>
                <Badge variant={detectedLayout.confidence >= 0.5 ? "default" : "secondary"}>
                  {detectedLayout.confidence >= 0.5 ? 'Alta confiança' : 'Verificar mapeamento'}
                </Badge>
              </div>
            </Card>
          )}

          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border p-4">
              <p className="text-sm text-muted-foreground">Total de Linhas</p>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {importData.validationResults?.totalRows.toLocaleString('pt-BR') || 0}
              </p>
            </Card>

            <Card className="border-border p-4">
              <p className="text-sm text-muted-foreground">Linhas Válidas</p>
              <p className="mt-2 text-2xl font-bold text-success">
                {validationResult?.summary.validRows.toLocaleString('pt-BR') || 0}
              </p>
            </Card>

            <Card className="border-border p-4">
              <p className="text-sm text-muted-foreground">Valor Total Crédito</p>
              <p className="mt-2 text-xl font-bold text-foreground">
                {formatCurrency(validationResult?.summary.totalValorCredito || 0)}
              </p>
            </Card>

            <Card className="border-border p-4">
              <p className="text-sm text-muted-foreground">Valor Recebido</p>
              <p className="mt-2 text-xl font-bold text-primary">
                {formatCurrency(validationResult?.summary.totalValorRecebido || 0)}
              </p>
            </Card>
          </div>

          {/* Financial Summary */}
          {validationResult && (
            <Card className="border-border p-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Resumo Financeiro</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Divergências</p>
                  <p className="text-lg font-semibold text-warning">
                    {validationResult.summary.divergencias}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Inadimplências</p>
                  <p className="text-lg font-semibold text-destructive">
                    {validationResult.summary.inadimplencias}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Cancelamentos</p>
                  <p className="text-lg font-semibold text-muted-foreground">
                    {validationResult.summary.cancelamentos}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Estornos</p>
                  <p className="text-lg font-semibold text-muted-foreground">
                    {validationResult.summary.estornos}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Errors */}
          {importData.validationResults?.errors &&
            importData.validationResults.errors.length > 0 && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-destructive">
                      Erros Encontrados ({importData.validationResults.errors.length})
                    </p>
                    <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                      {importData.validationResults.errors.map((error, index) => (
                        <li key={index} className="text-sm text-destructive/90">
                          • {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

          {/* Warnings */}
          {importData.validationResults?.warnings &&
            importData.validationResults.warnings.length > 0 && (
              <div className="rounded-lg border border-warning/50 bg-warning/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-warning">
                      Avisos ({importData.validationResults.warnings.length})
                    </p>
                    <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                      {importData.validationResults.warnings.map((warning, index) => (
                        <li key={index} className="text-sm text-warning/90">
                          • {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

          {/* Success */}
          {canProceed && importData.validationResults?.errors.length === 0 && (
            <div className="rounded-lg border border-success/50 bg-success/10 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <div className="flex-1">
                  <p className="font-medium text-success">
                    Validação Concluída com Sucesso
                  </p>
                  <p className="mt-1 text-sm text-success/90">
                    Todos os dados foram validados e estão prontos para importação
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isProcessing}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button onClick={onNext} disabled={!canProceed} size="lg">
          Próximo: Confirmar
        </Button>
      </div>
    </motion.div>
  );
};

export default ValidationStep;
