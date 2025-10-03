export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      achievements: {
        Row: {
          id: string
          name: string
          description: string
          icon: string | null
          points: number
        }
        Insert: {
          id?: string
          name: string
          description: string
          icon?: string | null
          points: number
        }
        Update: {
          id?: string
          name?: string
          description?: string
          icon?: string | null
          points?: number
        }
        Relationships: []
      }
      announcements: {
        Row: {
          id: number
          title: string
          content: string
          created_at: string | null
          expires_at: string | null
        }
        Insert: {
          id?: number
          title: string
          content: string
          created_at?: string | null
          expires_at?: string | null
        }
        Update: {
          id?: number
          title?: string
          content?: string
          created_at?: string | null
          expires_at?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          created_at: string | null
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
          created_at?: string | null
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          content?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      communities: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string
          icon: string | null
          creator_id: string
          members_count: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category: string
          icon?: string | null
          creator_id: string
          members_count?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string
          icon?: string | null
          creator_id?: string
          members_count?: number | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communities_creator_id_fkey"
            columns: ["creator_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      community_members: {
        Row: {
          id: string
          community_id: string
          user_id: string
          role: string | null
          joined_at: string | null
        }
        Insert: {
          id?: string
          community_id: string
          user_id: string
          role?: string | null
          joined_at?: string | null
        }
        Update: {
          id?: string
          community_id?: string
          user_id?: string
          role?: string | null
          joined_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      posts: {
        Row: {
          id: string
          user_id: string
          content: string
          image_url: string | null
          likes_count: number | null
          comments_count: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          image_url?: string | null
          likes_count?: number | null
          comments_count?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          image_url?: string | null
          likes_count?: number | null
          comments_count?: number | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string
          bio: string | null
          avatar_url: string | null
          cover_photo_url: string | null
          house_theme: string | null
          house_background: string | null
          house_music: string | null
          points: number | null
          level: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          username: string
          display_name: string
          bio?: string | null
          avatar_url?: string | null
          cover_photo_url?: string | null
          house_theme?: string | null
          house_background?: string | null
          house_music?: string | null
          points?: number | null
          level?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          username?: string
          display_name?: string
          bio?: string | null
          avatar_url?: string | null
          cover_photo_url?: string | null
          house_theme?: string | null
          house_background?: string | null
          house_music?: string | null
          points?: number | null
          level?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      scraps: {
        Row: {
          id: string
          from_user_id: string
          to_user_id: string
          content: string
          created_at: string | null
        }
        Insert: {
          id?: string
          from_user_id: string
          to_user_id: string
          content: string
          created_at?: string | null
        }
        Update: {
          id?: string
          from_user_id?: string
          to_user_id?: string
          content?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scraps_from_user_id_fkey"
            columns: ["from_user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scraps_to_user_id_fkey"
            columns: ["to_user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      testimonials: {
        Row: {
          id: string
          from_user_id: string
          to_user_id: string
          content: string
          status: string
          created_at: string | null
        }
        Insert: {
          id?: string
          from_user_id: string
          to_user_id: string
          content: string
          status?: string
          created_at?: string | null
        }
        Update: {
          id?: string
          from_user_id?: string
          to_user_id?: string
          content?: string
          status?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_from_user_id_fkey"
            columns: ["from_user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "testimonials_to_user_id_fkey"
            columns: ["to_user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          earned_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          achievement_id: string
          earned_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          achievement_id?: string
          earned_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          role?: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      weekly_rankings: {
        Row: {
          id: string
          user_id: string
          week_start_date: string
          week_end_date: string
          rank: number
          score: number
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          week_start_date: string
          week_end_date: string
          rank: number
          score: number
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          week_start_date?: string
          week_end_date?: string
          rank?: number
          score?: number
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "weekly_rankings_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_weekly_ranking: {
        Args: Record<string, never>
        Returns: undefined
      }
    }
    Enums: {
      user_role: 'user' | 'moderator' | 'admin' | 'prefeito'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
