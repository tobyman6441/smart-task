// Script to update all tasks with type 'Todo' to type 'Task'
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function updateTodoTasks() {
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // First, let's count how many "Todo" tasks we have
    const { data: todoCount, error: countError } = await supabase
      .from('tasks')
      .select('id', { count: 'exact' })
      .eq('type', 'Todo');

    if (countError) {
      throw countError;
    }

    console.log(`Found ${todoCount.length} tasks with type 'Todo'`);
    
    // Update all tasks with type 'Todo' to have type 'Task'
    const { data, error } = await supabase
      .from('tasks')
      .update({ 
        type: 'Task',
        updated_at: new Date().toISOString()
      })
      .eq('type', 'Todo');

    if (error) {
      throw error;
    }
    
    console.log(`Successfully updated ${todoCount.length} tasks from 'Todo' to 'Task'`);
  } catch (error) {
    console.error('Error updating tasks:', error);
  }
}

// Run the function
updateTodoTasks(); 