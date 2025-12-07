// Validadores financeiros e de conciliação

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: ValidationSummary;
}

export interface ValidationError {
  row: number;
  column: string;
  value: any;
  message: string;
  type: 'required' | 'format' | 'range' | 'business';
}

export interface ValidationWarning {
  row: number;
  column: string;
  value: any;
  message: string;
  type: 'tolerance' | 'suggestion' | 'info';
}

export interface ValidationSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  totalValorCredito: number;
  totalValorRecebido: number;
  totalComissoes: number;
  divergencias: number;
  inadimplencias: number;
  cancelamentos: number;
  estornos: number;
}

export interface RowValidation {
  row: number;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  data: ParsedRowData;
}

export interface ParsedRowData {
  dataVenda: Date | null;
  administradora: string;
  representante: string;
  segmento: string;
  grupo: string;
  cota: string;
  valorCredito: number;
  valorTotal: number;
  situacao: string;
  observacao: string;
  vendedor1: string;
  vendedor1Percentual: number;
  vendedor2: string;
  vendedor2Percentual: number;
  comissao1: number;
  comissao2: number;
  cliente: string;
  parcelas: ParcelaData[];
  isCancelamento: boolean;
  isEstorno: boolean;
  isNegativo: boolean;
  valorDivergencia: number;
}

export interface ParcelaData {
  numero: number;
  valorRecebido: number;
  dataCredito: Date | null;
}

const TOLERANCE_PERCENTAGE = 0.005; // 0.5%
const TOLERANCE_ABSOLUTE = 0.01; // R$ 0.01

export function parseDate(value: any): Date | null {
  if (!value) return null;
  
  // Handle Excel serial date (Windows 1900 date system)
  // Excel epoch starts at 1900-01-01 (serial 1), but Excel incorrectly treats 1900 as a leap year
  // The base date is actually December 30, 1899 to account for this bug
  if (typeof value === 'number') {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30)); // Dec 30, 1899
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const excelDate = new Date(excelEpoch.getTime() + value * millisecondsPerDay);
    
    if (!isNaN(excelDate.getTime())) return excelDate;
  }
  
  // Handle string dates
  if (typeof value === 'string') {
    // Try DD/MM/YYYY format
    const brMatch = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (brMatch) {
      const [, day, month, year] = brMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    
    // Try YYYY-MM-DD format
    const isoMatch = value.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return new Date(value);
    }
    
    // Try standard Date parse
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  
  return null;
}

export function parseNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  
  const strValue = String(value)
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  
  const parsed = parseFloat(strValue);
  return isNaN(parsed) ? 0 : parsed;
}

export function parsePercentage(value: any): number {
  if (!value) return 0;
  
  const num = parseNumber(value);
  // If value is greater than 1, assume it's already a percentage
  return num > 1 ? num : num * 100;
}

export function validateTotalRecebido(
  parcelas: ParcelaData[],
  valorTotal: number
): { isValid: boolean; diferenca: number; percentualDiferenca: number } {
  const somaRecebido = parcelas.reduce((sum, p) => sum + p.valorRecebido, 0);
  const diferenca = Math.abs(somaRecebido - valorTotal);
  const percentualDiferenca = valorTotal > 0 ? diferenca / valorTotal : 0;
  
  return {
    isValid: percentualDiferenca <= TOLERANCE_PERCENTAGE || diferenca <= TOLERANCE_ABSOLUTE,
    diferenca,
    percentualDiferenca
  };
}

export function validateComissao(
  comissaoPrevista: number,
  comissaoPaga: number
): { isValid: boolean; diferenca: number } {
  const diferenca = Math.abs(comissaoPrevista - comissaoPaga);
  
  return {
    isValid: diferenca <= TOLERANCE_ABSOLUTE,
    diferenca
  };
}

export function isCancelamento(situacao: string): boolean {
  const normalizado = situacao?.toUpperCase().trim() || '';
  return normalizado.includes('CANCELAMENTO') || normalizado === 'CANCELADO';
}

export function isEstorno(situacao: string): boolean {
  const normalizado = situacao?.toUpperCase().trim() || '';
  return normalizado.includes('ESTORNO');
}

export function isNegativo(valor: number): boolean {
  return valor < 0;
}

