/**
 * Database types matching supabase/migrations/part_02_tables.sql.
 *
 * These are hand-written to match the schema in this repo. Once the project
 * is linked to a real Supabase project, prefer regenerating this file with
 * the Supabase CLI so it can never drift from the live database:
 *
 *   npx supabase gen types typescript --project-id <ref> > types/database.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      branches: {
        Row: {
          id: number;
          name: string;
          country: string | null;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          country?: string | null;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["branches"]["Insert"]>;
      };
      profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string | null;
          role: "super_admin" | "branch_admin";
          branch_id: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          full_name?: string | null;
          role: "super_admin" | "branch_admin";
          branch_id?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      employees: {
        Row: {
          id: number;
          branch_id: number;
          name: string;
          position: string | null;
          active: boolean;
          hire_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          branch_id: number;
          name: string;
          position?: string | null;
          active?: boolean;
          hire_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["employees"]["Insert"]>;
      };
      shifts: {
        Row: {
          id: number;
          branch_id: number;
          name: string;
          start_time: string;
          end_time: string;
          grace_minutes: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          branch_id: number;
          name: string;
          start_time: string;
          end_time: string;
          grace_minutes?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["shifts"]["Insert"]>;
      };
      attendance: {
        Row: {
          id: number;
          branch_id: number;
          employee_id: number | null;
          employee_name: string;
          type: "in" | "out" | "permission";
          status: "pending" | "done";
          eth_date: string;
          eth_time: string | null;
          is_late: boolean;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          branch_id: number;
          employee_id?: number | null;
          employee_name: string;
          type: "in" | "out" | "permission";
          status?: "pending" | "done";
          eth_date: string;
          eth_time?: string | null;
          is_late?: boolean;
          note?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["attendance"]["Insert"]>;
      };
      settings: {
        Row: {
          branch_id: number;
          key: string;
          value: string | null;
          updated_at: string;
        };
        Insert: {
          branch_id: number;
          key: string;
          value?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["settings"]["Insert"]>;
      };
      holidays: {
        Row: {
          id: number;
          name: string;
          eth_date: string | null;
          greg_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          eth_date?: string | null;
          greg_date?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["holidays"]["Insert"]>;
      };
      announcements: {
        Row: {
          id: number;
          title: string;
          message: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          title: string;
          message?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["announcements"]["Insert"]>;
      };
      audit_logs: {
        Row: {
          id: number;
          admin_id: string | null;
          admin_username: string | null;
          action: string;
          details: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          admin_id?: string | null;
          admin_username?: string | null;
          action: string;
          details?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      username_to_email: {
        Args: { p_username: string };
        Returns: string | null;
      };
      branch_today_summary: {
        Args: { p_branch_id: number; p_eth_date: string };
        Returns: {
          total_active: number;
          present: number;
          late: number;
          on_time: number;
          pending: number;
        }[];
      };
      log_audit_event: {
        Args: { p_action: string; p_details: string };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
  };
}
