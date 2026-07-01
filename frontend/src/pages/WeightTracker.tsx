import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.js';
import { useToast } from '../contexts/ToastContext.js';
import { useAuth } from '../contexts/AuthContext.js';
import type { IWeightLog } from '../types/index.js';
import {
  TrendingDown,
  Camera,
  Save,
  LineChart as LineChartIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export const WeightTracker: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [weight, setWeight] = useState('');
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [biceps, setBiceps] = useState('');
  const [thighs, setThighs] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch weight history logs list
  const { data: historyData, isLoading } = useQuery({
    queryKey: ['weightHistory'],
    queryFn: async () => {
      const res = await api.get('/weight/history');
      return res.data.history as IWeightLog[];
    },
  });

  // Fetch weight trends calculations
  const { data: trendsData } = useQuery({
    queryKey: ['weightTrends'],
    queryFn: async () => {
      const res = await api.get('/weight/trends');
      return res.data.trends;
    },
  });

  // Save Weight Log Mutation
  const saveLogMutation = useMutation({
    mutationFn: async () => {
      setSaving(true);
      const formData = new FormData();
      formData.append('weight', weight);
      formData.append('date', date);

      const measurements = {
        ...(chest && { chest: Number(chest) }),
        ...(waist && { waist: Number(waist) }),
        ...(hips && { hips: Number(hips) }),
        ...(biceps && { biceps: Number(biceps) }),
        ...(thighs && { thighs: Number(thighs) }),
      };

      if (Object.keys(measurements).length > 0) {
        formData.append('measurements', JSON.stringify(measurements));
      }

      if (photoFile) {
        formData.append('progressPhoto', photoFile);
      }

      const res = await api.post('/weight', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weightHistory'] });
      queryClient.invalidateQueries({ queryKey: ['weightTrends'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      showToast('Weight log recorded successfully!', 'success');
      resetForm();
      setSaving(false);
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to record weight log.', 'error');
      setSaving(false);
    },
  });

  const resetForm = () => {
    setWeight('');
    setChest('');
    setWaist('');
    setHips('');
    setBiceps('');
    setThighs('');
    setPhotoFile(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || Number(weight) <= 0) {
      showToast('Please enter a valid weight in kg.', 'warning');
      return;
    }
    saveLogMutation.mutate();
  };

  const chartData = historyData ? [...historyData].reverse() : [];

  return (
    <div className="flex flex-col gap-8 pb-10">
      
      {/* Trends Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* BMI Card */}
        <div className="glass-card rounded-3xl p-5 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current BMI</span>
          <p className="text-3xl font-extrabold tracking-tight mt-1 text-slate-800 dark:text-slate-200">
            {trendsData?.currentBMI || '--'}
          </p>
          <span className="text-[10px] text-brand-emerald font-semibold uppercase mt-2">
            Height logged: {user?.height || 175}cm
          </span>
        </div>

        {/* Total Lost */}
        <div className="glass-card rounded-3xl p-5 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Weight Loss</span>
          <p className="text-3xl font-extrabold tracking-tight mt-1 text-brand-indigo">
            {trendsData?.totalLoss > 0 ? `${trendsData.totalLoss} kg` : trendsData?.totalLoss < 0 ? `+${Math.abs(trendsData.totalLoss)} kg` : '0 kg'}
          </p>
          <span className="text-[10px] text-slate-400 font-semibold mt-2">
            Starting weight: {trendsData?.startWeight || '--'}kg
          </span>
        </div>

        {/* Weekly Velocity */}
        <div className="glass-card rounded-3xl p-5 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Weekly Loss Velocity</span>
          <p className="text-3xl font-extrabold tracking-tight mt-1 text-brand-amber">
            {trendsData?.avgWeeklyLoss ? `${trendsData.avgWeeklyLoss} kg` : '-- kg'}
          </p>
          <span className="text-[10px] text-slate-405 font-medium mt-2">
            {trendsData?.avgWeeklyLoss > 0 ? 'Weight decreasing weekly' : 'Establishing baseline'}
          </span>
        </div>

        {/* Prediction */}
        <div className="glass-card rounded-3xl p-5 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Target ETA</span>
          <p className="text-2xl font-extrabold tracking-tight mt-1 text-slate-800 dark:text-slate-200">
            {typeof trendsData?.predictedWeeks === 'number'
              ? `${trendsData.predictedWeeks} weeks`
              : 'Need more history'}
          </p>
          <span className="text-[10px] text-slate-400 font-semibold mt-2 truncate">
            Target Weight: {trendsData?.targetWeight || '--'}kg
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Logger Input Form */}
        <div className="glass-card rounded-3xl p-6 h-fit">
          <div className="flex items-center gap-2 mb-6">
            <TrendingDown className="w-5 h-5 text-brand-emerald" />
            <h3 className="font-bold text-sm">Weigh-In Log</h3>
          </div>

          <form onSubmit={handleSave} className="flex flex-col gap-4">
            
            {/* Date Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Log Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-slate-100/50 dark:bg-slate-950 border border-slate-200/10 outline-none text-xs font-bold"
              />
            </div>

            {/* Weight Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Current Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 78.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-100/50 dark:bg-slate-950 border border-slate-250/10 outline-none text-sm font-medium"
              />
            </div>

            {/* Tape Measurements grid */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Body Measurements (cm - Optional)</label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  placeholder="Chest"
                  value={chest}
                  onChange={(e) => setChest(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-100/50 dark:bg-slate-950 border border-slate-250/10 outline-none text-xs"
                />
                <input
                  type="number"
                  placeholder="Waist"
                  value={waist}
                  onChange={(e) => setWaist(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-100/50 dark:bg-slate-950 border border-slate-250/10 outline-none text-xs"
                />
                <input
                  type="number"
                  placeholder="Hips"
                  value={hips}
                  onChange={(e) => setHips(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-100/50 dark:bg-slate-950 border border-slate-250/10 outline-none text-xs"
                />
                <input
                  type="number"
                  placeholder="Biceps"
                  value={biceps}
                  onChange={(e) => setBiceps(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-100/50 dark:bg-slate-950 border border-slate-250/10 outline-none text-xs"
                />
                <input
                  type="number"
                  placeholder="Thighs"
                  value={thighs}
                  onChange={(e) => setThighs(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-100/50 dark:bg-slate-950 border border-slate-250/10 outline-none text-xs"
                />
              </div>
            </div>

            {/* Progress photo dropzone */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Progress Photo (Optional)</label>
              <div className="relative border border-dashed border-slate-200 dark:border-slate-800 hover:border-brand-emerald dark:hover:border-brand-emerald rounded-2xl p-4 transition-all text-center flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-950/20">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Camera className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-[10px] font-bold truncate max-w-[200px]">
                  {photoFile ? photoFile.name : 'Upload Progress Photo'}
                </span>
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-brand-emerald dark:hover:bg-brand-emerald-dark font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Weigh-In'}
            </button>

          </form>
        </div>

        {/* Weight history list & Recharts line graphs */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Chart Card */}
          <div className="glass-card rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <LineChartIcon className="w-5 h-5 text-brand-indigo" />
              <h3 className="font-bold text-sm">Weight Progression Curve</h3>
            </div>
            
            {chartData.length < 2 ? (
              <div className="text-center py-20 text-slate-400 text-sm">
                Log weight measurements on multiple days to output a curve.
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
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
                      strokeWidth={3.5}
                      dot={{ r: 4, stroke: '#6366f1', strokeWidth: 2, fill: '#fff' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Table list view */}
          <div className="glass-card rounded-3xl p-6">
            <h3 className="font-bold text-sm mb-4">Logged Weigh-ins History</h3>
            
            <div className="overflow-x-auto max-h-60 custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/50 dark:border-slate-800/50 text-slate-400 font-semibold uppercase">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Weight</th>
                    <th className="py-2.5 px-3">Chest/Waist/Hips</th>
                    <th className="py-2.5 px-3 text-right">Photo</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={4} className="py-8 text-center text-slate-400">Loading history logs...</td></tr>
                  ) : !historyData || historyData.length === 0 ? (
                    <tr><td colSpan={4} className="py-8 text-center text-slate-400">No logs on record yet.</td></tr>
                  ) : (
                    historyData.map((log) => (
                      <tr key={log._id} className="border-b border-slate-100/50 dark:border-slate-800/10 text-slate-700 dark:text-slate-350">
                        <td className="py-3 px-3 font-semibold">{log.date}</td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{log.weight} kg</td>
                        <td className="py-3 px-3 text-slate-500">
                          {log.measurements
                            ? `${log.measurements.chest || '--'}/${log.measurements.waist || '--'}/${log.measurements.hips || '--'} cm`
                            : '--'}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {log.progressPhotoUrl ? (
                            <a
                              href={log.progressPhotoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-brand-emerald font-bold hover:underline"
                            >
                              View Photo
                            </a>
                          ) : (
                            '--'
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

      </div>

    </div>
  );
};
