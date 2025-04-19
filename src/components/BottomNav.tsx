'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed md:static bottom-0 left-0 right-0 md:right-auto md:w-20 md:min-h-screen bg-white border-t md:border-t-0 md:border-r border-gray-200 pb-safe">
      <div className="flex md:flex-col justify-around items-center h-16 md:h-auto md:pt-8">
        <Link
          href="/"
          className={`flex flex-col items-center justify-center flex-1 md:flex-none h-full md:h-auto md:py-4 md:w-full ${
            pathname === '/' ? 'text-black' : 'text-gray-500'
          } hover:bg-gray-50 transition-colors`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
            />
          </svg>
          <span className="text-xs mt-1">New entry</span>
        </Link>

        <Link
          href="/tasks"
          className={`flex flex-col items-center justify-center flex-1 md:flex-none h-full md:h-auto md:py-4 md:w-full ${
            pathname === '/tasks' ? 'text-black' : 'text-gray-500'
          } hover:bg-gray-50 transition-colors`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 16.5h8M8 12h8m-8-5.5h8"
            />
          </svg>
          <span className="text-xs mt-1">View list</span>
        </Link>

        <Link
          href="/data"
          className={`flex flex-col items-center justify-center flex-1 md:flex-none h-full md:h-auto md:py-4 md:w-full ${
            pathname === '/data' ? 'text-black' : 'text-gray-500'
          } hover:bg-gray-50 transition-colors`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
            />
          </svg>
          <span className="text-xs mt-1">Data</span>
        </Link>
      </div>
    </nav>
  );
} 