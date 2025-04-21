'use client';

import { usePathname } from 'next/navigation';
import RippleButton from './RippleButton';

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:static md:right-auto md:w-24 md:min-h-screen bg-white border-t md:border-t-0 md:border-r border-gray-200 pb-safe z-50 backdrop-blur-lg backdrop-saturate-150 bg-white/90">
      <div className="flex md:flex-col justify-around items-center h-20 md:h-auto md:pt-8">
        <RippleButton
          href="/"
          className={`flex flex-col items-center justify-center flex-1 md:flex-none h-full md:h-auto md:py-6 md:w-full ${
            pathname === '/' ? 'text-black' : 'text-gray-500'
          } hover:bg-gray-50 transition-all duration-150`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-7 h-7"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
            />
          </svg>
          <span className="text-sm mt-1.5">New entry</span>
        </RippleButton>

        <RippleButton
          href="/tasks"
          className={`flex flex-col items-center justify-center flex-1 md:flex-none h-full md:h-auto md:py-6 md:w-full ${
            pathname === '/tasks' ? 'text-black' : 'text-gray-500'
          } hover:bg-gray-50 transition-all duration-150`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            className="w-6 h-6"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          >
            <path
              strokeLinecap="round"
              d="M2 4h12M2 8h12M2 12h12"
            />
          </svg>
          <span className="text-sm mt-1.5">View list</span>
        </RippleButton>

        <RippleButton
          href="/data"
          className={`flex flex-col items-center justify-center flex-1 md:flex-none h-full md:h-auto md:py-6 md:w-full ${
            pathname === '/data' ? 'text-black' : 'text-gray-500'
          } hover:bg-gray-50 transition-all duration-150`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-7 h-7"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z"
            />
          </svg>
          <span className="text-sm mt-1.5">Data</span>
        </RippleButton>
      </div>
    </nav>
  );
} 