-- Tabela de regras de comissão por administradora/grupo
CREATE TABLE public.regras_comissao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id),
  administradora_id UUID REFERENCES public.administradoras(id),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'VENDEDOR', -- VENDEDOR ou REPRESENTANTE
  grupo_filtro TEXT, -- filtro opcional por grupo
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.regras_comissao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on regras_comissao" ON public.regras_comissao FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_regras_comissao_updated_at
  BEFORE UPDATE ON public.regras_comissao
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de faixas (múltiplas faixas por regra)
CREATE TABLE public.faixas_comissao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regra_id UUID NOT NULL REFERENCES public.regras_comissao(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL DEFAULT 1,
  percentual NUMERIC NOT NULL,
  parcelas INTEGER NOT NULL DEFAULT 1,
  meses_carencia INTEGER DEFAULT 0, -- defasagem
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.faixas_comissao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on faixas_comissao" ON public.faixas_comissao FOR ALL USING (true) WITH CHECK (true);

-- Tabela de comissões a receber (geradas automaticamente)
CREATE TABLE public.comissoes_receber (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id UUID NOT NULL REFERENCES public.vendas(id) ON DELETE CASCADE,
  vendedor_id UUID REFERENCES public.vendedores(id),
  representante_id UUID REFERENCES public.representantes(id),
  regra_id UUID REFERENCES public.regras_comissao(id),
  faixa_id UUID REFERENCES public.faixas_comissao(id),
  parcela INTEGER NOT NULL,
  total_parcelas INTEGER NOT NULL,
  base_calculo NUMERIC NOT NULL,
  percentual NUMERIC NOT NULL,
  valor_previsto NUMERIC NOT NULL,
  competencia_origem TEXT NOT NULL, -- YYYY-MM da venda/recebimento
  competencia_pagamento TEXT NOT NULL, -- YYYY-MM do pagamento (com defasagem)
  tipo TEXT NOT NULL DEFAULT 'VENDEDOR', -- VENDEDOR ou REPRESENTANTE
  status TEXT NOT NULL DEFAULT 'PENDENTE', -- PENDENTE, LIBERADO, BLOQUEADO, PAGO, CANCELADO
  motivo_bloqueio TEXT,
  data_liberacao TIMESTAMPTZ,
  data_pagamento TIMESTAMPTZ,
  valor_pago NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.comissoes_receber ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on comissoes_receber" ON public.comissoes_receber FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_comissoes_receber_updated_at
  BEFORE UPDATE ON public.comissoes_receber
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar campo de parcela às inadimplencias
ALTER TABLE public.inadimplencias ADD COLUMN IF NOT EXISTS parcela INTEGER;
ALTER TABLE public.inadimplencias ADD COLUMN IF NOT EXISTS dias_atraso INTEGER DEFAULT 0;
ALTER TABLE public.inadimplencias ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ABERTO';

-- Índices para performance
CREATE INDEX idx_comissoes_receber_venda ON public.comissoes_receber(venda_id);
CREATE INDEX idx_comissoes_receber_vendedor ON public.comissoes_receber(vendedor_id);
CREATE INDEX idx_comissoes_receber_competencia ON public.comissoes_receber(competencia_pagamento);
CREATE INDEX idx_comissoes_receber_status ON public.comissoes_receber(status);
CREATE INDEX idx_faixas_regra ON public.faixas_comissao(regra_id);