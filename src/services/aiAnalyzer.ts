import OpenAI from 'openai';
import { Database } from '@/types/supabase';

type TaskType = Database['public']['Enums']['task_type'];
type TaskCategory = Database['public']['Enums']['task_category'];
type TaskSubcategory = Database['public']['Enums']['task_subcategory'];

interface AnalysisResult {
  name: string;
  type: TaskType;
  category: TaskCategory;
  subcategory: TaskSubcategory | null;
  who: string;
  due_date: string | null;
}

let openai: OpenAI | null = null;

// Initialize OpenAI client only when needed and when API key is available
const getOpenAIClient = () => {
  if (!openai && typeof window !== 'undefined' && process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });
  }
  return openai;
};

export interface TaskAnalysis {
  name: string;
  type: string;
  category: string;
  subcategory?: string;
  who?: string;
  due_date?: string;
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