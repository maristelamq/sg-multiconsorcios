
-- Drop all overly permissive policies first
DROP POLICY IF EXISTS "Allow public read access on vendas" ON vendas;
DROP POLICY IF EXISTS "Allow public insert on vendas" ON vendas;
DROP POLICY IF EXISTS "Allow public update on vendas" ON vendas;
DROP POLICY IF EXISTS "Allow public delete on vendas" ON vendas;

DROP POLICY IF EXISTS "Allow public read access on clientes" ON clientes;
DROP POLICY IF EXISTS "Allow public insert on clientes" ON clientes;
DROP POLICY IF EXISTS "Allow public update on clientes" ON clientes;
DROP POLICY IF EXISTS "Allow public delete on clientes" ON clientes;

DROP POLICY IF EXISTS "Allow public read access on vendedores" ON vendedores;
DROP POLICY IF EXISTS "Allow public insert on vendedores" ON vendedores;
DROP POLICY IF EXISTS "Allow public update on vendedores" ON vendedores;
DROP POLICY IF EXISTS "Allow public delete on vendedores" ON vendedores;

DROP POLICY IF EXISTS "Allow public read access on administradoras" ON administradoras;
DROP POLICY IF EXISTS "Allow public insert on administradoras" ON administradoras;
DROP POLICY IF EXISTS "Allow public update on administradoras" ON administradoras;
DROP POLICY IF EXISTS "Allow public delete on administradoras" ON administradoras;

DROP POLICY IF EXISTS "Allow public read access on representantes" ON representantes;
DROP POLICY IF EXISTS "Allow public insert on representantes" ON representantes;
DROP POLICY IF EXISTS "Allow public update on representantes" ON representantes;
DROP POLICY IF EXISTS "Allow public delete on representantes" ON representantes;

DROP POLICY IF EXISTS "Allow public read access on cotas" ON cotas;
DROP POLICY IF EXISTS "Allow public insert on cotas" ON cotas;
DROP POLICY IF EXISTS "Allow public update on cotas" ON cotas;
DROP POLICY IF EXISTS "Allow public delete on cotas" ON cotas;

DROP POLICY IF EXISTS "Allow public read access on recebimentos" ON recebimentos;
DROP POLICY IF EXISTS "Allow public insert on recebimentos" ON recebimentos;
DROP POLICY IF EXISTS "Allow public update on recebimentos" ON recebimentos;
DROP POLICY IF EXISTS "Allow public delete on recebimentos" ON recebimentos;

DROP POLICY IF EXISTS "Allow public read access on comissoes_pagas" ON comissoes_pagas;
DROP POLICY IF EXISTS "Allow public insert on comissoes_pagas" ON comissoes_pagas;
DROP POLICY IF EXISTS "Allow public update on comissoes_pagas" ON comissoes_pagas;
DROP POLICY IF EXISTS "Allow public delete on comissoes_pagas" ON comissoes_pagas;

DROP POLICY IF EXISTS "Allow public read access on comissoes_regras" ON comissoes_regras;
DROP POLICY IF EXISTS "Allow public insert on comissoes_regras" ON comissoes_regras;
DROP POLICY IF EXISTS "Allow public update on comissoes_regras" ON comissoes_regras;
DROP POLICY IF EXISTS "Allow public delete on comissoes_regras" ON comissoes_regras;

DROP POLICY IF EXISTS "Allow public read access on comissoes_representantes" ON comissoes_representantes;
DROP POLICY IF EXISTS "Allow public insert on comissoes_representantes" ON comissoes_representantes;
DROP POLICY IF EXISTS "Allow public update on comissoes_representantes" ON comissoes_representantes;
DROP POLICY IF EXISTS "Allow public delete on comissoes_representantes" ON comissoes_representantes;

DROP POLICY IF EXISTS "Allow public read access on inadimplencias" ON inadimplencias;
DROP POLICY IF EXISTS "Allow public insert on inadimplencias" ON inadimplencias;
DROP POLICY IF EXISTS "Allow public update on inadimplencias" ON inadimplencias;
DROP POLICY IF EXISTS "Allow public delete on inadimplencias" ON inadimplencias;

