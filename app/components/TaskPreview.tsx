import { Database } from '@/types/supabase';

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
  analysis: TaskAnalysis;
  onCancel: () => void;
  onSave: (task: TaskAnalysis) => void;
  mode: 'create' | 'edit';
};

export default function TaskPreview({ analysis, onCancel, onSave, mode }: Props) {
  return (
    <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-700">Entry Name</h3>
          <p className="mt-1 text-sm text-gray-900">{analysis.name}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700">Original Entry</h3>
          <p className="mt-1 text-sm text-gray-900">{analysis.entry}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
            {analysis.type}
          </div>
          <div className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
            {analysis.category}
          </div>
          {analysis.subcategory && (
            <div className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
              {analysis.subcategory}
            </div>
          )}
          <div className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
            {analysis.who}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            type="button"
            className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(analysis)}
            type="button"
            className="rounded-md bg-black px-2.5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800"
          >
            {mode === 'create' ? 'Add Entry' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
} 