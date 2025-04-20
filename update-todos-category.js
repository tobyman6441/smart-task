// Script to update all tasks with category 'Todos' to a valid category
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function updateTodosCategory() {
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // First, get the valid enum values for task_category
    let enumData;
    const { data, error: enumError } = await supabase
      .rpc('pg_enum_values', { enum_name: 'task_category_new' });
    
    if (enumError) {
      console.log('Error fetching enum values, trying alternate enum name...');
      const { data: altData, error: altEnumError } = await supabase
        .rpc('pg_enum_values', { enum_name: 'task_category' });
      
      if (altEnumError) {
        throw new Error(`Could not fetch enum values: ${altEnumError.message}`);
      }
      
      enumData = altData;
    } else {
      enumData = data;
    }
    
    console.log('Valid task_category values:', enumData);
    
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
    
    // Based on the valid enum values, choose an appropriate replacement
    // Using "Task" if available, otherwise the first available enum value
    const newCategory = enumData && enumData.includes('Task') ? 'Task' : 
                        (enumData && enumData.length > 0 ? enumData[0] : null);
    
    if (!newCategory) {
      throw new Error('Could not determine a valid category to use');
    }
    
    console.log(`Will replace 'Todos' with '${newCategory}'`);
    
    // Update all tasks with category 'Todos' to have the new category
    const { data: updateData, error } = await supabase
      .from('tasks')
      .update({ 
        category: newCategory,
        updated_at: new Date().toISOString()
      })
      .eq('category', 'Todos');

    if (error) {
      throw error;
    }
    
    console.log(`Successfully updated ${todosCount.length} tasks from category 'Todos' to '${newCategory}'`);
  } catch (error) {
    console.error('Error updating tasks:', error);
  }
}

// Run the function
updateTodosCategory(); 