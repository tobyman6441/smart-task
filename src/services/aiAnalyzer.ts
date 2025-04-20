import { Database } from '@/types/supabase';

type TaskType = Database['public']['Enums']['task_type'];
type TaskCategory = Database['public']['Enums']['task_category_new'];
type TaskSubcategory = Database['public']['Enums']['task_subcategory'];

export interface TaskAnalysis {
  name: string;
  type: TaskType;
  category: TaskCategory;
  subcategory: TaskSubcategory | null;
  who: string;
  due_date: string | null;
}

export async function analyzeTask(entry: string, due_date?: string | null): Promise<TaskAnalysis> {
  try {
    // Log the request
    console.log('Sending analysis request for entry:', entry);

    const response = await fetch('/api/analyze-task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ 
        entry,
        due_date 
      }),
    });

    // Log the response status and headers
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    // If response is not ok, try to read the error message
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to analyze task');
      } else {
        // If not JSON, read as text for debugging
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned an invalid response');
      }
    }

    // For successful responses, parse JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Expected JSON but got:', text);
      throw new Error('Server returned non-JSON response');
    }

    const analysis = await response.json();
    
    // Log the parsed response
    console.log('Received analysis:', analysis);

    // Ensure all required fields are present
    if (!analysis.name || !analysis.type || !analysis.category) {
      console.error('Invalid analysis response:', analysis);
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