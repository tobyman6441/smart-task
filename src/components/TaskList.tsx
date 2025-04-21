import { useState, useRef } from 'react';
import TaskPreview from './TaskPreview';
import { supabase } from '@/utils/supabase';
import { Task, TaskType, TaskCategory, TaskSubcategory, TaskAnalysis } from '@/types/task';

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
  'Task',
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
  onEditTask: (task: TaskAnalysis) => void;
  onTaskUpdate: (taskId: string, updates: Partial<Task> | null) => void;
};

// Add type for sortable fields
type SortableField = keyof Pick<Task, 'name' | 'created_at' | 'due_date' | 'type' | 'category' | 'subcategory' | 'who'>;

export default function TaskList({ tasks, onEditTask, onTaskUpdate }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [selectedWho, setSelectedWho] = useState<string>('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: SortableField;
    direction: 'ascending' | 'descending';
  } | null>(null);
  const taskRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Get unique values for filters
  const uniqueTypes = Array.from(new Set(tasks.map(task => task.type))).filter(Boolean) as TaskType[];
  const uniqueCategories = Array.from(new Set(tasks.map(task => task.category))).filter(Boolean) as TaskCategory[];
  const uniqueSubcategories = Array.from(new Set(tasks.map(task => task.subcategory))).filter(Boolean) as TaskSubcategory[];
  const uniqueWhos = Array.from(new Set(tasks.map(task => task.who))).filter(Boolean);

  const handleComplete = async (taskId: string, completed: boolean) => {
    try {
      const supabaseClient = supabase();
      if (!supabaseClient) {
        throw new Error('Supabase client not initialized');
      }
      const { error } = await supabaseClient
        .from('tasks')
        .update({ 
          completed,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;
      
      // Update local state through the parent component
      onTaskUpdate(taskId, { 
        completed,
        updated_at: new Date().toISOString()
      });
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

  const sortTasks = (tasksToSort: Task[]) => {
    if (!sortConfig) return tasksToSort;

    return [...tasksToSort].sort((a, b) => {
      if (sortConfig.key === 'created_at' || sortConfig.key === 'due_date') {
        const aDate = a[sortConfig.key] ? new Date(a[sortConfig.key] as string).getTime() : 0;
        const bDate = b[sortConfig.key] ? new Date(b[sortConfig.key] as string).getTime() : 0;
        return sortConfig.direction === 'ascending' ? aDate - bDate : bDate - aDate;
      }

      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';
      
      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  };

  const requestSort = (key: SortableField) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const filteredTasks = sortTasks(tasks.filter(task => {
    if (!showCompleted && task.completed === true) {
      return false;
    }

    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' || 
      task.name.toLowerCase().includes(searchLower) ||
      task.entry.toLowerCase().includes(searchLower) ||
      (task.who?.toLowerCase() || '').includes(searchLower);

    const matchesType = !selectedType || task.type === selectedType;
    const matchesCategory = !selectedCategory || task.category === selectedCategory;
    const matchesSubcategory = !selectedSubcategory || task.subcategory === selectedSubcategory;
    const matchesWho = !selectedWho || task.who === selectedWho;

    return matchesSearch && matchesType && matchesCategory && matchesSubcategory && matchesWho;
  }));

  const handleEditClick = (task: Task) => {
    if (editingTaskId === task.id) {
      setEditingTaskId(null);
    } else {
      setEditingTaskId(task.id || '');
      // Ensure we have valid values for required fields
      const taskType = TASK_TYPES.includes(task.type as TaskType) 
        ? task.type as TaskType 
        : TASK_TYPES[0];
      
      // Always provide a valid category, defaulting to 'Task' or the first available category
      const taskCategory = task.category && TASK_CATEGORIES.includes(task.category as TaskCategory)
        ? task.category as TaskCategory
        : (TASK_CATEGORIES.includes('Task') ? 'Task' as TaskCategory : TASK_CATEGORIES[0]);

      const taskSubcategory = task.subcategory && TASK_SUBCATEGORIES.includes(task.subcategory as TaskSubcategory)
        ? task.subcategory as TaskSubcategory
        : null;

      const analysis: TaskAnalysis = {
        id: task.id || '',
        entry: task.entry,
        name: task.name,
        type: taskType,
        category: taskCategory,
        subcategory: taskSubcategory,
        who: task.who || '',
        completed: task.completed || false,
        due_date: task.due_date
      };
      onEditTask(analysis);
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

  // Add FilterButton component
  const FilterButton = ({ 
    column, 
    options, 
    value, 
    onChange 
  }: { 
    column: SortableField, 
    options: (string | TaskType | TaskCategory | TaskSubcategory)[], 
    value: string, 
    onChange: (value: string) => void 
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center hover:text-gray-900 group -mt-0.5"
          title={`Filter by ${column}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`w-4 h-4 translate-y-[1px] transition-colors duration-200 ${value ? 'text-black' : 'text-gray-400'}`}
          >
            <path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z" clipRule="evenodd" />
          </svg>
        </button>
        {isOpen && (
          <div className="absolute z-10 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="py-1">
              <button
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${!value ? 'bg-gray-50' : ''}`}
              >
                All
              </button>
              {options.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    onChange(option.toString());
                    setIsOpen(false);
                  }}
                  className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${value === option.toString() ? 'bg-gray-50' : ''}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Update column headers to include both sort and filter
  const ColumnHeader = ({ 
    column,
    options,
    filterValue,
    onFilterChange
  }: { 
    column: SortableField,
    options?: (string | TaskType | TaskCategory | TaskSubcategory)[],
    filterValue?: string,
    onFilterChange?: (value: string) => void
  }) => {
    const isSorted = sortConfig?.key === column;
    
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => requestSort(column)}
          className="inline-flex items-center gap-1 hover:text-gray-900"
        >
          <span>{column === 'created_at' ? 'Created' : column === 'due_date' ? 'Due Date' : column}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`w-4 h-4 transition-transform ${
              isSorted && sortConfig?.direction === 'descending' ? 'rotate-180' : ''
            }`}
          >
            <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
          </svg>
        </button>
        {options && onFilterChange && (
          <FilterButton
            column={column}
            options={options}
            value={filterValue || ''}
            onChange={onFilterChange}
          />
        )}
      </div>
    );
  };

  return (
    <div className="w-full px-2 pt-4 bg-white">
      {/* Search and filters section */}
      <div className="relative w-full max-w-none mb-4">
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

      {/* Filters button and panel */}
      <div className="relative w-full max-w-none mb-4 md:hidden">
        <div className="flex gap-2 items-center mb-4">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className={`flex items-center gap-2 px-4 py-4 text-sm font-medium rounded-lg border transition-colors duration-200 ${
              showCompleted
                ? 'bg-black text-white border-black hover:bg-gray-800'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              {showCompleted ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              ) : (
                <>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </>
              )}
              {showCompleted && (
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              )}
            </svg>
            {showCompleted ? 'Hide Completed' : 'Show Completed'}
          </button>
          <button
            onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
            className="flex-1 flex items-center justify-between px-4 py-4 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-200"
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
        </div>

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
              
              {/* Filter buttons for mobile */}
              <div className="flex flex-col gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Type</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedType('')}
                      className={`px-3 py-1 text-sm rounded-full border ${
                        selectedType === '' 
                          ? 'bg-black text-white border-black' 
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      All
                    </button>
                    {TASK_TYPES.map((type) => (
                      <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={`px-3 py-1 text-sm rounded-full border ${
                          selectedType === type 
                            ? 'bg-black text-white border-black' 
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Category</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory('')}
                      className={`px-3 py-1 text-sm rounded-full border ${
                        selectedCategory === '' 
                          ? 'bg-black text-white border-black' 
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      All
                    </button>
                    {TASK_CATEGORIES.map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-3 py-1 text-sm rounded-full border ${
                          selectedCategory === category 
                            ? 'bg-black text-white border-black' 
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Subcategory</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedSubcategory('')}
                      className={`px-3 py-1 text-sm rounded-full border ${
                        selectedSubcategory === '' 
                          ? 'bg-black text-white border-black' 
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      All
                    </button>
                    {TASK_SUBCATEGORIES.map((subcategory) => (
                      <button
                        key={subcategory}
                        onClick={() => setSelectedSubcategory(subcategory)}
                        className={`px-3 py-1 text-sm rounded-full border ${
                          selectedSubcategory === subcategory 
                            ? 'bg-black text-white border-black' 
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {subcategory}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Who</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedWho('')}
                      className={`px-3 py-1 text-sm rounded-full border ${
                        selectedWho === '' 
                          ? 'bg-black text-white border-black' 
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      All
                    </button>
                    {uniqueWhos.map((who) => (
                      <button
                        key={who}
                        onClick={() => setSelectedWho(who)}
                        className={`px-3 py-1 text-sm rounded-full border ${
                          selectedWho === who 
                            ? 'bg-black text-white border-black' 
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {who}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task list section */}
      <div className="w-full max-w-none bg-white">
        {/* Desktop spreadsheet view */}
        <div className="hidden md:block w-full bg-white">
          <div className="w-full divide-y divide-gray-200 bg-white rounded-lg border border-gray-200">
            <div className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
              <div className="grid grid-cols-[48px_minmax(200px,2fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)_48px] gap-x-4 px-6 py-3 text-sm font-medium text-gray-500">
                <div className="flex items-center justify-center">
                  <button
                    onClick={() => setShowCompleted(!showCompleted)}
                    className={`rounded-full p-1.5 transition-colors duration-200 ${
                      showCompleted ? 'bg-black text-white hover:bg-gray-800' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }`}
                    title={showCompleted ? 'Hide completed tasks' : 'Show completed tasks'}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      {showCompleted ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      ) : (
                        <>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </>
                      )}
                      {showCompleted && (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      )}
                    </svg>
                  </button>
                </div>
                <div>
                  <ColumnHeader column="name" />
                </div>
                <div className="whitespace-nowrap">
                  <ColumnHeader column="created_at" />
                </div>
                <div className="whitespace-nowrap">
                  <ColumnHeader column="due_date" />
                </div>
                <div>
                  <ColumnHeader 
                    column="type"
                    options={uniqueTypes}
                    filterValue={selectedType}
                    onFilterChange={setSelectedType}
                  />
                </div>
                <div>
                  <ColumnHeader 
                    column="category"
                    options={uniqueCategories}
                    filterValue={selectedCategory}
                    onFilterChange={setSelectedCategory}
                  />
                </div>
                <div>
                  <ColumnHeader 
                    column="subcategory"
                    options={uniqueSubcategories}
                    filterValue={selectedSubcategory}
                    onFilterChange={setSelectedSubcategory}
                  />
                </div>
                <div>
                  <ColumnHeader 
                    column="who"
                    options={uniqueWhos}
                    filterValue={selectedWho}
                    onFilterChange={setSelectedWho}
                  />
                </div>
                <div></div>
              </div>
            </div>
            <div className="divide-y divide-gray-200 bg-white">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  ref={el => { taskRefs.current[task.id] = el }}
                  className={`grid grid-cols-[48px_minmax(200px,2fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)_48px] gap-x-4 px-6 py-3 hover:bg-gray-50 transition-colors duration-150 ${
                    task.completed ? 'bg-gray-50/50' : ''
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <div className="relative flex-shrink-0 flex items-center">
                      <input
                        type="checkbox"
                        checked={task.completed || false}
                        onChange={(e) => handleComplete(task.id, e.target.checked)}
                        className="peer appearance-none !h-4 !w-4 !rounded !border-2 !border-gray-300 bg-white cursor-pointer checked:!bg-black checked:!border-black hover:!border-black focus:outline-none focus:!ring-0"
                      />
                      <svg
                        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 text-white transition-opacity peer-checked:opacity-100"
                        width="10"
                        height="10"
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
                  </div>
                  <div className="flex items-center min-w-0 pr-4">
                    <span className={`text-sm truncate ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {task.name}
                    </span>
                  </div>
                  <div className="flex items-center whitespace-nowrap">
                    <span className="text-sm text-gray-500">
                      {task.created_at ? new Date(task.created_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <div className="flex items-center whitespace-nowrap">
                    <span className="text-sm text-gray-500">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 truncate max-w-full">
                      {task.type}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 truncate max-w-full">
                      {task.category}
                    </span>
                  </div>
                  <div className="flex items-center">
                    {task.subcategory && (
                      <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 truncate max-w-full">
                        {task.subcategory}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 truncate max-w-full">
                      {task.who}
                    </span>
                  </div>
                  <div className="flex items-center justify-end">
                    <button
                      onClick={() => handleEditClick(task)}
                      className="text-gray-400 hover:text-gray-600 transition-colors duration-150"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                        <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile card view */}
        <div className="md:hidden space-y-4">
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
                        checked={task.completed || false}
                        onChange={(e) => handleComplete(task.id, e.target.checked)}
                        className="peer appearance-none !h-4 !w-4 !rounded !border-2 !border-gray-300 bg-white cursor-pointer checked:!bg-black checked:!border-black hover:!border-black focus:outline-none focus:!ring-0"
                      />
                      <svg
                        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 text-white transition-opacity peer-checked:opacity-100"
                        width="10"
                        height="10"
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditClick(task)}
                      className="rounded-full p-2 hover:bg-gray-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                        <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                    {task.type}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                    {task.category}
                  </span>
                  {task.subcategory && (
                    <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                      {task.subcategory}
                    </span>
                  )}
                  {task.who && (
                    <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                      {task.who}
                    </span>
                  )}
                  {task.due_date && (
                    <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                      Due: {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric'
                      }) : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit mode and delete confirmation modal */}
      {editingTaskId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-lg max-h-[90vh] overflow-y-auto">
            {(() => {
              const task = tasks.find(t => t.id === editingTaskId);
              if (!task) return null;

              // Ensure we have valid values for required fields
              const taskType = TASK_TYPES.includes(task.type as TaskType) 
                ? task.type as TaskType 
                : TASK_TYPES[0];
              
              // Always provide a valid category, defaulting to 'Task' or the first available category
              const taskCategory = task.category && TASK_CATEGORIES.includes(task.category as TaskCategory)
                ? task.category as TaskCategory
                : (TASK_CATEGORIES.includes('Task') ? 'Task' as TaskCategory : TASK_CATEGORIES[0]);

              const taskSubcategory = task.subcategory && TASK_SUBCATEGORIES.includes(task.subcategory as TaskSubcategory)
                ? task.subcategory as TaskSubcategory
                : null;

              const analysis: TaskAnalysis = {
                id: editingTaskId,
                entry: task.entry,
                name: task.name,
                type: taskType,
                category: taskCategory,
                subcategory: taskSubcategory,
                who: task.who || '',
                completed: task.completed || false,
                due_date: task.due_date
              };

              return (
                <TaskPreview
                  key={editingTaskId}
                  analysis={analysis}
                  onCancel={() => setEditingTaskId(null)}
                  onSave={(updatedTask) => {
                    onEditTask({
                      ...updatedTask,
                      id: editingTaskId
                    });
                    setEditingTaskId(null);
                  }}
                  onDelete={() => handleDelete(editingTaskId)}
                  mode="edit"
                />
              );
            })()}
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
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
    </div>
  );
} 