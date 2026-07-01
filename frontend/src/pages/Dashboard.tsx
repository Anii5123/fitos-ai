import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.js';
import { useToast } from '../contexts/ToastContext.js';
import { motion } from 'framer-motion';
import {
  Flame,
  Droplet,
  Footprints,
  ChevronRight,
  TrendingDown,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [quickMealText, setQuickMealText] = useState('');
  const [addingQuickMeal, setAddingQuickMeal] = useState(false);

  // Fetch Dashboard Summary data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: async () => {
      const res = await api.get('/activities/dashboard');
      return res.data.summary;
    },
  });

  // Water log mutation
  const logWaterMutation = useMutation({
    mutationFn: async (amount: number) => {
      const todayStr = new Date().toISOString().split('T')[0];
      const currentWater = dashboardData?.nutrition?.waterIntake || 0;
      const res = await api.post('/activities', {
        date: todayStr,
        waterIntake: currentWater + amount,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      showToast('Water logged successfully!', 'success');
    },
  });

  // Steps log mutation
  const logStepsMutation = useMutation({
    mutationFn: async (steps: number) => {
      const todayStr = new Date().toISOString().split('T')[0];
      const currentSteps = dashboardData?.activity?.stepsWalked || 0;
      const res = await api.post('/activities', {
        date: todayStr,
        stepsWalked: currentSteps + steps,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      showToast('Steps logged successfully!', 'success');
    },
  });

  // AI Quick Add Meal Mutation
  const quickMealMutation = useMutation({
    mutationFn: async (text: string) => {
      setAddingQuickMeal(true);
      // 1. Analyze text macros via AI
      const analysisRes = await api.post('/meals/analyze-text', { text });
      const foodItems = analysisRes.data.data.foodItems;

      // 2. Log meal on backend
      const todayStr = new Date().toISOString().split('T')[0];
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const res = await api.post('/meals', {
        name: 'Snack / Quick Add',
        time: timeStr,
        date: todayStr,
        foodItems,
        notes: `AI Quick Add: "${text}"`,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      showToast('Meal logged using AI Quick Add!', 'success');
      setQuickMealText('');
      setAddingQuickMeal(false);
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'AI Quick Add failed', 'error');
      setAddingQuickMeal(false);
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-40 rounded-3xl bg-slate-200/50 dark:bg-slate-800/50" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-48 rounded-3xl bg-slate-200/50 dark:bg-slate-800/50" />
          <div className="h-48 rounded-3xl bg-slate-200/50 dark:bg-slate-800/50" />
          <div className="h-48 rounded-3xl bg-slate-200/50 dark:bg-slate-800/50" />
        </div>
      </div>
    );
  }

  const { nutrition, activity, weight, goals, recentMeals, weightTrend, aiSuggestion } = dashboardData || {};

  // Macro calculation percentages
  const targetCalories = goals?.targetCalories || 2000;
  const targetProtein = goals?.proteinGoal || 130;
  const calPercent = Math.min(100, Math.round(((nutrition?.caloriesConsumed || 0) / targetCalories) * 100));

  return (
    <div className="flex flex-col gap-8 pb-10">
      
      {/* Dynamic Welcome Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-emerald to-emerald-800 text-white p-6 md:p-8 shadow-xl"
      >
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-10 translate-y-10 scale-150">
          <Sparkles className="w-64 h-64" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Keep up the momentum!</h2>
            <p className="text-emerald-100 text-sm md:text-base mt-2 max-w-xl leading-relaxed">
              Your calorie balance is on track. Add your meals and steps to maintain your active deficit.
            </p>
          </div>
          <div className="shrink-0 flex gap-2">
            <button
              onClick={() => logWaterMutation.mutate(250)}
              className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Droplet className="w-4 h-4 fill-white" />
              +250ml Water
            </button>
            <button
              onClick={() => logStepsMutation.mutate(2000)}
              className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Footprints className="w-4 h-4" />
              +2k Steps
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Aggregations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Calorie Dial Card */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 justify-around relative">
          
          {/* Circular Indicator */}
          <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="88"
                cy="88"
                r="76"
                strokeWidth="10"
                className="stroke-slate-200 dark:stroke-slate-800 fill-none"
              />
              <circle
                cx="88"
                cy="88"
                r="76"
                strokeWidth="10"
                className="stroke-brand-emerald fill-none"
                strokeDasharray={2 * Math.PI * 76}
                strokeDashoffset={2 * Math.PI * 76 * (1 - calPercent / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <Flame className="w-6 h-6 text-brand-emerald fill-brand-emerald/10 mb-1" />
              <span className="text-3xl font-extrabold tracking-tight">{nutrition?.caloriesRemaining}</span>
              <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">kcal left</span>
            </div>
          </div>

          {/* Quick Metrics Details */}
          <div className="flex-1 w-full grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/10">
              <span className="text-xs text-slate-400 font-medium">Consumed Today</span>
              <p className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-200 mt-1">
                {nutrition?.caloriesConsumed} <span className="text-xs font-normal text-slate-400">kcal</span>
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/10">
              <span className="text-xs text-slate-400 font-medium">Protein Target</span>
              <p className="text-2xl font-bold tracking-tight text-brand-indigo mt-1">
                {nutrition?.protein} <span className="text-xs font-normal text-slate-400">/ {targetProtein}g</span>
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/10">
              <span className="text-xs text-slate-400 font-medium">Carbohydrates</span>
              <p className="text-2xl font-bold tracking-tight text-brand-amber mt-1">
                {nutrition?.carbs}g
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/10">
              <span className="text-xs text-slate-400 font-medium">Fats & Fiber</span>
              <p className="text-2xl font-bold tracking-tight text-slate-500 mt-1">
                {nutrition?.fat}g <span className="text-xs text-slate-400 font-normal">/ {nutrition?.fiber}g</span>
              </p>
            </div>
          </div>
        </div>

        {/* Goals Progress Widget */}
        <div className="glass-card rounded-3xl p-6 flex flex-col justify-between gap-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Weight Loss Target</span>
            <TrendingDown className="w-5 h-5 text-brand-indigo" />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-baseline">
              <p className="text-4xl font-extrabold tracking-tight">
                {weight?.currentWeight || '--'} <span className="text-sm font-medium text-slate-400">kg</span>
              </p>
              <p className="text-xs text-slate-400 font-medium">
                Goal: {weight?.goalWeight || '--'} kg
              </p>
            </div>
            
            {/* Progress Bar */}
            <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mt-1">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-indigo to-brand-emerald"
                style={{ width: `${weight?.progressPercentage || 0}%` }}
              />
            </div>
            <span className="text-[10px] text-right font-bold text-brand-indigo uppercase tracking-wider mt-1">
              {weight?.progressPercentage}% completed
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-200/20 pt-4">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Days left</span>
              <p className="text-lg font-bold mt-0.5">{weight?.daysRemaining || '--'}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Steps Active</span>
              <p className="text-lg font-bold mt-0.5">{activity?.stepsWalked || 0} / {goals?.dailyStepGoal || 10000}</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Suggestions Alert Banner */}
      {aiSuggestion && (
        <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/50 dark:bg-indigo-950/20 dark:border-indigo-900/30 flex items-start gap-3">
          <Zap className="w-5 h-5 text-indigo-500 fill-indigo-500/10 shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">AI Coach Advice</span>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              {aiSuggestion.summary}
            </p>
          </div>
        </div>
      )}

      {/* Middle Grid: Quick Add & Recent Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Quick Add Meal */}
        <div className="glass-card rounded-3xl p-6 flex flex-col justify-between gap-4">
          <div>
            <h3 className="font-semibold text-base">AI Quick-Log Food</h3>
            <p className="text-xs text-slate-400 leading-relaxed mt-1">
              Type the foods and amounts you consumed. Our AI engine will resolve macros and log it immediately.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <textarea
              rows={3}
              value={quickMealText}
              onChange={(e) => setQuickMealText(e.target.value)}
              placeholder="Example: 150g grilled chicken, 2 chapati, 1 egg whites..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-100/50 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-900 border border-slate-200/10 dark:border-slate-800/10 outline-none focus:border-brand-emerald/50 dark:focus:border-brand-emerald/50 transition-all text-sm custom-scrollbar resize-none"
            />
            <button
              onClick={() => quickMealMutation.mutate(quickMealText)}
              disabled={addingQuickMeal || !quickMealText.trim()}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-brand-emerald dark:hover:bg-brand-emerald-dark font-medium text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {addingQuickMeal ? 'AI estimating macros...' : 'AI Log Meal'}
            </button>
          </div>
        </div>

        {/* Recent Meals Lists */}
        <div className="glass-card rounded-3xl p-6 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base">Recent Meals</h3>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>

          <div className="flex-1 flex flex-col gap-3 custom-scrollbar max-h-56 overflow-y-auto">
            {recentMeals?.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No meals logged yet today.
              </div>
            ) : (
              recentMeals?.map((meal: any) => (
                <div
                  key={meal._id}
                  className="p-3 rounded-2xl bg-slate-100/30 hover:bg-slate-100/50 dark:bg-slate-900/30 dark:hover:bg-slate-900/50 border border-slate-200/5 dark:border-slate-800/5 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{meal.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                      {meal.foodItems.map((fi: any) => `${fi.quantity} ${fi.name}`).join(', ')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{meal.calories} kcal</p>
                    <span className="text-[9px] text-slate-400 uppercase font-semibold">
                      {meal.protein}g protein
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Weight History Analytics */}
      <div className="glass-card rounded-3xl p-6">
        <h3 className="font-semibold text-base mb-6">Weight Loss Trends (7 logs)</h3>
        {weightTrend?.length < 2 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            Not enough data. Log weight logs on multiple days to display the trend line.
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightTrend}>
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                />
                <YAxis
                  domain={['dataMin - 1', 'dataMax + 1']}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ r: 4, stroke: '#6366f1', strokeWidth: 2, fill: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

    </div>
  );
};
