import React, { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import dayjs from 'dayjs';
import { AnalyticsData, COLORS } from '../types';

interface AnalyticsPanelProps {
  data: AnalyticsData | null;
  loading: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 shadow-lg rounded-lg outline-none">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
          {dayjs(label).format('dddd, MMM D')}
        </p>
        <p className="text-sm text-primary font-medium">
          Completion: <span className="font-bold">{Number(payload[0].value).toFixed(0)}%</span>
        </p>
      </div>
    );
  }
  return null;
};

const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ data, loading }) => {
  if (loading || !data) {
    return <div className="h-64 flex items-center justify-center text-slate-400">Loading analytics...</div>;
  }

  const pieData = useMemo(() => [
    { name: 'Completed', value: Math.round(data.overallEfficiency) },
    { name: 'Missed', value: 100 - Math.round(data.overallEfficiency) },
  ], [data.overallEfficiency]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {/* Monthly Trend */}
      <div className="col-span-1 md:col-span-2 bg-white dark:bg-dark-card rounded-2xl shadow-sm p-6 border border-slate-100 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Monthly Performance Trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.dailyCompletion}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10, fill: '#94A3B8' }} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(val) => val.split('-')[2]} // Show day only (day)
                interval={2}
                minTickGap={10}
              />
              <YAxis 
                 hide 
                 domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#CBD5E1', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#3B82F6" 
                strokeWidth={3} 
                dot={false} 
                activeDot={{ r: 6, strokeWidth: 0 }} 
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Overall Efficiency */}
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm p-6 border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center relative">
        <h3 className="absolute top-6 left-6 text-sm font-semibold text-slate-500 uppercase tracking-wider">Overall Efficiency</h3>
        <div className="h-48 w-48 relative mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                innerRadius={60}
                outerRadius={80}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                stroke="none"
              >
                <Cell fill="#3B82F6" />
                <Cell fill="#F1F5F9" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-bold text-slate-800 dark:text-white">{Math.round(data.overallEfficiency)}%</span>
            <span className="text-xs text-slate-400">Efficiency</span>
          </div>
        </div>
        <div className="flex gap-8 mt-2">
            <div className="text-center">
                <p className="text-xs text-slate-400 uppercase">Status</p>
                <p className="font-medium text-emerald-500">Active</p>
            </div>
        </div>
      </div>

      {/* Top Habits */}
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm p-6 border border-slate-100 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Top 5 Habits</h3>
        <div className="space-y-4">
            {data.topHabits.length === 0 && <p className="text-sm text-slate-400">No data yet.</p>}
            {data.topHabits.map((habit, idx) => (
                <div key={idx} className="flex flex-col">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-700 dark:text-slate-200 truncate pr-2 font-medium">{habit.name}</span>
                        <span className="font-bold text-slate-900 dark:text-white">{Math.round(habit.rate)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                        <div 
                            className="h-1.5 rounded-full transition-all duration-1000 ease-out" 
                            style={{ 
                                width: `${habit.rate}%`,
                                backgroundColor: COLORS[idx % COLORS.length]
                            }}
                        ></div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Weekly Breakdown (Progress Bars) */}
      <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-white dark:bg-dark-card rounded-2xl shadow-sm p-6 border border-slate-100 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Weekly Overview</h3>
        <div className="space-y-6">
            {data.weeklyProgress.map((week, idx) => (
                 <div key={week.week} className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                        <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-slate-600 dark:text-slate-200 bg-slate-200 dark:bg-slate-700">
                            Week {week.week}
                        </span>
                        </div>
                        <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-primary">
                            {Math.round(week.value)}%
                        </span>
                        </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-slate-100 dark:bg-slate-800">
                        <div style={{ width: `${week.value}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all duration-500"></div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;