'use client';

import { useState, useEffect } from 'react';
import TaskList from '@/components/TaskList';
import { supabase } from '@/utils/supabase';
import { Database } from '@/types/supabase';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskAnalysis = {
  entry: string;
  name: string;
  type: Database['public']['Enums']['task_type'];
  category: Database['public']['Enums']['task_category'];
  subcategory: Database['public']['Enums']['task_subcategory'] | null;
  who: string;
  id?: string;
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setError('Unable to connect to database');
      return;
    }

    fetchTasks();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('tasks_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const fetchTasks = async () => {
    if (!supabase) {
      setError('Unable to connect to database');
      return;
    }

    const { data, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching tasks:', fetchError);
      setError('Error fetching tasks');
      return;
    }

    setTasks(data || []);
  };

  const handleEditTask = async (task: TaskAnalysis) => {
    if (!task.id || !supabase) {
      setError('Unable to edit task');
      return;
    }
    
    try {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          entry: task.entry,
          name: task.name,
          type: task.type,
          category: task.category,
          subcategory: task.subcategory,
          who: task.who,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (updateError) throw updateError;

      // Update local state
      handleTaskUpdate(task.id, {
        entry: task.entry,
        name: task.name,
        type: task.type,
        category: task.category,
        subcategory: task.subcategory,
        who: task.who,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving task:', error);
      setError('Failed to save task');
    }
  };

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      )
    );
  };

  if (error) {
    return (
      <main className="min-h-screen p-4 sm:p-8 bg-white text-black">
        <div className="max-w-4xl mx-auto space-y-4 md:pl-4">
          <div className="text-red-500">{error}</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 sm:p-8 bg-white text-black">
      <div className="max-w-4xl mx-auto space-y-4 md:pl-4">
        <TaskList 
          tasks={tasks} 
          onEditTask={handleEditTask} 
          onTaskUpdate={handleTaskUpdate}
        />
      </div>
    </main>
  );
} 