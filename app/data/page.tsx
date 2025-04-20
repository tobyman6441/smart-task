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
import { Database } from '@/types/supabase';
import ChartDataLabels from 'chartjs-plugin-datalabels';

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
  const [activityByWhoDistribution, setActivityByWhoDistribution] = useState<ChartData>({
    labels: [],
    datasets: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [sortedCategoryData, setSortedCategoryData] = useState<Array<[string, number, number]>>([]);
  const [sortedSubcategoryData, setSortedSubcategoryData] = useState<Array<[string, number, number]>>([]);
  const [sortedActivityByWhoData, setSortedActivityByWhoData] = useState<Array<[string, number, number, Record<string, number>]>>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [totalActivities, setTotalActivities] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("Task");
  const [selectedTimelineCategory, setSelectedTimelineCategory] = useState<string>("Task");
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (allTasks.length > 0) {
      updateSubcategoryChart(selectedCategory);
    }
  }, [selectedCategory, allTasks]);

  useEffect(() => {
    if (allTasks.length > 0) {
      updateTasksCompletedChart(selectedTimelineCategory);
    }
  }, [selectedTimelineCategory, allTasks]);

  const updateSubcategoryChart = (category: string) => {
    const filteredTasks = allTasks.filter(task => task.category === category);
    const totalCategoryTasks = filteredTasks.length;
    
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
      const percentage = totalCategoryTasks > 0 ? Math.round((count / totalCategoryTasks) * 100) : 0;
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
  };

  const updateTasksCompletedChart = (category: string) => {
    // Filter completed tasks by the selected category
    const filteredCompletedTasks = allTasks.filter(task => 
      task.completed && (category === 'All' || task.category === category)
    );
    
    // Get all unique subcategories from the filtered tasks
    const allSubcategories = Array.from(new Set(filteredCompletedTasks.map(task => task.subcategory || 'None')));
    
    // Group tasks by date and subcategory
    const tasksByDateAndSubcategory: Record<string, Record<string, number>> = {};
    
    filteredCompletedTasks.forEach(task => {
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
  };

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
      updateSubcategoryChart(selectedCategory);
      // Initialize tasks completed chart with default category (Task)
      updateTasksCompletedChart(selectedTimelineCategory);

      // Process activity distribution by who
      const activityTypes = ['Family Night', 'Date Night', 'Night Out'];
      const activitiesByWho: Record<string, {count: number, categories: Record<string, number>}> = {};
      
      // Filter tasks to include only the specified activities
      const activityTasks = tasks.filter(task => {
        const entry = task.entry?.toLowerCase() || '';
        return activityTypes.some(type => 
          entry.includes(type.toLowerCase()) || 
          (task.name?.toLowerCase() || '').includes(type.toLowerCase())
        );
      });

      // Set total activities count
      const activityCount = activityTasks.length;
      setTotalActivities(activityCount);
      
      // Group by who and track categories
      activityTasks.forEach(task => {
        const who = task.who ? task.who.trim() : '';
        const category = task.category || 'Uncategorized';
        
        if (!activitiesByWho[who]) {
          activitiesByWho[who] = {
            count: 0,
            categories: {}
          };
        }
        
        activitiesByWho[who].count += 1;
        activitiesByWho[who].categories[category] = (activitiesByWho[who].categories[category] || 0) + 1;
      });
      
      // Sort by count (descending)
      const sortedActivitiesByWho: Array<[string, number, Record<string, number>]> = Object.entries(activitiesByWho)
        .sort(([, dataA], [, dataB]) => dataB.count - dataA.count)
        .map(([who, data]) => [who, data.count, data.categories]);
      
      // Calculate percentages and store data
      const activityWithPercentages: Array<[string, number, number, Record<string, number>]> = sortedActivitiesByWho.map(([who, count, categories]) => {
        const percentage = activityCount > 0 ? Math.round((count / activityCount) * 100) : 0;
        return [who, count, percentage, categories];
      });
      
      // Store sorted data for the table
      setSortedActivityByWhoData(activityWithPercentages);
      
      // Create grayscale colors for each who
      const whoColors = sortedActivitiesByWho.map((_, index) => {
        const grayShade = Math.max(0, Math.min(200, index * 40));
        return `rgb(${grayShade}, ${grayShade}, ${grayShade})`;
      });
      
      setActivityByWhoDistribution({
        labels: sortedActivitiesByWho.map(([who]) => who),
        datasets: [
          {
            data: sortedActivitiesByWho.map(([, count]) => count),
            backgroundColor: whoColors,
          },
        ],
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
  };

  const handleTimelineCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTimelineCategory(e.target.value);
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-black">Tasks Completed Over Time</h2>
              <div className="w-64">
                <select 
                  value={selectedTimelineCategory}
                  onChange={handleTimelineCategoryChange}
                  className="w-full px-3 py-2 text-black bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black"
                >
                  {allCategories.map(category => (
                    <option key={`timeline-${category}`} value={category}>{category}</option>
                  ))}
                </select>
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
                    // @ts-ignore - plugin is registered but TypeScript doesn't know the type
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-black">Subcategory Distribution</h2>
              <div className="w-64">
                <select 
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  className="w-full px-3 py-2 text-black bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black"
                >
                  {allCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
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
                          const percentage = Math.round((context.raw as number / allTasks.filter(t => t.category === selectedCategory).length) * 100);
                          return `${context.label}: ${context.raw} (${percentage}%)`;
                        }
                      }
                    },
                    // @ts-ignore - plugin is registered but TypeScript doesn't know the type
                    datalabels: {
                      formatter: (value: number) => {
                        const totalCategoryTasks = allTasks.filter(t => t.category === selectedCategory).length;
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
              <h3 className="text-lg font-medium mb-2 text-black">Subcategories of {selectedCategory} by Task Count</h3>
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
            <h2 className="text-xl font-semibold mb-4 text-black">Social Activities by Person</h2>
            <div className="h-[300px]">
              <Pie
                data={activityByWhoDistribution}
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
                          const percentage = Math.round((context.raw as number / totalActivities) * 100);
                          return `${context.label}: ${context.raw} (${percentage}%)`;
                        }
                      }
                    },
                    // @ts-ignore - plugin is registered but TypeScript doesn't know the type
                    datalabels: {
                      formatter: (value: number) => {
                        const percentage = totalActivities > 0 ? Math.round((value / totalActivities) * 100) : 0;
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
              <h3 className="text-lg font-medium mb-2 text-black">Social Activities Distribution by Person</h3>
              <div className="overflow-auto max-h-[200px]">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-black font-bold">Person</th>
                      <th className="px-4 py-2 text-black font-bold">Activities</th>
                      <th className="px-4 py-2 text-black font-bold">Percentage</th>
                      <th className="px-4 py-2 text-black font-bold">Categories</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedActivityByWhoData.map(([who, count, percentage, categories], index) => (
                      <tr key={who} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-2 text-black">{who}</td>
                        <td className="px-4 py-2 text-black">{count}</td>
                        <td className="px-4 py-2 text-black">{percentage}%</td>
                        <td className="px-4 py-2 text-black">
                          {Object.entries(categories)
                            .sort(([, countA], [, countB]) => (countB as number) - (countA as number))
                            .map(([category, catCount]) => (
                              <div key={`${who}-${category}`}>{category}: {catCount}</div>
                            ))
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="md:col-span-2">
            <h2 className="text-xl font-semibold mb-4 text-black">Additional Charts</h2>
            <p className="text-gray-500">Future visualizations will appear here.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 