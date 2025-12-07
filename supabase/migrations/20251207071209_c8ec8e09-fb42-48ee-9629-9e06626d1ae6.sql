-- Criar tabela de empresas
CREATE TABLE public.empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on empresas" ON public.empresas FOR SELECT USING (true);
CREATE POLICY "Allow public insert on empresas" ON public.empresas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on empresas" ON public.empresas FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on empresas" ON public.empresas FOR DELETE USING (true);

CREATE TRIGGER update_empresas_updated_at
  BEFORE UPDATE ON public.empresas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar empresa_id às tabelas existentes
ALTER TABLE public.administradoras ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.representantes ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.representantes ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'INTERNO';
ALTER TABLE public.representantes ADD COLUMN IF NOT EXISTS percentual NUMERIC DEFAULT 0;
ALTER TABLE public.representantes ADD COLUMN IF NOT EXISTS parcelas INTEGER DEFAULT 1;

ALTER TABLE public.vendedores ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.vendedores ADD COLUMN IF NOT EXISTS representante_id UUID REFERENCES public.representantes(id);
ALTER TABLE public.vendedores ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE public.vendedores ADD COLUMN IF NOT EXISTS exige_nf BOOLEAN DEFAULT true;

ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS contato TEXT;

ALTER TABLE public.cotas ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.cotas ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ATIVO';

ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS vendedor_id UUID REFERENCES public.vendedores(id);
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS docs_status TEXT DEFAULT 'PENDENTE';

ALTER TABLE public.recebimentos ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.recebimentos ADD COLUMN IF NOT EXISTS administradora_id UUID REFERENCES public.administradoras(id);
ALTER TABLE public.recebimentos ADD COLUMN IF NOT EXISTS cota_id UUID REFERENCES public.cotas(id);
ALTER TABLE public.recebimentos ADD COLUMN IF NOT EXISTS origem TEXT DEFAULT 'IMPORTACAO';
ALTER TABLE public.recebimentos ADD COLUMN IF NOT EXISTS conciliado BOOLEAN DEFAULT false;

-- Adicionar políticas UPDATE e DELETE às tabelas que não tinham
CREATE POLICY "Allow public update on administradoras" ON public.administradoras FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on administradoras" ON public.administradoras FOR DELETE USING (true);

CREATE POLICY "Allow public update on clientes" ON public.clientes FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on clientes" ON public.clientes FOR DELETE USING (true);

CREATE POLICY "Allow public update on representantes" ON public.representantes FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on representantes" ON public.representantes FOR DELETE USING (true);

CREATE POLICY "Allow public update on vendedores" ON public.vendedores FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on vendedores" ON public.vendedores FOR DELETE USING (true);

CREATE POLICY "Allow public update on cotas" ON public.cotas FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on cotas" ON public.cotas FOR DELETE USING (true);

CREATE POLICY "Allow public update on vendas" ON public.vendas FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on vendas" ON public.vendas FOR DELETE USING (true);

CREATE POLICY "Allow public update on recebimentos" ON public.recebimentos FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on recebimentos" ON public.recebimentos FOR DELETE USING (true);

CREATE POLICY "Allow public update on comissoes_regras" ON public.comissoes_regras FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on comissoes_regras" ON public.comissoes_regras FOR DELETE USING (true);

CREATE POLICY "Allow public update on comissoes_pagas" ON public.comissoes_pagas FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on comissoes_pagas" ON public.comissoes_pagas FOR DELETE USING (true);

CREATE POLICY "Allow public update on comissoes_representantes" ON public.comissoes_representantes FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on comissoes_representantes" ON public.comissoes_representantes FOR DELETE USING (true);

CREATE POLICY "Allow public update on inadimplencias" ON public.inadimplencias FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on inadimplencias" ON public.inadimplencias FOR DELETE USING (true);

CREATE POLICY "Allow public update on ajustes_conciliacao" ON public.ajustes_conciliacao FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on ajustes_conciliacao" ON public.ajustes_conciliacao FOR DELETE USING (true);