DROP POLICY IF EXISTS "Allow public read access on ajustes_conciliacao" ON ajustes_conciliacao;
DROP POLICY IF EXISTS "Allow public insert on ajustes_conciliacao" ON ajustes_conciliacao;
DROP POLICY IF EXISTS "Allow public update on ajustes_conciliacao" ON ajustes_conciliacao;
DROP POLICY IF EXISTS "Allow public delete on ajustes_conciliacao" ON ajustes_conciliacao;

DROP POLICY IF EXISTS "Allow all on comissoes_receber" ON comissoes_receber;
DROP POLICY IF EXISTS "Allow all on contas_pagar" ON contas_pagar;
DROP POLICY IF EXISTS "Allow all on regras_comissao" ON regras_comissao;
DROP POLICY IF EXISTS "Allow all on faixas_comissao" ON faixas_comissao;
DROP POLICY IF EXISTS "Allow all on documentos" ON documentos;

DROP POLICY IF EXISTS "Allow public read on empresas" ON empresas;
DROP POLICY IF EXISTS "Allow public insert on empresas" ON empresas;
DROP POLICY IF EXISTS "Allow public update on empresas" ON empresas;
DROP POLICY IF EXISTS "Allow public delete on empresas" ON empresas;

-- Helper function to check if user is admin or gestor_master (can see all companies)
CREATE OR REPLACE FUNCTION public.is_admin_or_master(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'gestor_master')
  )
$$;

-- Helper function to check if user has elevated access (gestor level or above)
CREATE OR REPLACE FUNCTION public.has_elevated_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'gestor_master', 'gestor_empresa', 'financeiro')
  )
$$;

-- =====================
-- EMPRESAS (Companies)
-- =====================
-- Admins/Gestores Masters can see all companies, others see only their company
CREATE POLICY "empresas_select" ON empresas FOR SELECT USING (
  is_admin_or_master(auth.uid()) OR id = get_user_empresa_id(auth.uid())
);

CREATE POLICY "empresas_insert" ON empresas FOR INSERT WITH CHECK (
  is_admin_or_master(auth.uid())
);

CREATE POLICY "empresas_update" ON empresas FOR UPDATE USING (
  is_admin_or_master(auth.uid())
);

CREATE POLICY "empresas_delete" ON empresas FOR DELETE USING (
  has_role(auth.uid(), 'admin')
);

-- =====================
-- ADMINISTRADORAS
-- =====================
CREATE POLICY "administradoras_select" ON administradoras FOR SELECT USING (
  is_admin_or_master(auth.uid()) OR empresa_id = get_user_empresa_id(auth.uid()) OR empresa_id IS NULL
);

CREATE POLICY "administradoras_insert" ON administradoras FOR INSERT WITH CHECK (
  has_elevated_access(auth.uid()) AND (empresa_id IS NULL OR empresa_id = get_user_empresa_id(auth.uid()) OR is_admin_or_master(auth.uid()))
);

CREATE POLICY "administradoras_update" ON administradoras FOR UPDATE USING (
  has_elevated_access(auth.uid()) AND (empresa_id IS NULL OR empresa_id = get_user_empresa_id(auth.uid()) OR is_admin_or_master(auth.uid()))
);

CREATE POLICY "administradoras_delete" ON administradoras FOR DELETE USING (
  is_admin_or_master(auth.uid())
);

-- =====================
-- CLIENTES (Contains PII - CPF/CNPJ)
-- =====================
CREATE POLICY "clientes_select" ON clientes FOR SELECT USING (
  is_admin_or_master(auth.uid()) OR empresa_id = get_user_empresa_id(auth.uid())
);

CREATE POLICY "clientes_insert" ON clientes FOR INSERT WITH CHECK (
  has_elevated_access(auth.uid()) OR has_role(auth.uid(), 'analista_vendas')
);

CREATE POLICY "clientes_update" ON clientes FOR UPDATE USING (
  (has_elevated_access(auth.uid()) OR has_role(auth.uid(), 'analista_vendas'))
  AND (empresa_id = get_user_empresa_id(auth.uid()) OR is_admin_or_master(auth.uid()))
);

CREATE POLICY "clientes_delete" ON clientes FOR DELETE USING (
  is_admin_or_master(auth.uid())
);

-- =====================
-- VENDEDORES (Contains PII - CPF)
-- =====================
CREATE POLICY "vendedores_select" ON vendedores FOR SELECT USING (
  is_admin_or_master(auth.uid()) OR empresa_id = get_user_empresa_id(auth.uid())
);

