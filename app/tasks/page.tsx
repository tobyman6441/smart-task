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

  useEffect(() => {
    fetchTasks();
    
    // Subscribe to real-time updates
    const supabaseClient = supabase();
    if (!supabaseClient) {
      console.error('Supabase client not initialized');
      return;
    }

    const channel = supabaseClient
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
      if (supabaseClient) {
        supabaseClient.removeChannel(channel);
      }
    };
  }, []);

  const fetchTasks = async () => {
    const supabaseClient = supabase();
    if (!supabaseClient) {
      console.error('Supabase client not initialized');
      return;
    }

    const { data, error } = await supabaseClient
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      return;
    }

    setTasks(data || []);
  };

  const handleEditTask = async (task: TaskAnalysis) => {
    if (!task.id) return;
    
    try {
      const supabaseClient = supabase();
      if (!supabaseClient) {
        throw new Error('Supabase client not initialized');
      }

      const { error } = await supabaseClient
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

      if (error) throw error;

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
      alert('Failed to save task. Please try again.');
    }
  };

  const handleTaskUpdate = (taskId: string, updates: Partial<Task> | null) => {
    setTasks(prevTasks => {
      if (updates === null) {
        // If updates is null, remove the task from the list
        return prevTasks.filter(task => task.id !== taskId);
      }
      // Otherwise, update the task as before
      return prevTasks.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      );
    });
  };

  return (
    <main className="min-h-screen bg-white text-black w-full">
        <TaskList 
          tasks={tasks} 
          onEditTask={handleEditTask} 
          onTaskUpdate={handleTaskUpdate}
        />
    </main>
  );
} 