import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import UploadStep from "@/components/import/UploadStep";
import ValidationStep from "@/components/import/ValidationStep";
import DivergenceReviewStep, { type DivergenceItem } from "@/components/import/DivergenceReviewStep";
import ConfirmationStep from "@/components/import/ConfirmationStep";
import type { ValidationResult } from "@/lib/import/validators";

export type ImportType = "historico" | "pagamento" | null;

export interface ImportData {
  file: File | null;
  type: ImportType;
  data: any[];
  validationResults: {
    totalRows: number;
    validRows: number;
    errors: string[];
    warnings: string[];
  } | null;
}

const Import = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [importData, setImportData] = useState<ImportData>({
    file: null,
    type: null,
    data: [],
    validationResults: null,
  });
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [divergences, setDivergences] = useState<DivergenceItem[]>([]);

  const steps = [
    { number: 1, title: "Upload", icon: Upload },
    { number: 2, title: "Validação", icon: FileSpreadsheet },
    { number: 3, title: "Divergências", icon: AlertTriangle },
    { number: 4, title: "Confirmação", icon: CheckCircle2 },
  ];

  const handleValidationComplete = (result: ValidationResult) => {
    setValidationResult(result);
    
    // Build divergences from validation result
    const items: DivergenceItem[] = [];
    let id = 0;
    
    // Add errors
    result.errors.forEach((error) => {
      items.push({
        id: `err-${id++}`,
        row: error.row,
        type: 'error',
        column: error.column,
        originalValue: error.value,
        adjustedValue: null,
        message: error.message,
        status: 'pending',
      });
    });
    
    // Add warnings
    result.warnings.forEach((warning) => {
      const type = warning.message.toLowerCase().includes('divergência') ? 'divergence' :
                   warning.message.toLowerCase().includes('inadimpl') ? 'inadimplencia' :
                   warning.message.toLowerCase().includes('cancel') ? 'cancelamento' :
                   warning.message.toLowerCase().includes('estorno') ? 'estorno' : 'warning';
      
      items.push({
        id: `warn-${id++}`,
        row: warning.row,
        type,
        column: warning.column,
        originalValue: warning.value,
        adjustedValue: null,
        message: warning.message,
        status: 'pending',
      });
    });
    
    setDivergences(items);
  };

  const handleGoToStep3 = () => {
    if (divergences.length > 0) {
      setCurrentStep(3);
    } else {
      setCurrentStep(4);
    }
  };

  const resetImport = () => {
    setCurrentStep(1);
    setImportData({
      file: null,
      type: null,
      data: [],
      validationResults: null,
    });
    setValidationResult(null);
    setDivergences([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-foreground">
            Importador de Planilhas
          </h1>
          <p className="mt-2 text-muted-foreground">
            Sistema inteligente de importação para Consórcios Multiempresa
          </p>
        </div>
      </header>

      {/* Progress Stepper */}
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;

            return (
              <div key={step.number} className="flex items-center gap-4">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.1 : 1,
                  }}
                  className="flex items-center gap-3"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all ${
                      isCompleted
                        ? "border-success bg-success text-success-foreground"
                        : isActive
                        ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        isActive || isCompleted
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      Etapa {step.number}
                    </p>
                    <p
                      className={`text-xs ${
                        isActive ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {step.title}
                    </p>
                  </div>
                </motion.div>

                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 w-16 lg:w-24 transition-all ${
                      currentStep > step.number ? "bg-success" : "bg-border"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 pb-12">
        <Card className="mx-auto max-w-5xl border-border bg-card shadow-lg">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <UploadStep
                key="upload"
                importData={importData}
                setImportData={setImportData}
                onNext={() => setCurrentStep(2)}
              />
            )}
            {currentStep === 2 && (
              <ValidationStep
                key="validation"
                importData={importData}
                setImportData={setImportData}
                onNext={handleGoToStep3}
                onBack={() => setCurrentStep(1)}
                onValidationComplete={handleValidationComplete}
              />
            )}
            {currentStep === 3 && (
              <DivergenceReviewStep
                key="divergence"
                importData={importData}
                validationResult={validationResult}
                divergences={divergences}
                setDivergences={setDivergences}
                onNext={() => setCurrentStep(4)}
                onBack={() => setCurrentStep(2)}
              />
            )}
            {currentStep === 4 && (
              <ConfirmationStep
                key="confirmation"
                importData={importData}
                divergences={divergences}
                onBack={() => divergences.length > 0 ? setCurrentStep(3) : setCurrentStep(2)}
                onComplete={resetImport}
              />
            )}
          </AnimatePresence>
        </Card>
      </div>
    </div>
  );
};

export default Import;
