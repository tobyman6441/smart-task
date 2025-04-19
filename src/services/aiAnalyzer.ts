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

export async function analyzeTask(entry: string): Promise<AnalysisResult> {
  try {
    const client = getOpenAIClient();
    if (!client) {
      throw new Error('OpenAI client not initialized - API key missing');
    }

    const completion = await client.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that analyzes and categorizes tasks. Follow these key principles:
1. Focus type is for proactive tasks that need attention and shouldn't just sit in a backlog
2. Follow up type is for interaction-based items that can wait for the next meeting
3. Save for later type is for recommendations and discoveries to reference in the future
4. When looking for who a task is for, only extract actual names of people, not generic references like "mom" or "boss"
5. Extract any due dates or deadlines mentioned in the task. Look for:
   - Explicit dates (e.g., "due on March 15th", "deadline: 3/15/24")
   - Relative dates (e.g., "due next Friday", "deadline in 2 weeks")
   - Times (e.g., "by 3pm", "before 15:00")
   Convert all dates to ISO format (YYYY-MM-DDTHH:mm). If no time is specified, use 23:59.`
        },
        {
          role: 'user',
          content: `Analyze this task and return a JSON object with name, type, category, subcategory, who, and due_date (in ISO format if a date/deadline is mentioned, null if not mentioned):

${entry}`
        }
      ],
      model: 'gpt-3.5-turbo',
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    // Validate the response matches our types
    return {
      name: result.name || 'Untitled Task',
      type: result.type as TaskType,
      category: result.category as TaskCategory,
      subcategory: result.subcategory as TaskSubcategory | null,
      who: result.who || '',
      due_date: result.due_date || null
    };
  } catch (error) {
    console.error('Error analyzing task:', error);
    throw new Error('Failed to analyze task');
  }
} 