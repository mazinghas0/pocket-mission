export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      families: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          subscription_status: 'free' | 'premium';
          stripe_customer_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          invite_code: string;
          subscription_status?: 'free' | 'premium';
          stripe_customer_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          invite_code?: string;
          subscription_status?: 'free' | 'premium';
          stripe_customer_id?: string | null;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          family_id: string | null;
          role: 'parent' | 'child';
          name: string;
          points: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          family_id?: string | null;
          role: 'parent' | 'child';
          name: string;
          points?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          family_id?: string | null;
          role?: 'parent' | 'child';
          name?: string;
          points?: number;
          created_at?: string;
        };
      };
      missions: {
        Row: {
          id: string;
          family_id: string;
          created_by: string;
          assigned_to: string | null;
          title: string;
          description: string;
          points: number;
          template_id: string | null;
          status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected';
          due_date: string | null;
          is_recurring: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          created_by: string;
          assigned_to?: string | null;
          title: string;
          description?: string;
          points: number;
          template_id?: string | null;
          status?: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected';
          due_date?: string | null;
          is_recurring?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          created_by?: string;
          assigned_to?: string | null;
          title?: string;
          description?: string;
          points?: number;
          template_id?: string | null;
          status?: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected';
          due_date?: string | null;
          is_recurring?: boolean;
          created_at?: string;
        };
      };
      mission_templates: {
        Row: {
          id: string;
          title: string;
          description: string;
          default_points: number;
          category: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          default_points: number;
          category: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          default_points?: number;
          category?: string;
          created_at?: string;
        };
      };
      mission_submissions: {
        Row: {
          id: string;
          mission_id: string;
          child_id: string;
          photo_url: string;
          memo: string;
          status: 'pending' | 'approved' | 'rejected';
          rejection_reason: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          mission_id: string;
          child_id: string;
          photo_url: string;
          memo?: string;
          status?: 'pending' | 'approved' | 'rejected';
          rejection_reason?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          mission_id?: string;
          child_id?: string;
          photo_url?: string;
          memo?: string;
          status?: 'pending' | 'approved' | 'rejected';
          rejection_reason?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
      };
      point_transactions: {
        Row: {
          id: string;
          profile_id: string;
          amount: number;
          type: 'earned' | 'requested' | 'paid';
          mission_id: string | null;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          amount: number;
          type: 'earned' | 'requested' | 'paid';
          mission_id?: string | null;
          description?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          amount?: number;
          type?: 'earned' | 'requested' | 'paid';
          mission_id?: string | null;
          description?: string;
          created_at?: string;
        };
      };
      withdrawal_requests: {
        Row: {
          id: string;
          child_id: string;
          points: number;
          status: 'pending' | 'approved';
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          child_id: string;
          points: number;
          status?: 'pending' | 'approved';
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          child_id?: string;
          points?: number;
          status?: 'pending' | 'approved';
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
