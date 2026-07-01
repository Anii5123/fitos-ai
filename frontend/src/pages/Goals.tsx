import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.js';
import { useToast } from '../contexts/ToastContext.js';
import { useAuth } from '../contexts/AuthContext.js';
import type { IGoal } from '../types/index.js';
import { Target, Save, CheckCircle2, Calendar, Scale, Flame, Footprints } from 'lucide-react';

export const Goals: React.FC = () => {
  const { showToast } = useToast();
  const { user, updateUserHeight } = useAuth();
  const queryClient = useQueryClient();

  // Form states
  const [targetWeight, setTargetWeight] = useState('');
  const [targetCalories, setTargetCalories] = useState('');
  const [proteinGoal, setProteinGoal] = useState('');
  const [dailyStepGoal, setDailyStepGoal] = useState('10000');
  const [waterGoal, setWaterGoal] = useState('3000');
  const [targetDate, setTargetDate] = useState('');
  const [userHeight, setUserHeight] = useState(() => String(user?.height || 175));

  // Fetch active goal
  const { data: activeGoalData, isLoading: activeLoading } = useQuery({
    queryKey: ['activeGoal'],
    queryFn: async () => {
      const res = await api.get('/goals/active');
      return res.data.goal as IGoal | null;
    },
  });

  // Fetch goals history
  const { data: historyData } = useQuery({
    queryKey: ['goalsHistory'],
    queryFn: async () => {
      const res = await api.get('/goals/history');
      return res.data.goals as IGoal[];
    },
  });

  // Create Goal Mutation
  const createGoalMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/goals', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeGoal'] });
      queryClient.invalidateQueries({ queryKey: ['goalsHistory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      showToast('New fitness target established!', 'success');
      resetForm();
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to establish goal.', 'error');
    },
  });

  const resetForm = () => {
    setTargetWeight('');
    setTargetCalories('');
    setProteinGoal('');
    setTargetDate('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetWeight || !targetCalories || !proteinGoal || !targetDate) {
      showToast('Please fill out all goal parameters.', 'warning');
      return;
    }

    const payload = {
      targetWeight: Number(targetWeight),
      targetCalories: Number(targetCalories),
      proteinGoal: Number(proteinGoal),
      waterGoal: Number(waterGoal),
      dailyStepGoal: Number(dailyStepGoal),
      targetDate,
    };

    createGoalMutation.mutate(payload);
  };

  const handleUpdateHeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userHeight || Number(userHeight) <= 0) {
      showToast('Please enter a valid height.', 'warning');
      return;
    }
    await updateUserHeight(Number(userHeight));
    showToast('Body height updated in local session.', 'success');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
      
      {/* Left: Active targets indicators & configurations */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        
        {/* Active Goal Board */}
        <div className="glass-card rounded-3xl p-6 relative overflow-hidden bg-gradient-to-br from-brand-indigo/10 to-transparent">
          <div className="absolute right-0 bottom-0 opacity-5 translate-x-5 translate-y-5 scale-125">
            <Target className="w-48 h-48" />
          </div>
          
          <h3 className="font-bold text-base mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-brand-indigo" />
            Current Active Targets
          </h3>

          {activeLoading ? (
            <div className="text-center py-6 text-slate-400">Loading active goals...</div>
          ) : !activeGoalData ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              No active targets logged. Establish your weights and nutrition goals below.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/20">
                <span className="text-[10px] text-slate-450 uppercase font-semibold">Weight Target</span>
                <p className="text-xl font-extrabold mt-1 text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-brand-emerald shrink-0" />
                  {activeGoalData.targetWeight} <span className="text-xs font-normal text-slate-400">kg</span>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/20">
                <span className="text-[10px] text-slate-450 uppercase font-semibold">Calories Ceiling</span>
                <p className="text-xl font-extrabold mt-1 text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-rose-500 shrink-0" />
                  {activeGoalData.targetCalories} <span className="text-xs font-normal text-slate-400">kcal</span>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/20">
                <span className="text-[10px] text-slate-450 uppercase font-semibold">Protein Intake</span>
                <p className="text-xl font-extrabold mt-1 text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-indigo shrink-0" />
                  {activeGoalData.proteinGoal} <span className="text-xs font-normal text-slate-400">g</span>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/20">
                <span className="text-[10px] text-slate-450 uppercase font-semibold">Step Limit</span>
                <p className="text-xl font-extrabold mt-1 text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Footprints className="w-4 h-4 text-brand-amber shrink-0" />
                  {activeGoalData.dailyStepGoal}
                </p>
              </div>

            </div>
          )}

          {activeGoalData && (
            <div className="mt-6 flex items-center gap-2 text-xs text-slate-400 border-t border-slate-200/10 pt-4">
              <Calendar className="w-4 h-4" />
              <span>Target deadline set for: <strong>{new Date(activeGoalData.targetDate).toLocaleDateString()}</strong></span>
            </div>
          )}
        </div>

        {/* Height updates form */}
        <div className="glass-card rounded-3xl p-6">
          <h3 className="font-bold text-sm mb-4">Body Height Settings</h3>
          <form onSubmit={handleUpdateHeight} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Height in Centimeters</label>
              <input
                type="number"
                placeholder="e.g. 175"
                value={userHeight}
                onChange={(e) => setUserHeight(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-slate-100/50 dark:bg-slate-950 border border-slate-250/10 outline-none text-sm"
              />
            </div>
            <button
              type="submit"
              className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-brand-emerald dark:hover:bg-brand-emerald-dark text-white font-semibold text-xs transition-all shadow-md"
            >
              Update Height
            </button>
          </form>
        </div>

        {/* Goals history table */}
        <div className="glass-card rounded-3xl p-6">
          <h3 className="font-bold text-sm mb-4">Goals Logging History</h3>
          <div className="overflow-x-auto max-h-60 custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/50 dark:border-slate-800/50 text-slate-400 font-semibold uppercase">
                  <th className="py-2 px-3">Date Configured</th>
                  <th className="py-2 px-3">Target Weight</th>
                  <th className="py-2 px-3">Daily Calorie Ceiling</th>
                  <th className="py-2 px-3">Protein Goal</th>
                  <th className="py-2 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {!historyData || historyData.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-slate-400">No logs on record yet.</td></tr>
                ) : (
                  historyData.map((goal) => (
                    <tr key={goal._id} className="border-b border-slate-100/50 dark:border-slate-800/10 text-slate-700 dark:text-slate-350">
                      <td className="py-3 px-3">{new Date(goal.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">{goal.targetWeight} kg</td>
                      <td className="py-3 px-3">{goal.targetCalories} kcal</td>
                      <td className="py-3 px-3">{goal.proteinGoal}g</td>
                      <td className="py-3 px-3 text-right">
                        {goal.isActive ? (
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-500 font-bold uppercase text-[9px]">
                            active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-400 dark:bg-slate-900 dark:text-slate-500 uppercase text-[9px]">
                            historical
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Right: New target creation form */}
      <div className="glass-card rounded-3xl p-6 h-fit">
        <h3 className="font-bold text-sm mb-6 flex items-center gap-2">
          <PlusCircleIcon className="w-5 h-5 text-brand-emerald" />
          Create New Goal Target
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Target Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
              placeholder="e.g. 70.0"
              className="w-full px-4 py-2 rounded-xl bg-slate-100/50 dark:bg-slate-950 border border-slate-250/10 outline-none text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Daily Calorie Target (kcal)</label>
            <input
              type="number"
              value={targetCalories}
              onChange={(e) => setTargetCalories(e.target.value)}
              placeholder="e.g. 1800"
              className="w-full px-4 py-2 rounded-xl bg-slate-100/50 dark:bg-slate-950 border border-slate-250/10 outline-none text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Daily Protein Target (g)</label>
            <input
              type="number"
              value={proteinGoal}
              onChange={(e) => setProteinGoal(e.target.value)}
              placeholder="e.g. 120"
              className="w-full px-4 py-2 rounded-xl bg-slate-100/50 dark:bg-slate-950 border border-slate-250/10 outline-none text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Daily Steps Target</label>
            <input
              type="number"
              value={dailyStepGoal}
              onChange={(e) => setDailyStepGoal(e.target.value)}
              placeholder="e.g. 10000"
              className="w-full px-4 py-2 rounded-xl bg-slate-100/50 dark:bg-slate-950 border border-slate-250/10 outline-none text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Daily Water Target (ml)</label>
            <input
              type="number"
              value={waterGoal}
              onChange={(e) => setWaterGoal(e.target.value)}
              placeholder="e.g. 3000"
              className="w-full px-4 py-2 rounded-xl bg-slate-100/50 dark:bg-slate-950 border border-slate-250/10 outline-none text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase font-medium">Target Deadline</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-slate-100/50 dark:bg-slate-950 border border-slate-250/10 outline-none text-xs font-bold"
            />
          </div>

          <button
            type="submit"
            disabled={createGoalMutation.isPending}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-brand-emerald dark:hover:bg-brand-emerald-dark font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save Goal Target
          </button>

        </form>
      </div>

    </div>
  );
};

// Lightweight custom icon since lucide doesn't export PlusCircle directly in some package builds
const PlusCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v8" />
    <path d="M8 12h8" />
  </svg>
);
