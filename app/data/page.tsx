'use client';

import { useEffect, useState, useCallback } from 'react';
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
import { Bar, Pie } from 'react-chartjs-2';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import MultiSelect from '../components/MultiSelect';

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
  ArcElement,
  ChartDataLabels
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
  updated_at: string;
  type: Database['public']['Enums']['task_type'];
  completed: boolean;
  category: Database['public']['Enums']['task_category_new'] | null;
  subcategory: Database['public']['Enums']['task_subcategory'] | null;
  entry?: string;
  name?: string;
  who?: string;
}

export default function DataPage() {
  const [tasksCompletedOverTime, setTasksCompletedOverTime] = useState<ChartData>({
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
  const [subcategoryDistribution, setSubcategoryDistribution] = useState<ChartData>({
    labels: [],
    datasets: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [sortedCategoryData, setSortedCategoryData] = useState<Array<[string, number, number]>>([]);
  const [sortedSubcategoryData, setSortedSubcategoryData] = useState<Array<[string, number, number]>>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["Task"]);
  const [selectedTimelineCategories, setSelectedTimelineCategories] = useState<string[]>(["Task"]);
  const [selectedWhoCategories, setSelectedWhoCategories] = useState<string[]>(["All"]);
  const [selectedWhoSubcategories, setSelectedWhoSubcategories] = useState<string[]>(["All"]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  
  // New state for who distribution
  const [whoDistribution, setWhoDistribution] = useState<ChartData>({
    labels: [],
    datasets: [],
  });
  const [sortedWhoData, setSortedWhoData] = useState<Array<[string, number, number]>>([]);
  const [allSubcategories, setAllSubcategories] = useState<string[]>([]);

  const updateTasksCompletedChart = useCallback((categories: string[]) => {
    if (!allTasks) return;
    
    const filteredTasks = categories.includes("All") 
      ? allTasks 
      : allTasks.filter(task => categories.includes(task.category || 'Uncategorized'));

    // Process data for tasks completed over time by subcategory
    const completedTasks = filteredTasks.filter(task => task.completed);
    
    // Get all unique subcategories
    const allSubcategories = Array.from(new Set(completedTasks.map(task => task.subcategory || 'None')));
    
    // Group tasks by date and subcategory
    const tasksByDateAndSubcategory: Record<string, Record<string, number>> = {};
    
    completedTasks.forEach(task => {
      const date = new Date(task.updated_at).toLocaleDateString();
      const subcategory = task.subcategory || 'None';
      
      if (!tasksByDateAndSubcategory[date]) {
        tasksByDateAndSubcategory[date] = {};
      }
      
      tasksByDateAndSubcategory[date][subcategory] = (tasksByDateAndSubcategory[date][subcategory] || 0) + 1;
    });
    
    // Sort dates chronologically
    const sortedDates = Object.keys(tasksByDateAndSubcategory).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });
    
    // Create datasets for each subcategory
    const subcategoryDatasets = allSubcategories.map((subcategory, index) => {
      // Generate a grayscale color based on index
      const grayShade = Math.max(0, Math.min(200, index * 40));
      const color = `rgb(${grayShade}, ${grayShade}, ${grayShade})`;
      
      return {
        label: subcategory,
        data: sortedDates.map(date => 
          tasksByDateAndSubcategory[date][subcategory] || 0
        ),
        backgroundColor: color,
      };
    });
    
    setTasksCompletedOverTime({
      labels: sortedDates,
      datasets: subcategoryDatasets,
    });
  }, [allTasks]);

  const updateSubcategoryChart = useCallback((categories: string[]) => {
    if (!allTasks) return;

    const filteredTasks = categories.includes("All") 
      ? allTasks 
      : allTasks.filter(task => categories.includes(task.category || 'Uncategorized'));

    // Process data for subcategory distribution
    const subcategories = filteredTasks.reduce((acc: Record<string, number>, task: Task) => {
      const subcategory = task.subcategory || 'None';
      acc[subcategory] = (acc[subcategory] || 0) + 1;
      return acc;
    }, {});

    // Sort subcategories by count (descending)
    const sortedSubcategories: Array<[string, number]> = Object.entries(subcategories)
      .sort(([, countA], [, countB]) => (countB as number) - (countA as number))
      .map(([subcategory, count]) => [subcategory, count as number]);

    // Calculate percentages and store full data
    const sortedWithPercentages: Array<[string, number, number]> = sortedSubcategories.map(([subcategory, count]) => {
      const percentage = Math.round((count / filteredTasks.length) * 100);
      return [subcategory, count, percentage];
    });
    
    // Store sorted data for the table
    setSortedSubcategoryData(sortedWithPercentages);

    const sortedSubcategoriesObj = sortedSubcategories.reduce((acc: Record<string, number>, [subcategory, count]) => {
      acc[subcategory] = count;
      return acc;
    }, {});

    setSubcategoryDistribution({
      labels: Object.keys(sortedSubcategoriesObj),
      datasets: [
        {
          data: Object.values(sortedSubcategoriesObj),
          backgroundColor: [
            'rgb(0, 0, 0)',
            'rgb(50, 50, 50)',
            'rgb(100, 100, 100)',
            'rgb(150, 150, 150)',
            'rgb(200, 200, 200)',
          ],
        },
      ],
    });
  }, [allTasks]);

  const updateWhoChart = useCallback((categories: string[], subcategories: string[]) => {
    if (!allTasks) return;

    let filteredTasks = allTasks;

    // Filter by categories if not "All"
    if (!categories.includes("All")) {
      filteredTasks = filteredTasks.filter(task => 
        categories.includes(task.category || 'Uncategorized')
      );
    }

    // Filter by subcategories if not "All"
    if (!subcategories.includes("All")) {
      filteredTasks = filteredTasks.filter(task => 
        subcategories.includes(task.subcategory || 'None')
      );
    }

    // Process data for who distribution
    const whoDistributionData = filteredTasks.reduce((acc: Record<string, number>, task: Task) => {
      const who = task.who || 'Unassigned';
      acc[who] = (acc[who] || 0) + 1;
      return acc;
    }, {});

    // Sort who data by count (descending)
    const sortedWhoEntries: Array<[string, number]> = Object.entries(whoDistributionData)
      .sort(([, countA], [, countB]) => countB - countA)
      .map(([who, count]) => [who, count]);

    // Calculate percentages and store full data
    const sortedWithPercentages: Array<[string, number, number]> = sortedWhoEntries.map(([who, count]) => {
      const percentage = Math.round((count / filteredTasks.length) * 100);
      return [who, count, percentage];
    });
    
    // Store sorted data for the table
    setSortedWhoData(sortedWithPercentages);

    const sortedWhoObj = sortedWhoEntries.reduce((acc: Record<string, number>, [who, count]) => {
      acc[who] = count;
      return acc;
    }, {});

    setWhoDistribution({
      labels: Object.keys(sortedWhoObj),
      datasets: [
        {
          data: Object.values(sortedWhoObj),
          backgroundColor: [
            'rgb(0, 0, 0)',
            'rgb(50, 50, 50)',
            'rgb(100, 100, 100)',
            'rgb(150, 150, 150)',
            'rgb(200, 200, 200)',
          ],
        },
      ],
    });
  }, [allTasks]);

  // Define fetchData and other functions before useEffect hooks using useCallback
  const fetchData = useCallback(async () => {
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
      
      // Store all tasks for filtered views
      setAllTasks(tasks);

      // Set total tasks count
      const taskCount = tasks.length;
      setTotalTasks(taskCount);

      // Process data for tasks completed over time by subcategory
      const completedTasks = tasks.filter(task => task.completed);
      
      // Get all unique subcategories
      const allSubcategories = Array.from(new Set(completedTasks.map(task => task.subcategory || 'None')));
      
      // Group tasks by date and subcategory
      const tasksByDateAndSubcategory: Record<string, Record<string, number>> = {};
      
      completedTasks.forEach(task => {
        const date = new Date(task.updated_at).toLocaleDateString();
        const subcategory = task.subcategory || 'None';
        
        if (!tasksByDateAndSubcategory[date]) {
          tasksByDateAndSubcategory[date] = {};
        }
        
        tasksByDateAndSubcategory[date][subcategory] = (tasksByDateAndSubcategory[date][subcategory] || 0) + 1;
      });
      
      // Sort dates chronologically
      const sortedDates = Object.keys(tasksByDateAndSubcategory).sort((a, b) => {
        return new Date(a).getTime() - new Date(b).getTime();
      });
      
      // Create datasets for each subcategory
      const subcategoryDatasets = allSubcategories.map((subcategory, index) => {
        // Generate a grayscale color based on index
        const grayShade = Math.max(0, Math.min(200, index * 40));
        const color = `rgb(${grayShade}, ${grayShade}, ${grayShade})`;
        
        return {
          label: subcategory,
          data: sortedDates.map(date => 
            tasksByDateAndSubcategory[date][subcategory] || 0
          ),
          backgroundColor: color,
        };
      });
      
      setTasksCompletedOverTime({
        labels: sortedDates,
        datasets: subcategoryDatasets,
      });

      // Process data for completion rate
      const focusTasks = tasks.filter((task: Task) => task.type === 'Focus');
      const completed = focusTasks.filter((task: Task) => task.completed).length;
      const total = focusTasks.length;
      
      setCompletionRate({
        labels: ['Completed Focus Tasks', 'Pending Focus Tasks'],
        datasets: [
          {
            data: [completed, total - completed],
            backgroundColor: ['rgb(0, 0, 0)', 'rgb(200, 200, 200)'],
          },
        ],
      });

      // Process data for category distribution
      const categories = tasks.reduce((acc: Record<string, number>, task: Task) => {
        const category = task.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});
      
      // Get unique categories for the filter
      const uniqueCategories = Object.keys(categories);
      setAllCategories(['All', ...uniqueCategories]);

      // Get all unique subcategories
      const uniqueSubcategories = Array.from(new Set(tasks.map(task => task.subcategory || 'None')));
      setAllSubcategories(['All', ...uniqueSubcategories]);

      // Get all unique whos
      const uniqueWhos = Array.from(new Set(tasks.map(task => task.who || 'Unassigned')));
      
      // Initialize who distribution chart
      updateWhoChart(["All"], ["All"]);

      // Sort categories by count (descending)
      const sortedCategories: Array<[string, number]> = Object.entries(categories)
        .sort(([, countA], [, countB]) => (countB as number) - (countA as number))
        .map(([category, count]) => [category, count as number]);

      // Calculate percentages and store full data
      const sortedWithPercentages: Array<[string, number, number]> = sortedCategories.map(([category, count]) => {
        const percentage = Math.round((count / taskCount) * 100);
        return [category, count, percentage];
      });
      
      // Store sorted data for the table
      setSortedCategoryData(sortedWithPercentages);

      const sortedCategoriesObj = sortedCategories.reduce((acc: Record<string, number>, [category, count]) => {
        acc[category] = count;
        return acc;
      }, {});

      setCategoryDistribution({
        labels: Object.keys(sortedCategoriesObj),
        datasets: [
          {
            data: Object.values(sortedCategoriesObj),
            backgroundColor: [
              'rgb(0, 0, 0)',
              'rgb(50, 50, 50)',
              'rgb(100, 100, 100)',
              'rgb(150, 150, 150)',
              'rgb(200, 200, 200)',
            ],
          },
        ],
      });
      
      // Initialize subcategory chart with default category (Task)
      updateSubcategoryChart(selectedCategories);
      // Initialize tasks completed chart with default category (Task)
      updateTasksCompletedChart(selectedTimelineCategories);
    } catch (error) {
      setError('An error occurred while fetching data');
      console.error(error);
    }
  }, [selectedCategories, selectedTimelineCategories, selectedWhoCategories, selectedWhoSubcategories, updateSubcategoryChart, updateTasksCompletedChart, updateWhoChart]);

  // Now the useEffects can reference the functions properly
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (allTasks.length > 0) {
      updateSubcategoryChart(selectedCategories);
    }
  }, [selectedCategories, allTasks, updateSubcategoryChart]);

  useEffect(() => {
    if (allTasks.length > 0) {
      updateTasksCompletedChart(selectedTimelineCategories);
    }
  }, [selectedTimelineCategories, allTasks, updateTasksCompletedChart]);

  useEffect(() => {
    if (allTasks.length > 0) {
      updateWhoChart(selectedWhoCategories, selectedWhoSubcategories);
    }
  }, [selectedWhoCategories, selectedWhoSubcategories, allTasks, updateWhoChart]);

  // Update handlers for multi-select
  const handleTimelineCategoriesChange = (values: string[]) => {
    setSelectedTimelineCategories(values.length > 0 ? values : ["All"]);
  };

  const handleCategoriesChange = (values: string[]) => {
    setSelectedCategories(values.length > 0 ? values : ["All"]);
  };

  const handleWhoCategoriesChange = (values: string[]) => {
    const newCategories = values.length > 0 ? values : ["All"];
    setSelectedWhoCategories(newCategories);
    
    // Update available subcategories based on selected categories
    if (newCategories.includes("All")) {
      const allSubs = Array.from(new Set(allTasks.map(task => task.subcategory || 'None')));
      setAllSubcategories(['All', ...allSubs]);
    } else {
      const categorySubs = Array.from(new Set(
        allTasks
          .filter(task => newCategories.includes(task.category || 'Uncategorized'))
          .map(task => task.subcategory || 'None')
      ));
      setAllSubcategories(['All', ...categorySubs]);
    }
    
    // Reset subcategories when categories change
    setSelectedWhoSubcategories(["All"]);
  };

  const handleWhoSubcategoriesChange = (values: string[]) => {
    setSelectedWhoSubcategories(values.length > 0 ? values : ["All"]);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8 text-black">Data</h1>
        
        {error && (
          <div className="mb-8 p-4 bg-gray-100 border border-gray-300 text-gray-900 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
              <h2 className="text-xl font-semibold text-black">Tasks Completed Over Time</h2>
              <div className="w-full md:w-64">
                <MultiSelect
                  options={allCategories}
                  selectedValues={selectedTimelineCategories}
                  onChange={handleTimelineCategoriesChange}
                  label="Categories"
                  placeholder="Select categories..."
                />
              </div>
            </div>
            <div className="h-[300px]">
              <Bar
                data={tasksCompletedOverTime}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                      labels: {
                        color: 'black'
                      }
                    },
                    tooltip: {
                      callbacks: {
                        title: (items) => {
                          return items[0].label;
                        }
                      }
                    }
                  },
                  scales: {
                    x: {
                      stacked: true,
                      ticks: { color: 'black' },
                      grid: { color: 'rgba(0, 0, 0, 0.1)' }
                    },
                    y: {
                      stacked: true,
                      ticks: { color: 'black' },
                      grid: { color: 'rgba(0, 0, 0, 0.1)' }
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-black">Completion Rate of Focus Tasks</h2>
            <div className="h-[300px]">
              <Pie
                data={completionRate}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                      labels: {
                        color: 'black'
                      }
                    },
                  },
                }}
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-black">Category Distribution</h2>
            <div className="h-[300px]">
              <Pie
                data={categoryDistribution}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                      labels: {
                        color: 'black'
                      }
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const percentage = Math.round((context.raw as number / totalTasks) * 100);
                          return `${context.label}: ${context.raw} (${percentage}%)`;
                        }
                      }
                    },
                    datalabels: {
                      formatter: (value: number) => {
                        const percentage = Math.round((value / totalTasks) * 100);
                        return `${percentage}%`;
                      },
                      color: 'white',
                      font: {
                        weight: 'bold',
                        size: 12
                      }
                    }
                  },
                }}
              />
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2 text-black">Categories by Task Count</h3>
              <div className="overflow-auto max-h-[200px]">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-black font-bold">Category</th>
                      <th className="px-4 py-2 text-black font-bold">Tasks</th>
                      <th className="px-4 py-2 text-black font-bold">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCategoryData.map(([category, count, percentage], index) => (
                      <tr key={category} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-2 text-black">{category}</td>
                        <td className="px-4 py-2 text-black">{count}</td>
                        <td className="px-4 py-2 text-black">{percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
              <h2 className="text-xl font-semibold text-black">Subcategory Distribution</h2>
              <div className="w-full md:w-64">
                <MultiSelect
                  options={allCategories}
                  selectedValues={selectedCategories}
                  onChange={handleCategoriesChange}
                  label="Categories"
                  placeholder="Select categories..."
                />
              </div>
            </div>
            <div className="h-[300px]">
              <Pie
                data={subcategoryDistribution}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                      labels: {
                        color: 'black'
                      }
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const percentage = Math.round((context.raw as number / allTasks.filter(t => t.category === selectedCategories[0]).length) * 100);
                          return `${context.label}: ${context.raw} (${percentage}%)`;
                        }
                      }
                    },
                    datalabels: {
                      formatter: (value: number) => {
                        const totalCategoryTasks = allTasks.filter(t => t.category === selectedCategories[0]).length;
                        const percentage = totalCategoryTasks > 0 ? Math.round((value / totalCategoryTasks) * 100) : 0;
                        return `${percentage}%`;
                      },
                      color: 'white',
                      font: {
                        weight: 'bold',
                        size: 12
                      }
                    }
                  },
                }}
              />
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2 text-black">Subcategories of {selectedCategories[0]} by Task Count</h3>
              <div className="overflow-auto max-h-[200px]">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-black font-bold">Subcategory</th>
                      <th className="px-4 py-2 text-black font-bold">Tasks</th>
                      <th className="px-4 py-2 text-black font-bold">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSubcategoryData.map(([subcategory, count, percentage], index) => (
                      <tr key={subcategory} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-2 text-black">{subcategory}</td>
                        <td className="px-4 py-2 text-black">{count}</td>
                        <td className="px-4 py-2 text-black">{percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
              <h2 className="text-xl font-semibold text-black">Task Distribution by Who</h2>
              <div className="flex flex-col gap-2 w-full md:w-auto">
                <div className="w-full md:w-48">
                  <MultiSelect
                    options={allCategories}
                    selectedValues={selectedWhoCategories}
                    onChange={handleWhoCategoriesChange}
                    label="Categories"
                    placeholder="Select categories..."
                  />
                </div>
                <div className="w-full md:w-48">
                  <MultiSelect
                    options={allSubcategories}
                    selectedValues={selectedWhoSubcategories}
                    onChange={handleWhoSubcategoriesChange}
                    label="Subcategories"
                    placeholder="Select subcategories..."
                  />
                </div>
              </div>
            </div>
            <div className="h-[300px]">
              <Pie
                data={whoDistribution}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                      labels: {
                        color: 'black'
                      }
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const totalFilteredTasks = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
                          const percentage = totalFilteredTasks > 0 ? Math.round((context.raw as number / totalFilteredTasks) * 100) : 0;
                          return `${context.label}: ${context.raw} (${percentage}%)`;
                        }
                      }
                    },
                    datalabels: {
                      formatter: (value: number, ctx) => {
                        const totalFilteredTasks = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0);
                        const percentage = totalFilteredTasks > 0 ? Math.round((value / totalFilteredTasks) * 100) : 0;
                        return `${percentage}%`;
                      },
                      color: 'white',
                      font: {
                        weight: 'bold',
                        size: 12
                      }
                    }
                  },
                }}
              />
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2 text-black">Tasks by Who</h3>
              <div className="overflow-auto max-h-[200px]">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-black font-bold">Who</th>
                      <th className="px-4 py-2 text-black font-bold">Tasks</th>
                      <th className="px-4 py-2 text-black font-bold">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedWhoData.map(([who, count, percentage], index) => (
                      <tr key={who} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-2 text-black">{who}</td>
                        <td className="px-4 py-2 text-black">{count}</td>
                        <td className="px-4 py-2 text-black">{percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 