CREATE POLICY "vendedores_insert" ON vendedores FOR INSERT WITH CHECK (
  has_elevated_access(auth.uid())
);

CREATE POLICY "vendedores_update" ON vendedores FOR UPDATE USING (
  has_elevated_access(auth.uid()) AND (empresa_id = get_user_empresa_id(auth.uid()) OR is_admin_or_master(auth.uid()))
);

CREATE POLICY "vendedores_delete" ON vendedores FOR DELETE USING (
  is_admin_or_master(auth.uid())
);

-- =====================
-- REPRESENTANTES
-- =====================
CREATE POLICY "representantes_select" ON representantes FOR SELECT USING (
  is_admin_or_master(auth.uid()) OR empresa_id = get_user_empresa_id(auth.uid())
);

CREATE POLICY "representantes_insert" ON representantes FOR INSERT WITH CHECK (
  has_elevated_access(auth.uid())
);

CREATE POLICY "representantes_update" ON representantes FOR UPDATE USING (
  has_elevated_access(auth.uid()) AND (empresa_id = get_user_empresa_id(auth.uid()) OR is_admin_or_master(auth.uid()))
);

CREATE POLICY "representantes_delete" ON representantes FOR DELETE USING (
  is_admin_or_master(auth.uid())
);

-- =====================
-- COTAS
-- =====================
CREATE POLICY "cotas_select" ON cotas FOR SELECT USING (
  is_admin_or_master(auth.uid()) OR empresa_id = get_user_empresa_id(auth.uid())
);

CREATE POLICY "cotas_insert" ON cotas FOR INSERT WITH CHECK (
  has_elevated_access(auth.uid()) OR has_role(auth.uid(), 'analista_vendas')
);

CREATE POLICY "cotas_update" ON cotas FOR UPDATE USING (
  (has_elevated_access(auth.uid()) OR has_role(auth.uid(), 'analista_vendas'))
  AND (empresa_id = get_user_empresa_id(auth.uid()) OR is_admin_or_master(auth.uid()))
);

CREATE POLICY "cotas_delete" ON cotas FOR DELETE USING (
  is_admin_or_master(auth.uid())
);

-- =====================
-- VENDAS (Sales - Financial Data)
-- =====================
-- Vendedores can only see their own sales
CREATE POLICY "vendas_select" ON vendas FOR SELECT USING (
  is_admin_or_master(auth.uid()) 
  OR (empresa_id = get_user_empresa_id(auth.uid()) AND (
    has_elevated_access(auth.uid()) 
    OR has_role(auth.uid(), 'analista_vendas')
    OR has_role(auth.uid(), 'analista_inadimplencia')
    OR vendedor_id IN (SELECT id FROM vendedores WHERE nome = (SELECT nome FROM profiles WHERE user_id = auth.uid()))
  ))
);

CREATE POLICY "vendas_insert" ON vendas FOR INSERT WITH CHECK (
  has_elevated_access(auth.uid()) OR has_role(auth.uid(), 'analista_vendas')
);

CREATE POLICY "vendas_update" ON vendas FOR UPDATE USING (
  (has_elevated_access(auth.uid()) OR has_role(auth.uid(), 'analista_vendas'))
  AND (empresa_id = get_user_empresa_id(auth.uid()) OR is_admin_or_master(auth.uid()))
);

CREATE POLICY "vendas_delete" ON vendas FOR DELETE USING (
  is_admin_or_master(auth.uid())
);

-- =====================
-- RECEBIMENTOS (Receipts - Financial Data)
-- =====================
CREATE POLICY "recebimentos_select" ON recebimentos FOR SELECT USING (
  is_admin_or_master(auth.uid()) 
  OR (empresa_id = get_user_empresa_id(auth.uid()) AND (has_elevated_access(auth.uid()) OR has_role(auth.uid(), 'analista_vendas')))
);

CREATE POLICY "recebimentos_insert" ON recebimentos FOR INSERT WITH CHECK (
  has_elevated_access(auth.uid())
);

CREATE POLICY "recebimentos_update" ON recebimentos FOR UPDATE USING (
  has_elevated_access(auth.uid()) AND (empresa_id = get_user_empresa_id(auth.uid()) OR is_admin_or_master(auth.uid()))
);

