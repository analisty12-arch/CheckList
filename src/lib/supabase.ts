import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
    public: {
        Tables: {
            checklists: {
                Row: {
                    id: string
                    title: string
                    type: string
                    data: any // JSONB
                    created_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    type: string
                    data?: any
                    created_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    type?: string
                    data?: any
                    created_at?: string
                }
            }
            tasks: {
                Row: {
                    id: string
                    checklist_id: string
                    text: string
                    role: string | null
                    completed: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    checklist_id: string
                    text: string
                    role?: string | null
                    completed?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    checklist_id?: string
                    text?: string
                    role?: string | null
                    completed?: boolean
                    created_at?: string
                }
            }
        }
    }
}
