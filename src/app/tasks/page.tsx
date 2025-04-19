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
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTasks = async () => {
    const { data, error } = await supabase
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
      const { error } = await supabase
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

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      )
    );
  };

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