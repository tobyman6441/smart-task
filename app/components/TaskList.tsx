import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import TaskPreview from '@/components/TaskPreview';
import { Database } from '@/types/supabase';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskAnalysis = {
  entry: string;
  name: string;
  type: Database['public']['Enums']['task_type'];
  category: Database['public']['Enums']['task_category_new'];
  subcategory: Database['public']['Enums']['task_subcategory'] | null;
  who: string;
  id?: string;
  due_date?: string | null;
  completed?: boolean;
};

type Props = {
  tasks: Task[];
  onEditTask: (task: TaskAnalysis) => void;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
};

export default function TaskList({ tasks, onEditTask, onTaskUpdate }: Props) {
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleDelete = async (taskId: string) => {
    try {
      const supabaseClient = supabase();
      if (!supabaseClient) {
        throw new Error('Supabase client not initialized');
      }
      const { error } = await supabaseClient
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      // Update local state
      onTaskUpdate(taskId, { completed: true });
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task. Please try again.');
    }
  };

  const handleToggleComplete = async (taskId: string, isComplete: boolean) => {
    try {
      const supabaseClient = supabase();
      if (!supabaseClient) {
        throw new Error('Supabase client not initialized');
      }
      const { error } = await supabaseClient
        .from('tasks')
        .update({ 
          completed: isComplete,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;

      // Update local state
      onTaskUpdate(taskId, { 
        completed: isComplete,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task. Please try again.');
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
  };

  const handleSaveEdit = (task: TaskAnalysis) => {
    onEditTask(task);
    setEditingTask(null);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">No tasks yet</h2>
        <p className="mt-2 text-gray-600">Add some tasks to get started!</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex items-center gap-4 p-4 bg-gray-50 border-b">
        <input 
          type="text" 
          placeholder="Search list..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm"
        />
      </div>
      <div className="min-w-full">
        <div className="grid grid-cols-[auto,2fr,1fr,1fr,1fr,1fr,1fr,1fr,1fr,auto] gap-4 px-4 py-3 bg-gray-50 border-b">
          <div>
            <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black" />
          </div>
          <div className="text-sm font-medium text-gray-500">Name</div>
          <div className="text-sm font-medium text-gray-500">Due Date</div>
          <div className="text-sm font-medium text-gray-500">Created Date</div>
          <div className="text-sm font-medium text-gray-500">Completed Date</div>
          <div className="text-sm font-medium text-gray-500">Type ▼</div>
          <div className="text-sm font-medium text-gray-500">Category ▼</div>
          <div className="text-sm font-medium text-gray-500">Subcategory ▼</div>
          <div className="text-sm font-medium text-gray-500">Who</div>
          <div></div>
        </div>
        <div className="divide-y divide-gray-200">
          {tasks.map(task => {
            if (!task.id) return null;
            
            if (editingTask?.id === task.id) {
              return (
                <div key={task.id} className="px-4 py-4">
                  <TaskPreview
                    analysis={{
                      id: task.id,
                      entry: task.entry,
                      name: task.name,
                      type: task.type,
                      category: task.category || 'Task',
                      subcategory: task.subcategory,
                      who: task.who || '',
                      due_date: task.due_date,
                      completed: task.completed || false
                    }}
                    onCancel={handleCancelEdit}
                    onSave={handleSaveEdit}
                    mode="edit"
                  />
                </div>
              );
            }

            return (
              <div key={task.id} className={`grid grid-cols-[auto,2fr,1fr,1fr,1fr,1fr,1fr,1fr,1fr,auto] gap-4 px-4 py-3 items-center ${task.completed ? 'bg-gray-50' : ''}`}>
                <div>
                  <input
                    type="checkbox"
                    checked={task.completed || false}
                    onChange={(e) => handleToggleComplete(task.id, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                  />
                </div>
                <div>
                  <div className="text-sm text-gray-900">{task.name}</div>
                  <div className="text-sm text-gray-500">{task.entry}</div>
                </div>
                <div className="text-sm text-gray-500">
                  {formatDate(task.due_date)}
                </div>
                <div className="text-sm text-gray-500">
                  {formatDate(task.created_at)}
                </div>
                <div className="text-sm text-gray-500">
                  {task.completed ? formatDate(task.updated_at) : ''}
                </div>
                <div className="text-sm text-gray-500">{task.type}</div>
                <div className="text-sm text-gray-500">{task.category}</div>
                <div className="text-sm text-gray-500">{task.subcategory}</div>
                <div className="text-sm text-gray-500">{task.who}</div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => handleEdit(task)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                      <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 