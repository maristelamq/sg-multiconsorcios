// Serviço de importação para persistência no Supabase

import { supabase } from "@/integrations/supabase/client";
import { ParsedRowData, validateRow } from "./validators";
import { ImportType } from "./mappingConfig";

export interface ImportProgress {
  phase: 'preparing' | 'processing' | 'saving' | 'validating' | 'complete' | 'error';
  currentRow: number;
  totalRows: number;
  percentage: number;
  message: string;
}

export interface ImportResult {
  success: boolean;
  importLogId: string | null;
  stats: {
    vendasCriadas: number;
    cotasCriadas: number;
    clientesCriados: number;
    vendedoresCriados: number;
    administradorasCriadas: number;
    representantesCriados: number;
    recebimentosCriados: number;
    comissoesCriadas: number;
    inadimplenciasCriadas: number;
    ajustesCriados: number;
  };
  errors: string[];
  warnings: string[];
}

type ProgressCallback = (progress: ImportProgress) => void;

// Cache para evitar duplicatas
const cache = {
  administradoras: new Map<string, string>(),
  representantes: new Map<string, string>(),
  vendedores: new Map<string, string>(),
  clientes: new Map<string, string>(),
  cotas: new Map<string, string>(),
};

async function getOrCreateAdministradora(nome: string): Promise<string | null> {
  if (!nome) return null;
  
  const normalizado = nome.trim().toUpperCase();
  if (cache.administradoras.has(normalizado)) {
    return cache.administradoras.get(normalizado)!;
  }
  
  const { data: existing } = await supabase
    .from('administradoras')
    .select('id')
    .ilike('nome', normalizado)
    .maybeSingle();
  
  if (existing) {
    cache.administradoras.set(normalizado, existing.id);
    return existing.id;
  }
  
  const { data: created, error } = await supabase
    .from('administradoras')
    .insert({ nome: nome.trim() })
    .select('id')
    .single();
  
  if (error || !created) return null;
  
  cache.administradoras.set(normalizado, created.id);
  return created.id;
}

async function getOrCreateRepresentante(nome: string): Promise<string | null> {
  if (!nome) return null;
  
  const normalizado = nome.trim().toUpperCase();
  if (cache.representantes.has(normalizado)) {
    return cache.representantes.get(normalizado)!;
  }
  
  const { data: existing } = await supabase
    .from('representantes')
    .select('id')
    .ilike('nome', normalizado)
    .maybeSingle();
  
  if (existing) {
    cache.representantes.set(normalizado, existing.id);
    return existing.id;
  }
  
  const { data: created, error } = await supabase
    .from('representantes')
    .insert({ nome: nome.trim() })
    .select('id')
    .single();
  
  if (error || !created) return null;
  
  cache.representantes.set(normalizado, created.id);
  return created.id;
}

async function getOrCreateVendedor(nome: string): Promise<string | null> {
  if (!nome) return null;
  
  const normalizado = nome.trim().toUpperCase();
  if (cache.vendedores.has(normalizado)) {
    return cache.vendedores.get(normalizado)!;
  }
  
  const { data: existing } = await supabase
    .from('vendedores')
    .select('id')
    .ilike('nome', normalizado)
    .maybeSingle();
  
  if (existing) {
    cache.vendedores.set(normalizado, existing.id);
    return existing.id;
  }
  
  const { data: created, error } = await supabase
    .from('vendedores')
    .insert({ nome: nome.trim() })
    .select('id')
    .single();
  
  if (error || !created) return null;
  
  cache.vendedores.set(normalizado, created.id);
  return created.id;
}

async function getOrCreateCliente(nome: string): Promise<string | null> {
  if (!nome) return null;
  
  const normalizado = nome.trim().toUpperCase();
  if (cache.clientes.has(normalizado)) {
    return cache.clientes.get(normalizado)!;
  }
  
  const { data: existing } = await supabase
    .from('clientes')
    .select('id')
    .ilike('nome', normalizado)
    .maybeSingle();
  
  if (existing) {
    cache.clientes.set(normalizado, existing.id);
    return existing.id;
  }
  
  const { data: created, error } = await supabase
    .from('clientes')
    .insert({ nome: nome.trim() })
    .select('id')
    .single();
  
  if (error || !created) return null;
  
  cache.clientes.set(normalizado, created.id);
  return created.id;
}

