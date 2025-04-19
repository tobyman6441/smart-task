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
      console.error('No entry provided in request body');
      return NextResponse.json(
        { error: 'Entry text is required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is not configured');
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    console.log('Attempting to analyze task with OpenAI...');
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
      response_format: { type: "json_object" }
    });

    const analysisText = completion.choices[0].message.content;
    if (!analysisText) {
      console.error('OpenAI returned empty response');
      throw new Error('Empty response from OpenAI');
    }

    console.log('OpenAI response:', analysisText);
    const analysis = JSON.parse(analysisText);

    return NextResponse.json(analysis);
  } catch (error) {
    // Log the full error details
    console.error('Error in analyze-task API route:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { error: 'Failed to analyze task', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 