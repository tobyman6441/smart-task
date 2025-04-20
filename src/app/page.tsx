'use client';

import { useState } from 'react';
import TaskInput from '@/components/TaskInput';
import TaskPreview from '@/components/TaskPreview';
import { analyzeTask } from '@/services/aiAnalyzer';
import { supabase } from '@/utils/supabase';
import { Database } from '@/types/supabase';

type TaskType = Database['public']['Enums']['task_type'];
type TaskCategory = Database['public']['Enums']['task_category_new'];
type TaskSubcategory = Database['public']['Enums']['task_subcategory'];

type TaskAnalysis = {
  entry: string;
  name: string;
  type: TaskType;
  category: TaskCategory;
  subcategory: TaskSubcategory | null;
  who: string;
  id?: string;
  completed?: boolean;
  due_date: string | null;
};

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<TaskAnalysis | null>(null);

  const handleTaskSubmit = async (entry: string) => {
    setIsLoading(true);
    try {
      const analysis = await analyzeTask(entry);
      setCurrentAnalysis({ 
        entry, 
        ...analysis,
        due_date: analysis.due_date || null 
      });
    } catch (error) {
      console.error('Error analyzing task:', error);
      // If AI analysis fails, create a default analysis for manual entry
      setCurrentAnalysis({
        entry,
        name: '',
        type: 'Focus' as TaskType,
        category: 'Task' as TaskCategory,
        subcategory: null,
        who: '',
        completed: false,
        due_date: null
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTask = async (task: TaskAnalysis) => {
    try {
      console.log('handleSaveTask - Received task:', {
        ...task,
        due_date_exists: 'due_date' in task,
        due_date_type: typeof task.due_date,
        due_date_value: task.due_date,
        due_date_null: task.due_date === null,
        due_date_undefined: task.due_date === undefined
      });

      const supabaseClient = supabase();
      if (!supabaseClient) {
        throw new Error('Supabase client not initialized');
      }
      
      const now = new Date().toISOString();
      const taskData = {
        entry: task.entry,
        name: task.name,
        type: task.type,
        category: task.category,
        subcategory: task.subcategory,
        who: task.who,
        completed: task.completed === true,
        due_date: task.due_date || null,
        created_at: now,
        updated_at: now
      };

      console.log('handleSaveTask - Final data being sent to database:', {
        ...taskData,
        due_date_type: typeof taskData.due_date,
        due_date_value: taskData.due_date,
        due_date_null: taskData.due_date === null,
      });

      const { data, error } = await supabaseClient
        .from('tasks')
        .insert(taskData)
        .select();

      console.log('handleSaveTask - Database response:', { data, error });

      if (error) throw error;
      
      setCurrentAnalysis(null);
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Failed to save task. Please try again.');
    }
  };

  return (
    <main className="min-h-screen p-4 sm:p-8 bg-white text-black">
      <div className="max-w-4xl mx-auto space-y-8 md:pl-4">
        <h1 className="text-2xl font-bold text-center text-black">Put it on the list...</h1>
        
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200">
          <TaskInput onSubmit={handleTaskSubmit} />
          {isLoading && (
            <div className="mt-4 text-center text-gray-600">
              Analyzing your task...
            </div>
          )}
          {currentAnalysis && (
            <TaskPreview
              onCancel={() => setCurrentAnalysis(null)}
              onSave={handleSaveTask}
              analysis={currentAnalysis}
              mode="create"
            />
          )}
        </div>
      </div>
    </main>
  );
}
