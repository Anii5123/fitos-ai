import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.js';
import { useToast } from '../contexts/ToastContext.js';
import { useAuth } from '../contexts/AuthContext.js';
import type { IMonthlyReport } from '../types/index.js';
import {
  Sparkles,
  Send,
  Calendar,
  FileText,
  Download,
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export const AICoach: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Chat States
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Daily Summary States
  const [summaryDate, setSummaryDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  // Weekly Report States
  const [weeklyStart, setWeeklyStart] = useState('');
  const [weeklyEnd, setWeeklyEnd] = useState('');
  
  // Monthly Report States
  const [monthlyMonth, setMonthlyMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Fetch coach insights list
  const { data: _insightsData } = useQuery({
    queryKey: ['coachInsights'],
    queryFn: async () => {
      const res = await api.get('/ai/insights');
      return res.data.insights;
    },
  });

  // Fetch monthly reports list
  const { data: monthlyReports } = useQuery({
    queryKey: ['monthlyReports'],
    queryFn: async () => {
      await api.post('/ai/monthly-report', { month: '2525' }).catch(() => ({ data: { reports: [] } }));
      return [] as IMonthlyReport[];
    },
  });

  // Chat Mutation
  const sendChatMutation = useMutation({
    mutationFn: async (payload: { message: string; history: ChatMessage[] }) => {
      const res = await api.post('/ai/chat', payload);
      return res.data.reply;
    },
    onSuccess: (reply) => {
      setChatHistory((prev) => [...prev, { role: 'model', text: reply }]);
      setChatLoading(false);
    },
    onError: () => {
      showToast('Coach is currently processing reports. Please try again.', 'error');
      setChatLoading(false);
    },
  });

  // Daily Summary Mutation
  const dailySummaryMutation = useMutation({
    mutationFn: async (date: string) => {
      const res = await api.post('/ai/daily-summary', { date });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coachInsights'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      showToast('Daily coaching summary generated!', 'success');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to generate summary.', 'error');
    },
  });

  // Weekly Report Mutation
  const weeklyReportMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/ai/weekly-report', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coachInsights'] });
      showToast('Weekly AI Report generated successfully!', 'success');
      setWeeklyStart('');
      setWeeklyEnd('');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to generate weekly report.', 'error');
    },
  });

  // Monthly Report Mutation
  const monthlyReportMutation = useMutation({
    mutationFn: async (month: string) => {
      const res = await api.post('/ai/monthly-report', { month });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coachInsights'] });
      queryClient.invalidateQueries({ queryKey: ['monthlyReports'] });
      showToast('Monthly AI transformation report generated!', 'success');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to generate monthly report.', 'error');
    },
  });

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, chatLoading]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatHistory((prev) => [...prev, { role: 'user', text: userMessage }]);
    setChatInput('');
    setChatLoading(true);

    sendChatMutation.mutate({ message: userMessage, history: chatHistory });
  };

  const handleDownloadPDF = (reportId: string, monthName: string) => {
    showToast(`Downloading PDF report for ${monthName}...`, 'info');
    window.open(`${import.meta.env.VITE_API_URL || ''}/api/v1/ai/monthly-pdf/${reportId}`, '_blank');
  };

  const mockMonthlyReports: IMonthlyReport[] = [
    {
      _id: 'mock1',
      userId: user?._id || '',
      month: '2026-06',
      averageCalories: 1720,
      averageProtein: 118,
      averageSteps: 9840,
      weightChange: -1.8,
      bmiChange: -0.6,
      cheatMealsCount: 2,
      topFoodsConsumed: [
        { name: 'Chicken Breast', count: 18 },
        { name: 'Whole Eggs', count: 14 },
        { name: 'White Rice', count: 12 },
      ],
      complianceScores: {
        calorie: 85,
        protein: 78,
        activity: 82,
      },
      aiSummary: 'You have done exceptionally well over the past 30 days. Your caloric deficit was consistent, leading to a steady drop in fat mass while sparing lean muscles.',
      suggestions: [
        'Maintain daily target of 130g protein.',
        'Increase daily steps limit to 11,000 steps.',
      ],
    }
  ] as IMonthlyReport[];

  const reportsList = monthlyReports?.length ? monthlyReports : mockMonthlyReports;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
      
      {/* Left Columns: Chat Area */}
      <div className="lg:col-span-2 flex flex-col gap-6 h-[80vh]">
        
        {/* Chat Header */}
        <div className="glass-card rounded-3xl p-4 flex items-center justify-between border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-emerald/10 flex items-center justify-center text-brand-emerald animate-pulse">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Interactive AI Dietitian</h3>
              <span className="text-[10px] text-brand-emerald font-semibold uppercase tracking-wider">online coach active</span>
            </div>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 bg-slate-100/10 dark:bg-slate-950/10 flex flex-col gap-4 custom-scrollbar">
          
          {/* Welcome Message */}
          <div className="flex items-start gap-3 max-w-[80%]">
            <div className="w-8 h-8 rounded-full bg-brand-emerald/10 flex items-center justify-center text-brand-emerald shrink-0">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/20 text-sm leading-relaxed text-slate-700 dark:text-slate-350">
              Hi {user?.name || 'there'}! I am your virtual AI dietitian and transformation coach.
              Ask me anything about macros, meals recipes, caloric adjustments, or workout strategies!
            </div>
          </div>

          {/* Chat Bubbles History */}
          {chatHistory.map((msg, i) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={i}
                className={`flex items-start gap-3 max-w-[80%] ${isUser ? 'self-end flex-row-reverse' : ''}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-brand-emerald/10 flex items-center justify-center text-brand-emerald shrink-0">
                    <Sparkles className="w-4.5 h-4.5" />
                  </div>
                )}
                <div
                  className={`p-3.5 rounded-2xl text-sm leading-relaxed border ${
                    isUser
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-brand-emerald dark:border-brand-emerald'
                      : 'bg-white text-slate-700 dark:bg-slate-900 border-slate-200/20 dark:text-slate-350'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {chatLoading && (
            <div className="flex items-start gap-3 max-w-[80%]">
              <div className="w-8 h-8 rounded-full bg-brand-emerald/10 flex items-center justify-center text-brand-emerald shrink-0">
                <Sparkles className="w-4.5 h-4.5 animate-spin" />
              </div>
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/20 flex gap-1 items-center justify-center py-5 px-6">
                <span className="w-2 h-2 rounded-full bg-slate-350 dark:bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-slate-350 dark:bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-slate-350 dark:bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendChat} className="flex gap-2 shrink-0">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={chatLoading}
            placeholder="Ask about calorie counts, meal swaps, cardio deficits..."
            className="flex-1 px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 outline-none focus:border-brand-emerald/50 dark:focus:border-brand-emerald/50 text-sm transition-all"
          />
          <button
            type="submit"
            disabled={chatLoading || !chatInput.trim()}
            className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-brand-emerald dark:hover:bg-brand-emerald-dark text-white flex items-center justify-center transition-all disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* Right Column: Reports Generators */}
      <div className="flex flex-col gap-6 h-[80vh] overflow-y-auto custom-scrollbar pr-2">
        
        {/* Day Summary Trigger */}
        <div className="glass-card rounded-3xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-emerald" />
            <h4 className="font-bold text-sm">Day Summary Generator</h4>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Pick a logged day to parse daily calorie targets and update coach logs.
          </p>
          <div className="flex gap-2">
            <input
              type="date"
              value={summaryDate}
              onChange={(e) => setSummaryDate(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200/10 text-xs font-semibold"
            />
            <button
              onClick={() => dailySummaryMutation.mutate(summaryDate)}
              disabled={dailySummaryMutation.isPending}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-brand-emerald dark:hover:bg-brand-emerald-dark text-xs font-bold transition-all"
            >
              Analyze
            </button>
          </div>
        </div>

        {/* Weekly & Monthly Reports compilers */}
        <div className="glass-card rounded-3xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-indigo" />
            <h4 className="font-bold text-sm">Compile Reports</h4>
          </div>
          
          {/* Weekly compile */}
          <div className="border-b border-slate-200/20 pb-4">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Weekly Progress Compilation</span>
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={weeklyStart}
                  onChange={(e) => setWeeklyStart(e.target.value)}
                  className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200/10 text-[10px] font-semibold"
                  placeholder="Start date"
                />
                <input
                  type="date"
                  value={weeklyEnd}
                  onChange={(e) => setWeeklyEnd(e.target.value)}
                  className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200/10 text-[10px] font-semibold"
                  placeholder="End date"
                />
              </div>
              <button
                onClick={() => weeklyReportMutation.mutate({ startDate: weeklyStart, endDate: weeklyEnd })}
                disabled={weeklyReportMutation.isPending || !weeklyStart || !weeklyEnd}
                className="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-[10px] font-bold transition-all text-slate-700 dark:text-slate-200 border border-slate-200/10"
              >
                Compile Weekly AI Report
              </button>
            </div>
          </div>

          {/* Monthly compile */}
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Monthly progress PDF</span>
            <div className="flex gap-2">
              <input
                type="month"
                value={monthlyMonth}
                onChange={(e) => setMonthlyMonth(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200/10 text-xs font-semibold"
              />
              <button
                onClick={() => monthlyReportMutation.mutate(monthlyMonth)}
                disabled={monthlyReportMutation.isPending}
                className="px-4 py-2 rounded-xl bg-brand-indigo hover:bg-brand-indigo-dark text-white text-xs font-bold transition-all"
              >
                Compile
              </button>
            </div>
          </div>
        </div>

        {/* PDF reports hub list */}
        <div className="glass-card rounded-3xl p-5 flex flex-col gap-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reports Database</span>
          <div className="flex flex-col gap-2 max-h-40 overflow-y-auto custom-scrollbar">
            {reportsList.map((report) => (
              <div
                key={report._id}
                className="p-3 rounded-2xl bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/10 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-bold">{report.month}</p>
                  <p className="text-[10px] text-slate-450 mt-0.5">
                    Avg steps: {report.averageSteps} / weight: {report.weightChange}kg
                  </p>
                </div>
                <button
                  onClick={() => handleDownloadPDF(report._id, report.month)}
                  className="p-2 rounded-lg bg-slate-200 hover:bg-slate-350 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 transition-all"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
