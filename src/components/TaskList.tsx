import { useState, useRef } from 'react';
import { Database } from '@/types/supabase';
import TaskPreview from './TaskPreview';
import { supabase } from '@/utils/supabase';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskType = Database['public']['Enums']['task_type'];
type TaskCategory = Database['public']['Enums']['task_category'];
type TaskSubcategory = Database['public']['Enums']['task_subcategory'];

const TASK_TYPES: TaskType[] = ['Focus', 'Follow up', 'Save for later'];
const TASK_CATEGORIES: TaskCategory[] = [
  'My questions',
  'Questions for me',
  'My asks',
  'Asks of me',
  'Recommendations',
  'Finds',
  'Ideas',
  'Rules / promises',
  'Todos',
  'Night out',
  'Date night',
  'Family day'
];
const TASK_SUBCATEGORIES: TaskSubcategory[] = [
  'House',
  'Car',
  'Boat',
  'Travel',
  'Books',
  'Movies',
  'Shows',
  'Music',
  'Eats',
  'Podcasts',
  'Activities',
  'Appearance',
  'Career / network',
  'Rules',
  'Family / friends',
  'Gifts',
  'Finances',
  'Philanthropy',
  'Side quests'
];

type Props = {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onTaskUpdate: (taskId: string, updates: Partial<Task> | null) => void;
};

