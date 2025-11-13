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
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
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
      clientes: {
        Row: {
          created_at: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
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
      cotas: {
        Row: {
          administradora_id: string | null
          codigo: string
          created_at: string
          grupo: string
          id: string
          tipo: string
          updated_at: string
        }
        Insert: {
          administradora_id?: string | null
          codigo: string
          created_at?: string
          grupo: string
          id?: string
          tipo: string
          updated_at?: string
        }
        Update: {
          administradora_id?: string | null
          codigo?: string
          created_at?: string
          grupo?: string
          id?: string
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
          id: string
          observacao: string | null
          updated_at: string
          valor: number
          venda_id: string
        }
        Insert: {
          created_at?: string
          data_registro?: string
          id?: string
          observacao?: string | null
          updated_at?: string
          valor: number
          venda_id: string
        }
        Update: {
          created_at?: string
          data_registro?: string
          id?: string
          observacao?: string | null
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
      recebimentos: {
        Row: {
          created_at: string
          data_credito: string
          id: string
          parcela: number
          updated_at: string
          valor_recebido: number
          venda_id: string
        }
        Insert: {
          created_at?: string
          data_credito: string
          id?: string
          parcela: number
          updated_at?: string
          valor_recebido: number
          venda_id: string
        }
        Update: {
          created_at?: string
          data_credito?: string
          id?: string
          parcela?: number
          updated_at?: string
          valor_recebido?: number
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recebimentos_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      representantes: {
        Row: {
          created_at: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      vendas: {
        Row: {
          cliente_id: string | null
          cota_id: string | null
          created_at: string
          data_venda: string
          id: string
          observacao: string | null
          representante_id: string | null
          situacao: string
          updated_at: string
          valor_credito: number
          valor_total: number
        }
        Insert: {
          cliente_id?: string | null
          cota_id?: string | null
          created_at?: string
          data_venda: string
          id?: string
          observacao?: string | null
          representante_id?: string | null
          situacao?: string
          updated_at?: string
          valor_credito: number
          valor_total: number
        }
        Update: {
          cliente_id?: string | null
          cota_id?: string | null
          created_at?: string
          data_venda?: string
          id?: string
          observacao?: string | null
          representante_id?: string | null
          situacao?: string
          updated_at?: string
          valor_credito?: number
          valor_total?: number
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
            foreignKeyName: "vendas_representante_id_fkey"
            columns: ["representante_id"]
            isOneToOne: false
            referencedRelation: "representantes"
            referencedColumns: ["id"]
          },
        ]
      }
      vendedores: {
        Row: {
          created_at: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
