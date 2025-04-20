// Script to check what categories are used in the database
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function checkTaskCategories() {
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Get all tasks to see what categories are used
    const { data, error } = await supabase
      .from('tasks')
      .select('category')
      .limit(1000);

    if (error) {
      throw error;
    }

    // Count occurrences of each category
    const categoryCounts = {};
    data.forEach(task => {
      const category = task.category || 'Uncategorized';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    console.log('Task categories used in the database:');
    console.log(categoryCounts);
  } catch (error) {
    console.error('Error checking task categories:', error);
  }
}

// Run the function
checkTaskCategories(); 