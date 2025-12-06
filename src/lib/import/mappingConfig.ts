// Configuração de mapeamento técnico para importação de planilhas

export const LAYOUT_HISTORICO = {
  descricao: "Histórico Geral de Vendas e Recebimentos",
  tipo_importacao: "unica" as const,
  colunas: {
    "DATA DA VENDA": "vendas.data_venda",
    "ADM": "administradoras.nome",
    "REPRES": "representantes.nome",
    "SEGMENTO": "cotas.tipo",
    "GRUPO": "cotas.grupo",
    "COTA": "cotas.codigo",
    "CRÉDITO ATUAL": "vendas.valor_credito",
    "VENDEDOR 1": "vendedores.nome",
    "VENDEDOR 1 % COMISSÃO": "comissoes_regras.percentual_vendedor",
    "VENDEDOR 2": "vendedores.nome",
    "VENDEDOR 2 % COMISSÃO": "comissoes_regras.percentual_vendedor",
    "COMISSÃO1 ANATOTE": "comissoes_representantes.percentual",
    "COMISSÃO2 ANATOTE": "comissoes_representantes.percentual_adicional",
    "VALOR TOTAL A RECEBER": "vendas.valor_total",
    "SITUAÇÃO": "vendas.situacao",
    "OBSERVAÇÃO": "vendas.observacao"
  },
  regras_especiais: {
    colunas_excluir: ["ALPHA1", "ALPHA2"],
    colunas_dif: {
      padrao: "comissoes_representantes.valor",
      condicao: "REPRES != 'ANATOTE'"
    },
    valores_negativos: "inadimplencias.valor",
    status_cancelamento: ["CANCELAMENTO", "ESTORNO"],
    evento_estorno: true,
    parcelas: {
      padrao: "PARCELA",
      valor_recebido: "VALOR RECEBIDO",
      data_credito: "DATA DO",
      gerar_recebimento: true
    }
  }
};

export const LAYOUT_PAGAMENTO = {
  descricao: "Relatório Mensal de Comissões Pagas a Vendedores",
  tipo_importacao: "mensal" as const,
  colunas: {
    "DATA  VENDA": "vendas.data_venda",
    "CLIENTE": "clientes.nome",
    "ADM": "administradoras.nome",
    "SEGMENTO": "cotas.tipo",
    "GRUPO": "cotas.grupo",
    "COTA": "cotas.codigo",
    "CRÉDITO": "vendas.valor_credito",
    "%": "comissoes_regras.percentual_vendedor",
    "COMISSÃO TOTAL": "comissoes_regras.valor_previsto",
    "TOTAL DE PARCELAS": "comissoes_regras.parcelas",
    "PARCELA PAGA": "comissoes_pagas.parcela",
    "VALOR PARCELA COMISSÃO": "comissoes_pagas.valor_pago",
    "STATUS PAGTO": "comissoes_pagas.status",
    "OBS": "comissoes_pagas.observacao"
  },
  metadados: {
    competencia: "extraido do cabeçalho",
    forma_pagamento: "extraido do cabeçalho",
    valor_total: "extraido do cabeçalho"
  }
};

export type ImportType = "historico" | "pagamento";

export interface DetectedLayout {
  type: ImportType;
  layout: typeof LAYOUT_HISTORICO | typeof LAYOUT_PAGAMENTO;
  confidence: number;
  matchedColumns: string[];
  unmatchedColumns: string[];
}

