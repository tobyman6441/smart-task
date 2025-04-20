import { Database } from './supabase';

export type TaskType = Database['public']['Enums']['task_type'];
export type TaskCategory = Database['public']['Enums']['task_category_new'];
export type TaskSubcategory = Database['public']['Enums']['task_subcategory'];

export type Task = Database['public']['Tables']['tasks']['Row'];

export interface TaskAnalysis {
  entry: string;
  name: string;
  type: TaskType;
  category: TaskCategory;
  subcategory: TaskSubcategory | null;
  who: string;
  id?: string;
  completed?: boolean;
  due_date: string | null;
} 