CREATE POLICY "recebimentos_delete" ON recebimentos FOR DELETE USING (
  is_admin_or_master(auth.uid())
);

-- =====================
-- COMISSOES_PAGAS (Paid Commissions)
-- =====================
CREATE POLICY "comissoes_pagas_select" ON comissoes_pagas FOR SELECT USING (
  is_admin_or_master(auth.uid()) 
  OR has_elevated_access(auth.uid())
  OR vendedor_id IN (SELECT id FROM vendedores WHERE nome = (SELECT nome FROM profiles WHERE user_id = auth.uid()))
);

CREATE POLICY "comissoes_pagas_insert" ON comissoes_pagas FOR INSERT WITH CHECK (
  has_elevated_access(auth.uid())
);

CREATE POLICY "comissoes_pagas_update" ON comissoes_pagas FOR UPDATE USING (
  has_elevated_access(auth.uid())
);

CREATE POLICY "comissoes_pagas_delete" ON comissoes_pagas FOR DELETE USING (
  is_admin_or_master(auth.uid())
);

-- =====================
-- COMISSOES_RECEBER (Commissions to Receive)
-- =====================
CREATE POLICY "comissoes_receber_select" ON comissoes_receber FOR SELECT USING (
  is_admin_or_master(auth.uid()) 
  OR has_elevated_access(auth.uid())
  OR vendedor_id IN (SELECT id FROM vendedores WHERE nome = (SELECT nome FROM profiles WHERE user_id = auth.uid()))
);

CREATE POLICY "comissoes_receber_insert" ON comissoes_receber FOR INSERT WITH CHECK (
  has_elevated_access(auth.uid())
);

CREATE POLICY "comissoes_receber_update" ON comissoes_receber FOR UPDATE USING (
  has_elevated_access(auth.uid())
);

CREATE POLICY "comissoes_receber_delete" ON comissoes_receber FOR DELETE USING (
  is_admin_or_master(auth.uid())
);

-- =====================
-- COMISSOES_REGRAS (Commission Rules)
-- =====================
CREATE POLICY "comissoes_regras_select" ON comissoes_regras FOR SELECT USING (
  is_admin_or_master(auth.uid()) OR has_elevated_access(auth.uid())
);

CREATE POLICY "comissoes_regras_insert" ON comissoes_regras FOR INSERT WITH CHECK (
  has_elevated_access(auth.uid())
);

CREATE POLICY "comissoes_regras_update" ON comissoes_regras FOR UPDATE USING (
  has_elevated_access(auth.uid())
);

CREATE POLICY "comissoes_regras_delete" ON comissoes_regras FOR DELETE USING (
  is_admin_or_master(auth.uid())
);

-- =====================
-- COMISSOES_REPRESENTANTES
-- =====================
CREATE POLICY "comissoes_representantes_select" ON comissoes_representantes FOR SELECT USING (
  is_admin_or_master(auth.uid()) OR has_elevated_access(auth.uid())
);

CREATE POLICY "comissoes_representantes_insert" ON comissoes_representantes FOR INSERT WITH CHECK (
  has_elevated_access(auth.uid())
);

CREATE POLICY "comissoes_representantes_update" ON comissoes_representantes FOR UPDATE USING (
  has_elevated_access(auth.uid())
);

CREATE POLICY "comissoes_representantes_delete" ON comissoes_representantes FOR DELETE USING (
  is_admin_or_master(auth.uid())
);

-- =====================
-- REGRAS_COMISSAO (Commission Rules Configuration)
-- =====================
CREATE POLICY "regras_comissao_select" ON regras_comissao FOR SELECT USING (
  is_admin_or_master(auth.uid()) 
  OR (empresa_id = get_user_empresa_id(auth.uid()) AND has_elevated_access(auth.uid()))
);

CREATE POLICY "regras_comissao_insert" ON regras_comissao FOR INSERT WITH CHECK (
  has_elevated_access(auth.uid())
);

CREATE POLICY "regras_comissao_update" ON regras_comissao FOR UPDATE USING (
  has_elevated_access(auth.uid()) AND (empresa_id = get_user_empresa_id(auth.uid()) OR is_admin_or_master(auth.uid()))
);

