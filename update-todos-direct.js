// Script to update all tasks with category 'Todos' to 'My asks'
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function updateTodosTasks() {
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // First, let's count how many tasks have category 'Todos'
    const { data: todosCount, error: countError } = await supabase
      .from('tasks')
      .select('id', { count: 'exact' })
      .eq('category', 'Todos');

    if (countError) {
      throw countError;
    }

    console.log(`Found ${todosCount ? todosCount.length : 0} tasks with category 'Todos'`);
    
    if (!todosCount || todosCount.length === 0) {
      console.log("No tasks with category 'Todos' found.");
      return;
    }
    
    // Update all tasks with category 'Todos' to have category 'My asks'
    // 'My asks' is a valid category according to the enum in supabase.ts
    const { data, error } = await supabase
      .from('tasks')
      .update({ 
        category: 'My asks',
        updated_at: new Date().toISOString()
      })
      .eq('category', 'Todos');

    if (error) {
      throw error;
    }
    
    console.log(`Successfully updated ${todosCount.length} tasks from category 'Todos' to 'My asks'`);
  } catch (error) {
    console.error('Error updating tasks:', error);
  }
}

// Run the function
updateTodosTasks(); 