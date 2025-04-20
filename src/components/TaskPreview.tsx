import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { TaskType, TaskCategory, TaskSubcategory, TaskAnalysis } from '@/types/task';

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

interface TaskPreviewProps {
  onCancel: () => void;
  onSave: (task: TaskAnalysis) => void;
  onDelete?: (taskId: string) => void;
  analysis: TaskAnalysis;
  mode?: 'create' | 'edit';
}

const parseDateSafely = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

export default function TaskPreview({ onCancel, onSave, onDelete, analysis, mode = 'create' }: TaskPreviewProps) {
  const [name, setName] = useState(analysis.name);
  const [type, setType] = useState<TaskType>(analysis.type);
  const [category, setCategory] = useState<TaskCategory>(analysis.category);
  const [subcategory, setSubcategory] = useState<TaskSubcategory | null>(analysis.subcategory);
  const [who, setWho] = useState(analysis.who || '');
  const [dueDate, setDueDate] = useState<Date | null>(analysis.due_date ? new Date(analysis.due_date) : null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Update state when analysis changes
  useEffect(() => {
    setName(analysis.name);
    setType(analysis.type);
    setCategory(analysis.category);
    setSubcategory(analysis.subcategory);
    setWho(analysis.who || '');
    const parsed = parseDateSafely(analysis.due_date);
    console.log('useEffect dueDate update:', {
      input: analysis.due_date,
      parsed,
      isDate: parsed instanceof Date,
      value: parsed ? parsed.toISOString() : null
    });
    setDueDate(parsed);
  }, [analysis]);

  const handleDateChange = (date: Date | null) => {
    console.log('handleDateChange:', {
      date,
      isDate: date instanceof Date,
      type: typeof date,
      value: date ? date.toISOString() : null
    });
    setDueDate(date);
  };

  const handleSave = (completed: boolean = false) => {
    // Create the task object with explicit due_date handling
    const taskToSave: TaskAnalysis = {
      entry: analysis.entry,
      name,
      type,
      category,
      subcategory,
      who,
      // Explicitly convert Date to ISO string when present, otherwise null
      due_date: dueDate ? dueDate.toISOString() : null,
      id: analysis.id,
      completed: completed || analysis.completed || false
    };

    console.log('TaskPreview handleSave:', {
      dueDate,
      isDate: dueDate instanceof Date,
      type: typeof dueDate,
      raw_value: dueDate,
      iso_value: dueDate ? dueDate.toISOString() : null,
      final_due_date: taskToSave.due_date
    });

    onSave(taskToSave);
  };

  const handleLogEntry = () => {
    const now = new Date();
    setDueDate(now);
    const taskToSave: TaskAnalysis = {
      entry: analysis.entry,
      name,
      type,
      category,
      subcategory,
      who,
      due_date: now.toISOString(),
      id: analysis.id,
      completed: true
    };

    console.log('TaskPreview logging entry:', {
      ...taskToSave,
      due_date_type: typeof now,
      due_date_instanceof_date: now instanceof Date,
      due_date_raw: now,
      due_date_final: taskToSave.due_date
    });

    onSave(taskToSave);
  };

  const handleDelete = () => {
    if (onDelete && analysis.id) {
      onDelete(analysis.id);
    }
  };

  const inputClasses = "w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black bg-white text-sm transition-all duration-200 font-light appearance-none";
  const labelClasses = "block text-sm font-medium text-gray-600 mb-1.5";

  return (
    <>
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
              <label className={labelClasses}>Entry Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClasses}
                placeholder="Enter entry name"
              />
            </div>

            <div>
              <label className={labelClasses}>Due Date</label>
              <div className="w-full relative">
                <DatePicker
                  selected={dueDate}
                  onChange={handleDateChange}
                  dateFormat="MMMM d, yyyy"
                  className={inputClasses}
                  placeholderText="Select due date (optional)"
                  isClearable
                  wrapperClassName="w-full"
                />
              </div>
            </div>

            <div>
              <label className={labelClasses}>Type</label>
              <div className="relative">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as TaskType)}
                  className={`${inputClasses} pr-10`}
                >
                  {TASK_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className={labelClasses}>Category</label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TaskCategory)}
                  className={`${inputClasses} pr-10`}
                >
                  {TASK_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className={labelClasses}>Subcategory</label>
              <div className="relative">
                <select
                  value={subcategory || ''}
                  onChange={(e) => setSubcategory(e.target.value as TaskSubcategory)}
                  className={`${inputClasses} pr-10`}
                >
                  <option value="">None</option>
                  {TASK_SUBCATEGORIES.map((sc) => (
                    <option key={sc} value={sc}>{sc}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" />
                  </svg>
                </div>
              </div>
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

          <div className="flex flex-col gap-3">
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              {mode === 'create' && (
                <button
                  type="button"
                  onClick={handleLogEntry}
                  className="w-full sm:w-auto px-4 py-4 text-sm font-medium text-black bg-gray-100 border border-transparent rounded-lg shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                  </svg>
                  Log Entry
                </button>
              )}
              <button
                type="button"
                onClick={() => handleSave(false)}
                className="w-full sm:w-auto px-4 py-4 text-sm font-medium text-white bg-black border border-transparent rounded-lg shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
              >
                {mode === 'create' ? 'Add Entry' : 'Save Changes'}
              </button>
            </div>
            {mode === 'edit' && onDelete && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete Entry
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
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
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-lg border border-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDelete();
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}