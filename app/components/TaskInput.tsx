'use client';

import { useState } from 'react';

type Props = {
  onSubmit: (entry: string) => void;
};

export default function TaskInput({ onSubmit }: Props) {
  const [entry, setEntry] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry.trim()) return;
    
    onSubmit(entry.trim());
    setEntry('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="task" className="sr-only">
          Task
        </label>
        <textarea
          id="task"
          name="task"
          rows={3}
          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6"
          placeholder="What would you like to add to your list?"
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
        />
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
        >
          Add to List
        </button>
      </div>
    </form>
  );
} 