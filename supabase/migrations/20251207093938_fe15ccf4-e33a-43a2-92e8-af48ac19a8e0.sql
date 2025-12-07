
-- Criar tabela documentos para controle documental de vendas
CREATE TABLE public.documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id UUID NOT NULL,
  tipo TEXT NOT NULL, -- 'CONTRATO', 'PROPOSTA', 'RG', 'CPF', 'COMPROVANTE_ENDERECO', 'OUTRO'
  nome_arquivo TEXT NOT NULL,
  arquivo_url TEXT,
  status TEXT DEFAULT 'PENDENTE', -- 'PENDENTE', 'APROVADO', 'REJEITADO'
  observacao TEXT,
  aprovado_por TEXT,
  data_aprovacao TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

-- RLS policies for documentos
CREATE POLICY "Allow all on documentos" ON public.documentos FOR ALL USING (true) WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_documentos_updated_at
  BEFORE UPDATE ON public.documentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar tabela contas_pagar para controle de pagamentos
CREATE TABLE public.contas_pagar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID,
  vendedor_id UUID,
  representante_id UUID,
  competencia TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'VENDEDOR', -- 'VENDEDOR', 'REPRESENTANTE'
  valor_total NUMERIC NOT NULL DEFAULT 0,
  valor_pago NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'PENDENTE', -- 'PENDENTE', 'PARCIAL', 'PAGO'
  data_pagamento TIMESTAMPTZ,
  forma_pagamento TEXT,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;

-- RLS policies for contas_pagar
CREATE POLICY "Allow all on contas_pagar" ON public.contas_pagar FOR ALL USING (true) WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_contas_pagar_updated_at
  BEFORE UPDATE ON public.contas_pagar
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar bucket de storage para documentos
INSERT INTO storage.buckets (id, name, public) VALUES ('documentos', 'documentos', false);

-- Policies de storage para documentos
CREATE POLICY "Allow public read on documentos bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'documentos');

CREATE POLICY "Allow public insert on documentos bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documentos');

CREATE POLICY "Allow public update on documentos bucket"
ON storage.objects FOR UPDATE
USING (bucket_id = 'documentos');

CREATE POLICY "Allow public delete on documentos bucket"
ON storage.objects FOR DELETE
USING (bucket_id = 'documentos');
