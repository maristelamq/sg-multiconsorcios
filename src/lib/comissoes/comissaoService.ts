import { supabase } from "@/integrations/supabase/client";
import { addMonths, format, parseISO } from "date-fns";

interface Faixa {
  id: string;
  ordem: number;
  percentual: number;
  parcelas: number;
  meses_carencia: number;
}

interface Regra {
  id: string;
  nome: string;
  tipo: string;
  empresa_id: string | null;
  administradora_id: string | null;
  grupo_filtro: string | null;
  faixas_comissao: Faixa[];
}

interface Venda {
  id: string;
  data_venda: string;
  valor_credito: number;
  vendedor_id: string | null;
  representante_id: string | null;
  situacao: string;
  cota_id: string | null;
  cotas?: {
    grupo: string;
    administradora_id: string | null;
  } | null;
}

export interface ComissaoGerada {
  venda_id: string;
  vendedor_id: string | null;
  representante_id: string | null;
  regra_id: string;
  faixa_id: string;
  parcela: number;
  total_parcelas: number;
  base_calculo: number;
  percentual: number;
  valor_previsto: number;
  competencia_origem: string;
  competencia_pagamento: string;
  tipo: string;
  status: string;
}

// Buscar regras aplicáveis para uma venda
async function buscarRegrasAplicaveis(
  venda: Venda,
  tipo: 'VENDEDOR' | 'REPRESENTANTE'
): Promise<Regra[]> {
  let query = supabase
    .from('regras_comissao')
    .select('*, faixas_comissao(*)')
    .eq('tipo', tipo)
    .eq('ativo', true)
    .order('created_at', { ascending: false });

  const { data, error } = await query;
  
  if (error || !data) return [];

  // Filtrar regras aplicáveis
  return data.filter((regra: Regra) => {
    // Verificar administradora
    if (regra.administradora_id && venda.cotas?.administradora_id !== regra.administradora_id) {
      return false;
    }
    
    // Verificar grupo
    if (regra.grupo_filtro && venda.cotas?.grupo !== regra.grupo_filtro) {
      return false;
    }
    
    return true;
  });
}

// Verificar se venda tem inadimplência
async function verificarInadimplencia(vendaId: string): Promise<boolean> {
  const { data } = await supabase
    .from('inadimplencias')
    .select('id')
    .eq('venda_id', vendaId)
    .eq('status', 'ABERTO')
    .limit(1);
  
  return (data?.length || 0) > 0;
}

// Calcular competência de pagamento com defasagem
function calcularCompetenciaPagamento(
  dataOrigem: Date,
  mesesCarencia: number
): string {
  // Defasagem padrão: pagamento no mês seguinte + carência
  const dataPagamento = addMonths(dataOrigem, 1 + mesesCarencia);
  return format(dataPagamento, 'yyyy-MM');
}

// Gerar comissões para uma venda
export async function gerarComissoesVenda(vendaId: string): Promise<{
  success: boolean;
  comissoes: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let comissoesGeradas = 0;

  // Buscar venda com dados relacionados
  const { data: venda, error: vendaError } = await supabase
    .from('vendas')
    .select('*, cotas(grupo, administradora_id)')
    .eq('id', vendaId)
    .single();

  if (vendaError || !venda) {
    return { success: false, comissoes: 0, errors: ['Venda não encontrada'] };
  }

  // Não gerar comissões para vendas canceladas
  if (venda.situacao === 'CANCELADO' || venda.situacao === 'ESTORNO') {
    return { success: true, comissoes: 0, errors: ['Venda cancelada/estornada'] };
  }

  // Verificar inadimplência
  const temInadimplencia = await verificarInadimplencia(vendaId);

  const dataVenda = parseISO(venda.data_venda);
  const competenciaOrigem = format(dataVenda, 'yyyy-MM');

  // Processar comissões de vendedor
  if (venda.vendedor_id) {
    const regrasVendedor = await buscarRegrasAplicaveis(venda, 'VENDEDOR');
    
    for (const regra of regrasVendedor) {
      const faixas = (regra.faixas_comissao || []).sort((a: Faixa, b: Faixa) => a.ordem - b.ordem);
      
      for (const faixa of faixas) {
        const valorParcela = (venda.valor_credito * faixa.percentual / 100) / faixa.parcelas;
        
        for (let parcela = 1; parcela <= faixa.parcelas; parcela++) {
          const mesesOffset = parcela - 1 + faixa.meses_carencia;
          const dataPagamento = addMonths(dataVenda, 1 + mesesOffset);
          const competenciaPagamento = format(dataPagamento, 'yyyy-MM');
          
          const comissao: ComissaoGerada = {
            venda_id: vendaId,
            vendedor_id: venda.vendedor_id,
            representante_id: null,
            regra_id: regra.id,
            faixa_id: faixa.id,
            parcela,
            total_parcelas: faixa.parcelas,
            base_calculo: venda.valor_credito,
            percentual: faixa.percentual,
            valor_previsto: valorParcela,
            competencia_origem: competenciaOrigem,
            competencia_pagamento: competenciaPagamento,
            tipo: 'VENDEDOR',
            status: temInadimplencia ? 'BLOQUEADO' : 'PENDENTE'
          };

          const { error } = await supabase
            .from('comissoes_receber')
            .insert(comissao);

          if (error) {
            errors.push(`Erro ao criar comissão vendedor: ${error.message}`);
          } else {
            comissoesGeradas++;
          }
        }
      }
    }
  }

  // Processar comissões de representante
  if (venda.representante_id) {
    const regrasRepresentante = await buscarRegrasAplicaveis(venda, 'REPRESENTANTE');
    
    for (const regra of regrasRepresentante) {
      const faixas = (regra.faixas_comissao || []).sort((a: Faixa, b: Faixa) => a.ordem - b.ordem);
      
      for (const faixa of faixas) {
        const valorParcela = (venda.valor_credito * faixa.percentual / 100) / faixa.parcelas;
        
        for (let parcela = 1; parcela <= faixa.parcelas; parcela++) {
          const mesesOffset = parcela - 1 + faixa.meses_carencia;
          const dataPagamento = addMonths(dataVenda, 1 + mesesOffset);
          const competenciaPagamento = format(dataPagamento, 'yyyy-MM');
          
          const comissao: ComissaoGerada = {
            venda_id: vendaId,
            vendedor_id: null,
            representante_id: venda.representante_id,
            regra_id: regra.id,
            faixa_id: faixa.id,
            parcela,
            total_parcelas: faixa.parcelas,
            base_calculo: venda.valor_credito,
            percentual: faixa.percentual,
            valor_previsto: valorParcela,
            competencia_origem: competenciaOrigem,
            competencia_pagamento: competenciaPagamento,
            tipo: 'REPRESENTANTE',
            status: temInadimplencia ? 'BLOQUEADO' : 'PENDENTE'
          };

          const { error } = await supabase
            .from('comissoes_receber')
            .insert(comissao);

          if (error) {
            errors.push(`Erro ao criar comissão representante: ${error.message}`);
          } else {
            comissoesGeradas++;
          }
        }
      }
    }
  }

  return {
    success: errors.length === 0,
    comissoes: comissoesGeradas,
    errors
  };
}

