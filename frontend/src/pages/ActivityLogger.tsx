import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.js';
import { useToast } from '../contexts/ToastContext.js';
import {
  Footprints,
  Droplet,
  Moon,
  Save,
  Smile,
  Frown,
  Meh,
  Activity,
  SmilePlus,
} from 'lucide-react';

export const ActivityLogger: React.FC = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Form states
  const [steps, setSteps] = useState(0);
  const [exercise, setExercise] = useState(0);
  const [water, setWater] = useState(0);
  const [sleep, setSleep] = useState(7);
  const [workoutType, setWorkoutType] = useState('None');
  const [mood, setMood] = useState('Neutral');
  const [energy, setEnergy] = useState(5);

  // Fetch log for date
  const { data: activityData, isLoading } = useQuery({
    queryKey: ['activity', selectedDate],
    queryFn: async () => {
      const res = await api.get(`/activities/date/${selectedDate}`);
      return res.data;
    },
  });

  // Populate form states when data loads
  useEffect(() => {
    if (activityData) {
      const act = activityData.activity;
      setSteps(act?.stepsWalked || 0);
      setExercise(act?.exerciseDuration || 0);
      setWater(activityData.waterIntake || 0);
      setSleep(act?.sleepHours || 7);
      setWorkoutType(act?.workoutType || 'None');
      setMood(act?.mood || 'Neutral');
      setEnergy(act?.energyLevel || 5);
    }
  }, [activityData]);

  // Save activity mutation
  const saveActivityMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/activities', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity', selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      showToast('Daily activity logged successfully!', 'success');
    },
    onError: () => {
      showToast('Failed to log daily activity.', 'error');
    },
  });

  const handleSave = () => {
    const payload = {
      date: selectedDate,
      stepsWalked: steps,
      exerciseDuration: exercise,
      sleepHours: sleep,
      workoutType,
      mood,
      energyLevel: energy,
      waterIntake: water,
    };

    saveActivityMutation.mutate(payload);
  };

  const incrementWater = (amount: number) => {
    setWater((prev) => Math.max(0, prev + amount));
  };

  const moods = [
    { label: 'Energetic', icon: SmilePlus, color: 'text-emerald-500 bg-emerald-500/10' },
    { label: 'Happy', icon: Smile, color: 'text-indigo-500 bg-indigo-500/10' },
    { label: 'Neutral', icon: Meh, color: 'text-slate-500 bg-slate-500/10' },
    { label: 'Tired', icon: Moon, color: 'text-amber-500 bg-amber-500/10' },
    { label: 'Stressed', icon: Frown, color: 'text-rose-500 bg-rose-500/10' },
  ];

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8 pb-10">
      
      {/* Date Header Picker */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-4 rounded-3xl">
        <span className="text-sm font-semibold">Select Log Date</span>
        <div className="relative">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200/10 outline-none text-xs font-bold cursor-pointer"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading activity records...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Steps & Workouts */}
          <div className="glass-card rounded-3xl p-6 flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <Footprints className="w-5 h-5 text-brand-emerald" />
              <h3 className="font-semibold text-sm">Physical Activity</h3>
            </div>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Steps Walked</label>
                <input
                  type="number"
                  value={steps || ''}
                  onChange={(e) => setSteps(Number(e.target.value))}
                  placeholder="e.g. 10000"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-100/50 dark:bg-slate-950 border border-slate-250/10 outline-none text-sm font-medium"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Exercise Duration (minutes)</label>
                <input
                  type="number"
                  value={exercise || ''}
                  onChange={(e) => setExercise(Number(e.target.value))}
                  placeholder="e.g. 45"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-100/50 dark:bg-slate-950 border border-slate-250/10 outline-none text-sm font-medium"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Workout Type</label>
                <select
                  value={workoutType}
                  onChange={(e) => setWorkoutType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-100/50 dark:bg-slate-950 border border-slate-250/10 outline-none text-sm font-medium"
                >
                  <option>None</option>
                  <option>Cardio (Run/Walk)</option>
                  <option>Strength (Lifting)</option>
                  <option>HIIT / Crossfit</option>
                  <option>Yoga / Stretch</option>
                  <option>Sport (Football/Swimming)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Water Intake Tracker */}
          <div className="glass-card rounded-3xl p-6 flex flex-col justify-between gap-6">
            <div className="flex items-center gap-2">
              <Droplet className="w-5 h-5 text-blue-500 fill-blue-500/10" />
              <h3 className="font-semibold text-sm">Water Intake</h3>
            </div>
            
            <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
              <span className="text-4xl font-extrabold text-blue-500">{water}</span>
              <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">ml consumed</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => incrementWater(250)}
                className="flex-1 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 text-blue-500 dark:text-blue-400 font-bold text-xs transition-all"
              >
                +250ml (1 cup)
              </button>
              <button
                onClick={() => incrementWater(500)}
                className="flex-1 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 text-blue-500 dark:text-blue-400 font-bold text-xs transition-all"
              >
                +500ml (1 bottle)
              </button>
              {water > 0 && (
                <button
                  onClick={() => setWater(0)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 transition-all text-xs"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Sleep Hours Slider */}
          <div className="glass-card rounded-3xl p-6 flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <Moon className="w-5 h-5 text-brand-indigo" />
              <h3 className="font-semibold text-sm">Sleep Quality</h3>
            </div>
            
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Sleep Duration</label>
                <span className="text-lg font-bold text-brand-indigo">{sleep} hours</span>
              </div>
              <input
                type="range"
                min="3"
                max="12"
                step="0.5"
                value={sleep}
                onChange={(e) => setSleep(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-indigo"
              />
              <div className="flex justify-between text-[10px] text-slate-450 mt-1.5 font-medium">
                <span>Too Short (3h)</span>
                <span>Optimal (7-8h)</span>
                <span>Heavy (12h)</span>
              </div>
            </div>
          </div>

          {/* Subjective Mood / Energy Scale */}
          <div className="glass-card rounded-3xl p-6 flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-500" />
              <h3 className="font-semibold text-sm">Wellness & Subjective Energy</h3>
            </div>
            
            {/* Energy slider */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Energy Level</label>
                <span className="text-lg font-bold text-rose-500">{energy} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={energy}
                onChange={(e) => setEnergy(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
            </div>
            
            {/* Mood selector buttons */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Daily Mood State</label>
              <div className="flex flex-wrap gap-2">
                {moods.map((m) => {
                  const active = mood === m.label;
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.label}
                      onClick={() => setMood(m.label)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        active
                          ? 'bg-slate-900 text-white border-slate-900 dark:bg-brand-emerald dark:text-white dark:border-brand-emerald'
                          : 'bg-slate-100/50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border-slate-250/10'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? 'text-white' : m.color.split(' ')[0]}`} />
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Master Save Button */}
          <div className="md:col-span-2 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saveActivityMutation.isPending}
              className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-brand-emerald dark:hover:bg-brand-emerald-dark text-white font-bold text-sm flex items-center gap-2 shadow-lg transition-all"
            >
              <Save className="w-5 h-5" />
              Save Daily Activity Log
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
