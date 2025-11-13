import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { ImportData } from "@/pages/Import";
import * as XLSX from "xlsx";

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

  useEffect(() => {
    const processFile = async () => {
      if (!importData.file) return;

      setIsProcessing(true);
      setProgress(0);

      try {
        // Simulate progress
        const progressInterval = setInterval(() => {
          setProgress((prev) => Math.min(prev + 10, 90));
        }, 200);

        const reader = new FileReader();
        reader.onload = (e) => {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          clearInterval(progressInterval);
          setProgress(100);

          // Detect import type based on columns
          const firstRow = jsonData[0] as any;
          const columns = Object.keys(firstRow || {});

          let detectedType: "historico" | "pagamento" | null = null;
          if (columns.includes("DATA DA VENDA") && columns.includes("CRÉDITO ATUAL")) {
            detectedType = "historico";
          } else if (columns.includes("DATA  VENDA") && columns.includes("PARCELA PAGA")) {
            detectedType = "pagamento";
          }

          // Simple validation
          const errors: string[] = [];
          const warnings: string[] = [];

          if (!detectedType) {
            errors.push("Não foi possível identificar o tipo de planilha");
          }

          if (jsonData.length === 0) {
            errors.push("A planilha está vazia");
          }

          if (jsonData.length > 10000) {
            warnings.push(`Planilha grande (${jsonData.length} linhas) - processamento pode levar alguns minutos`);
          }

          setImportData({
            ...importData,
            type: detectedType,
            data: jsonData,
            validationResults: {
              totalRows: jsonData.length,
              validRows: errors.length === 0 ? jsonData.length : 0,
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
                title: "Erros encontrados",
                description: "Revise os erros antes de prosseguir",
                variant: "destructive",
              });
            }
          }, 500);
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
    importData.validationResults.errors.length === 0;

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
          Analisando estrutura e validando dados da planilha
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
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-border p-4">
              <p className="text-sm text-muted-foreground">Tipo Detectado</p>
              <p className="mt-2 text-xl font-semibold text-foreground">
                {importData.type === "historico"
                  ? "Histórico Geral"
                  : importData.type === "pagamento"
                  ? "Pagamento"
                  : "Não identificado"}
              </p>
            </Card>

            <Card className="border-border p-4">
              <p className="text-sm text-muted-foreground">Total de Linhas</p>
              <p className="mt-2 text-xl font-semibold text-foreground">
                {importData.validationResults?.totalRows || 0}
              </p>
            </Card>

            <Card className="border-border p-4">
              <p className="text-sm text-muted-foreground">Linhas Válidas</p>
              <p className="mt-2 text-xl font-semibold text-success">
                {importData.validationResults?.validRows || 0}
              </p>
            </Card>
          </div>

          {/* Errors */}
          {importData.validationResults?.errors &&
            importData.validationResults.errors.length > 0 && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <div className="flex-1">
                    <p className="font-medium text-destructive">
                      Erros Encontrados
                    </p>
                    <ul className="mt-2 space-y-1">
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
                  <AlertCircle className="h-5 w-5 text-warning" />
                  <div className="flex-1">
                    <p className="font-medium text-warning">Avisos</p>
                    <ul className="mt-2 space-y-1">
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
          {canProceed && (
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
