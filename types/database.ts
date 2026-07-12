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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          id: number
          is_active: number
          is_primary: number
          name: string
          opening_balance: number
          type: string
          vault_id: number
        }
        Insert: {
          id?: number
          is_active?: number
          is_primary?: number
          name: string
          opening_balance?: number
          type: string
          vault_id: number
        }
        Update: {
          id?: number
          is_active?: number
          is_primary?: number
          name?: string
          opening_balance?: number
          type?: string
          vault_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "accounts_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          category_type: string
          emoji: string
          id: number
          is_active: number
          is_system: number
          name: string
          parent_category: string | null
          vault_id: number | null
        }
        Insert: {
          category_type: string
          emoji: string
          id?: number
          is_active?: number
          is_system?: number
          name: string
          parent_category?: string | null
          vault_id?: number | null
        }
        Update: {
          category_type?: string
          emoji?: string
          id?: number
          is_active?: number
          is_system?: number
          name?: string
          parent_category?: string | null
          vault_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      commitments: {
        Row: {
          account_id: number
          amount: number
          due_day: number
          id: number
          is_active: number
          name: string
          vault_id: number
        }
        Insert: {
          account_id: number
          amount: number
          due_day: number
          id?: number
          is_active?: number
          name: string
          vault_id: number
        }
        Update: {
          account_id?: number
          amount?: number
          due_day?: number
          id?: number
          is_active?: number
          name?: string
          vault_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "commitments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commitments_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      cycle_contributions: {
        Row: {
          created_at: string | null
          cycle_id: number
          id: number
          income: number
          income_ratio: number
          participant_vault_id: number
        }
        Insert: {
          created_at?: string | null
          cycle_id: number
          id?: number
          income?: number
          income_ratio?: number
          participant_vault_id: number
        }
        Update: {
          created_at?: string | null
          cycle_id?: number
          id?: number
          income?: number
          income_ratio?: number
          participant_vault_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "cycle_contributions_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "financial_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cycle_contributions_participant_vault_id_fkey"
            columns: ["participant_vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_cycles: {
        Row: {
          closed_at: string | null
          created_at: string | null
          end_date: string
          id: number
          start_date: string
          vault_id: number
        }
        Insert: {
          closed_at?: string | null
          created_at?: string | null
          end_date: string
          id?: number
          start_date: string
          vault_id: number
        }
        Update: {
          closed_at?: string | null
          created_at?: string | null
          end_date?: string
          id?: number
          start_date?: string
          vault_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "financial_cycles_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      income_status: {
        Row: {
          actual_amount: number | null
          id: number
          income_template_id: number
          month: number
          notes: string | null
          status: string | null
          transaction_id: number | null
          year: number
        }
        Insert: {
          actual_amount?: number | null
          id?: number
          income_template_id: number
          month: number
          notes?: string | null
          status?: string | null
          transaction_id?: number | null
          year: number
        }
        Update: {
          actual_amount?: number | null
          id?: number
          income_template_id?: number
          month?: number
          notes?: string | null
          status?: string | null
          transaction_id?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "income_status_income_template_id_fkey"
            columns: ["income_template_id"]
            isOneToOne: false
            referencedRelation: "income_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      income_templates: {
        Row: {
          account_id: number
          amount: number
          due_day: number
          id: number
          is_active: number
          name: string
          vault_id: number
        }
        Insert: {
          account_id: number
          amount: number
          due_day: number
          id?: number
          is_active?: number
          name: string
          vault_id: number
        }
        Update: {
          account_id?: number
          amount?: number
          due_day?: number
          id?: number
          is_active?: number
          name?: string
          vault_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "income_templates_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_templates_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_cycles: {
        Row: {
          created_at: string | null
          id: number
          month: number
          status: string
          vault_id: number
          year: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          month: number
          status: string
          vault_id: number
          year: number
        }
        Update: {
          created_at?: string | null
          id?: number
          month?: number
          status?: string
          vault_id?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_cycles_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      obligation_status: {
        Row: {
          actual_amount: number | null
          commitment_id: number
          id: number
          month: number
          notes: string | null
          status: string | null
          transaction_id: number | null
          year: number
        }
        Insert: {
          actual_amount?: number | null
          commitment_id: number
          id?: number
          month: number
          notes?: string | null
          status?: string | null
          transaction_id?: number | null
          year: number
        }
        Update: {
          actual_amount?: number | null
          commitment_id?: number
          id?: number
          month?: number
          notes?: string | null
          status?: string | null
          transaction_id?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "obligation_status_commitment_id_fkey"
            columns: ["commitment_id"]
            isOneToOne: false
            referencedRelation: "commitments"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_bill_cycles: {
        Row: {
          closed_at: string | null
          created_at: string | null
          id: number
          month: number
          paid_amount: number
          remaining_amount: number
          shared_vault_id: number
          status: string
          total_amount: number
          year: number
        }
        Insert: {
          closed_at?: string | null
          created_at?: string | null
          id?: number
          month: number
          paid_amount?: number
          remaining_amount?: number
          shared_vault_id: number
          status?: string
          total_amount?: number
          year: number
        }
        Update: {
          closed_at?: string | null
          created_at?: string | null
          id?: number
          month?: number
          paid_amount?: number
          remaining_amount?: number
          shared_vault_id?: number
          status?: string
          total_amount?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "shared_bill_cycles_shared_vault_id_fkey"
            columns: ["shared_vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_bill_instance_shares: {
        Row: {
          bill_instance_id: number
          created_at: string | null
          expected_amount: number
          expected_percentage: number
          id: number
          participant_vault_id: number
        }
        Insert: {
          bill_instance_id: number
          created_at?: string | null
          expected_amount: number
          expected_percentage: number
          id?: number
          participant_vault_id: number
        }
        Update: {
          bill_instance_id?: number
          created_at?: string | null
          expected_amount?: number
          expected_percentage?: number
          id?: number
          participant_vault_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "shared_bill_instance_shares_bill_instance_id_fkey"
            columns: ["bill_instance_id"]
            isOneToOne: false
            referencedRelation: "shared_bill_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_bill_instance_shares_participant_vault_id_fkey"
            columns: ["participant_vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_bill_instances: {
        Row: {
          amount: number
          bill_id: number
          category_id: number | null
          created_at: string | null
          cycle_id: number
          due_date: string
          frequency: string
          id: number
          name: string
          payer_vault_id: number | null
          payment_date: string | null
          payment_notes: string | null
          status: string
          transaction_id: number | null
        }
        Insert: {
          amount: number
          bill_id: number
          category_id?: number | null
          created_at?: string | null
          cycle_id: number
          due_date: string
          frequency: string
          id?: number
          name: string
          payer_vault_id?: number | null
          payment_date?: string | null
          payment_notes?: string | null
          status?: string
          transaction_id?: number | null
        }
        Update: {
          amount?: number
          bill_id?: number
          category_id?: number | null
          created_at?: string | null
          cycle_id?: number
          due_date?: string
          frequency?: string
          id?: number
          name?: string
          payer_vault_id?: number | null
          payment_date?: string | null
          payment_notes?: string | null
          status?: string
          transaction_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_bill_instances_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "shared_bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_bill_instances_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_bill_instances_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "shared_bill_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_bill_instances_payer_vault_id_fkey"
            columns: ["payer_vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_bill_instances_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_bills: {
        Row: {
          amount: number
          category_id: number | null
          created_at: string | null
          due_day: number
          end_date: string | null
          frequency: string
          id: number
          is_active: number
          name: string
          notes: string | null
          shared_vault_id: number
          start_date: string | null
        }
        Insert: {
          amount: number
          category_id?: number | null
          created_at?: string | null
          due_day: number
          end_date?: string | null
          frequency?: string
          id?: number
          is_active?: number
          name: string
          notes?: string | null
          shared_vault_id: number
          start_date?: string | null
        }
        Update: {
          amount?: number
          category_id?: number | null
          created_at?: string | null
          due_day?: number
          end_date?: string | null
          frequency?: string
          id?: number
          is_active?: number
          name?: string
          notes?: string | null
          shared_vault_id?: number
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_bills_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_bills_shared_vault_id_fkey"
            columns: ["shared_vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_shares: {
        Row: {
          created_at: string | null
          id: number
          participant_vault_id: number
          share_amount: number
          share_percentage: number | null
          transaction_id: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          participant_vault_id: number
          share_amount: number
          share_percentage?: number | null
          transaction_id: number
        }
        Update: {
          created_at?: string | null
          id?: number
          participant_vault_id?: number
          share_amount?: number
          share_percentage?: number | null
          transaction_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "transaction_shares_participant_vault_id_fkey"
            columns: ["participant_vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_shares_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: number | null
          allocation_method: string | null
          amount: number
          beneficiary_vault_id: number
          category_id: number | null
          date: string
          id: number
          is_deleted: number
          notes: string | null
          transaction_type: string
          transfer_group_id: string | null
          vault_id: number
        }
        Insert: {
          account_id?: number | null
          allocation_method?: string | null
          amount: number
          beneficiary_vault_id: number
          category_id?: number | null
          date: string
          id?: number
          is_deleted?: number
          notes?: string | null
          transaction_type: string
          transfer_group_id?: string | null
          vault_id: number
        }
        Update: {
          account_id?: number | null
          allocation_method?: string | null
          amount?: number
          beneficiary_vault_id?: number
          category_id?: number | null
          date?: string
          id?: number
          is_deleted?: number
          notes?: string | null
          transaction_type?: string
          transfer_group_id?: string | null
          vault_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_beneficiary_vault_id_fkey"
            columns: ["beneficiary_vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_shares: {
        Row: {
          created_at: string | null
          id: number
          shared_vault_id: number
          vault_id: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          shared_vault_id: number
          vault_id: number
        }
        Update: {
          created_at?: string | null
          id?: number
          shared_vault_id?: number
          vault_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "vault_shares_shared_vault_id_fkey"
            columns: ["shared_vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_shares_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      vaults: {
        Row: {
          created_at: string | null
          financial_cycle_start_day: number
          id: number
          is_admin: number
          month_start_day: number
          monthly_savings_goal: number
          name: string
          pin_hash: string
          vault_type: string
        }
        Insert: {
          created_at?: string | null
          financial_cycle_start_day?: number
          id?: number
          is_admin?: number
          month_start_day?: number
          monthly_savings_goal?: number
          name: string
          pin_hash: string
          vault_type?: string
        }
        Update: {
          created_at?: string | null
          financial_cycle_start_day?: number
          id?: number
          is_admin?: number
          month_start_day?: number
          monthly_savings_goal?: number
          name?: string
          pin_hash?: string
          vault_type?: string
        }
        Relationships: []
      }
      wishlist_categories: {
        Row: {
          created_at: string | null
          id: number
          is_active: number
          name: string
          vault_id: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_active?: number
          name: string
          vault_id: number
        }
        Update: {
          created_at?: string | null
          id?: number
          is_active?: number
          name?: string
          vault_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_categories_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_items: {
        Row: {
          account_id: number | null
          category: string
          created_at: string | null
          estimated_cost: number
          id: number
          image_url: string | null
          is_active: number
          name: string
          notes: string | null
          saved_amount: number
          target_date: string | null
          vault_id: number
        }
        Insert: {
          account_id?: number | null
          category?: string
          created_at?: string | null
          estimated_cost?: number
          id?: number
          image_url?: string | null
          is_active?: number
          name: string
          notes?: string | null
          saved_amount?: number
          target_date?: string | null
          vault_id: number
        }
        Update: {
          account_id?: number | null
          category?: string
          created_at?: string | null
          estimated_cost?: number
          id?: number
          image_url?: string | null
          is_active?: number
          name?: string
          notes?: string | null
          saved_amount?: number
          target_date?: string | null
          vault_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
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