// Bloquear comissões por inadimplência
export async function bloquearComissoesPorInadimplencia(vendaId: string): Promise<number> {
  const { data, error } = await supabase
    .from('comissoes_receber')
    .update({ 
      status: 'BLOQUEADO', 
      motivo_bloqueio: 'Inadimplência detectada' 
    })
    .eq('venda_id', vendaId)
    .eq('status', 'PENDENTE')
    .select();

  return data?.length || 0;
}

// Desbloquear comissões quando inadimplência for resolvida
export async function desbloquearComissoes(vendaId: string): Promise<number> {
  const { data, error } = await supabase
    .from('comissoes_receber')
    .update({ 
      status: 'PENDENTE', 
      motivo_bloqueio: null,
      data_liberacao: new Date().toISOString()
    })
    .eq('venda_id', vendaId)
    .eq('status', 'BLOQUEADO')
    .select();

  return data?.length || 0;
}

// Cancelar comissões futuras (para estornos/cancelamentos)
export async function cancelarComissoesFuturas(vendaId: string): Promise<number> {
  const competenciaAtual = format(new Date(), 'yyyy-MM');
  
  const { data, error } = await supabase
    .from('comissoes_receber')
    .update({ status: 'CANCELADO' })
    .eq('venda_id', vendaId)
    .in('status', ['PENDENTE', 'BLOQUEADO'])
    .gte('competencia_pagamento', competenciaAtual)
    .select();

  return data?.length || 0;
}

// Obter resumo de comissões por competência
export async function getResumoComissoes(competencia: string): Promise<{
  total_pendente: number;
  total_bloqueado: number;
  total_pago: number;
  por_vendedor: Record<string, number>;
  por_representante: Record<string, number>;
}> {
  const { data } = await supabase
    .from('comissoes_receber')
    .select('*, vendedores(nome), representantes(nome)')
    .eq('competencia_pagamento', competencia);

  const resumo = {
    total_pendente: 0,
    total_bloqueado: 0,
    total_pago: 0,
    por_vendedor: {} as Record<string, number>,
    por_representante: {} as Record<string, number>
  };

  for (const c of data || []) {
    if (c.status === 'PENDENTE') resumo.total_pendente += Number(c.valor_previsto);
    if (c.status === 'BLOQUEADO') resumo.total_bloqueado += Number(c.valor_previsto);
    if (c.status === 'PAGO') resumo.total_pago += Number(c.valor_pago || c.valor_previsto);

    if (c.vendedor_id && c.vendedores) {
      const nome = c.vendedores.nome;
      resumo.por_vendedor[nome] = (resumo.por_vendedor[nome] || 0) + Number(c.valor_previsto);
    }

    if (c.representante_id && c.representantes) {
      const nome = c.representantes.nome;
      resumo.por_representante[nome] = (resumo.por_representante[nome] || 0) + Number(c.valor_previsto);
    }
  }

  return resumo;
}
