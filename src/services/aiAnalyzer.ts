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

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const ANALYSIS_PROMPT = `Analyze the following task entry and categorize it according to these criteria:

1. Name: Create a brief, clear name for the task
2. Type: Choose one of: ["Focus", "Follow up", "Save for later"] based on these definitions:
   - Focus: Proactive tasks or things to remember that need active attention, not just backlog items
   - Follow up: Questions, requests, or tasks involving interactions with others that can be addressed next time you meet
   - Save for later: Recommendations or discoveries (books, movies, restaurants, etc.) to reference when looking for something in that category

3. Category: Choose one of: ["My questions", "Questions for me", "My asks", "Asks of me", "Recommendations", "Finds", "Ideas", "Rules / promises", "Daily accomplishments", "Night out", "Date night", "Family day"]
4. Subcategory (optional): Choose one of: ["House", "Car", "Boat", "Travel", "Books", "Movies", "Shows", "Music", "Eats", "Podcasts", "Activities", "Appearance", "Career / network", "Rules", "Family / friends", "Gifts", "Finances", "Philanthropy", "Side quests"]
5. Who: Extract any person's name from the task. This should be their actual name (e.g., "John", "Sarah Smith"), not a generic reference. If no specific name is mentioned, use an empty string.

Guidelines for Type selection:
- Use "Focus" for tasks that need proactive attention or shouldn't be forgotten
- Use "Follow up" for interaction-based items that can wait for the next meeting/conversation
- Use "Save for later" for recommendations and things to reference in the future

For the Who field:
- "Call John about the party" → who: "John"
- "Meet Sarah Smith for coffee" → who: "Sarah Smith"
- "Mom needs help with her computer" → who: ""
- "Pick up groceries" → who: ""
- "Review proposal with Mike from marketing" → who: "Mike"

Respond in JSON format with these fields: name, type, category, subcategory (null if not applicable), who

Task entry:`;

export async function analyzeTask(entry: string): Promise<AnalysisResult> {
  try {
    const completion = await openai.chat.completions.create({
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