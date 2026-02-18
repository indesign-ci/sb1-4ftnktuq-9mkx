export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      quotes: {
        Row: {
          id: string
          company_id: string
          client_id: string
          project_id: string | null
          quote_number: string
          date: string
          valid_until: string
          object: string
          status: string
          subtotal: number
          discount_percent: number
          discount_amount: number
          total_ht: number
          vat_10: number
          vat_20: number
          total_ttc: number
          payment_terms: string | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          client_id: string
          project_id?: string | null
          quote_number: string
          date?: string
          valid_until?: string
          object?: string
          status?: string
          subtotal?: number
          discount_percent?: number
          discount_amount?: number
          total_ht?: number
          vat_10?: number
          vat_20?: number
          total_ttc?: number
          payment_terms?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          client_id?: string
          project_id?: string | null
          quote_number?: string
          date?: string
          valid_until?: string
          object?: string
          status?: string
          subtotal?: number
          discount_percent?: number
          discount_amount?: number
          total_ht?: number
          vat_10?: number
          vat_20?: number
          total_ttc?: number
          payment_terms?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      quote_sections: {
        Row: {
          id: string
          quote_id: string
          title: string
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          quote_id: string
          title: string
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          quote_id?: string
          title?: string
          position?: number
          created_at?: string
        }
      }
      quote_lines: {
        Row: {
          id: string
          quote_id: string
          section_id: string | null
          designation: string
          description: string | null
          quantity: number
          unit: string
          unit_price: number
          vat_rate: number
          discount_percent: number
          total_ht: number
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          quote_id: string
          section_id?: string | null
          designation: string
          description?: string | null
          quantity?: number
          unit?: string
          unit_price?: number
          vat_rate?: number
          discount_percent?: number
          total_ht?: number
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          quote_id?: string
          section_id?: string | null
          designation?: string
          description?: string | null
          quantity?: number
          unit?: string
          unit_price?: number
          vat_rate?: number
          discount_percent?: number
          total_ht?: number
          position?: number
          created_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          company_id: string
          client_id: string
          project_id: string | null
          quote_id: string | null
          invoice_number: string
          date: string
          due_date: string | null
          invoice_type: string
          object: string | null
          status: string
          subtotal: number
          discount_percent: number
          discount_amount: number
          total_ht: number
          vat_10: number
          vat_20: number
          total_ttc: number
          amount_paid: number
          amount_due: number
          payment_terms: string | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          client_id: string
          project_id?: string | null
          quote_id?: string | null
          invoice_number: string
          date?: string
          due_date?: string | null
          invoice_type?: string
          object?: string | null
          status?: string
          subtotal?: number
          discount_percent?: number
          discount_amount?: number
          total_ht?: number
          vat_10?: number
          vat_20?: number
          total_ttc?: number
          amount_paid?: number
          amount_due?: number
          payment_terms?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          client_id?: string
          project_id?: string | null
          quote_id?: string | null
          invoice_number?: string
          date?: string
          due_date?: string | null
          invoice_type?: string
          object?: string | null
          status?: string
          subtotal?: number
          discount_percent?: number
          discount_amount?: number
          total_ht?: number
          vat_10?: number
          vat_20?: number
          total_ttc?: number
          amount_paid?: number
          amount_due?: number
          payment_terms?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invoice_lines: {
        Row: {
          id: string
          invoice_id: string
          designation: string
          description: string | null
          quantity: number
          unit: string
          unit_price: number
          vat_rate: number
          discount_percent: number
          total_ht: number
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          designation: string
          description?: string | null
          quantity?: number
          unit?: string
          unit_price?: number
          vat_rate?: number
          discount_percent?: number
          total_ht?: number
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          designation?: string
          description?: string | null
          quantity?: number
          unit?: string
          unit_price?: number
          vat_rate?: number
          discount_percent?: number
          total_ht?: number
          position?: number
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          company_id: string
          invoice_id: string
          amount: number
          payment_date: string
          payment_method: string
          reference: string | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          invoice_id: string
          amount: number
          payment_date?: string
          payment_method?: string
          reference?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          invoice_id?: string
          amount?: number
          payment_date?: string
          payment_method?: string
          reference?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: Record<string, any>
        Insert: Record<string, any>
        Update: Record<string, any>
      }
      projects: {
        Row: Record<string, any>
        Insert: Record<string, any>
        Update: Record<string, any>
      }
      [key: string]: {
        Row: Record<string, any>
        Insert: Record<string, any>
        Update: Record<string, any>
      }
    }
  }
}
