'use client';

import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { createClient } from '@supabase/supabase-js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Initialize Supabase client
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

interface ChartData {
  labels: string[];
  datasets: {
    label?: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string | string[];
    tension?: number;
  }[];
}

interface Task {
  created_at: string;
  type: string;
  completed: boolean;
  category: string;
}

export default function DataPage() {
  const [tasksOverTime, setTasksOverTime] = useState<ChartData>({
    labels: [],
    datasets: [],
  });
  const [completionRate, setCompletionRate] = useState<ChartData>({
    labels: [],
    datasets: [],
  });
  const [categoryDistribution, setCategoryDistribution] = useState<ChartData>({
    labels: [],
    datasets: [],
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setError('Unable to connect to database');
        return;
      }

      // Fetch tasks data
      const { data: tasks, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at');

      if (fetchError) {
        setError('Error fetching tasks');
        return;
      }

      if (!tasks) return;

      // Process data for tasks over time
      const tasksByDate = tasks.reduce((acc: Record<string, number>, task: Task) => {
        const date = new Date(task.created_at).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      setTasksOverTime({
        labels: Object.keys(tasksByDate),
        datasets: [
          {
            label: 'Tasks Created',
            data: Object.values(tasksByDate),
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
          },
        ],
      });

      // Process data for completion rate
      const todos = tasks.filter((task: Task) => task.type === 'Todo');
      const completed = todos.filter((task: Task) => task.completed).length;
      const total = todos.length;
      
      setCompletionRate({
        labels: ['Completed Todos', 'Pending Todos'],
        datasets: [
          {
            data: [completed, total - completed],
            backgroundColor: ['rgb(75, 192, 192)', 'rgb(255, 99, 132)'],
          },
        ],
      });

      // Process data for category distribution
      const categories = tasks.reduce((acc: Record<string, number>, task: Task) => {
        const category = task.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});

      setCategoryDistribution({
        labels: Object.keys(categories),
        datasets: [
          {
            data: Object.values(categories),
            backgroundColor: [
              'rgb(255, 99, 132)',
              'rgb(54, 162, 235)',
              'rgb(255, 206, 86)',
              'rgb(75, 192, 192)',
              'rgb(153, 102, 255)',
            ],
          },
        ],
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8 text-gray-900">Data</h1>
        
        {error && (
          <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Tasks Over Time</h2>
            <div className="h-[300px]">
              <Line
                data={tasksOverTime}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                    },
                  },
                }}
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Completion Rate of To-do&apos;s</h2>
            <div className="h-[300px]">
              <Pie
                data={completionRate}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                    },
                  },
                }}
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Category Distribution</h2>
            <div className="h-[300px]">
              <Bar
                data={categoryDistribution}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 