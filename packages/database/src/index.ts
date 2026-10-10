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
      profiles: {
        Row: {
          id: string;
          birth_date: string | null;
          height_cm: number | null;
          training_years: number;
          last_regular_workout_date: string | null;
          equipment_available: string[];
          available_days_per_week: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          birth_date?: string | null;
          height_cm?: number | null;
          training_years?: number;
          last_regular_workout_date?: string | null;
          equipment_available?: string[];
          available_days_per_week?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      muscles: {
        Row: {
          id: string;
          name_en: string;
          name_fa: string;
          group_name: string;
          max_sets_per_session: number;
          default_mev: number;
          default_mrv: number;
          created_at: string;
        };
        Insert: Database['public']['Tables']['muscles']['Row'];
        Update: Partial<Database['public']['Tables']['muscles']['Insert']>;
      };
      exercises: {
        Row: {
          id: string;
          name_en: string;
          name_fa: string;
          movement_pattern: string;
          equipment: string;
          primary_muscles: Json;
          secondary_muscles: Json;
          sfr_prior: number;
          joint_fatigue: Json;
          systemic_fatigue: number;
          length_bias: number;
          estimated_time_sec: number;
          default_load_increment_kg: number;
          e1rm_conversion_factor: number;
          source: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: Database['public']['Tables']['exercises']['Row'];
        Update: Partial<Database['public']['Tables']['exercises']['Insert']>;
      };
      sessions: {
        Row: {
          id: string;
          client_uuid: string;
          user_id: string;
          mesocycle_id: string | null;
          name: string;
          started_at: string;
          completed_at: string | null;
          readiness_score: number | null;
          srpe: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Database['public']['Tables']['sessions']['Row'];
        Update: Partial<Database['public']['Tables']['sessions']['Insert']>;
      };
      sets: {
        Row: {
          id: string;
          client_uuid: string;
          session_id: string;
          user_id: string;
          exercise_id: string;
          set_number: number;
          load_kg: number;
          reps: number;
          rir: number | null;
          rest_seconds: number;
          is_warmup: boolean;
          superseded_by: string | null;
          performed_at: string;
          notes: string | null;
          created_at: string;
        };
        Insert: Database['public']['Tables']['sets']['Row'];
        Update: Partial<Database['public']['Tables']['sets']['Insert']>;
      };
      daily_checkins: {
        Row: {
          id: string;
          user_id: string;
          checkin_date: string;
          sleep_hours: number;
          sleep_quality: number;
          stress_level: number;
          motivation: number;
          muscle_soreness: Json;
          resting_heart_rate: number | null;
          hrv_ms: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Database['public']['Tables']['daily_checkins']['Row'];
        Update: Partial<Database['public']['Tables']['daily_checkins']['Insert']>;
      };
      body_metrics: {
        Row: {
          id: string;
          user_id: string;
          recorded_at: string;
          weight_kg: number;
          waist_cm: number | null;
          chest_cm: number | null;
          arms_cm: number | null;
          thighs_cm: number | null;
          calves_cm: number | null;
          photo_storage_path: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Database['public']['Tables']['body_metrics']['Row'];
        Update: Partial<Database['public']['Tables']['body_metrics']['Insert']>;
      };
      decisions_log: {
        Row: {
          id: string;
          user_id: string;
          decision_timestamp: string;
          decision_type: string;
          scope: Json;
          inputs: Json;
          estimates: Json;
          rules_fired: Json;
          counterfactual: string | null;
          confidence: string;
          explanation_en: string;
          explanation_fa: string;
          model_version: string;
          created_at: string;
        };
        Insert: Database['public']['Tables']['decisions_log']['Row'];
        Update: Partial<Database['public']['Tables']['decisions_log']['Insert']>;
      };
    };
  };
}
