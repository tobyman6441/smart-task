// Script to create a function that returns enum values
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function createEnumFunction() {
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Create function to get enum values
    const { data, error } = await supabase.rpc('pg_enum_values', { enum_name: 'task_category' })
      .catch(async () => {
        console.log('Creating pg_enum_values function...');
        
        // Function doesn't exist, create it
        const createFunctionSQL = `
          CREATE OR REPLACE FUNCTION pg_enum_values(enum_name text)
          RETURNS text[] AS $$
          BEGIN
            RETURN ARRAY(
              SELECT e.enumlabel::text
              FROM pg_type t
              JOIN pg_enum e ON t.oid = e.enumtypid
              WHERE t.typname = enum_name
              ORDER BY e.enumsortorder
            );
          END;
          $$ LANGUAGE plpgsql;
        `;
        
        return await supabase.rpc('exec_sql', { sql: createFunctionSQL })
          .catch(async () => {
            // If exec_sql doesn't exist, we need more privileges
            console.log('Cannot create function directly, please run this SQL in your database:');
            console.log(createFunctionSQL);
            return { data: null, error: new Error('Cannot create function') };
          });
      });

    if (error) {
      throw error;
    }
    
    // Try to get enum values now
    const { data: enumValues, error: enumError } = await supabase
      .rpc('pg_enum_values', { enum_name: 'task_category' });
    
    if (enumError) {
      console.log('Could not get enum values even after creating function.');
    } else {
      console.log('Valid task_category values:', enumValues);
    }
    
    // Also try task_category_new if it exists
    const { data: newEnumValues, error: newEnumError } = await supabase
      .rpc('pg_enum_values', { enum_name: 'task_category_new' });
    
    if (!newEnumError) {
      console.log('Valid task_category_new values:', newEnumValues);
    }
  } catch (error) {
    console.error('Error creating enum function:', error);
  }
}

// Run the function
createEnumFunction(); 