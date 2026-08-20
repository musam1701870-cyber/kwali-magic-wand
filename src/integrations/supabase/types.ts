export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      businesses: {
        Row: {
          annual_rate: number | null;
          approved_at: string | null;
          approved_by: string | null;
          assessment_ref: string | null;
          building: string | null;
          business_name: string;
          bvn: string | null;
          category: string | null;
          created_at: string;
          district: string | null;
          documents: string[] | null;
          email: string | null;
          id: string;
          industry: string | null;
          landmark: string | null;
          lat: string | null;
          lng: string | null;
          nin: string | null;
          obligations: string[] | null;
          owner_id: string;
          owner_name: string | null;
          payload: Json | null;
          phone: string | null;
          property_class: string | null;
          rc_number: string | null;
          ref: string;
          qr_token: string;
          registered_by: string | null;
          rejected_reason: string | null;
          status: string;
          street: string | null;
          taxpayer_type: string | null;
          tin: string | null;
          trading_name: string | null;
          updated_at: string;
          ward: string | null;
          website: string | null;
        };
        Insert: {
          annual_rate?: number | null;
          approved_at?: string | null;
          approved_by?: string | null;
          assessment_ref?: string | null;
          building?: string | null;
          business_name: string;
          bvn?: string | null;
          category?: string | null;
          created_at?: string;
          district?: string | null;
          documents?: string[] | null;
          email?: string | null;
          id?: string;
          industry?: string | null;
          landmark?: string | null;
          lat?: string | null;
          lng?: string | null;
          nin?: string | null;
          obligations?: string[] | null;
          owner_id: string;
          owner_name?: string | null;
          payload?: Json | null;
          phone?: string | null;
          property_class?: string | null;
          rc_number?: string | null;
          ref: string;
          qr_token?: string;
          registered_by?: string | null;
          rejected_reason?: string | null;
          status?: string;
          street?: string | null;
          taxpayer_type?: string | null;
          tin?: string | null;
          trading_name?: string | null;
          updated_at?: string;
          ward?: string | null;
          website?: string | null;
        };
        Update: {
          annual_rate?: number | null;
          approved_at?: string | null;
          approved_by?: string | null;
          assessment_ref?: string | null;
          building?: string | null;
          business_name?: string;
          bvn?: string | null;
          category?: string | null;
          created_at?: string;
          district?: string | null;
          documents?: string[] | null;
          email?: string | null;
          id?: string;
          industry?: string | null;
          landmark?: string | null;
          lat?: string | null;
          lng?: string | null;
          nin?: string | null;
          obligations?: string[] | null;
          owner_id?: string;
          owner_name?: string | null;
          payload?: Json | null;
          phone?: string | null;
          property_class?: string | null;
          rc_number?: string | null;
          ref?: string;
          qr_token?: string;
          registered_by?: string | null;
          rejected_reason?: string | null;
          status?: string;
          street?: string | null;
          taxpayer_type?: string | null;
          tin?: string | null;
          trading_name?: string | null;
          updated_at?: string;
          ward?: string | null;
          website?: string | null;
        };
        Relationships: [];
      };
      enforcement_incidents: {
        Row: {
          assigned_officer_id: string | null;
          created_at: string;
          description: string;
          evidence_photos: string[] | null;
          id: string;
          incident_type: string;
          location_lat: string | null;
          location_lng: string | null;
          marshal_id: string;
          penalty_amount: number | null;
          penalty_paid: boolean | null;
          resolved_at: string | null;
          status: string;
          subject_id: string | null;
          subject_identifier: string | null;
          subject_name: string | null;
          subject_type: string;
          updated_at: string;
          ward: string | null;
        };
        Insert: {
          assigned_officer_id?: string | null;
          created_at?: string;
          description: string;
          evidence_photos?: string[] | null;
          id?: string;
          incident_type: string;
          location_lat?: string | null;
          location_lng?: string | null;
          marshal_id: string;
          penalty_amount?: number | null;
          penalty_paid?: boolean | null;
          resolved_at?: string | null;
          status?: string;
          subject_id?: string | null;
          subject_identifier?: string | null;
          subject_name?: string | null;
          subject_type: string;
          updated_at?: string;
          ward?: string | null;
        };
        Update: {
          assigned_officer_id?: string | null;
          created_at?: string;
          description?: string;
          evidence_photos?: string[] | null;
          id?: string;
          incident_type?: string;
          location_lat?: string | null;
          location_lng?: string | null;
          marshal_id?: string;
          penalty_amount?: number | null;
          penalty_paid?: boolean | null;
          resolved_at?: string | null;
          status?: string;
          subject_id?: string | null;
          subject_identifier?: string | null;
          subject_name?: string | null;
          subject_type?: string;
          updated_at?: string;
          ward?: string | null;
        };
        Relationships: [];
      };
      hospitality_permits: {
        Row: {
          address: string;
          annual_permit_fee: number | null;
          approved_at: string | null;
          approved_by: string | null;
          capacity: number | null;
          created_at: string;
          establishment_name: string;
          establishment_type: string;
          id: string;
          owner_id: string;
          payload: Json | null;
          ref: string;
          qr_token: string;
          registered_by: string | null;
          rejected_reason: string | null;
          rooms: number | null;
          status: string;
          updated_at: string;
          ward: string;
        };
        Insert: {
          address: string;
          annual_permit_fee?: number | null;
          approved_at?: string | null;
          approved_by?: string | null;
          capacity?: number | null;
          created_at?: string;
          establishment_name: string;
          establishment_type: string;
          id?: string;
          owner_id: string;
          payload?: Json | null;
          ref: string;
          qr_token?: string;
          registered_by?: string | null;
          rejected_reason?: string | null;
          rooms?: number | null;
          status?: string;
          updated_at?: string;
          ward: string;
        };
        Update: {
          address?: string;
          annual_permit_fee?: number | null;
          approved_at?: string | null;
          approved_by?: string | null;
          capacity?: number | null;
          created_at?: string;
          establishment_name?: string;
          establishment_type?: string;
          id?: string;
          owner_id?: string;
          payload?: Json | null;
          ref?: string;
          qr_token?: string;
          registered_by?: string | null;
          rejected_reason?: string | null;
          rooms?: number | null;
          status?: string;
          updated_at?: string;
          ward?: string;
        };
        Relationships: [];
      };
      market_payment_verifications: {
        Row: {
          created_at: string;
          id: string;
          is_valid: boolean;
          location_lat: string | null;
          location_lng: string | null;
          market_name: string;
          marshal_id: string;
          notes: string | null;
          payment_ref: string | null;
          stall_id: string | null;
          stall_number: string | null;
          trader_name: string;
          verification_method: string;
          ward: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_valid: boolean;
          location_lat?: string | null;
          location_lng?: string | null;
          market_name: string;
          marshal_id: string;
          notes?: string | null;
          payment_ref?: string | null;
          stall_id?: string | null;
          stall_number?: string | null;
          trader_name: string;
          verification_method?: string;
          ward?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_valid?: boolean;
          location_lat?: string | null;
          location_lng?: string | null;
          market_name?: string;
          marshal_id?: string;
          notes?: string | null;
          payment_ref?: string | null;
          stall_id?: string | null;
          stall_number?: string | null;
          trader_name?: string;
          verification_method?: string;
          ward?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "market_payment_verifications_stall_id_fkey";
            columns: ["stall_id"];
            isOneToOne: false;
            referencedRelation: "market_stalls";
            referencedColumns: ["id"];
          },
        ];
      };
      market_stalls: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
          daily_toll: number | null;
          goods_category: string | null;
          id: string;
          market_name: string;
          monthly_rent: number | null;
          owner_id: string;
          payload: Json | null;
          ref: string;
          qr_token: string;
          registered_by: string | null;
          rejected_reason: string | null;
          sanitation_levy: number | null;
          stall_number: string | null;
          stall_type: string | null;
          status: string;
          trader_name: string;
          trader_nin: string | null;
          trader_phone: string | null;
          updated_at: string;
          ward: string;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          daily_toll?: number | null;
          goods_category?: string | null;
          id?: string;
          market_name: string;
          monthly_rent?: number | null;
          owner_id: string;
          payload?: Json | null;
          ref: string;
          qr_token?: string;
          registered_by?: string | null;
          rejected_reason?: string | null;
          sanitation_levy?: number | null;
          stall_number?: string | null;
          stall_type?: string | null;
          status?: string;
          trader_name: string;
          trader_nin?: string | null;
          trader_phone?: string | null;
          updated_at?: string;
          ward: string;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          daily_toll?: number | null;
          goods_category?: string | null;
          id?: string;
          market_name?: string;
          monthly_rent?: number | null;
          owner_id?: string;
          payload?: Json | null;
          ref?: string;
          qr_token?: string;
          registered_by?: string | null;
          rejected_reason?: string | null;
          sanitation_levy?: number | null;
          stall_number?: string | null;
          stall_type?: string | null;
          status?: string;
          trader_name?: string;
          trader_nin?: string | null;
          trader_phone?: string | null;
          updated_at?: string;
          ward?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          amount: number;
          channel: string;
          collector_id: string | null;
          collector_role: string | null;
          confirmed_at: string | null;
          created_at: string;
          expires_at: string | null;
          id: string;
          idempotency_key: string | null;
          notes: string | null;
          obligation_period: string | null;
          payer_id: string | null;
          payer_name: string | null;
          payload: Json | null;
          provider_ref: string | null;
          ref: string;
          revenue_type: string;
          source_id: string | null;
          source_ref: string | null;
          source_table: string;
          status: string;
          updated_at: string;
          ward: string | null;
        };
        Insert: {
          amount: number;
          channel?: string;
          collector_id?: string | null;
          collector_role?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          idempotency_key?: string | null;
          notes?: string | null;
          obligation_period?: string | null;
          payer_id?: string | null;
          payer_name?: string | null;
          payload?: Json | null;
          provider_ref?: string | null;
          ref: string;
          revenue_type: string;
          source_id?: string | null;
          source_ref?: string | null;
          source_table: string;
          status?: string;
          updated_at?: string;
          ward?: string | null;
        };
        Update: {
          amount?: number;
          channel?: string;
          collector_id?: string | null;
          collector_role?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          idempotency_key?: string | null;
          notes?: string | null;
          obligation_period?: string | null;
          payer_id?: string | null;
          payer_name?: string | null;
          payload?: Json | null;
          provider_ref?: string | null;
          ref?: string;
          revenue_type?: string;
          source_id?: string | null;
          source_ref?: string | null;
          source_table?: string;
          status?: string;
          updated_at?: string;
          ward?: string | null;
        };
        Relationships: [];
      };
      receipts: {
        Row: {
          amount: number;
          channel: string | null;
          entity_ref: string | null;
          id: string;
          issued_at: string;
          payer_name: string | null;
          payment_id: string;
          receipt_no: string;
          revenue_type: string | null;
          snapshot: Json;
          verify_token: string;
          void_reason: string | null;
          voided_at: string | null;
          ward: string | null;
        };
        Insert: {
          amount: number;
          channel?: string | null;
          entity_ref?: string | null;
          id?: string;
          issued_at?: string;
          payer_name?: string | null;
          payment_id: string;
          receipt_no: string;
          revenue_type?: string | null;
          snapshot?: Json;
          verify_token: string;
          void_reason?: string | null;
          voided_at?: string | null;
          ward?: string | null;
        };
        Update: {
          amount?: number;
          channel?: string | null;
          entity_ref?: string | null;
          id?: string;
          issued_at?: string;
          payer_name?: string | null;
          payment_id?: string;
          receipt_no?: string;
          revenue_type?: string | null;
          snapshot?: Json;
          verify_token?: string;
          void_reason?: string | null;
          voided_at?: string | null;
          ward?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "receipts_payment_id_fkey";
            columns: ["payment_id"];
            isOneToOne: true;
            referencedRelation: "payments";
            referencedColumns: ["id"];
          },
        ];
      };
      pos_operators: {
        Row: {
          annual_permit_fee: number | null;
          approved_at: string | null;
          approved_by: string | null;
          business_name: string | null;
          created_at: string;
          email: string | null;
          id: string;
          location: string | null;
          operator_name: string;
          owner_id: string;
          payload: Json | null;
          phone: string;
          ref: string;
          qr_token: string;
          registered_by: string | null;
          rejected_reason: string | null;
          status: string;
          terminal_count: number | null;
          updated_at: string;
          ward: string;
        };
        Insert: {
          annual_permit_fee?: number | null;
          approved_at?: string | null;
          approved_by?: string | null;
          business_name?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          location?: string | null;
          operator_name: string;
          owner_id: string;
          payload?: Json | null;
          phone: string;
          ref: string;
          qr_token?: string;
          registered_by?: string | null;
          rejected_reason?: string | null;
          status?: string;
          terminal_count?: number | null;
          updated_at?: string;
          ward: string;
        };
        Update: {
          annual_permit_fee?: number | null;
          approved_at?: string | null;
          approved_by?: string | null;
          business_name?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          location?: string | null;
          operator_name?: string;
          owner_id?: string;
          payload?: Json | null;
          phone?: string;
          ref?: string;
          qr_token?: string;
          registered_by?: string | null;
          rejected_reason?: string | null;
          status?: string;
          terminal_count?: number | null;
          updated_at?: string;
          ward?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          phone: string | null;
          updated_at: string;
          ward: string | null;
        };
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          updated_at?: string;
          ward?: string | null;
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          updated_at?: string;
          ward?: string | null;
        };
        Relationships: [];
      };
      properties: {
        Row: {
          address: string;
          annual_rate: number | null;
          approved_at: string | null;
          approved_by: string | null;
          assessed_value: number | null;
          assessment_ref: string | null;
          building: string | null;
          created_at: string;
          district: string | null;
          id: string;
          landmark: string | null;
          lat: string | null;
          lng: string | null;
          outstanding: number | null;
          owner_id: string;
          payload: Json | null;
          property_class: string | null;
          property_name: string | null;
          property_type: string;
          ref: string;
          qr_token: string;
          registered_by: string | null;
          rejected_reason: string | null;
          status: string;
          street: string | null;
          updated_at: string;
          ward: string;
        };
        Insert: {
          address: string;
          annual_rate?: number | null;
          approved_at?: string | null;
          approved_by?: string | null;
          assessed_value?: number | null;
          assessment_ref?: string | null;
          building?: string | null;
          created_at?: string;
          district?: string | null;
          id?: string;
          landmark?: string | null;
          lat?: string | null;
          lng?: string | null;
          outstanding?: number | null;
          owner_id: string;
          payload?: Json | null;
          property_class?: string | null;
          property_name?: string | null;
          property_type: string;
          ref: string;
          qr_token?: string;
          registered_by?: string | null;
          rejected_reason?: string | null;
          status?: string;
          street?: string | null;
          updated_at?: string;
          ward: string;
        };
        Update: {
          address?: string;
          annual_rate?: number | null;
          approved_at?: string | null;
          approved_by?: string | null;
          assessed_value?: number | null;
          assessment_ref?: string | null;
          building?: string | null;
          created_at?: string;
          district?: string | null;
          id?: string;
          landmark?: string | null;
          lat?: string | null;
          lng?: string | null;
          outstanding?: number | null;
          owner_id?: string;
          payload?: Json | null;
          property_class?: string | null;
          property_name?: string | null;
          property_type?: string;
          ref?: string;
          qr_token?: string;
          registered_by?: string | null;
          rejected_reason?: string | null;
          status?: string;
          street?: string | null;
          updated_at?: string;
          ward?: string;
        };
        Relationships: [];
      };
      sanitation_subscriptions: {
        Row: {
          address: string;
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
          id: string;
          monthly_fee: number | null;
          owner_id: string;
          payload: Json | null;
          phone: string;
          pickup_frequency: string | null;
          ref: string;
          qr_token: string;
          registered_by: string | null;
          rejected_reason: string | null;
          service_type: string | null;
          status: string;
          subscriber_name: string;
          updated_at: string;
          ward: string;
        };
        Insert: {
          address: string;
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          id?: string;
          monthly_fee?: number | null;
          owner_id: string;
          payload?: Json | null;
          phone: string;
          pickup_frequency?: string | null;
          ref: string;
          qr_token?: string;
          registered_by?: string | null;
          rejected_reason?: string | null;
          service_type?: string | null;
          status?: string;
          subscriber_name: string;
          updated_at?: string;
          ward: string;
        };
        Update: {
          address?: string;
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          id?: string;
          monthly_fee?: number | null;
          owner_id?: string;
          payload?: Json | null;
          phone?: string;
          pickup_frequency?: string | null;
          ref?: string;
          qr_token?: string;
          registered_by?: string | null;
          rejected_reason?: string | null;
          service_type?: string | null;
          status?: string;
          subscriber_name?: string;
          updated_at?: string;
          ward?: string;
        };
        Relationships: [];
      };
      transport_ticket_verifications: {
        Row: {
          created_at: string;
          id: string;
          is_valid: boolean;
          location_lat: string | null;
          location_lng: string | null;
          marshal_id: string;
          notes: string | null;
          plate_number: string;
          ticket_ref: string | null;
          vehicle_id: string | null;
          vehicle_type: string;
          verification_method: string;
          ward: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_valid: boolean;
          location_lat?: string | null;
          location_lng?: string | null;
          marshal_id: string;
          notes?: string | null;
          plate_number: string;
          ticket_ref?: string | null;
          vehicle_id?: string | null;
          vehicle_type: string;
          verification_method?: string;
          ward?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_valid?: boolean;
          location_lat?: string | null;
          location_lng?: string | null;
          marshal_id?: string;
          notes?: string | null;
          plate_number?: string;
          ticket_ref?: string | null;
          vehicle_id?: string | null;
          vehicle_type?: string;
          verification_method?: string;
          ward?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "transport_ticket_verifications_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "transport_vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
      transport_vehicles: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          chassis_number: string | null;
          color: string | null;
          created_at: string;
          daily_ticket_price: number | null;
          engine_number: string | null;
          id: string;
          make: string | null;
          model: string | null;
          operator_name: string | null;
          operator_nin: string | null;
          operator_phone: string | null;
          owner_id: string;
          parking_location: string | null;
          payload: Json | null;
          plate_number: string | null;
          qr_sticker_code: string | null;
          ref: string;
          qr_token: string;
          registered_by: string | null;
          rejected_reason: string | null;
          route: string | null;
          status: string;
          updated_at: string;
          vehicle_type: string;
          ward: string;
          year: number | null;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          chassis_number?: string | null;
          color?: string | null;
          created_at?: string;
          daily_ticket_price?: number | null;
          engine_number?: string | null;
          id?: string;
          make?: string | null;
          model?: string | null;
          operator_name?: string | null;
          operator_nin?: string | null;
          operator_phone?: string | null;
          owner_id: string;
          parking_location?: string | null;
          payload?: Json | null;
          plate_number?: string | null;
          qr_sticker_code?: string | null;
          ref: string;
          qr_token?: string;
          registered_by?: string | null;
          rejected_reason?: string | null;
          route?: string | null;
          status?: string;
          updated_at?: string;
          vehicle_type: string;
          ward: string;
          year?: number | null;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          chassis_number?: string | null;
          color?: string | null;
          created_at?: string;
          daily_ticket_price?: number | null;
          engine_number?: string | null;
          id?: string;
          make?: string | null;
          model?: string | null;
          operator_name?: string | null;
          operator_nin?: string | null;
          operator_phone?: string | null;
          owner_id?: string;
          parking_location?: string | null;
          payload?: Json | null;
          plate_number?: string | null;
          qr_sticker_code?: string | null;
          ref?: string;
          qr_token?: string;
          registered_by?: string | null;
          rejected_reason?: string | null;
          route?: string | null;
          status?: string;
          updated_at?: string;
          vehicle_type?: string;
          ward?: string;
          year?: number | null;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      marshal_dashboard_stats: {
        Row: {
          full_name: string | null;
          incidents_today: number | null;
          market_verifications_today: number | null;
          marshal_id: string | null;
          open_incidents: number | null;
          transport_verifications_today: number | null;
          ward: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      confirm_payment: {
        Args: {
          p_payment_id: string;
          p_provider_ref?: string | null;
          p_actor?: string | null;
          p_channel?: string | null;
        };
        // Shape of public.receipts. Inlined rather than referenced as
        // Database["public"]["Tables"]["receipts"]["Row"]: that self-reference is
        // circular within the Database type and degrades inference across every
        // query in the app.
        Returns: {
          id: string;
          payment_id: string;
          receipt_no: string;
          verify_token: string;
          payer_name: string | null;
          entity_ref: string | null;
          revenue_type: string | null;
          amount: number;
          channel: string | null;
          ward: string | null;
          snapshot: Json;
          issued_at: string;
          voided_at: string | null;
          void_reason: string | null;
        };
      };
      entity_obligations: {
        Args: {
          p_table: string;
          p_id: string;
        };
        Returns: {
          revenue_type: string;
          label: string;
          amount: number;
          period: string;
          period_label: string;
          paid: boolean;
          receipt_no: string | null;
        }[];
      };
      has_any_role: {
        Args: {
          _user_id: string;
          _roles: string[];
        };
        Returns: boolean;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      mask_name: {
        Args: {
          p_name: string;
        };
        Returns: string;
      };
      next_ref: {
        Args: {
          p_type: string;
        };
        Returns: string;
      };
      normalize_public_id: {
        Args: {
          p_id: string;
        };
        Returns: string;
      };
      raise_self_payment: {
        Args: {
          p_table: string;
          p_id: string;
          p_revenue_type: string;
          p_channel?: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      app_role: "admin" | "chairman" | "taxpayer" | "officer" | "marshal";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "chairman", "taxpayer", "officer", "marshal"],
    },
  },
} as const;