export default function TaskList({ tasks, onEditTask, onTaskUpdate }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const taskRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const handleComplete = async (taskId: string, completed: boolean) => {
    try {
      const supabaseClient = supabase();
      if (!supabaseClient) {
        throw new Error('Supabase client not initialized');
      }
      const { error } = await supabaseClient
        .from('tasks')
        .update({ completed })
        .eq('id', taskId);

      if (error) throw error;
      
      // Update local state through the parent component
      onTaskUpdate(taskId, { completed });
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task. Please try again.');
    }
  };

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
      
      // Remove the task from the list entirely
      onTaskUpdate(taskId, null);
      setDeleteTaskId(null);
      setEditingTaskId(null);
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task. Please try again.');
    }
  };

  const filteredTasks = tasks.filter(task => {
    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' || 
      task.name.toLowerCase().includes(searchLower) ||
      task.entry.toLowerCase().includes(searchLower) ||
      task.who?.toLowerCase().includes(searchLower);

    // Category filters
    const matchesType = !selectedType || task.type === selectedType;
    const matchesCategory = !selectedCategory || task.category === selectedCategory;
    const matchesSubcategory = !selectedSubcategory || task.subcategory === selectedSubcategory;

    return matchesSearch && matchesType && matchesCategory && matchesSubcategory;
  }).sort((a, b) => {
    // Sort by due date (tasks with due dates come first, sorted by earliest)
    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    if (a.due_date) return -1;
    if (b.due_date) return 1;
    
    // For tasks without due dates, sort by created date
    return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
  });

  const handleEditClick = (task: Task) => {
    if (editingTaskId === task.id) {
      setEditingTaskId(null);
    } else {
      setEditingTaskId(task.id);
      onEditTask(task);
      // Scroll the task into view with smooth behavior
      setTimeout(() => {
        taskRefs.current[task.id]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
    }
  };

  const activeFilterCount = [selectedType, selectedCategory, selectedSubcategory].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Confirmation Modal */}
      {deleteTaskId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Delete Entry
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this entry? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTaskId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-lg border border-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteTaskId)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search list..."
          className="w-full px-4 py-5 pl-10 text-sm border rounded-lg bg-gray-50 text-gray-900 border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <div className="relative">
        <button
          onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
          className="w-full flex items-center justify-between px-4 py-4 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-200"
        >
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
            </svg>
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-black text-white rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className={`w-4 h-4 transition-transform duration-200 ${isFiltersExpanded ? 'rotate-180' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        <div
          className={`mt-2 overflow-hidden transition-all duration-200 ease-in-out ${
            isFiltersExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex flex-col gap-3">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-500">Filter by:</span>
              </div>
              <div className="grid grid-cols-1 gap-3 w-full">
                <div className="relative">
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full p-3 text-sm border rounded-lg bg-white text-gray-900 border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent appearance-none pr-10"
                  >
                    <option value="">All Types</option>
                    {TASK_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" />
                    </svg>
                  </div>
                </div>

                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-3 text-sm border rounded-lg bg-white text-gray-900 border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent appearance-none pr-10"
                  >
                    <option value="">All Categories</option>
                    {TASK_CATEGORIES.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" />
                    </svg>
                  </div>
                </div>

                <div className="relative">
                  <select
                    value={selectedSubcategory}
                    onChange={(e) => setSelectedSubcategory(e.target.value)}
                    className="w-full p-3 text-sm border rounded-lg bg-white text-gray-900 border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent appearance-none pr-10"
                  >
                    <option value="">All Subcategories</option>
                    {TASK_SUBCATEGORIES.map((subcategory) => (
                      <option key={subcategory} value={subcategory}>{subcategory}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            ref={el => { taskRefs.current[task.id] = el }}
            className={`bg-white rounded-lg shadow p-6 ${task.completed ? 'opacity-50' : ''}`}
          >
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="relative flex-shrink-0 flex items-center">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={(e) => handleComplete(task.id, e.target.checked)}
                      className="peer h-6 w-6 cursor-pointer appearance-none rounded-full border-2 border-gray-300 transition-all checked:border-black checked:bg-black hover:border-black"
                      style={{ marginTop: '2px' }}
                    />
                    <svg
                      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[45%] opacity-0 text-white transition-opacity peer-checked:opacity-100"
                      width="14"
                      height="14"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M10 3L4.5 8.5L2 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <h3 className={`text-lg font-medium text-gray-900 ${
                    task.completed ? 'line-through text-gray-400' : ''
                  }`}>
                    {task.name}
                  </h3>
                </div>
                {task.due_date && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={`h-4 w-4 ${
                        new Date(task.due_date) < new Date() ? 'text-red-500' : 'text-gray-400'
                      }`}
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                      />
                    </svg>
                    <span className={`text-sm font-medium ${
                      new Date(task.due_date) < new Date() 
                        ? 'text-red-600 bg-red-50 px-2 py-0.5 rounded-full' 
                        : 'text-gray-500'
                    }`}>
                      {new Date(task.due_date) < new Date() ? 'Overdue: ' : 'Due: '}
                      {new Date(task.due_date).toLocaleDateString()} at {new Date(task.due_date).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit', hour12: true})}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {task.who && (
                  <span className="inline-flex px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    {task.who}
                  </span>
                )}
                <span className="inline-flex px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {task.type}
                </span>
                <span className="inline-flex px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {task.category}
                </span>
                {task.subcategory && (
                  <span className="inline-flex px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    {task.subcategory}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-600">
                  Created: {new Date(task.created_at!).toLocaleDateString()}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditClick(task)}
                    className="px-3 py-1.5 text-sm font-medium text-black hover:bg-gray-50 rounded-lg border-2 border-black transition-colors duration-200"
                  >
                    {editingTaskId === task.id ? 'Cancel Edit' : 'Edit'}
                  </button>
                </div>
              </div>
            </div>
            {editingTaskId === task.id && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Original Entry</h4>
                  <p className="text-sm text-gray-900">{task.entry}</p>
                </div>
                <TaskPreview
                  onCancel={() => setEditingTaskId(null)}
                  onSave={(updatedTask) => {
                    onEditTask({
                      ...task,
                      entry: updatedTask.entry,
                      name: updatedTask.name,
                      type: updatedTask.type,
                      category: updatedTask.category,
                      subcategory: updatedTask.subcategory,
                      who: updatedTask.who,
                      due_date: updatedTask.due_date || null
                    });
                    setEditingTaskId(null);
                  }}
                  analysis={{
                    id: task.id,
                    entry: task.entry,
                    name: task.name,
                    type: task.type,
                    category: task.category,
                    subcategory: task.subcategory,
                    who: task.who,
                    due_date: task.due_date
                  }}
                  mode="edit"
                />
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setDeleteTaskId(task.id)}
                    className="w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg border-2 border-red-600 transition-colors duration-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 