import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Database } from '@/types/supabase';

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

interface TaskData {
  entry: string;
  name: string;
  type: TaskType;
  category: TaskCategory;
  subcategory: TaskSubcategory | null;
  who: string;
  due_date?: string | null;
  id?: string;
}

interface TaskPreviewProps {
  onCancel: () => void;
  onSave: (task: TaskData) => void;
  analysis: TaskData;
  mode?: 'create' | 'edit';
}

const parseDateSafely = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

export default function TaskPreview({ onCancel, onSave, analysis, mode = 'create' }: TaskPreviewProps) {
  const [name, setName] = useState(analysis.name);
  const [type, setType] = useState<TaskType>(analysis.type);
  const [category, setCategory] = useState<TaskCategory>(analysis.category);
  const [subcategory, setSubcategory] = useState<TaskSubcategory | null>(analysis.subcategory);
  const [who, setWho] = useState(analysis.who || '');
  const [dueDate, setDueDate] = useState<Date | null>(parseDateSafely(analysis.due_date));

  // Update state when analysis changes
  useEffect(() => {
    setName(analysis.name);
    setType(analysis.type);
    setCategory(analysis.category);
    setSubcategory(analysis.subcategory);
    setWho(analysis.who || '');
    setDueDate(parseDateSafely(analysis.due_date));
  }, [analysis]);

  const handleSave = () => {
    onSave({
      entry: analysis.entry,
      name,
      type,
      category,
      subcategory,
      who,
      due_date: dueDate ? dueDate.toISOString() : null,
      id: analysis.id
    });
  };

  const inputClasses = "w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black bg-white text-sm transition-all duration-200 font-light";
  const labelClasses = "block text-sm font-medium text-gray-600 mb-1.5";

  return (
    <div className={`${mode === 'edit' ? 'mt-0 relative' : 'mt-8 border-t border-gray-100 pt-8'} mb-24 sm:mb-0`}>
      <h3 className={`text-xl font-semibold mb-6 text-black ${mode === 'edit' ? 'text-center' : ''}`}>
        {mode === 'create' ? 'Scan results' : 'Edit entry'}
      </h3>
      
      <div className="space-y-6">
        <div className="bg-gray-100 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Original Entry</h4>
          <p className="text-sm text-gray-900">{analysis.entry}</p>
        </div>

        <div className={`grid grid-cols-1 ${mode === 'edit' ? 'max-w-lg mx-auto' : 'md:grid-cols-2'} gap-6`}>
          <div>
            <label className={labelClasses}>Task Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClasses}
            />
          </div>

          <div>
            <label className={labelClasses}>Due Date</label>
            <div className="relative">
              <DatePicker
                selected={dueDate}
                onChange={(date) => setDueDate(date)}
                showTimeSelect
                timeFormat="h:mm aa"
                timeIntervals={15}
                dateFormat="MMMM d, yyyy h:mm aa"
                placeholderText="Set a due date (optional)"
                isClearable
                className={`${inputClasses} pl-10`}
                calendarClassName="!bg-white !border !border-gray-200 !rounded-lg !shadow-lg !font-sans"
                wrapperClassName="w-full"
                popperClassName="react-datepicker-popper"
                customInput={
                  <input className={`${inputClasses} pl-10`} />
                }
              />
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" 
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
            </div>
            {mode === 'create' && (
              <p className="mt-1.5 text-sm text-gray-500">
                {dueDate ? (
                  <>
                    Due: {dueDate.toLocaleDateString()} at{' '}
                    {dueDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </>
                ) : (
                  'Optional: Set a deadline for this task'
                )}
              </p>
            )}
          </div>

          <div>
            <label className={labelClasses}>Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TaskType)}
              className={inputClasses}
            >
              {TASK_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClasses}>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TaskCategory)}
              className={inputClasses}
            >
              {TASK_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClasses}>Subcategory</label>
            <select
              value={subcategory || ''}
              onChange={(e) => setSubcategory(e.target.value as TaskSubcategory)}
              className={inputClasses}
            >
              <option value="">None</option>
              {TASK_SUBCATEGORIES.map((sc) => (
                <option key={sc} value={sc}>{sc}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClasses}>Who</label>
            <input
              type="text"
              value={who}
              onChange={(e) => setWho(e.target.value)}
              className={inputClasses}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}