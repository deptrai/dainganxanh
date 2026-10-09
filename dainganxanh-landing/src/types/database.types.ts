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
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          metadata: Json | null
          target_id: string | null
          target_role: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_role?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_audit_log_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_preferences: {
        Row: {
          created_at: string | null
          email_notifications: Json | null
          in_app_sound: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_notifications?: Json | null
          in_app_sound?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_notifications?: Json | null
          in_app_sound?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_user_lots: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          lot_id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          lot_id: string
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          lot_id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_user_lots_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
        ]
      }
      casso_transactions: {
        Row: {
          amount: number
          bank_account: string | null
          casso_id: number | null
          casso_tid: string
          created_at: string | null
          description: string | null
          id: string
          note: string | null
          order_id: string | null
          raw_payload: Json | null
          status: string
          transaction_at: string | null
        }
        Insert: {
          amount: number
          bank_account?: string | null
          casso_id?: number | null
          casso_tid: string
          created_at?: string | null
          description?: string | null
          id?: string
          note?: string | null
          order_id?: string | null
          raw_payload?: Json | null
          status?: string
          transaction_at?: string | null
        }
        Update: {
          amount?: number
          bank_account?: string | null
          casso_id?: number | null
          casso_tid?: string
          created_at?: string | null
          description?: string | null
          id?: string
          note?: string | null
          order_id?: string | null
          raw_payload?: Json | null
          status?: string
          transaction_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "casso_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string | null
          email_type: string
          error_message: string | null
          id: string
          order_id: string
          recipient: string
          resend_id: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          email_type: string
          error_message?: string | null
          id?: string
          order_id: string
          recipient: string
          resend_id?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          email_type?: string
          error_message?: string | null
          id?: string
          order_id?: string
          recipient?: string
          resend_id?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          created_at: string | null
          html_body: string
          id: string
          subject: string
          template_key: string
          updated_at: string | null
          updated_by: string | null
          variables: Json | null
        }
        Insert: {
          created_at?: string | null
          html_body: string
          id?: string
          subject: string
          template_key: string
          updated_at?: string | null
          updated_by?: string | null
          variables?: Json | null
        }
        Update: {
          created_at?: string | null
          html_body?: string
          id?: string
          subject?: string
          template_key?: string
          updated_at?: string | null
          updated_by?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      field_checklists: {
        Row: {
          checklist_items: Json | null
          completed_at: string | null
          created_at: string | null
          due_date: string
          id: string
          lot_id: string
          overall_status: string | null
          quarter: string
          updated_at: string | null
        }
        Insert: {
          checklist_items?: Json | null
          completed_at?: string | null
          created_at?: string | null
          due_date: string
          id?: string
          lot_id: string
          overall_status?: string | null
          quarter: string
          updated_at?: string | null
        }
        Update: {
          checklist_items?: Json | null
          completed_at?: string | null
          created_at?: string | null
          due_date?: string
          id?: string
          lot_id?: string
          overall_status?: string | null
          quarter?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "field_checklists_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_up_tasks: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          due_date: string
          health_log_id: string
          id: string
          notes: string | null
          status: string
          tree_id: string
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          due_date: string
          health_log_id: string
          id?: string
          notes?: string | null
          status?: string
          tree_id: string
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          due_date?: string
          health_log_id?: string
          id?: string
          notes?: string | null
          status?: string
          tree_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_tasks_health_log_id_fkey"
            columns: ["health_log_id"]
            isOneToOne: false
            referencedRelation: "tree_health_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_tasks_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
        ]
      }
      lots: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          images: Json
          location_lat: number | null
          location_lng: number | null
          name: string
          planted: number | null
          region: string
          total_trees: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          images?: Json
          location_lat?: number | null
          location_lng?: number | null
          name: string
          planted?: number | null
          region: string
          total_trees?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          images?: Json
          location_lat?: number | null
          location_lng?: number | null
          name?: string
          planted?: number | null
          region?: string
          total_trees?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          data: Json | null
          id: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          address: string | null
          approved_at: string | null
          approved_by: string | null
          claimed_at: string | null
          co2_absorbed: number | null
          code: string
          contract_url: string | null
          created_at: string | null
          dob: string | null
          has_insurance: boolean
          id: string
          id_issue_date: string | null
          id_issue_place: string | null
          id_number: string | null
          is_phantom: boolean | null
          latest_photo_url: string | null
          lot_id: string | null
          nationality: string | null
          order_code: string | null
          payment_method: string
          payment_proof_url: string | null
          phone: string | null
          planted_at: string | null
          quantity: number
          referred_by: string | null
          status: string | null
          total_amount: number
          tree_status: string | null
          unit_price: number
          updated_at: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
          verified_at: string | null
          locale: 'vi' | 'en'
        }
        Insert: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          claimed_at?: string | null
          co2_absorbed?: number | null
          code: string
          contract_url?: string | null
          created_at?: string | null
          dob?: string | null
          has_insurance?: boolean
          id?: string
          id_issue_date?: string | null
          id_issue_place?: string | null
          id_number?: string | null
          is_phantom?: boolean | null
          latest_photo_url?: string | null
          lot_id?: string | null
          nationality?: string | null
          order_code?: string | null
          payment_method: string
          payment_proof_url?: string | null
          phone?: string | null
          planted_at?: string | null
          quantity: number
          referred_by?: string | null
          status?: string | null
          total_amount: number
          tree_status?: string | null
          unit_price?: number
          updated_at?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
          verified_at?: string | null
          locale?: 'vi' | 'en'
        }
        Update: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          claimed_at?: string | null
          co2_absorbed?: number | null
          code?: string
          contract_url?: string | null
          created_at?: string | null
          dob?: string | null
          has_insurance?: boolean
          id?: string
          id_issue_date?: string | null
          id_issue_place?: string | null
          id_number?: string | null
          is_phantom?: boolean | null
          latest_photo_url?: string | null
          lot_id?: string | null
          nationality?: string | null
          order_code?: string | null
          payment_method?: string
          payment_proof_url?: string | null
          phone?: string | null
          planted_at?: string | null
          quantity?: number
          referred_by?: string | null
          status?: string | null
          total_amount?: number
          tree_status?: string | null
          unit_price?: number
          updated_at?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
          verified_at?: string | null
          locale?: 'vi' | 'en'
        }
        Relationships: [
          {
            foreignKeyName: "fk_orders_lot_id"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          casso_tid: string
          created_at: string
          id: string
          metadata: Json
          order_code: string
          order_id: string
          order_type: string
          status: string
        }
        Insert: {
          amount: number
          casso_tid: string
          created_at?: string
          id?: string
          metadata?: Json
          order_code: string
          order_id: string
          order_type: string
          status?: string
        }
        Update: {
          amount?: number
          casso_tid?: string
          created_at?: string
          id?: string
          metadata?: Json
          order_code?: string
          order_id?: string
          order_type?: string
          status?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          author_id: string | null
          content: string
          cover_image: string | null
          created_at: string | null
          excerpt: string | null
          id: string
          meta_desc: string | null
          meta_title: string | null
          published_at: string | null
          scheduled_at: string | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          author_id?: string | null
          content?: string
          cover_image?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string
          meta_desc?: string | null
          meta_title?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          author_id?: string | null
          content?: string
          cover_image?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string
          meta_desc?: string | null
          meta_title?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      print_queue: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          order_id: string
          printed_at: string | null
          shipped_at: string | null
          status: string
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          printed_at?: string | null
          shipped_at?: string | null
          status?: string
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          printed_at?: string | null
          shipped_at?: string | null
          status?: string
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "print_queue_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          batch_certificate_url: string | null
          category_id: string
          compare_at_price: number | null
          created_at: string
          description: string | null
          id: string
          images: Json
          is_featured: boolean
          lot_id: string | null
          name: string
          origin_type: string
          price: number
          reserved_quantity: number
          sku: string | null
          slug: string
          specifications: Json
          status: string
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          batch_certificate_url?: string | null
          category_id: string
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          images?: Json
          is_featured?: boolean
          lot_id?: string | null
          name: string
          origin_type?: string
          price: number
          reserved_quantity?: number
          sku?: string | null
          slug: string
          specifications?: Json
          status?: string
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          batch_certificate_url?: string | null
          category_id?: string
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          images?: Json
          is_featured?: boolean
          lot_id?: string | null
          name?: string
          origin_type?: string
          price?: number
          reserved_quantity?: number
          sku?: string | null
          slug?: string
          specifications?: Json
          status?: string
          stock_quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_clicks: {
        Row: {
          converted: boolean | null
          created_at: string | null
          id: string
          ip_hash: string | null
          order_id: string | null
          referrer_id: string
          user_agent: string | null
        }
        Insert: {
          converted?: boolean | null
          created_at?: string | null
          id?: string
          ip_hash?: string | null
          order_id?: string | null
          referrer_id: string
          user_agent?: string | null
        }
        Update: {
          converted?: boolean | null
          created_at?: string | null
          id?: string
          ip_hash?: string | null
          order_id?: string | null
          referrer_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_clicks_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      replacement_tasks: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          dead_tree_id: string
          id: string
          new_tree_id: string | null
          notes: string | null
          reason: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          dead_tree_id: string
          id?: string
          new_tree_id?: string | null
          notes?: string | null
          reason?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          dead_tree_id?: string
          id?: string
          new_tree_id?: string | null
          notes?: string | null
          reason?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "replacement_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "replacement_tasks_dead_tree_id_fkey"
            columns: ["dead_tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "replacement_tasks_new_tree_id_fkey"
            columns: ["new_tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
        ]
      }
      room_blocks: {
        Row: {
          created_at: string
          created_by: string | null
          end_date: string
          id: string
          reason: string | null
          room_id: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_date: string
          id?: string
          reason?: string | null
          room_id: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_date?: string
          id?: string
          reason?: string | null
          room_id?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_blocks_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_bookings: {
        Row: {
          cancellation_reason: string | null
          check_in_date: string
          check_out_date: string
          code: string
          created_at: string
          expires_at: string | null
          guest_email: string | null
          guest_name: string
          guest_phone: string
          guests_count: number
          id: string
          nights_count: number | null
          payment_method: string
          payment_ref: string | null
          room_id: string
          special_requests: string | null
          status: string
          total_amount: number
          updated_at: string
          user_id: string | null
          locale: 'vi' | 'en'
        }
        Insert: {
          cancellation_reason?: string | null
          check_in_date: string
          check_out_date: string
          code: string
          created_at?: string
          expires_at?: string | null
          guest_email?: string | null
          guest_name: string
          guest_phone: string
          guests_count?: number
          id?: string
          nights_count?: number | null
          payment_method: string
          payment_ref?: string | null
          room_id: string
          special_requests?: string | null
          status?: string
          total_amount: number
          updated_at?: string
          user_id?: string | null
          locale?: 'vi' | 'en'
        }
        Update: {
          cancellation_reason?: string | null
          check_in_date?: string
          check_out_date?: string
          code?: string
          created_at?: string
          expires_at?: string | null
          guest_email?: string | null
          guest_name?: string
          guest_phone?: string
          guests_count?: number
          id?: string
          nights_count?: number | null
          payment_method?: string
          payment_ref?: string | null
          room_id?: string
          special_requests?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string | null
          locale?: 'vi' | 'en'
        }
        Relationships: [
          {
            foreignKeyName: "room_bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_pricing_rules: {
        Row: {
          end_date: string
          id: string
          min_nights: number | null
          price_per_night: number
          room_id: string
          start_date: string
        }
        Insert: {
          end_date: string
          id?: string
          min_nights?: number | null
          price_per_night: number
          room_id: string
          start_date: string
        }
        Update: {
          end_date?: string
          id?: string
          min_nights?: number | null
          price_per_night?: number
          room_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_pricing_rules_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          amenities: Json
          capacity: number
          created_at: string
          description: string | null
          id: string
          images: Json
          lot_id: string
          name: string
          price_per_night: number
          status: string
          updated_at: string
        }
        Insert: {
          amenities?: Json
          capacity?: number
          created_at?: string
          description?: string | null
          id?: string
          images?: Json
          lot_id: string
          name: string
          price_per_night: number
          status?: string
          updated_at?: string
        }
        Update: {
          amenities?: Json
          capacity?: number
          created_at?: string
          description?: string | null
          id?: string
          images?: Json
          lot_id?: string
          name?: string
          price_per_night?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
        ]
      }
      store_order_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          store_order_id: string
          subtotal: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity: number
          store_order_id: string
          subtotal?: number | null
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          store_order_id?: string
          subtotal?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "store_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_order_items_store_order_id_fkey"
            columns: ["store_order_id"]
            isOneToOne: false
            referencedRelation: "store_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      store_orders: {
        Row: {
          cancellation_reason: string | null
          code: string
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          expires_at: string | null
          id: string
          payment_method: string
          payment_ref: string | null
          shipping_address: string
          shipping_fee: number
          shipping_note: string | null
          shipping_province: string | null
          status: string
          subtotal: number
          total_amount: number
          tracking_number: string | null
          updated_at: string
          user_id: string | null
          locale: 'vi' | 'en'
        }
        Insert: {
          cancellation_reason?: string | null
          code: string
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          expires_at?: string | null
          id?: string
          payment_method: string
          payment_ref?: string | null
          shipping_address: string
          shipping_fee?: number
          shipping_note?: string | null
          shipping_province?: string | null
          status?: string
          subtotal: number
          total_amount: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
          locale?: 'vi' | 'en'
        }
        Update: {
          cancellation_reason?: string | null
          code?: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          expires_at?: string | null
          id?: string
          payment_method?: string
          payment_ref?: string | null
          shipping_address?: string
          shipping_fee?: number
          shipping_note?: string | null
          shipping_province?: string | null
          status?: string
          subtotal?: number
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
          locale?: 'vi' | 'en'
        }
        Relationships: []
      }
      system_config: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      tree_health_logs: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          id: string
          new_status: string
          notes: string | null
          old_status: string | null
          treatment_details: string | null
          tree_id: string
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_status: string
          notes?: string | null
          old_status?: string | null
          treatment_details?: string | null
          tree_id: string
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_status?: string
          notes?: string | null
          old_status?: string | null
          treatment_details?: string | null
          tree_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tree_health_logs_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_health_logs_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
        ]
      }
      tree_photos: {
        Row: {
          caption: string | null
          gps_accuracy: number | null
          gps_lat: number | null
          gps_lng: number | null
          id: string
          lot_id: string
          photo_url: string
          taken_at: string | null
          tree_id: string | null
          uploaded_at: string | null
        }
        Insert: {
          caption?: string | null
          gps_accuracy?: number | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          lot_id: string
          photo_url: string
          taken_at?: string | null
          tree_id?: string | null
          uploaded_at?: string | null
        }
        Update: {
          caption?: string | null
          gps_accuracy?: number | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          lot_id?: string
          photo_url?: string
          taken_at?: string | null
          tree_id?: string | null
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tree_photos_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_photos_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
        ]
      }
      trees: {
        Row: {
          code: string
          created_at: string | null
          health_status: string | null
          id: string
          lot_id: string | null
          order_id: string
          planted_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          health_status?: string | null
          id?: string
          lot_id?: string | null
          order_id: string
          planted_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          health_status?: string | null
          id?: string
          lot_id?: string | null
          order_id?: string
          planted_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trees_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trees_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_carts: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_carts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          full_name: string | null
          id: string
          id_number: string | null
          is_phantom: boolean | null
          phone: string | null
          referral_code: string
          referred_by_user_id: string | null
          role: string | null
          updated_at: string | null
          locale: 'vi' | 'en'
        }
        Insert: {
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          id_number?: string | null
          is_phantom?: boolean | null
          phone?: string | null
          referral_code: string
          referred_by_user_id?: string | null
          role?: string | null
          updated_at?: string | null
          locale?: 'vi' | 'en'
        }
        Update: {
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          id_number?: string | null
          is_phantom?: boolean | null
          phone?: string | null
          referral_code?: string
          referred_by_user_id?: string | null
          role?: string | null
          updated_at?: string | null
          locale?: 'vi' | 'en'
        }
        Relationships: [
          {
            foreignKeyName: "users_referred_by_user_id_fkey"
            columns: ["referred_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawals: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          bank_account_name: string
          bank_account_number: string
          bank_name: string
          created_at: string | null
          id: string
          proof_image_path: string | null
          proof_image_url: string | null
          rejection_reason: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          bank_account_name: string
          bank_account_number: string
          bank_name: string
          created_at?: string | null
          id?: string
          proof_image_path?: string | null
          proof_image_url?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          bank_account_name?: string
          bank_account_number?: string
          bank_name?: string
          created_at?: string | null
          id?: string
          proof_image_path?: string | null
          proof_image_url?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_user_id_public_users_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      backfill_missing_user_profiles: { Args: never; Returns: number }
      execute_sql: { Args: { sql: string }; Returns: undefined }
      expire_pending_bookings: { Args: never; Returns: number }
      expire_pending_store_orders: { Args: never; Returns: number }
      generate_referral_code: { Args: never; Returns: string }
      get_harvest_ready_trees: {
        Args: never
        Returns: {
          age_months: number
          co2_absorbed: number
          id: string
          order_id: string
          planted_at: string
          tree_code: string
          user_email: string
          user_id: string
        }[]
      }
      confirm_product_stock: {
        Args: { p_product_id: string; p_qty: number }
        Returns: undefined
      }
      get_my_role: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      release_product_stock: {
        Args: { p_product_id: string; p_qty: number }
        Returns: undefined
      }
      reserve_product_stock: {
        Args: { p_product_id: string; p_qty: number }
        Returns: boolean
      }
      slugify_for_referral: { Args: { input_text: string }; Returns: string }
      unaccent: { Args: { "": string }; Returns: string }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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

/* -------------------------------------------------------------------------- */
/*             Convenience Table & Row Helpers for Eco-Tourism / Store        */
/* -------------------------------------------------------------------------- */

export type RoomBookingRow = Tables<'room_bookings'>
export type RoomBookingInsert = TablesInsert<'room_bookings'>
export type RoomBookingUpdate = TablesUpdate<'room_bookings'>

export type RoomRow = Tables<'rooms'>
export type RoomInsert = TablesInsert<'rooms'>
export type RoomUpdate = TablesUpdate<'rooms'>

export type LotRow = Tables<'lots'>
export type LotInsert = TablesInsert<'lots'>
export type LotUpdate = TablesUpdate<'lots'>

export type StoreOrderRow = Tables<'store_orders'>
export type StoreOrderInsert = TablesInsert<'store_orders'>
export type StoreOrderUpdate = TablesUpdate<'store_orders'>

export type StoreOrderItemRow = Tables<'store_order_items'>
export type StoreOrderItemInsert = TablesInsert<'store_order_items'>
export type StoreOrderItemUpdate = TablesUpdate<'store_order_items'>

export type ProductRow = Tables<'products'>
export type ProductInsert = TablesInsert<'products'>
export type ProductUpdate = TablesUpdate<'products'>

// Joined relation types for Supabase queries
export type LotSummary = Pick<LotRow, 'name' | 'region'> &
  Partial<Pick<LotRow, 'id' | 'description' | 'location_lat' | 'location_lng' | 'images'>>

export type RoomWithLotSummary = Pick<RoomRow, 'name'> &
  Partial<Pick<RoomRow, 'id' | 'lot_id' | 'description' | 'capacity' | 'amenities' | 'price_per_night' | 'images' | 'status'>> & {
    lots?: LotSummary | LotSummary[] | null
  }

export type RoomBookingWithJoinedRoom = Pick<
  RoomBookingRow,
  'id' | 'code' | 'check_in_date' | 'check_out_date' | 'guests_count' | 'total_amount' | 'status' | 'created_at'
> &
  Partial<RoomBookingRow> & {
    rooms: RoomWithLotSummary | RoomWithLotSummary[] | null
  }

export type StoreOrderItemWithProduct = Pick<StoreOrderItemRow, 'id' | 'quantity' | 'unit_price'> &
  Partial<StoreOrderItemRow> & {
    products:
      | (Pick<ProductRow, 'name' | 'slug'> & Partial<Pick<ProductRow, 'images'>>)
      | Array<Pick<ProductRow, 'name' | 'slug'> & Partial<Pick<ProductRow, 'images'>>>
      | null
  }

export type StoreOrderWithItems = Pick<
  StoreOrderRow,
  'id' | 'code' | 'status' | 'total_amount' | 'created_at'
> &
  Partial<StoreOrderRow> & {
    store_order_items: StoreOrderItemWithProduct[] | null
  }

