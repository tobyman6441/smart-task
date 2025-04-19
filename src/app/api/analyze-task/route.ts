import OpenAI from 'openai';
import { NextResponse } from 'next/server';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { entry } = await request.json();

    if (!entry) {
      return NextResponse.json(
        { error: 'Entry text is required' },
        { status: 400 }
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
          - The type (Focus, Follow up, Save for later)
          - The category (My questions, Questions for me, My asks, Asks of me, Recommendations, Finds, Ideas, Rules / promises, Todos, Night out, Date night, Family day)
          - A subcategory if applicable (House, Car, Boat, Travel, Books, Movies, Shows, Music, Eats, Podcasts, Activities, Appearance, Career / network, Rules, Family / friends, Gifts, Finances, Philanthropy, Side quests)
          - Who it involves (if mentioned)
          - Any due dates mentioned (in ISO format)
          
          Return the analysis as a JSON object with these fields: name, type, category, subcategory, who, due_date`
        },
        {
          role: "user",
          content: entry
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const analysis = JSON.parse(completion.choices[0].message.content || '{}');

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error analyzing task:', error);
    return NextResponse.json(
      { error: 'Failed to analyze task' },
      { status: 500 }
    );
  }
} 