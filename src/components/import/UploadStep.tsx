import { useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, FileSpreadsheet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { ImportData } from "@/pages/Import";

interface UploadStepProps {
  importData: ImportData;
  setImportData: (data: ImportData) => void;
  onNext: () => void;
}

const UploadStep = ({ importData, setImportData, onNext }: UploadStepProps) => {
  const { toast } = useToast();

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "text/csv",
      ];

      if (!validTypes.includes(file.type)) {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione um arquivo Excel (.xlsx) ou CSV (.csv)",
          variant: "destructive",
        });
        return;
      }

      setImportData({
        ...importData,
        file,
      });

      toast({
        title: "Arquivo carregado",
        description: `${file.name} pronto para validação`,
      });
    },
    [importData, setImportData, toast]
  );

  const handleRemoveFile = useCallback(() => {
    setImportData({
      ...importData,
      file: null,
    });
  }, [importData, setImportData]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) {
        const event = {
          target: { files: [file] },
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        handleFileChange(event);
      }
    },
    [handleFileChange]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8"
    >
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground">
          Upload da Planilha
        </h2>
        <p className="mt-2 text-muted-foreground">
          Selecione ou arraste a planilha de histórico ou pagamentos para começar
        </p>
      </div>

      {!importData.file ? (
        <label
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 p-12 transition-all hover:border-primary hover:bg-primary/5"
        >
          <input
            type="file"
            onChange={handleFileChange}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />

          <motion.div
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Upload className="h-16 w-16 text-muted-foreground transition-colors group-hover:text-primary" />
          </motion.div>

          <p className="mt-4 text-lg font-medium text-foreground">
            Clique para selecionar ou arraste aqui
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Formatos aceitos: .xlsx, .xls, .csv (até 20MB)
          </p>
        </label>
      ) : (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-4 rounded-xl border border-border bg-card p-6"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
            <FileSpreadsheet className="h-6 w-6 text-success" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">{importData.file.name}</p>
            <p className="text-sm text-muted-foreground">
              {(importData.file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRemoveFile}
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </motion.div>
      )}

      <div className="mt-8 flex justify-end">
        <Button
          onClick={onNext}
          disabled={!importData.file}
          size="lg"
          className="bg-primary hover:bg-primary/90"
        >
          Próximo: Validar Dados
        </Button>
      </div>
    </motion.div>
  );
};

export default UploadStep;
