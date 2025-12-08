CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'gestor_master',
    'gestor_empresa',
    'analista_vendas',
    'analista_inadimplencia',
    'financeiro',
    'vendedor'
);


--
-- Name: get_user_empresa_id(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_empresa_id(_user_id uuid) RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT empresa_id FROM public.profiles WHERE user_id = _user_id
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.email));
  
  -- Assign default 'vendedor' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'vendedor');
  
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: administradoras; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.administradoras (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    empresa_id uuid
);


--
-- Name: ajustes_conciliacao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ajustes_conciliacao (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    venda_id uuid NOT NULL,
    tipo text NOT NULL,
    valor_esperado numeric(15,2),
    valor_real numeric(15,2),
    diferenca numeric(15,2) NOT NULL,
    observacao text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    user_email text,
    action text NOT NULL,
    table_name text NOT NULL,
    record_id uuid,
    old_data jsonb,
    new_data jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: clientes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clientes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    empresa_id uuid,
    cpf_cnpj text,
    contato text
);


--
-- Name: comissoes_pagas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comissoes_pagas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    venda_id uuid NOT NULL,
    vendedor_id uuid,
    parcela integer NOT NULL,
    valor_pago numeric(15,2) NOT NULL,
    status text DEFAULT 'PAGO'::text NOT NULL,
    competencia text,
    forma_pagamento text,
    observacao text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: comissoes_receber; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comissoes_receber (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    venda_id uuid NOT NULL,
    vendedor_id uuid,
    representante_id uuid,
    regra_id uuid,
    faixa_id uuid,
    parcela integer NOT NULL,
    total_parcelas integer NOT NULL,
    base_calculo numeric NOT NULL,
    percentual numeric NOT NULL,
    valor_previsto numeric NOT NULL,
    competencia_origem text NOT NULL,
    competencia_pagamento text NOT NULL,
    tipo text DEFAULT 'VENDEDOR'::text NOT NULL,
    status text DEFAULT 'PENDENTE'::text NOT NULL,
    motivo_bloqueio text,
    data_liberacao timestamp with time zone,
    data_pagamento timestamp with time zone,
    valor_pago numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: comissoes_regras; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comissoes_regras (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    venda_id uuid NOT NULL,
    vendedor_id uuid,
    percentual_vendedor numeric(5,2) NOT NULL,
    parcelas integer DEFAULT 1 NOT NULL,
    valor_previsto numeric(15,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: comissoes_representantes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comissoes_representantes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    venda_id uuid NOT NULL,
    representante_id uuid NOT NULL,
    percentual numeric(5,2) NOT NULL,
    percentual_adicional numeric(5,2),
    valor numeric(15,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: contas_pagar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contas_pagar (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    empresa_id uuid,
    vendedor_id uuid,
    representante_id uuid,
    competencia text NOT NULL,
    tipo text DEFAULT 'VENDEDOR'::text NOT NULL,
    valor_total numeric DEFAULT 0 NOT NULL,
    valor_pago numeric DEFAULT 0,
    status text DEFAULT 'PENDENTE'::text,
    data_pagamento timestamp with time zone,
    forma_pagamento text,
    observacao text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: cotas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cotas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tipo text NOT NULL,
    grupo text NOT NULL,
    codigo text NOT NULL,
    administradora_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    empresa_id uuid,
    status text DEFAULT 'ATIVO'::text
);


--
-- Name: documentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documentos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    venda_id uuid NOT NULL,
    tipo text NOT NULL,
    nome_arquivo text NOT NULL,
    arquivo_url text,
    status text DEFAULT 'PENDENTE'::text,
    observacao text,
    aprovado_por text,
    data_aprovacao timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: empresas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.empresas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    cnpj text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: faixas_comissao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.faixas_comissao (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    regra_id uuid NOT NULL,
    ordem integer DEFAULT 1 NOT NULL,
    percentual numeric NOT NULL,
    parcelas integer DEFAULT 1 NOT NULL,
    meses_carencia integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: import_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.import_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tipo_importacao text NOT NULL,
    nome_arquivo text NOT NULL,
    total_linhas integer NOT NULL,
    linhas_validas integer NOT NULL,
    linhas_rejeitadas integer NOT NULL,
    valor_total_recebido numeric(15,2),
    total_divergencias integer DEFAULT 0,
    erros jsonb,
    warnings jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: inadimplencias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inadimplencias (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    venda_id uuid NOT NULL,
    valor numeric(15,2) NOT NULL,
    data_registro date DEFAULT CURRENT_DATE NOT NULL,
    observacao text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    parcela integer,
    dias_atraso integer DEFAULT 0,
    status text DEFAULT 'ABERTO'::text
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    nome text NOT NULL,
    cargo text,
    empresa_id uuid,
    telefone text,
    avatar_url text,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: recebimentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recebimentos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    venda_id uuid NOT NULL,
    parcela integer NOT NULL,
    valor_recebido numeric(15,2) NOT NULL,
    data_credito date NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    empresa_id uuid,
    administradora_id uuid,
    cota_id uuid,
    origem text DEFAULT 'IMPORTACAO'::text,
    conciliado boolean DEFAULT false
);


--
-- Name: regras_comissao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.regras_comissao (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    empresa_id uuid,
    administradora_id uuid,
    nome text NOT NULL,
    tipo text DEFAULT 'VENDEDOR'::text NOT NULL,
    grupo_filtro text,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: representantes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.representantes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    empresa_id uuid,
    tipo text DEFAULT 'INTERNO'::text,
    percentual numeric DEFAULT 0,
    parcelas integer DEFAULT 1
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vendas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    data_venda date NOT NULL,
    cota_id uuid,
    cliente_id uuid,
    representante_id uuid,
    valor_credito numeric(15,2) NOT NULL,
    valor_total numeric(15,2) NOT NULL,
    situacao text DEFAULT 'ATIVO'::text NOT NULL,
    observacao text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    empresa_id uuid,
    vendedor_id uuid,
    docs_status text DEFAULT 'PENDENTE'::text
);


--
-- Name: vendedores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendedores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    empresa_id uuid,
    representante_id uuid,
    cpf text,
    exige_nf boolean DEFAULT true
);


--
-- Name: administradoras administradoras_nome_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.administradoras
    ADD CONSTRAINT administradoras_nome_key UNIQUE (nome);


--
-- Name: administradoras administradoras_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.administradoras
    ADD CONSTRAINT administradoras_pkey PRIMARY KEY (id);


--
-- Name: ajustes_conciliacao ajustes_conciliacao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ajustes_conciliacao
    ADD CONSTRAINT ajustes_conciliacao_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);


--
-- Name: comissoes_pagas comissoes_pagas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comissoes_pagas
    ADD CONSTRAINT comissoes_pagas_pkey PRIMARY KEY (id);


--
-- Name: comissoes_receber comissoes_receber_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comissoes_receber
    ADD CONSTRAINT comissoes_receber_pkey PRIMARY KEY (id);


--
-- Name: comissoes_regras comissoes_regras_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comissoes_regras
    ADD CONSTRAINT comissoes_regras_pkey PRIMARY KEY (id);


--
-- Name: comissoes_representantes comissoes_representantes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comissoes_representantes
    ADD CONSTRAINT comissoes_representantes_pkey PRIMARY KEY (id);


--
-- Name: contas_pagar contas_pagar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contas_pagar
    ADD CONSTRAINT contas_pagar_pkey PRIMARY KEY (id);


--
-- Name: cotas cotas_grupo_codigo_administradora_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cotas
    ADD CONSTRAINT cotas_grupo_codigo_administradora_id_key UNIQUE (grupo, codigo, administradora_id);


--
-- Name: cotas cotas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cotas
    ADD CONSTRAINT cotas_pkey PRIMARY KEY (id);


--
-- Name: documentos documentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos
    ADD CONSTRAINT documentos_pkey PRIMARY KEY (id);


--
-- Name: empresas empresas_cnpj_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresas
    ADD CONSTRAINT empresas_cnpj_key UNIQUE (cnpj);


--
-- Name: empresas empresas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresas
    ADD CONSTRAINT empresas_pkey PRIMARY KEY (id);


--
-- Name: faixas_comissao faixas_comissao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faixas_comissao
    ADD CONSTRAINT faixas_comissao_pkey PRIMARY KEY (id);


--
-- Name: import_logs import_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_logs
    ADD CONSTRAINT import_logs_pkey PRIMARY KEY (id);


--
-- Name: inadimplencias inadimplencias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inadimplencias
    ADD CONSTRAINT inadimplencias_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: recebimentos recebimentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recebimentos
    ADD CONSTRAINT recebimentos_pkey PRIMARY KEY (id);


--
-- Name: regras_comissao regras_comissao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regras_comissao
    ADD CONSTRAINT regras_comissao_pkey PRIMARY KEY (id);


--
-- Name: representantes representantes_nome_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.representantes
    ADD CONSTRAINT representantes_nome_key UNIQUE (nome);


--
-- Name: representantes representantes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.representantes
    ADD CONSTRAINT representantes_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: vendas vendas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendas
    ADD CONSTRAINT vendas_pkey PRIMARY KEY (id);


--
-- Name: vendedores vendedores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendedores
    ADD CONSTRAINT vendedores_pkey PRIMARY KEY (id);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);


--
-- Name: idx_audit_logs_table_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_table_name ON public.audit_logs USING btree (table_name);


--
-- Name: idx_audit_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: idx_comissoes_receber_competencia; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comissoes_receber_competencia ON public.comissoes_receber USING btree (competencia_pagamento);


--
-- Name: idx_comissoes_receber_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comissoes_receber_status ON public.comissoes_receber USING btree (status);


--
-- Name: idx_comissoes_receber_venda; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comissoes_receber_venda ON public.comissoes_receber USING btree (venda_id);


--
-- Name: idx_comissoes_receber_vendedor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comissoes_receber_vendedor ON public.comissoes_receber USING btree (vendedor_id);


--
-- Name: idx_faixas_regra; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_faixas_regra ON public.faixas_comissao USING btree (regra_id);


--
-- Name: idx_profiles_empresa_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_empresa_id ON public.profiles USING btree (empresa_id);


--
-- Name: idx_profiles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_user_id ON public.profiles USING btree (user_id);


--
-- Name: idx_user_roles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);


--
-- Name: administradoras update_administradoras_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_administradoras_updated_at BEFORE UPDATE ON public.administradoras FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ajustes_conciliacao update_ajustes_conciliacao_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ajustes_conciliacao_updated_at BEFORE UPDATE ON public.ajustes_conciliacao FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: clientes update_clientes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: comissoes_pagas update_comissoes_pagas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_comissoes_pagas_updated_at BEFORE UPDATE ON public.comissoes_pagas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: comissoes_receber update_comissoes_receber_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_comissoes_receber_updated_at BEFORE UPDATE ON public.comissoes_receber FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: comissoes_regras update_comissoes_regras_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_comissoes_regras_updated_at BEFORE UPDATE ON public.comissoes_regras FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: comissoes_representantes update_comissoes_representantes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_comissoes_representantes_updated_at BEFORE UPDATE ON public.comissoes_representantes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: contas_pagar update_contas_pagar_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_contas_pagar_updated_at BEFORE UPDATE ON public.contas_pagar FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: cotas update_cotas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cotas_updated_at BEFORE UPDATE ON public.cotas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: documentos update_documentos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_documentos_updated_at BEFORE UPDATE ON public.documentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: empresas update_empresas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON public.empresas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: inadimplencias update_inadimplencias_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_inadimplencias_updated_at BEFORE UPDATE ON public.inadimplencias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: recebimentos update_recebimentos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_recebimentos_updated_at BEFORE UPDATE ON public.recebimentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: regras_comissao update_regras_comissao_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_regras_comissao_updated_at BEFORE UPDATE ON public.regras_comissao FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: representantes update_representantes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_representantes_updated_at BEFORE UPDATE ON public.representantes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: vendas update_vendas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_vendas_updated_at BEFORE UPDATE ON public.vendas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: vendedores update_vendedores_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_vendedores_updated_at BEFORE UPDATE ON public.vendedores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: administradoras administradoras_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.administradoras
    ADD CONSTRAINT administradoras_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: ajustes_conciliacao ajustes_conciliacao_venda_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ajustes_conciliacao
    ADD CONSTRAINT ajustes_conciliacao_venda_id_fkey FOREIGN KEY (venda_id) REFERENCES public.vendas(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: clientes clientes_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: comissoes_pagas comissoes_pagas_venda_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comissoes_pagas
    ADD CONSTRAINT comissoes_pagas_venda_id_fkey FOREIGN KEY (venda_id) REFERENCES public.vendas(id) ON DELETE CASCADE;


--
-- Name: comissoes_pagas comissoes_pagas_vendedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comissoes_pagas
    ADD CONSTRAINT comissoes_pagas_vendedor_id_fkey FOREIGN KEY (vendedor_id) REFERENCES public.vendedores(id);


--
-- Name: comissoes_receber comissoes_receber_faixa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comissoes_receber
    ADD CONSTRAINT comissoes_receber_faixa_id_fkey FOREIGN KEY (faixa_id) REFERENCES public.faixas_comissao(id);


--
-- Name: comissoes_receber comissoes_receber_regra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comissoes_receber
    ADD CONSTRAINT comissoes_receber_regra_id_fkey FOREIGN KEY (regra_id) REFERENCES public.regras_comissao(id);


--
-- Name: comissoes_receber comissoes_receber_representante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comissoes_receber
    ADD CONSTRAINT comissoes_receber_representante_id_fkey FOREIGN KEY (representante_id) REFERENCES public.representantes(id);


--
-- Name: comissoes_receber comissoes_receber_venda_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comissoes_receber
    ADD CONSTRAINT comissoes_receber_venda_id_fkey FOREIGN KEY (venda_id) REFERENCES public.vendas(id) ON DELETE CASCADE;


--
-- Name: comissoes_receber comissoes_receber_vendedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comissoes_receber
    ADD CONSTRAINT comissoes_receber_vendedor_id_fkey FOREIGN KEY (vendedor_id) REFERENCES public.vendedores(id);


--
-- Name: comissoes_regras comissoes_regras_venda_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comissoes_regras
    ADD CONSTRAINT comissoes_regras_venda_id_fkey FOREIGN KEY (venda_id) REFERENCES public.vendas(id) ON DELETE CASCADE;


--
-- Name: comissoes_regras comissoes_regras_vendedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comissoes_regras
    ADD CONSTRAINT comissoes_regras_vendedor_id_fkey FOREIGN KEY (vendedor_id) REFERENCES public.vendedores(id);


--
-- Name: comissoes_representantes comissoes_representantes_representante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comissoes_representantes
    ADD CONSTRAINT comissoes_representantes_representante_id_fkey FOREIGN KEY (representante_id) REFERENCES public.representantes(id);


--
-- Name: comissoes_representantes comissoes_representantes_venda_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comissoes_representantes
    ADD CONSTRAINT comissoes_representantes_venda_id_fkey FOREIGN KEY (venda_id) REFERENCES public.vendas(id) ON DELETE CASCADE;


--
-- Name: cotas cotas_administradora_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cotas
    ADD CONSTRAINT cotas_administradora_id_fkey FOREIGN KEY (administradora_id) REFERENCES public.administradoras(id);


--
-- Name: cotas cotas_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cotas
    ADD CONSTRAINT cotas_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: faixas_comissao faixas_comissao_regra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faixas_comissao
    ADD CONSTRAINT faixas_comissao_regra_id_fkey FOREIGN KEY (regra_id) REFERENCES public.regras_comissao(id) ON DELETE CASCADE;


--
-- Name: inadimplencias inadimplencias_venda_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inadimplencias
    ADD CONSTRAINT inadimplencias_venda_id_fkey FOREIGN KEY (venda_id) REFERENCES public.vendas(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE SET NULL;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: recebimentos recebimentos_administradora_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recebimentos
    ADD CONSTRAINT recebimentos_administradora_id_fkey FOREIGN KEY (administradora_id) REFERENCES public.administradoras(id);


--
-- Name: recebimentos recebimentos_cota_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recebimentos
    ADD CONSTRAINT recebimentos_cota_id_fkey FOREIGN KEY (cota_id) REFERENCES public.cotas(id);


--
-- Name: recebimentos recebimentos_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recebimentos
    ADD CONSTRAINT recebimentos_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: recebimentos recebimentos_venda_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recebimentos
    ADD CONSTRAINT recebimentos_venda_id_fkey FOREIGN KEY (venda_id) REFERENCES public.vendas(id) ON DELETE CASCADE;


--
-- Name: regras_comissao regras_comissao_administradora_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regras_comissao
    ADD CONSTRAINT regras_comissao_administradora_id_fkey FOREIGN KEY (administradora_id) REFERENCES public.administradoras(id);


--
-- Name: regras_comissao regras_comissao_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regras_comissao
    ADD CONSTRAINT regras_comissao_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: representantes representantes_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.representantes
    ADD CONSTRAINT representantes_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: vendas vendas_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendas
    ADD CONSTRAINT vendas_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);


--
-- Name: vendas vendas_cota_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendas
    ADD CONSTRAINT vendas_cota_id_fkey FOREIGN KEY (cota_id) REFERENCES public.cotas(id);


--
-- Name: vendas vendas_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendas
    ADD CONSTRAINT vendas_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: vendas vendas_representante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendas
    ADD CONSTRAINT vendas_representante_id_fkey FOREIGN KEY (representante_id) REFERENCES public.representantes(id);


--
-- Name: vendas vendas_vendedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendas
    ADD CONSTRAINT vendas_vendedor_id_fkey FOREIGN KEY (vendedor_id) REFERENCES public.vendedores(id);


--
-- Name: vendedores vendedores_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendedores
    ADD CONSTRAINT vendedores_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: vendedores vendedores_representante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendedores
    ADD CONSTRAINT vendedores_representante_id_fkey FOREIGN KEY (representante_id) REFERENCES public.representantes(id);


--
-- Name: profiles Admins can manage all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all profiles" ON public.profiles USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can manage roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage roles" ON public.user_roles USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: audit_logs Admins can view audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: comissoes_receber Allow all on comissoes_receber; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all on comissoes_receber" ON public.comissoes_receber USING (true) WITH CHECK (true);


--
-- Name: contas_pagar Allow all on contas_pagar; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all on contas_pagar" ON public.contas_pagar USING (true) WITH CHECK (true);


--
-- Name: documentos Allow all on documentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all on documentos" ON public.documentos USING (true) WITH CHECK (true);


--
-- Name: faixas_comissao Allow all on faixas_comissao; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all on faixas_comissao" ON public.faixas_comissao USING (true) WITH CHECK (true);


--
-- Name: regras_comissao Allow all on regras_comissao; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all on regras_comissao" ON public.regras_comissao USING (true) WITH CHECK (true);


--
-- Name: administradoras Allow public delete on administradoras; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete on administradoras" ON public.administradoras FOR DELETE USING (true);


--
-- Name: ajustes_conciliacao Allow public delete on ajustes_conciliacao; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete on ajustes_conciliacao" ON public.ajustes_conciliacao FOR DELETE USING (true);


--
-- Name: clientes Allow public delete on clientes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete on clientes" ON public.clientes FOR DELETE USING (true);


--
-- Name: comissoes_pagas Allow public delete on comissoes_pagas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete on comissoes_pagas" ON public.comissoes_pagas FOR DELETE USING (true);


--
-- Name: comissoes_regras Allow public delete on comissoes_regras; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete on comissoes_regras" ON public.comissoes_regras FOR DELETE USING (true);


--
-- Name: comissoes_representantes Allow public delete on comissoes_representantes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete on comissoes_representantes" ON public.comissoes_representantes FOR DELETE USING (true);


--
-- Name: cotas Allow public delete on cotas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete on cotas" ON public.cotas FOR DELETE USING (true);


--
-- Name: empresas Allow public delete on empresas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete on empresas" ON public.empresas FOR DELETE USING (true);


--
-- Name: inadimplencias Allow public delete on inadimplencias; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete on inadimplencias" ON public.inadimplencias FOR DELETE USING (true);


--
-- Name: recebimentos Allow public delete on recebimentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete on recebimentos" ON public.recebimentos FOR DELETE USING (true);


--
-- Name: representantes Allow public delete on representantes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete on representantes" ON public.representantes FOR DELETE USING (true);


--
-- Name: vendas Allow public delete on vendas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete on vendas" ON public.vendas FOR DELETE USING (true);


--
-- Name: vendedores Allow public delete on vendedores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete on vendedores" ON public.vendedores FOR DELETE USING (true);


--
-- Name: administradoras Allow public insert on administradoras; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on administradoras" ON public.administradoras FOR INSERT WITH CHECK (true);


--
-- Name: ajustes_conciliacao Allow public insert on ajustes_conciliacao; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on ajustes_conciliacao" ON public.ajustes_conciliacao FOR INSERT WITH CHECK (true);


--
-- Name: clientes Allow public insert on clientes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on clientes" ON public.clientes FOR INSERT WITH CHECK (true);


--
-- Name: comissoes_pagas Allow public insert on comissoes_pagas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on comissoes_pagas" ON public.comissoes_pagas FOR INSERT WITH CHECK (true);


--
-- Name: comissoes_regras Allow public insert on comissoes_regras; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on comissoes_regras" ON public.comissoes_regras FOR INSERT WITH CHECK (true);


--
-- Name: comissoes_representantes Allow public insert on comissoes_representantes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on comissoes_representantes" ON public.comissoes_representantes FOR INSERT WITH CHECK (true);


--
-- Name: cotas Allow public insert on cotas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on cotas" ON public.cotas FOR INSERT WITH CHECK (true);


--
-- Name: empresas Allow public insert on empresas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on empresas" ON public.empresas FOR INSERT WITH CHECK (true);


--
-- Name: import_logs Allow public insert on import_logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on import_logs" ON public.import_logs FOR INSERT WITH CHECK (true);


--
-- Name: inadimplencias Allow public insert on inadimplencias; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on inadimplencias" ON public.inadimplencias FOR INSERT WITH CHECK (true);


--
-- Name: recebimentos Allow public insert on recebimentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on recebimentos" ON public.recebimentos FOR INSERT WITH CHECK (true);


--
-- Name: representantes Allow public insert on representantes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on representantes" ON public.representantes FOR INSERT WITH CHECK (true);


--
-- Name: vendas Allow public insert on vendas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on vendas" ON public.vendas FOR INSERT WITH CHECK (true);


--
-- Name: vendedores Allow public insert on vendedores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on vendedores" ON public.vendedores FOR INSERT WITH CHECK (true);


--
-- Name: administradoras Allow public read access on administradoras; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access on administradoras" ON public.administradoras FOR SELECT USING (true);


--
-- Name: ajustes_conciliacao Allow public read access on ajustes_conciliacao; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access on ajustes_conciliacao" ON public.ajustes_conciliacao FOR SELECT USING (true);


--
-- Name: clientes Allow public read access on clientes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access on clientes" ON public.clientes FOR SELECT USING (true);


--
-- Name: comissoes_pagas Allow public read access on comissoes_pagas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access on comissoes_pagas" ON public.comissoes_pagas FOR SELECT USING (true);


--
-- Name: comissoes_regras Allow public read access on comissoes_regras; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access on comissoes_regras" ON public.comissoes_regras FOR SELECT USING (true);


--
-- Name: comissoes_representantes Allow public read access on comissoes_representantes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access on comissoes_representantes" ON public.comissoes_representantes FOR SELECT USING (true);


--
-- Name: cotas Allow public read access on cotas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access on cotas" ON public.cotas FOR SELECT USING (true);


--
-- Name: import_logs Allow public read access on import_logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access on import_logs" ON public.import_logs FOR SELECT USING (true);


--
-- Name: inadimplencias Allow public read access on inadimplencias; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access on inadimplencias" ON public.inadimplencias FOR SELECT USING (true);


--
-- Name: recebimentos Allow public read access on recebimentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access on recebimentos" ON public.recebimentos FOR SELECT USING (true);


--
-- Name: representantes Allow public read access on representantes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access on representantes" ON public.representantes FOR SELECT USING (true);


--
-- Name: vendas Allow public read access on vendas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access on vendas" ON public.vendas FOR SELECT USING (true);


--
-- Name: vendedores Allow public read access on vendedores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access on vendedores" ON public.vendedores FOR SELECT USING (true);


--
-- Name: empresas Allow public read on empresas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read on empresas" ON public.empresas FOR SELECT USING (true);


--
-- Name: administradoras Allow public update on administradoras; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on administradoras" ON public.administradoras FOR UPDATE USING (true);


--
-- Name: ajustes_conciliacao Allow public update on ajustes_conciliacao; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on ajustes_conciliacao" ON public.ajustes_conciliacao FOR UPDATE USING (true);


--
-- Name: clientes Allow public update on clientes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on clientes" ON public.clientes FOR UPDATE USING (true);


--
-- Name: comissoes_pagas Allow public update on comissoes_pagas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on comissoes_pagas" ON public.comissoes_pagas FOR UPDATE USING (true);


--
-- Name: comissoes_regras Allow public update on comissoes_regras; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on comissoes_regras" ON public.comissoes_regras FOR UPDATE USING (true);


--
-- Name: comissoes_representantes Allow public update on comissoes_representantes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on comissoes_representantes" ON public.comissoes_representantes FOR UPDATE USING (true);


--
-- Name: cotas Allow public update on cotas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on cotas" ON public.cotas FOR UPDATE USING (true);


--
-- Name: empresas Allow public update on empresas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on empresas" ON public.empresas FOR UPDATE USING (true);


--
-- Name: inadimplencias Allow public update on inadimplencias; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on inadimplencias" ON public.inadimplencias FOR UPDATE USING (true);


--
-- Name: recebimentos Allow public update on recebimentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on recebimentos" ON public.recebimentos FOR UPDATE USING (true);


--
-- Name: representantes Allow public update on representantes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on representantes" ON public.representantes FOR UPDATE USING (true);


--
-- Name: vendas Allow public update on vendas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on vendas" ON public.vendas FOR UPDATE USING (true);


--
-- Name: vendedores Allow public update on vendedores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on vendedores" ON public.vendedores FOR UPDATE USING (true);


--
-- Name: audit_logs System can insert audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: administradoras; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.administradoras ENABLE ROW LEVEL SECURITY;

--
-- Name: ajustes_conciliacao; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ajustes_conciliacao ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: clientes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

--
-- Name: comissoes_pagas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.comissoes_pagas ENABLE ROW LEVEL SECURITY;

--
-- Name: comissoes_receber; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.comissoes_receber ENABLE ROW LEVEL SECURITY;

--
-- Name: comissoes_regras; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.comissoes_regras ENABLE ROW LEVEL SECURITY;

--
-- Name: comissoes_representantes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.comissoes_representantes ENABLE ROW LEVEL SECURITY;

--
-- Name: contas_pagar; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;

--
-- Name: cotas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cotas ENABLE ROW LEVEL SECURITY;

--
-- Name: documentos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

--
-- Name: empresas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

--
-- Name: faixas_comissao; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.faixas_comissao ENABLE ROW LEVEL SECURITY;

--
-- Name: import_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: inadimplencias; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inadimplencias ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: recebimentos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.recebimentos ENABLE ROW LEVEL SECURITY;

--
-- Name: regras_comissao; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.regras_comissao ENABLE ROW LEVEL SECURITY;

--
-- Name: representantes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.representantes ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: vendas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;

--
-- Name: vendedores; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vendedores ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


