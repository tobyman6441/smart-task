'use client';

import { useState } from 'react';
import TaskInput from '@/components/TaskInput';
import TaskPreview from '@/components/TaskPreview';
import { analyzeTask } from '@/services/aiAnalyzer';
import { supabase } from '@/utils/supabase';
import { Database } from '@/types/supabase';

type TaskAnalysis = {
  entry: string;
  name: string;
  type: Database['public']['Enums']['task_type'];
  category: Database['public']['Enums']['task_category'];
  subcategory: Database['public']['Enums']['task_subcategory'] | null;
  who: string;
  id?: string;
};

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<TaskAnalysis | null>(null);

  const handleTaskSubmit = async (entry: string) => {
    setIsLoading(true);
    try {
      const analysis = await analyzeTask(entry);
      setCurrentAnalysis({ entry, ...analysis });
    } catch (error) {
      console.error('Error analyzing task:', error);
      alert('Failed to analyze task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTask = async (task: TaskAnalysis) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          entry: task.entry,
          name: task.name,
          type: task.type,
          category: task.category,
          subcategory: task.subcategory,
          who: task.who
        });

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