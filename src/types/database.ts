export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[] | undefined;

export interface Database {
  public: {
    Tables: {
      recipes: {
        Row: {
          id: string;
          user_id: string;
          dish_name: string;
          cuisine: string;
          description: string;
          servings: number;
          prep_time: number;
          cook_time: number;
          difficulty: 'easy' | 'medium' | 'hard';
          rating: number | null;
          is_favorite: boolean;
          source_url: string | null;
          nutrition: Json | null;
          instructions: string[];
          recipe_images: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          dish_name: string;
          cuisine?: string;
          description?: string;
          servings?: number;
          prep_time?: number;
          cook_time?: number;
          difficulty?: 'easy' | 'medium' | 'hard';
          rating?: number | null;
          is_favorite?: boolean;
          source_url?: string | null;
          nutrition?: Json | null;
          instructions?: string[];
          recipe_images?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          dish_name?: string;
          cuisine?: string;
          description?: string;
          servings?: number;
          prep_time?: number;
          cook_time?: number;
          difficulty?: 'easy' | 'medium' | 'hard';
          rating?: number | null;
          is_favorite?: boolean;
          source_url?: string | null;
          nutrition?: Json | null;
          instructions?: string[];
          recipe_images?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'recipes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      ingredients: {
        Row: {
          id: string;
          recipe_id: string;
          name: string;
          quantity: string;
          unit: string;
          category: string;
          group_name: string | null;
          notes: string | null;
          is_selected: boolean;
          sort_order: number;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          name: string;
          quantity?: string;
          unit?: string;
          category?: string;
          group_name?: string | null;
          notes?: string | null;
          is_selected?: boolean;
          sort_order?: number;
        };
        Update: {
          id?: string;
          recipe_id?: string;
          name?: string;
          quantity?: string;
          unit?: string;
          category?: string;
          group_name?: string | null;
          notes?: string | null;
          is_selected?: boolean;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'ingredients_recipe_id_fkey';
            columns: ['recipe_id'];
            isOneToOne: false;
            referencedRelation: 'recipes';
            referencedColumns: ['id'];
          },
        ];
      };
      shopping_items: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          quantity: string;
          unit: string;
          category: string;
          notes: string | null;
          is_checked: boolean;
          recipe_id: string | null;
          recipe_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          quantity?: string;
          unit?: string;
          category?: string;
          notes?: string | null;
          is_checked?: boolean;
          recipe_id?: string | null;
          recipe_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          quantity?: string;
          unit?: string;
          category?: string;
          notes?: string | null;
          is_checked?: boolean;
          recipe_id?: string | null;
          recipe_name?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'shopping_items_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      meal_slots: {
        Row: {
          id: string;
          user_id: string;
          recipe_id: string;
          recipe_name: string;
          recipe_image: string | null;
          date: string;
          meal_type: 'frühstück' | 'mittagessen' | 'abendessen' | 'snack';
          servings: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          recipe_id: string;
          recipe_name: string;
          recipe_image?: string | null;
          date: string;
          meal_type: 'frühstück' | 'mittagessen' | 'abendessen' | 'snack';
          servings?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          recipe_id?: string;
          recipe_name?: string;
          recipe_image?: string | null;
          date?: string;
          meal_type?: 'frühstück' | 'mittagessen' | 'abendessen' | 'snack';
          servings?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'meal_slots_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          profile_image: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          profile_image?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          profile_image?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
