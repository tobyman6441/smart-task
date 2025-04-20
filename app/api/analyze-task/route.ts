import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { Database } from '@/types/supabase';

type TaskType = Database['public']['Enums']['task_type'];
type TaskCategory = Database['public']['Enums']['task_category'];
type TaskSubcategory = Database['public']['Enums']['task_subcategory'];

const VALID_TYPES: TaskType[] = ["Focus", "Follow up", "Save for later"];
const VALID_CATEGORIES: TaskCategory[] = [
  "My questions", "Questions for me", "My asks", "Asks of me",
  "Recommendations", "Finds", "Ideas", "Rules / promises",
  "Task", "Night out", "Date night", "Family day"
];
const VALID_SUBCATEGORIES: TaskSubcategory[] = [
  "House", "Car", "Boat", "Travel", "Books", "Movies",
  "Shows", "Music", "Eats", "Podcasts", "Activities",
  "Appearance", "Career / network", "Rules", "Family / friends",
  "Gifts", "Finances", "Philanthropy", "Side quests"
];

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Add export config for API route
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const isValidISODate = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) && dateStr === date.toISOString();
};

export async function POST(request: Request) {
  try {
    // Ensure the request is properly formatted
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return new NextResponse(
        JSON.stringify({ error: 'Content-Type must be application/json' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { entry } = await request.json();

    if (!entry) {
      return new NextResponse(
        JSON.stringify({ error: 'Entry text is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return new NextResponse(
        JSON.stringify({ error: 'OpenAI API key is not configured' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that analyzes task entries and extracts key information. 
          For each task, identify:
          - A concise name/title
          - The type (must be exactly one of: ${VALID_TYPES.join(', ')})
          - The category (must be exactly one of: ${VALID_CATEGORIES.join(', ')})
          - The subcategory if applicable (must be exactly one of: ${VALID_SUBCATEGORIES.join(', ')})
          - Who it involves (if mentioned)
          - Any due dates mentioned (in ISO format)
          
          Return the analysis as a JSON object with these fields: name, type, category, subcategory, who, due_date.
          The type, category, and subcategory values must match exactly as provided above.`
        },
        {
          role: "user",
          content: entry
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const analysisText = completion.choices[0].message.content;
    if (!analysisText) {
      throw new Error('Empty response from OpenAI');
    }

    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (error) {
      console.error('Failed to parse OpenAI response:', analysisText);
      return new NextResponse(
        JSON.stringify({ 
          error: 'Invalid JSON response from OpenAI',
          details: error instanceof Error ? error.message : 'Unknown parsing error'
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Validate the response matches our types
    if (!analysis.type || !VALID_TYPES.includes(analysis.type)) {
      return new NextResponse(
        JSON.stringify({ error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` }),
        {
          status: 422,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    if (!analysis.category || !VALID_CATEGORIES.includes(analysis.category)) {
      return new NextResponse(
        JSON.stringify({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` }),
        {
          status: 422,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    if (analysis.subcategory && !VALID_SUBCATEGORIES.includes(analysis.subcategory)) {
      return new NextResponse(
        JSON.stringify({ error: `Invalid subcategory. Must be one of: ${VALID_SUBCATEGORIES.join(', ')}` }),
        {
          status: 422,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return new NextResponse(
      JSON.stringify({
        name: analysis.name || 'Untitled Task',
        type: analysis.type as TaskType,
        category: analysis.category as TaskCategory,
        subcategory: analysis.subcategory as TaskSubcategory | null,
        who: analysis.who || '',
        due_date: analysis.due_date && isValidISODate(analysis.due_date) ? analysis.due_date : null
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in analyze-task API route:', error);
    return new NextResponse(
      JSON.stringify({
        error: 'Failed to analyze task',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
} 