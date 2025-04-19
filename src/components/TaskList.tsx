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

interface TaskListProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
}

export default function TaskList({ tasks, onEditTask, onTaskUpdate }: TaskListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
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
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search list..."
          className="w-full px-4 py-2.5 pl-10 text-sm border rounded-lg bg-gray-50 text-gray-900 border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
        />
        <svg
          className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
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
          className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-200"
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
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center shrink-0">
                <span className="text-sm font-medium text-gray-500">Filter by:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border rounded-md bg-white text-gray-900 border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="">All Types</option>
                  {TASK_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border rounded-md bg-white text-gray-900 border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {TASK_CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>

                <select
                  value={selectedSubcategory}
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border rounded-md bg-white text-gray-900 border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="">All Subcategories</option>
                  {TASK_SUBCATEGORIES.map((subcategory) => (
                    <option key={subcategory} value={subcategory}>{subcategory}</option>
                  ))}
                </select>
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
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={(e) => handleComplete(task.id, e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <h3 className="text-lg font-medium text-gray-900">{task.name}</h3>
                  {task.due_date && (
                    <div className="flex items-center gap-2">
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
                <p className={`mt-3 text-gray-700 ${
                  task.completed ? 'line-through text-gray-400' : ''
                }`}>
                  {task.entry}
                </p>
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Created: {new Date(task.created_at!).toLocaleDateString()}
                  </span>
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
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 