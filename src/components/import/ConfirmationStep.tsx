import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowLeft, Loader2, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { ImportData } from "@/pages/Import";

interface ConfirmationStepProps {
  importData: ImportData;
  onBack: () => void;
  onComplete: () => void;
}

const ConfirmationStep = ({
  importData,
  onBack,
  onComplete,
}: ConfirmationStepProps) => {
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleImport = async () => {
    setIsImporting(true);
    setProgress(0);

    // Simulate import process
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 5;
      });
    }, 100);

    // Simulate API call
    setTimeout(() => {
      clearInterval(progressInterval);
      setProgress(100);
      
      toast({
        title: "Importação concluída!",
        description: `${importData.validationResults?.validRows || 0} registros importados com sucesso`,
      });

      setTimeout(() => {
        onComplete();
      }, 1500);
    }, 2000);
  };

  const typeLabel =
    importData.type === "historico"
      ? "Histórico Geral"
      : importData.type === "pagamento"
      ? "Pagamento de Comissões"
      : "Não identificado";

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
                      {importData.validationResults?.totalRows || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Registros Válidos</p>
                    <p className="font-medium text-success">
                      {importData.validationResults?.validRows || 0}
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
                        .slice(0, 4)
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
                        .slice(0, 4)
                        .map((value: any, i) => (
                          <td key={i} className="px-4 py-2 text-foreground">
                            {String(value).slice(0, 30)}
                            {String(value).length > 30 ? "..." : ""}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Warning */}
          <div className="rounded-lg border border-warning/50 bg-warning/10 p-4">
            <p className="text-sm text-warning">
              <strong>Atenção:</strong> Esta ação criará registros no banco de dados.
              Certifique-se de que os dados estão corretos antes de prosseguir.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6 py-8">
          <div className="flex flex-col items-center justify-center">
            <motion.div
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <Loader2 className="h-16 w-16 text-primary" />
            </motion.div>
            <p className="mt-4 text-lg font-medium text-foreground">
              Importando dados...
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {progress}% concluído - Processando {importData.validationResults?.validRows || 0} registros
            </p>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              animate={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-primary to-primary-glow"
            />
          </div>
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
