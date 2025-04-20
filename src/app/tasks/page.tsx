'use client';

import { useState, useEffect } from 'react';
import TaskList from '@/components/TaskList';
import { supabase } from '@/utils/supabase';
import { Task, TaskAnalysis } from '@/types/task';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  
  useEffect(() => {
    const fetchTasks = async () => {
      const supabaseClient = supabase();
      if (!supabaseClient) {
        throw new Error('Supabase client not initialized');
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

    fetchTasks();

    // Set up real-time subscription
    const supabaseClient = supabase();
    if (!supabaseClient) {
      throw new Error('Supabase client not initialized');
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
        (payload) => {
          switch (payload.eventType) {
            case 'INSERT':
              setTasks(prev => [payload.new as Task, ...prev]);
              break;
            case 'UPDATE':
              setTasks(prev => prev.map(task => 
                task.id === payload.new.id ? payload.new as Task : task
              ));
              break;
            case 'DELETE':
              setTasks(prev => prev.filter(task => task.id !== payload.old.id));
              break;
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const handleEditTask = async (task: TaskAnalysis) => {
    if (!task.id) return;
    
    try {
      console.log('TaskAnalysis received:', {
        ...task,
        due_date_type: typeof task.due_date,
        due_date_value: task.due_date
      });
      
      const supabaseClient = supabase();
      if (!supabaseClient) {
        throw new Error('Supabase client not initialized');
      }

      // Explicitly construct the updates object
      const updates: Partial<Task> = {
        entry: task.entry,
        name: task.name,
        type: task.type,
        category: task.category,
        subcategory: task.subcategory,
        who: task.who,
        completed: task.completed || false,
        updated_at: new Date().toISOString(),
        // Explicitly handle due_date - ensure it's either a valid ISO string or null
        due_date: task.due_date || null
      };
      
      console.log('Updates being sent to database:', {
        ...updates,
        due_date_type: typeof updates.due_date,
        due_date_value: updates.due_date
      });

      const { data, error } = await supabaseClient
        .from('tasks')
        .update(updates)
        .eq('id', task.id)
        .select();

      console.log('Database response:', { data, error });

      if (error) throw error;

      // Update local state
      handleTaskUpdate(task.id, updates);
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