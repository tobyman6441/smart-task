// Script to check what values are used for task types in the database
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function checkTaskTypes() {
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Get distinct types used in the tasks table
    const { data, error } = await supabase
      .from('tasks')
      .select('type')
      .limit(1000);

    if (error) {
      throw error;
    }

    // Count occurrences of each type
    const typeCounts = {};
    data.forEach(task => {
      const type = task.type;
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    console.log('Task types used in the database:');
    console.log(typeCounts);
  } catch (error) {
    console.error('Error checking task types:', error);
  }
}

// Run the function
checkTaskTypes(); 