CREATE POLICY "regras_comissao_delete" ON regras_comissao FOR DELETE USING (
  is_admin_or_master(auth.uid())
);

-- =====================
-- FAIXAS_COMISSAO (Commission Tiers)
-- =====================
CREATE POLICY "faixas_comissao_select" ON faixas_comissao FOR SELECT USING (
  is_admin_or_master(auth.uid()) OR has_elevated_access(auth.uid())
);

CREATE POLICY "faixas_comissao_insert" ON faixas_comissao FOR INSERT WITH CHECK (
  has_elevated_access(auth.uid())
);

CREATE POLICY "faixas_comissao_update" ON faixas_comissao FOR UPDATE USING (
  has_elevated_access(auth.uid())
);

CREATE POLICY "faixas_comissao_delete" ON faixas_comissao FOR DELETE USING (
  is_admin_or_master(auth.uid())
);

-- =====================
-- CONTAS_PAGAR (Accounts Payable)
-- =====================
CREATE POLICY "contas_pagar_select" ON contas_pagar FOR SELECT USING (
  is_admin_or_master(auth.uid()) 
  OR (empresa_id = get_user_empresa_id(auth.uid()) AND has_elevated_access(auth.uid()))
);

CREATE POLICY "contas_pagar_insert" ON contas_pagar FOR INSERT WITH CHECK (
  has_elevated_access(auth.uid())
);

CREATE POLICY "contas_pagar_update" ON contas_pagar FOR UPDATE USING (
  has_elevated_access(auth.uid()) AND (empresa_id = get_user_empresa_id(auth.uid()) OR is_admin_or_master(auth.uid()))
);

CREATE POLICY "contas_pagar_delete" ON contas_pagar FOR DELETE USING (
  is_admin_or_master(auth.uid())
);

-- =====================
-- INADIMPLENCIAS (Delinquencies)
-- =====================
CREATE POLICY "inadimplencias_select" ON inadimplencias FOR SELECT USING (
  is_admin_or_master(auth.uid()) 
  OR has_elevated_access(auth.uid())
  OR has_role(auth.uid(), 'analista_inadimplencia')
);

CREATE POLICY "inadimplencias_insert" ON inadimplencias FOR INSERT WITH CHECK (
  has_elevated_access(auth.uid()) OR has_role(auth.uid(), 'analista_inadimplencia')
);

CREATE POLICY "inadimplencias_update" ON inadimplencias FOR UPDATE USING (
  has_elevated_access(auth.uid()) OR has_role(auth.uid(), 'analista_inadimplencia')
);

CREATE POLICY "inadimplencias_delete" ON inadimplencias FOR DELETE USING (
  is_admin_or_master(auth.uid())
);

-- =====================
-- AJUSTES_CONCILIACAO (Reconciliation Adjustments)
-- =====================
CREATE POLICY "ajustes_conciliacao_select" ON ajustes_conciliacao FOR SELECT USING (
  is_admin_or_master(auth.uid()) OR has_elevated_access(auth.uid())
);

CREATE POLICY "ajustes_conciliacao_insert" ON ajustes_conciliacao FOR INSERT WITH CHECK (
  has_elevated_access(auth.uid())
);

CREATE POLICY "ajustes_conciliacao_update" ON ajustes_conciliacao FOR UPDATE USING (
  has_elevated_access(auth.uid())
);

CREATE POLICY "ajustes_conciliacao_delete" ON ajustes_conciliacao FOR DELETE USING (
  is_admin_or_master(auth.uid())
);

-- =====================
-- DOCUMENTOS (Documents)
-- =====================
CREATE POLICY "documentos_select" ON documentos FOR SELECT USING (
  is_admin_or_master(auth.uid()) 
  OR has_elevated_access(auth.uid())
  OR has_role(auth.uid(), 'analista_vendas')
);

CREATE POLICY "documentos_insert" ON documentos FOR INSERT WITH CHECK (
  has_elevated_access(auth.uid()) OR has_role(auth.uid(), 'analista_vendas')
);

CREATE POLICY "documentos_update" ON documentos FOR UPDATE USING (
  has_elevated_access(auth.uid()) OR has_role(auth.uid(), 'analista_vendas')
);

CREATE POLICY "documentos_delete" ON documentos FOR DELETE USING (
  is_admin_or_master(auth.uid())
);
