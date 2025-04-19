import { Database } from '@/types/supabase';

type TaskType = Database['public']['Enums']['task_type'];
type TaskCategory = Database['public']['Enums']['task_category'];
type TaskSubcategory = Database['public']['Enums']['task_subcategory'];

export interface TaskAnalysis {
  name: string;
  type: TaskType;
  category: TaskCategory;
  subcategory?: TaskSubcategory;
  who?: string;
  due_date?: string | null;
}

export async function analyzeTask(entry: string): Promise<TaskAnalysis> {
  try {
    const response = await fetch('/api/analyze-task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ entry }),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze task');
    }

    const analysis = await response.json();
    return analysis;
  } catch (error) {
    console.error('Error analyzing task:', error);
    throw error;
  }
} 