export function validateRow(
  row: Record<string, any>,
  rowIndex: number,
  columns: string[],
  layoutType: 'historico' | 'pagamento'
): RowValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Find column values using flexible matching
  const findValue = (patterns: string[]): any => {
    for (const pattern of patterns) {
      const col = columns.find(c => 
        c.toUpperCase().includes(pattern.toUpperCase())
      );
      if (col && row[col] !== undefined && row[col] !== '') {
        return row[col];
      }
    }
    return null;
  };
  
  const dataVendaRaw = findValue(['DATA DA VENDA', 'DATA  VENDA', 'DATA VENDA']);
  const dataVenda = parseDate(dataVendaRaw);
  
  const administradora = String(findValue(['ADM']) || '').trim();
  const representante = String(findValue(['REPRES']) || '').trim();
  const segmento = String(findValue(['SEGMENTO']) || '').trim();
  const grupo = String(findValue(['GRUPO']) || '').trim();
  const cota = String(findValue(['COTA']) || '').trim();
  const valorCredito = parseNumber(findValue(['CRÉDITO ATUAL', 'CRÉDITO', 'CREDITO']));
  const valorTotal = parseNumber(findValue(['VALOR TOTAL A RECEBER', 'VALOR TOTAL']));
  const situacao = String(findValue(['SITUAÇÃO', 'SITUACAO', 'STATUS']) || 'ATIVO').trim();
  const observacao = String(findValue(['OBSERVAÇÃO', 'OBSERVACAO', 'OBS']) || '').trim();
  
  const vendedor1 = String(findValue(['VENDEDOR 1']) || '').trim();
  const vendedor1Percentual = parsePercentage(findValue(['VENDEDOR 1 % COMISSÃO', 'VENDEDOR 1 %']));
  const vendedor2 = String(findValue(['VENDEDOR 2']) || '').trim();
  const vendedor2Percentual = parsePercentage(findValue(['VENDEDOR 2 % COMISSÃO', 'VENDEDOR 2 %']));
  
  const comissao1 = parsePercentage(findValue(['COMISSÃO1 ANATOTE', 'COMISSÃO1']));
  const comissao2 = parsePercentage(findValue(['COMISSÃO2 ANATOTE', 'COMISSÃO2']));
  
  const cliente = String(findValue(['CLIENTE']) || '').trim();
  
  // Extract parcelas
  const parcelas: ParcelaData[] = [];
  for (let i = 1; i <= 20; i++) {
    const valorRecebidoCol = columns.find(c => 
      new RegExp(`VALOR\\s+RECEBIDO\\s*${i}`, 'i').test(c)
    );
    const dataCreditoCol = columns.find(c =>
      new RegExp(`DATA\\s+DO\\s+${i}`, 'i').test(c)
    );
    
    if (valorRecebidoCol && row[valorRecebidoCol]) {
      const valorRecebido = parseNumber(row[valorRecebidoCol]);
      const dataCredito = dataCreditoCol ? parseDate(row[dataCreditoCol]) : null;
      
      if (valorRecebido !== 0) {
        parcelas.push({
          numero: i,
          valorRecebido,
          dataCredito
        });
      }
    }
  }
  
  // Validations
  if (layoutType === 'historico') {
    if (!cota) {
      errors.push('Código da cota é obrigatório');
    }
    if (!grupo) {
      errors.push('Grupo é obrigatório');
    }
    if (!administradora) {
      warnings.push('Administradora não informada');
    }
    if (valorCredito <= 0) {
      warnings.push('Valor de crédito inválido ou não informado');
    }
  }
  
  if (layoutType === 'pagamento') {
    if (!cota) {
      errors.push('Código da cota é obrigatório');
    }
  }
  
  // Check for divergencias
  const isCancelamentoFlag = isCancelamento(situacao);
  const isEstornoFlag = isEstorno(situacao);
  const isNegativoFlag = isNegativo(valorTotal) || parcelas.some(p => p.valorRecebido < 0);
  
  let valorDivergencia = 0;
  if (parcelas.length > 0 && valorTotal > 0) {
    const validation = validateTotalRecebido(parcelas, valorTotal);
    if (!validation.isValid) {
      warnings.push(`Divergência de ${(validation.percentualDiferenca * 100).toFixed(2)}% entre valor total e soma das parcelas`);
      valorDivergencia = validation.diferenca;
    }
  }
  
  const data: ParsedRowData = {
    dataVenda,
    administradora,
    representante,
    segmento,
    grupo,
    cota,
    valorCredito,
    valorTotal,
    situacao,
    observacao,
    vendedor1,
    vendedor1Percentual,
    vendedor2,
    vendedor2Percentual,
    comissao1,
    comissao2,
    cliente,
    parcelas,
    isCancelamento: isCancelamentoFlag,
    isEstorno: isEstornoFlag,
    isNegativo: isNegativoFlag,
    valorDivergencia
  };
  
  return {
    row: rowIndex,
    isValid: errors.length === 0,
    errors,
    warnings,
    data
  };
}

export function validateAllRows(
  rows: Record<string, any>[],
  columns: string[],
  layoutType: 'historico' | 'pagamento'
): ValidationResult {
  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationWarning[] = [];
  let validRows = 0;
  let invalidRows = 0;
  let totalValorCredito = 0;
  let totalValorRecebido = 0;
  let totalComissoes = 0;
  let divergencias = 0;
  let inadimplencias = 0;
  let cancelamentos = 0;
  let estornos = 0;
  
  rows.forEach((row, index) => {
    const validation = validateRow(row, index + 1, columns, layoutType);
    
    if (validation.isValid) {
      validRows++;
    } else {
      invalidRows++;
      validation.errors.forEach(error => {
        allErrors.push({
          row: index + 1,
          column: '',
          value: null,
          message: error,
          type: 'required'
        });
      });
    }
    
    validation.warnings.forEach(warning => {
      allWarnings.push({
        row: index + 1,
        column: '',
        value: null,
        message: warning,
        type: 'tolerance'
      });
    });
    
    totalValorCredito += validation.data.valorCredito;
    totalValorRecebido += validation.data.parcelas.reduce((sum, p) => sum + p.valorRecebido, 0);
    totalComissoes += validation.data.comissao1 + validation.data.comissao2;
    
    if (validation.data.valorDivergencia > 0) divergencias++;
    if (validation.data.isNegativo) inadimplencias++;
    if (validation.data.isCancelamento) cancelamentos++;
    if (validation.data.isEstorno) estornos++;
  });
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    summary: {
      totalRows: rows.length,
      validRows,
      invalidRows,
      totalValorCredito,
      totalValorRecebido,
      totalComissoes,
      divergencias,
      inadimplencias,
      cancelamentos,
      estornos
    }
  };
}
