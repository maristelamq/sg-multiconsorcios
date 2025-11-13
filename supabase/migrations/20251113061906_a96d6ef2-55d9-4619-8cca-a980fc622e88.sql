-- Create administradoras table
CREATE TABLE public.administradoras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create representantes table
CREATE TABLE public.representantes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vendedores table
CREATE TABLE public.vendedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create clientes table
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cotas table
CREATE TABLE public.cotas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL,
  grupo TEXT NOT NULL,
  codigo TEXT NOT NULL,
  administradora_id UUID REFERENCES public.administradoras(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(grupo, codigo, administradora_id)
);

-- Create vendas table
CREATE TABLE public.vendas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data_venda DATE NOT NULL,
  cota_id UUID REFERENCES public.cotas(id),
  cliente_id UUID REFERENCES public.clientes(id),
  representante_id UUID REFERENCES public.representantes(id),
  valor_credito DECIMAL(15,2) NOT NULL,
  valor_total DECIMAL(15,2) NOT NULL,
  situacao TEXT NOT NULL DEFAULT 'ATIVO',
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create comissoes_regras table
CREATE TABLE public.comissoes_regras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venda_id UUID NOT NULL REFERENCES public.vendas(id) ON DELETE CASCADE,
  vendedor_id UUID REFERENCES public.vendedores(id),
  percentual_vendedor DECIMAL(5,2) NOT NULL,
  parcelas INTEGER NOT NULL DEFAULT 1,
  valor_previsto DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create comissoes_representantes table
CREATE TABLE public.comissoes_representantes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venda_id UUID NOT NULL REFERENCES public.vendas(id) ON DELETE CASCADE,
  representante_id UUID NOT NULL REFERENCES public.representantes(id),
  percentual DECIMAL(5,2) NOT NULL,
  percentual_adicional DECIMAL(5,2),
  valor DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create recebimentos table
CREATE TABLE public.recebimentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venda_id UUID NOT NULL REFERENCES public.vendas(id) ON DELETE CASCADE,
  parcela INTEGER NOT NULL,
  valor_recebido DECIMAL(15,2) NOT NULL,
  data_credito DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inadimplencias table
CREATE TABLE public.inadimplencias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venda_id UUID NOT NULL REFERENCES public.vendas(id) ON DELETE CASCADE,
  valor DECIMAL(15,2) NOT NULL,
  data_registro DATE NOT NULL DEFAULT CURRENT_DATE,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create comissoes_pagas table
CREATE TABLE public.comissoes_pagas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venda_id UUID NOT NULL REFERENCES public.vendas(id) ON DELETE CASCADE,
  vendedor_id UUID REFERENCES public.vendedores(id),
  parcela INTEGER NOT NULL,
  valor_pago DECIMAL(15,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'PAGO',
  competencia TEXT,
  forma_pagamento TEXT,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ajustes_conciliacao table
CREATE TABLE public.ajustes_conciliacao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venda_id UUID NOT NULL REFERENCES public.vendas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  valor_esperado DECIMAL(15,2),
  valor_real DECIMAL(15,2),
  diferenca DECIMAL(15,2) NOT NULL,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create import_logs table
CREATE TABLE public.import_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_importacao TEXT NOT NULL,
  nome_arquivo TEXT NOT NULL,
  total_linhas INTEGER NOT NULL,
  linhas_validas INTEGER NOT NULL,
  linhas_rejeitadas INTEGER NOT NULL,
  valor_total_recebido DECIMAL(15,2),
  total_divergencias INTEGER DEFAULT 0,
  erros JSONB,
  warnings JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.administradoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.representantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comissoes_regras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comissoes_representantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recebimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inadimplencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comissoes_pagas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ajustes_conciliacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (for now, will be refined later with auth)
CREATE POLICY "Allow public read access on administradoras" 
ON public.administradoras FOR SELECT USING (true);

CREATE POLICY "Allow public read access on representantes" 
ON public.representantes FOR SELECT USING (true);

CREATE POLICY "Allow public read access on vendedores" 
ON public.vendedores FOR SELECT USING (true);

CREATE POLICY "Allow public read access on clientes" 
ON public.clientes FOR SELECT USING (true);

CREATE POLICY "Allow public read access on cotas" 
ON public.cotas FOR SELECT USING (true);

CREATE POLICY "Allow public read access on vendas" 
ON public.vendas FOR SELECT USING (true);

CREATE POLICY "Allow public read access on comissoes_regras" 
ON public.comissoes_regras FOR SELECT USING (true);

CREATE POLICY "Allow public read access on comissoes_representantes" 
ON public.comissoes_representantes FOR SELECT USING (true);

CREATE POLICY "Allow public read access on recebimentos" 
ON public.recebimentos FOR SELECT USING (true);

CREATE POLICY "Allow public read access on inadimplencias" 
ON public.inadimplencias FOR SELECT USING (true);

CREATE POLICY "Allow public read access on comissoes_pagas" 
ON public.comissoes_pagas FOR SELECT USING (true);

CREATE POLICY "Allow public read access on ajustes_conciliacao" 
ON public.ajustes_conciliacao FOR SELECT USING (true);

CREATE POLICY "Allow public read access on import_logs" 
ON public.import_logs FOR SELECT USING (true);

-- Allow public insert access for import functionality
CREATE POLICY "Allow public insert on administradoras" 
ON public.administradoras FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert on representantes" 
ON public.representantes FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert on vendedores" 
ON public.vendedores FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert on clientes" 
ON public.clientes FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert on cotas" 
ON public.cotas FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert on vendas" 
ON public.vendas FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert on comissoes_regras" 
ON public.comissoes_regras FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert on comissoes_representantes" 
ON public.comissoes_representantes FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert on recebimentos" 
ON public.recebimentos FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert on inadimplencias" 
ON public.inadimplencias FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert on comissoes_pagas" 
ON public.comissoes_pagas FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert on ajustes_conciliacao" 
ON public.ajustes_conciliacao FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert on import_logs" 
ON public.import_logs FOR INSERT WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_administradoras_updated_at
BEFORE UPDATE ON public.administradoras
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_representantes_updated_at
BEFORE UPDATE ON public.representantes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendedores_updated_at
BEFORE UPDATE ON public.vendedores
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at
BEFORE UPDATE ON public.clientes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cotas_updated_at
BEFORE UPDATE ON public.cotas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendas_updated_at
BEFORE UPDATE ON public.vendas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comissoes_regras_updated_at
BEFORE UPDATE ON public.comissoes_regras
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comissoes_representantes_updated_at
BEFORE UPDATE ON public.comissoes_representantes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recebimentos_updated_at
BEFORE UPDATE ON public.recebimentos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inadimplencias_updated_at
BEFORE UPDATE ON public.inadimplencias
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comissoes_pagas_updated_at
BEFORE UPDATE ON public.comissoes_pagas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ajustes_conciliacao_updated_at
BEFORE UPDATE ON public.ajustes_conciliacao
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();