async function getOrCreateCota(
  codigo: string, 
  grupo: string, 
  tipo: string, 
  administradoraId: string | null
): Promise<string | null> {
  if (!codigo) return null;
  
  const chave = `${grupo}-${codigo}`.toUpperCase();
  if (cache.cotas.has(chave)) {
    return cache.cotas.get(chave)!;
  }
  
  const { data: existing } = await supabase
    .from('cotas')
    .select('id')
    .eq('codigo', codigo.trim())
    .eq('grupo', grupo.trim())
    .maybeSingle();
  
  if (existing) {
    cache.cotas.set(chave, existing.id);
    return existing.id;
  }
  
  const { data: created, error } = await supabase
    .from('cotas')
    .insert({ 
      codigo: codigo.trim(), 
      grupo: grupo.trim(), 
      tipo: tipo.trim() || 'IMÓVEL',
      administradora_id: administradoraId
    })
    .select('id')
    .single();
  
  if (error || !created) return null;
  
  cache.cotas.set(chave, created.id);
  return created.id;
}

function formatDate(date: Date | null): string {
  if (!date || isNaN(date.getTime())) {
    return new Date().toISOString().split('T')[0];
  }
  return date.toISOString().split('T')[0];
}

export async function processImport(
  rows: Record<string, any>[],
  columns: string[],
  layoutType: ImportType,
  fileName: string,
  onProgress: ProgressCallback
): Promise<ImportResult> {
  // Clear cache at start
  cache.administradoras.clear();
  cache.representantes.clear();
  cache.vendedores.clear();
  cache.clientes.clear();
  cache.cotas.clear();
  
  const stats = {
    vendasCriadas: 0,
    cotasCriadas: 0,
    clientesCriados: 0,
    vendedoresCriados: 0,
    administradorasCriadas: 0,
    representantesCriados: 0,
    recebimentosCriados: 0,
    comissoesCriadas: 0,
    inadimplenciasCriadas: 0,
    ajustesCriados: 0
  };
  
  const errors: string[] = [];
  const warnings: string[] = [];
  
  onProgress({
    phase: 'preparing',
    currentRow: 0,
    totalRows: rows.length,
    percentage: 0,
    message: 'Preparando importação...'
  });
  
  // Pre-load existing entities for batch lookup
  await Promise.all([
    supabase.from('administradoras').select('id, nome'),
    supabase.from('representantes').select('id, nome'),
    supabase.from('vendedores').select('id, nome'),
    supabase.from('clientes').select('id, nome'),
    supabase.from('cotas').select('id, codigo, grupo')
  ]).then(([admRes, repRes, vendRes, cliRes, cotaRes]) => {
    admRes.data?.forEach(a => cache.administradoras.set(a.nome.toUpperCase(), a.id));
    repRes.data?.forEach(r => cache.representantes.set(r.nome.toUpperCase(), r.id));
    vendRes.data?.forEach(v => cache.vendedores.set(v.nome.toUpperCase(), v.id));
    cliRes.data?.forEach(c => cache.clientes.set(c.nome.toUpperCase(), c.id));
    cotaRes.data?.forEach(c => cache.cotas.set(`${c.grupo}-${c.codigo}`.toUpperCase(), c.id));
  });
  
  // Process rows
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;
    
    onProgress({
      phase: 'processing',
      currentRow: rowNum,
      totalRows: rows.length,
      percentage: Math.round((rowNum / rows.length) * 80),
      message: `Processando linha ${rowNum} de ${rows.length}...`
    });
    
    try {
      const validation = validateRow(row, rowNum, columns, layoutType);
      
      if (!validation.isValid) {
        validation.errors.forEach(err => errors.push(`Linha ${rowNum}: ${err}`));
        continue;
      }
      
      validation.warnings.forEach(warn => warnings.push(`Linha ${rowNum}: ${warn}`));
      
      const data = validation.data;
      
      // Create/get entities
      const administradoraId = await getOrCreateAdministradora(data.administradora);
      const representanteId = await getOrCreateRepresentante(data.representante);
      const vendedor1Id = await getOrCreateVendedor(data.vendedor1);
      const vendedor2Id = await getOrCreateVendedor(data.vendedor2);
      const clienteId = await getOrCreateCliente(data.cliente);
      const cotaId = await getOrCreateCota(
        data.cota, 
        data.grupo, 
        data.segmento, 
        administradoraId
      );
      
      if (!cotaId) {
        errors.push(`Linha ${rowNum}: Não foi possível criar/encontrar a cota ${data.grupo}-${data.cota}`);
        continue;
      }
      
      // Check for existing venda (for historico type, never overwrite)
      if (layoutType === 'historico') {
        const { data: existingVenda } = await supabase
          .from('vendas')
          .select('id')
          .eq('cota_id', cotaId)
          .maybeSingle();
        
        if (existingVenda) {
          warnings.push(`Linha ${rowNum}: Venda já existe para cota ${data.grupo}-${data.cota}, ignorando`);
          continue;
        }
      }
      
      // Create venda
      const { data: venda, error: vendaError } = await supabase
        .from('vendas')
        .insert({
          cota_id: cotaId,
          cliente_id: clienteId,
          representante_id: representanteId,
          data_venda: formatDate(data.dataVenda),
          valor_credito: data.valorCredito || 0,
          valor_total: data.valorTotal || 0,
          situacao: data.isCancelamento ? 'CANCELADO' : data.isEstorno ? 'ESTORNO' : data.situacao || 'ATIVO',
          observacao: data.observacao || null
        })
        .select('id')
        .single();
      
      if (vendaError || !venda) {
        errors.push(`Linha ${rowNum}: Erro ao criar venda - ${vendaError?.message}`);
        continue;
      }
      
      stats.vendasCriadas++;
      
      // Create comissoes_regras for vendedor1
      if (vendedor1Id && data.vendedor1Percentual > 0) {
        const valorPrevisto = (data.valorCredito * data.vendedor1Percentual) / 100;
        await supabase.from('comissoes_regras').insert({
          venda_id: venda.id,
          vendedor_id: vendedor1Id,
          percentual_vendedor: data.vendedor1Percentual,
          valor_previsto: valorPrevisto,
          parcelas: 1
        });
        stats.comissoesCriadas++;
      }
      
      // Create comissoes_regras for vendedor2
      if (vendedor2Id && data.vendedor2Percentual > 0) {
        const valorPrevisto = (data.valorCredito * data.vendedor2Percentual) / 100;
        await supabase.from('comissoes_regras').insert({
          venda_id: venda.id,
          vendedor_id: vendedor2Id,
          percentual_vendedor: data.vendedor2Percentual,
          valor_previsto: valorPrevisto,
          parcelas: 1
        });
        stats.comissoesCriadas++;
      }
      
      // Create comissao_representante if REPRES != ANATOTE
      if (representanteId && data.representante.toUpperCase() !== 'ANATOTE') {
        await supabase.from('comissoes_representantes').insert({
          venda_id: venda.id,
          representante_id: representanteId,
          percentual: data.comissao1 || 0,
          percentual_adicional: data.comissao2 || null,
          valor: (data.valorCredito * (data.comissao1 || 0)) / 100
        });
      }
      
      // Create recebimentos
      for (const parcela of data.parcelas) {
        if (parcela.valorRecebido !== 0) {
          await supabase.from('recebimentos').insert({
            venda_id: venda.id,
            parcela: parcela.numero,
            valor_recebido: parcela.valorRecebido,
            data_credito: formatDate(parcela.dataCredito) || formatDate(new Date())
          });
          stats.recebimentosCriados++;
        }
      }
      
      // Create inadimplencia if negative values
      if (data.isNegativo) {
        const valorNegativo = data.parcelas
          .filter(p => p.valorRecebido < 0)
          .reduce((sum, p) => sum + Math.abs(p.valorRecebido), 0);
        
        if (valorNegativo > 0) {
          await supabase.from('inadimplencias').insert({
            venda_id: venda.id,
            valor: valorNegativo,
            observacao: 'Importado automaticamente - valor negativo detectado'
          });
          stats.inadimplenciasCriadas++;
        }
      }
      
      // Create ajuste_conciliacao if divergencia
      if (data.valorDivergencia > 0) {
        const somaRecebido = data.parcelas.reduce((sum, p) => sum + p.valorRecebido, 0);
        await supabase.from('ajustes_conciliacao').insert({
          venda_id: venda.id,
          tipo: 'DIVERGENCIA_IMPORTACAO',
          diferenca: data.valorDivergencia,
          valor_esperado: data.valorTotal,
          valor_real: somaRecebido,
          observacao: `Divergência detectada na importação. Esperado: R$ ${data.valorTotal.toFixed(2)}, Real: R$ ${somaRecebido.toFixed(2)}`
        });
        stats.ajustesCriados++;
      }
      
    } catch (err: any) {
      errors.push(`Linha ${rowNum}: Erro inesperado - ${err.message}`);
    }
  }
  
  onProgress({
    phase: 'saving',
    currentRow: rows.length,
    totalRows: rows.length,
    percentage: 90,
    message: 'Salvando log de importação...'
  });
  
  // Create import log
  const { data: importLog, error: logError } = await supabase
    .from('import_logs')
    .insert({
      tipo_importacao: layoutType,
      nome_arquivo: fileName,
      total_linhas: rows.length,
      linhas_validas: stats.vendasCriadas,
      linhas_rejeitadas: errors.length,
      valor_total_recebido: stats.recebimentosCriados,
      total_divergencias: stats.ajustesCriados,
      erros: errors.length > 0 ? errors : null,
      warnings: warnings.length > 0 ? warnings : null
    })
    .select('id')
    .single();
  
  onProgress({
    phase: 'complete',
    currentRow: rows.length,
    totalRows: rows.length,
    percentage: 100,
    message: 'Importação concluída!'
  });
  
  return {
    success: errors.length === 0,
    importLogId: importLog?.id || null,
    stats,
    errors,
    warnings
  };
}
