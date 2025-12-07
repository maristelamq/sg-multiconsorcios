export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      administradoras: {
        Row: {
          created_at: string
          empresa_id: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          empresa_id?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          empresa_id?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "administradoras_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      ajustes_conciliacao: {
        Row: {
          created_at: string
          diferenca: number
          id: string
          observacao: string | null
          tipo: string
          updated_at: string
          valor_esperado: number | null
          valor_real: number | null
          venda_id: string
        }
        Insert: {
          created_at?: string
          diferenca: number
          id?: string
          observacao?: string | null
          tipo: string
          updated_at?: string
          valor_esperado?: number | null
          valor_real?: number | null
          venda_id: string
        }
        Update: {
          created_at?: string
          diferenca?: number
          id?: string
          observacao?: string | null
          tipo?: string
          updated_at?: string
          valor_esperado?: number | null
          valor_real?: number | null
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ajustes_conciliacao_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      clientes: {
        Row: {
          contato: string | null
          cpf_cnpj: string | null
          created_at: string
          empresa_id: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          contato?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          empresa_id?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          contato?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          empresa_id?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      comissoes_pagas: {
        Row: {
          competencia: string | null
          created_at: string
          forma_pagamento: string | null
          id: string
          observacao: string | null
          parcela: number
          status: string
          updated_at: string
          valor_pago: number
          venda_id: string
          vendedor_id: string | null
        }
        Insert: {
          competencia?: string | null
          created_at?: string
          forma_pagamento?: string | null
          id?: string
          observacao?: string | null
          parcela: number
          status?: string
          updated_at?: string
          valor_pago: number
          venda_id: string
          vendedor_id?: string | null
        }
        Update: {
          competencia?: string | null
          created_at?: string
          forma_pagamento?: string | null
          id?: string
          observacao?: string | null
          parcela?: number
          status?: string
          updated_at?: string
          valor_pago?: number
          venda_id?: string
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comissoes_pagas_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_pagas_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "vendedores"
            referencedColumns: ["id"]
          },
        ]
      }
      comissoes_receber: {
        Row: {
          base_calculo: number
          competencia_origem: string
          competencia_pagamento: string
          created_at: string
          data_liberacao: string | null
          data_pagamento: string | null
          faixa_id: string | null
          id: string
          motivo_bloqueio: string | null
          parcela: number
          percentual: number
          regra_id: string | null
          representante_id: string | null
          status: string
          tipo: string
          total_parcelas: number
          updated_at: string
          valor_pago: number | null
          valor_previsto: number
          venda_id: string
          vendedor_id: string | null
        }
        Insert: {
          base_calculo: number
          competencia_origem: string
          competencia_pagamento: string
          created_at?: string
          data_liberacao?: string | null
          data_pagamento?: string | null
          faixa_id?: string | null
          id?: string
          motivo_bloqueio?: string | null
          parcela: number
          percentual: number
          regra_id?: string | null
          representante_id?: string | null
          status?: string
          tipo?: string
          total_parcelas: number
          updated_at?: string
          valor_pago?: number | null
          valor_previsto: number
          venda_id: string
          vendedor_id?: string | null
        }
        Update: {
          base_calculo?: number
          competencia_origem?: string
          competencia_pagamento?: string
          created_at?: string
          data_liberacao?: string | null
          data_pagamento?: string | null
          faixa_id?: string | null
          id?: string
          motivo_bloqueio?: string | null
          parcela?: number
          percentual?: number
          regra_id?: string | null
          representante_id?: string | null
          status?: string
          tipo?: string
          total_parcelas?: number
          updated_at?: string
          valor_pago?: number | null
          valor_previsto?: number
          venda_id?: string
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comissoes_receber_faixa_id_fkey"
            columns: ["faixa_id"]
            isOneToOne: false
            referencedRelation: "faixas_comissao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_receber_regra_id_fkey"
            columns: ["regra_id"]
            isOneToOne: false
            referencedRelation: "regras_comissao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_receber_representante_id_fkey"
            columns: ["representante_id"]
            isOneToOne: false
            referencedRelation: "representantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_receber_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_receber_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "vendedores"
            referencedColumns: ["id"]
          },
        ]
      }
      comissoes_regras: {
        Row: {
          created_at: string
          id: string
          parcelas: number
          percentual_vendedor: number
          updated_at: string
          valor_previsto: number
          venda_id: string
          vendedor_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          parcelas?: number
          percentual_vendedor: number
          updated_at?: string
          valor_previsto: number
          venda_id: string
          vendedor_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          parcelas?: number
          percentual_vendedor?: number
          updated_at?: string
          valor_previsto?: number
          venda_id?: string
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comissoes_regras_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_regras_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "vendedores"
            referencedColumns: ["id"]
          },
        ]
      }
      comissoes_representantes: {
        Row: {
          created_at: string
          id: string
          percentual: number
          percentual_adicional: number | null
          representante_id: string
          updated_at: string
          valor: number
          venda_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          percentual: number
          percentual_adicional?: number | null
          representante_id: string
          updated_at?: string
          valor: number
          venda_id: string
        }
        Update: {
          created_at?: string
          id?: string
          percentual?: number
          percentual_adicional?: number | null
          representante_id?: string
          updated_at?: string
          valor?: number
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comissoes_representantes_representante_id_fkey"
            columns: ["representante_id"]
            isOneToOne: false
            referencedRelation: "representantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_representantes_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_pagar: {
        Row: {
          competencia: string
          created_at: string
          data_pagamento: string | null
          empresa_id: string | null
          forma_pagamento: string | null
          id: string
          observacao: string | null
          representante_id: string | null
          status: string | null
          tipo: string
          updated_at: string
          valor_pago: number | null
          valor_total: number
          vendedor_id: string | null
        }
        Insert: {
          competencia: string
          created_at?: string
          data_pagamento?: string | null
          empresa_id?: string | null
          forma_pagamento?: string | null
          id?: string
          observacao?: string | null
          representante_id?: string | null
          status?: string | null
          tipo?: string
          updated_at?: string
          valor_pago?: number | null
          valor_total?: number
          vendedor_id?: string | null
        }
        Update: {
          competencia?: string
          created_at?: string
          data_pagamento?: string | null
          empresa_id?: string | null
          forma_pagamento?: string | null
          id?: string
          observacao?: string | null
          representante_id?: string | null
          status?: string | null
          tipo?: string
          updated_at?: string
          valor_pago?: number | null
          valor_total?: number
          vendedor_id?: string | null
        }
        Relationships: []
      }
      cotas: {
        Row: {
          administradora_id: string | null
          codigo: string
          created_at: string
          empresa_id: string | null
          grupo: string
          id: string
          status: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          administradora_id?: string | null
          codigo: string
          created_at?: string
          empresa_id?: string | null
          grupo: string
          id?: string
          status?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          administradora_id?: string | null
          codigo?: string
          created_at?: string
          empresa_id?: string | null
          grupo?: string
          id?: string
          status?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cotas_administradora_id_fkey"
            columns: ["administradora_id"]
            isOneToOne: false
            referencedRelation: "administradoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          aprovado_por: string | null
          arquivo_url: string | null
          created_at: string
          data_aprovacao: string | null
          id: string
          nome_arquivo: string
          observacao: string | null
          status: string | null
          tipo: string
          updated_at: string
          venda_id: string
        }
        Insert: {
          aprovado_por?: string | null
          arquivo_url?: string | null
          created_at?: string
          data_aprovacao?: string | null
          id?: string
          nome_arquivo: string
          observacao?: string | null
          status?: string | null
          tipo: string
          updated_at?: string
          venda_id: string
        }
        Update: {
          aprovado_por?: string | null
          arquivo_url?: string | null
          created_at?: string
          data_aprovacao?: string | null
          id?: string
          nome_arquivo?: string
          observacao?: string | null
          status?: string | null
          tipo?: string
          updated_at?: string
          venda_id?: string
        }
        Relationships: []
      }
      empresas: {
        Row: {
          cnpj: string | null
          created_at: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      faixas_comissao: {
        Row: {
          created_at: string
          id: string
          meses_carencia: number | null
          ordem: number
          parcelas: number
          percentual: number
          regra_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meses_carencia?: number | null
          ordem?: number
          parcelas?: number
          percentual: number
          regra_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meses_carencia?: number | null
          ordem?: number
          parcelas?: number
          percentual?: number
          regra_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "faixas_comissao_regra_id_fkey"
            columns: ["regra_id"]
            isOneToOne: false
            referencedRelation: "regras_comissao"
            referencedColumns: ["id"]
          },
        ]
      }
      import_logs: {
        Row: {
          created_at: string
          erros: Json | null
          id: string
          linhas_rejeitadas: number
          linhas_validas: number
          nome_arquivo: string
          tipo_importacao: string
          total_divergencias: number | null
          total_linhas: number
          valor_total_recebido: number | null
          warnings: Json | null
        }
        Insert: {
          created_at?: string
          erros?: Json | null
          id?: string
          linhas_rejeitadas: number
          linhas_validas: number
          nome_arquivo: string
          tipo_importacao: string
          total_divergencias?: number | null
          total_linhas: number
          valor_total_recebido?: number | null
          warnings?: Json | null
        }
        Update: {
          created_at?: string
          erros?: Json | null
          id?: string
          linhas_rejeitadas?: number
          linhas_validas?: number
          nome_arquivo?: string
          tipo_importacao?: string
          total_divergencias?: number | null
          total_linhas?: number
          valor_total_recebido?: number | null
          warnings?: Json | null
        }
        Relationships: []
      }
      inadimplencias: {
        Row: {
          created_at: string
          data_registro: string
          dias_atraso: number | null
          id: string
          observacao: string | null
          parcela: number | null
          status: string | null
          updated_at: string
          valor: number
          venda_id: string
        }
        Insert: {
          created_at?: string
          data_registro?: string
          dias_atraso?: number | null
          id?: string
          observacao?: string | null
          parcela?: number | null
          status?: string | null
          updated_at?: string
          valor: number
          venda_id: string
        }
        Update: {
          created_at?: string
          data_registro?: string
          dias_atraso?: number | null
          id?: string
          observacao?: string | null
          parcela?: number | null
          status?: string | null
          updated_at?: string
          valor?: number
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inadimplencias_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean | null
          avatar_url: string | null
          cargo: string | null
          created_at: string
          empresa_id: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          empresa_id?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          empresa_id?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      recebimentos: {
        Row: {
          administradora_id: string | null
          conciliado: boolean | null
          cota_id: string | null
          created_at: string
          data_credito: string
          empresa_id: string | null
          id: string
          origem: string | null
          parcela: number
          updated_at: string
          valor_recebido: number
          venda_id: string
        }
        Insert: {
          administradora_id?: string | null
          conciliado?: boolean | null
          cota_id?: string | null
          created_at?: string
          data_credito: string
          empresa_id?: string | null
          id?: string
          origem?: string | null
          parcela: number
          updated_at?: string
          valor_recebido: number
          venda_id: string
        }
        Update: {
          administradora_id?: string | null
          conciliado?: boolean | null
          cota_id?: string | null
          created_at?: string
          data_credito?: string
          empresa_id?: string | null
          id?: string
          origem?: string | null
          parcela?: number
          updated_at?: string
          valor_recebido?: number
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recebimentos_administradora_id_fkey"
            columns: ["administradora_id"]
            isOneToOne: false
            referencedRelation: "administradoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recebimentos_cota_id_fkey"
            columns: ["cota_id"]
            isOneToOne: false
            referencedRelation: "cotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recebimentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recebimentos_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      regras_comissao: {
        Row: {
          administradora_id: string | null
          ativo: boolean | null
          created_at: string
          empresa_id: string | null
          grupo_filtro: string | null
          id: string
          nome: string
          tipo: string
          updated_at: string
        }
        Insert: {
          administradora_id?: string | null
          ativo?: boolean | null
          created_at?: string
          empresa_id?: string | null
          grupo_filtro?: string | null
          id?: string
          nome: string
          tipo?: string
          updated_at?: string
        }
        Update: {
          administradora_id?: string | null
          ativo?: boolean | null
          created_at?: string
          empresa_id?: string | null
          grupo_filtro?: string | null
          id?: string
          nome?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "regras_comissao_administradora_id_fkey"
            columns: ["administradora_id"]
            isOneToOne: false
            referencedRelation: "administradoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regras_comissao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      representantes: {
        Row: {
          created_at: string
          empresa_id: string | null
          id: string
          nome: string
          parcelas: number | null
          percentual: number | null
          tipo: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          empresa_id?: string | null
          id?: string
          nome: string
          parcelas?: number | null
          percentual?: number | null
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          empresa_id?: string | null
          id?: string
          nome?: string
          parcelas?: number | null
          percentual?: number | null
          tipo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "representantes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendas: {
        Row: {
          cliente_id: string | null
          cota_id: string | null
          created_at: string
          data_venda: string
          docs_status: string | null
          empresa_id: string | null
          id: string
          observacao: string | null
          representante_id: string | null
          situacao: string
          updated_at: string
          valor_credito: number
          valor_total: number
          vendedor_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          cota_id?: string | null
          created_at?: string
          data_venda: string
          docs_status?: string | null
          empresa_id?: string | null
          id?: string
          observacao?: string | null
          representante_id?: string | null
          situacao?: string
          updated_at?: string
          valor_credito: number
          valor_total: number
          vendedor_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          cota_id?: string | null
          created_at?: string
          data_venda?: string
          docs_status?: string | null
          empresa_id?: string | null
          id?: string
          observacao?: string | null
          representante_id?: string | null
          situacao?: string
          updated_at?: string
          valor_credito?: number
          valor_total?: number
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_cota_id_fkey"
            columns: ["cota_id"]
            isOneToOne: false
            referencedRelation: "cotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_representante_id_fkey"
            columns: ["representante_id"]
            isOneToOne: false
            referencedRelation: "representantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "vendedores"
            referencedColumns: ["id"]
          },
        ]
      }
      vendedores: {
        Row: {
          cpf: string | null
          created_at: string
          empresa_id: string | null
          exige_nf: boolean | null
          id: string
          nome: string
          representante_id: string | null
          updated_at: string
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          empresa_id?: string | null
          exige_nf?: boolean | null
          id?: string
          nome: string
          representante_id?: string | null
          updated_at?: string
        }
        Update: {
          cpf?: string | null
          created_at?: string
          empresa_id?: string | null
          exige_nf?: boolean | null
          id?: string
          nome?: string
          representante_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendedores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendedores_representante_id_fkey"
            columns: ["representante_id"]
            isOneToOne: false
            referencedRelation: "representantes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_empresa_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "gestor_master"
        | "gestor_empresa"
        | "analista_vendas"
        | "analista_inadimplencia"
        | "financeiro"
        | "vendedor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "gestor_master",
        "gestor_empresa",
        "analista_vendas",
        "analista_inadimplencia",
        "financeiro",
        "vendedor",
      ],
    },
  },
} as const
