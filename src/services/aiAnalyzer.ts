import { Database } from '@/types/supabase';

type TaskType = Database['public']['Enums']['task_type'];
type TaskCategory = Database['public']['Enums']['task_category'];
type TaskSubcategory = Database['public']['Enums']['task_subcategory'];

export interface TaskAnalysis {
  name: string;
  type: TaskType;
  category: TaskCategory;
  subcategory: TaskSubcategory | null;
  who: string;
  due_date: string | null;
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
      const errorData = await response.json();
      throw new Error(errorData.details || errorData.error || 'Failed to analyze task');
    }

    const analysis = await response.json();
    
    // Ensure all required fields are present
    if (!analysis.name || !analysis.type || !analysis.category) {
      throw new Error('Invalid response format from analysis');
    }

    return {
      name: analysis.name,
      type: analysis.type as TaskType,
      category: analysis.category as TaskCategory,
      subcategory: analysis.subcategory as TaskSubcategory | null,
      who: analysis.who || '',
      due_date: analysis.due_date || null
    };
  } catch (error) {
    console.error('Error analyzing task:', error);
    throw error;
  }
} 