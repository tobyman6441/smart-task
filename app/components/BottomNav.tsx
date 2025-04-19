'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:relative md:border-t-0 md:border-r md:w-64 md:min-h-screen">
      <div className="grid h-16 grid-cols-3 mx-auto md:block md:h-auto">
        <Link
          href="/"
          className={`inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 md:py-8 ${
            pathname === '/' ? 'text-black' : 'text-gray-500'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 mb-1">
            <path fillRule="evenodd" d="M10 2c-1.716 0-3.408.106-5.07.31C3.806 2.45 3 3.414 3 4.517V17.25a.75.75 0 001.075.676L10 15.082l5.925 2.844A.75.75 0 0017 17.25V4.517c0-1.103-.806-2.068-1.93-2.207A41.403 41.403 0 0010 2z" clipRule="evenodd" />
          </svg>
          <span className="text-xs">Add</span>
        </Link>

        <Link
          href="/tasks"
          className={`inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 md:py-8 ${
            pathname === '/tasks' ? 'text-black' : 'text-gray-500'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 mb-1">
            <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 012 10z" clipRule="evenodd" />
          </svg>
          <span className="text-xs">Tasks</span>
        </Link>

        <Link
          href="/data"
          className={`inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 md:py-8 ${
            pathname === '/data' ? 'text-black' : 'text-gray-500'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 mb-1">
            <path d="M15.5 2A1.5 1.5 0 0014 3.5v13a1.5 1.5 0 001.5 1.5h1a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0016.5 2h-1zM9.5 6A1.5 1.5 0 008 7.5v9A1.5 1.5 0 009.5 18h1a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0010.5 6h-1zM3.5 10A1.5 1.5 0 002 11.5v5A1.5 1.5 0 003.5 18h1A1.5 1.5 0 006 16.5v-5A1.5 1.5 0 004.5 10h-1z" />
          </svg>
          <span className="text-xs">Data</span>
        </Link>
      </div>
    </nav>
  );
} 