export function detectLayoutType(columns: string[]): DetectedLayout | null {
  const normalizeColumn = (col: string) => col.toUpperCase().trim();
  const normalizedColumns = columns.map(normalizeColumn);
  
  // Check historico layout
  const historicoKeys = Object.keys(LAYOUT_HISTORICO.colunas).map(normalizeColumn);
  const historicoMatches = historicoKeys.filter(key => 
    normalizedColumns.some(col => col.includes(key) || key.includes(col))
  );
  
  // Check pagamento layout  
  const pagamentoKeys = Object.keys(LAYOUT_PAGAMENTO.colunas).map(normalizeColumn);
  const pagamentoMatches = pagamentoKeys.filter(key =>
    normalizedColumns.some(col => col.includes(key) || key.includes(col))
  );
  
  const historicoConfidence = historicoMatches.length / historicoKeys.length;
  const pagamentoConfidence = pagamentoMatches.length / pagamentoKeys.length;
  
  // Check for specific distinguishing columns
  const hasHistoricoSpecific = normalizedColumns.some(col => 
    col.includes("DATA DA VENDA") || col.includes("CRÉDITO ATUAL")
  );
  const hasPagamentoSpecific = normalizedColumns.some(col => 
    col.includes("PARCELA PAGA") || col.includes("STATUS PAGTO")
  );
  
  if (hasHistoricoSpecific && historicoConfidence >= 0.3) {
    return {
      type: "historico",
      layout: LAYOUT_HISTORICO,
      confidence: historicoConfidence,
      matchedColumns: historicoMatches,
      unmatchedColumns: normalizedColumns.filter(col => !historicoMatches.includes(col))
    };
  }
  
  if (hasPagamentoSpecific && pagamentoConfidence >= 0.3) {
    return {
      type: "pagamento",
      layout: LAYOUT_PAGAMENTO,
      confidence: pagamentoConfidence,
      matchedColumns: pagamentoMatches,
      unmatchedColumns: normalizedColumns.filter(col => !pagamentoMatches.includes(col))
    };
  }
  
  if (historicoConfidence > pagamentoConfidence && historicoConfidence >= 0.2) {
    return {
      type: "historico",
      layout: LAYOUT_HISTORICO,
      confidence: historicoConfidence,
      matchedColumns: historicoMatches,
      unmatchedColumns: normalizedColumns.filter(col => !historicoMatches.includes(col))
    };
  }
  
  if (pagamentoConfidence >= 0.2) {
    return {
      type: "pagamento",
      layout: LAYOUT_PAGAMENTO,
      confidence: pagamentoConfidence,
      matchedColumns: pagamentoMatches,
      unmatchedColumns: normalizedColumns.filter(col => !pagamentoMatches.includes(col))
    };
  }
  
  return null;
}

export function findColumnMatch(columns: string[], pattern: string): string | null {
  const normalizedPattern = pattern.toUpperCase().trim();
  
  // Exact match first
  const exactMatch = columns.find(col => 
    col.toUpperCase().trim() === normalizedPattern
  );
  if (exactMatch) return exactMatch;
  
  // Partial match
  const partialMatch = columns.find(col =>
    col.toUpperCase().trim().includes(normalizedPattern) ||
    normalizedPattern.includes(col.toUpperCase().trim())
  );
  
  return partialMatch || null;
}

export function extractParcelaColumns(columns: string[]): {
  parcela: string;
  valorRecebido: string;
  dataCredito: string;
}[] {
  const results: { parcela: string; valorRecebido: string; dataCredito: string }[] = [];
  
  // Find columns matching PARCELA pattern
  const parcelaColumns = columns.filter(col => 
    /PARCELA\s*\d+/i.test(col.toUpperCase()) ||
    /VALOR\s+RECEBIDO\s*\d+/i.test(col.toUpperCase()) ||
    /DATA\s+DO\s+\d+/i.test(col.toUpperCase())
  );
  
  // Group by number
  const numbers = new Set<number>();
  parcelaColumns.forEach(col => {
    const match = col.match(/\d+/);
    if (match) numbers.add(parseInt(match[0]));
  });
  
  numbers.forEach(num => {
    const parcela = columns.find(col => 
      new RegExp(`PARCELA\\s*${num}`, 'i').test(col)
    );
    const valorRecebido = columns.find(col => 
      new RegExp(`VALOR\\s+RECEBIDO\\s*${num}`, 'i').test(col)
    );
    const dataCredito = columns.find(col => 
      new RegExp(`DATA\\s+DO\\s+${num}`, 'i').test(col)
    );
    
    if (parcela || valorRecebido) {
      results.push({
        parcela: parcela || `PARCELA ${num}`,
        valorRecebido: valorRecebido || '',
        dataCredito: dataCredito || ''
      });
    }
  });
  
  return results.sort((a, b) => {
    const numA = parseInt(a.parcela.match(/\d+/)?.[0] || '0');
    const numB = parseInt(b.parcela.match(/\d+/)?.[0] || '0');
    return numA - numB;
  });
}
