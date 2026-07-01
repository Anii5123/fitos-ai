import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.js';
import { useToast } from '../contexts/ToastContext.js';
import type { IFoodItem, IMeal } from '../types/index.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Camera,
  UploadCloud,
  AlertCircle,
  FileText,
  Sparkles,
  Save,
  Clock,
  X,
} from 'lucide-react';

export const MealLogger: React.FC = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [mealCategory, setMealCategory] = useState('Breakfast');
  const [mealTime, setMealTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [foodItems, setFoodItems] = useState<IFoodItem[]>([]);
  const [mealNotes, setMealNotes] = useState('');
  const [uploadedImageId, setUploadedImageId] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  // Fetch meals logged on selectedDate
  const { data: mealsData, isLoading } = useQuery({
    queryKey: ['meals', selectedDate],
    queryFn: async () => {
      const res = await api.get(`/meals/date/${selectedDate}`);
      return res.data.meals as IMeal[];
    },
  });

  // Log meal mutation
  const saveMealMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/meals', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals', selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      showToast('Meal logged successfully!', 'success');
      resetForm();
      setModalOpen(false);
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to save meal log', 'error');
    },
  });

  // Delete meal mutation
  const deleteMealMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/meals/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals', selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      showToast('Meal log deleted successfully.', 'success');
    },
    onError: () => {
      showToast('Failed to delete meal log', 'error');
    },
  });

  const resetForm = () => {
    setMealCategory('Breakfast');
    const now = new Date();
    setMealTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    setFoodItems([]);
    setMealNotes('');
    setUploadedImageId(null);
    setUploadedImageUrl(null);
  };

  // Image Upload handler
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);
    showToast('AI Scanner analyzing image...', 'info');

    try {
      const res = await api.post('/meals/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { image, prediction } = res.data;
      setUploadedImageId(image.id);
      setUploadedImageUrl(image.url);

      if (prediction && prediction.foodItems) {
        setFoodItems(prediction.foodItems);
        showToast('AI scanner completed parsing foods!', 'success');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'AI image recognition failed. Please input manually.', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Field mutations helpers
  const updateFoodField = (idx: number, field: keyof IFoodItem, val: any) => {
    setFoodItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  };

  const addEmptyFoodRow = () => {
    setFoodItems((prev) => [
      ...prev,
      { name: '', quantity: '100g', calories: 100, protein: 5, carbs: 15, fat: 2 },
    ]);
  };

  const removeFoodRow = (idx: number) => {
    setFoodItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveMeal = () => {
    if (foodItems.length === 0) {
      showToast('Please add at least one food item.', 'warning');
      return;
    }

    const payload = {
      name: mealCategory,
      time: mealTime,
      date: selectedDate,
      foodItems,
      notes: mealNotes,
      images: uploadedImageId ? [uploadedImageId] : [],
    };

    saveMealMutation.mutate(payload);
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      
      {/* Logger Top Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 outline-none text-sm font-semibold cursor-pointer"
            />
          </div>
        </div>

        <button
          onClick={() => {
            resetForm();
            setModalOpen(true);
          }}
          className="px-5 py-2.5 rounded-xl bg-brand-emerald text-white hover:bg-brand-emerald-dark font-semibold text-sm flex items-center gap-2 shadow-lg shadow-brand-emerald/15 transition-all"
        >
          <Plus className="w-5 h-5" />
          Log a New Meal
        </button>
      </div>

      {/* Main logged meals list */}
      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          <div className="text-center py-12 text-slate-400">Loading meals history...</div>
        ) : !mealsData || mealsData.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center flex flex-col items-center justify-center border-dashed">
            <AlertCircle className="w-12 h-12 text-slate-400 mb-3" />
            <h3 className="font-semibold text-lg">No meals logged</h3>
            <p className="text-slate-400 text-sm max-w-sm mt-1 leading-relaxed">
              Log your food items for this date using either text description templates or direct camera uploads.
            </p>
          </div>
        ) : (
          mealsData.map((meal) => (
            <motion.div
              layout
              key={meal._id}
              className="glass-card rounded-3xl p-6 flex flex-col md:flex-row gap-6 justify-between items-start"
            >
              
              {/* Photo preview */}
              {meal.images && meal.images.length > 0 && (
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-250/10">
                  <img
                    src={meal.images[0].imageUrl}
                    alt={meal.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Meal logs detail */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg text-slate-800 dark:text-slate-200">{meal.name}</span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200/10 text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {meal.time}
                  </span>
                </div>
                
                {/* Foods list */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {meal.foodItems.map((fi, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-xl bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/5 dark:border-slate-800/5 text-xs text-slate-600 dark:text-slate-350"
                    >
                      {fi.quantity} <strong className="text-slate-800 dark:text-slate-200">{fi.name}</strong> ({fi.calories} cal)
                    </span>
                  ))}
                </div>

                {meal.notes && (
                  <p className="text-xs text-slate-400 mt-3 flex items-start gap-1">
                    <FileText className="w-4 h-4 shrink-0" />
                    {meal.notes}
                  </p>
                )}
              </div>

              {/* Aggregated stats & Delete button */}
              <div className="flex md:flex-col justify-between items-end gap-4 w-full md:w-auto border-t md:border-t-0 border-slate-200/20 pt-4 md:pt-0 shrink-0">
                <div className="text-right">
                  <p className="text-xl font-extrabold text-slate-800 dark:text-slate-200">{meal.calories} kcal</p>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">
                    P: {meal.protein}g / C: {meal.carbs}g / F: {meal.fat}g
                  </p>
                </div>
                <button
                  onClick={() => deleteMealMutation.mutate(meal._id)}
                  className="p-2.5 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </div>

            </motion.div>
          ))
        )}
      </div>

      {/* Logging Form modal drawer */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setModalOpen(false)} />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 max-w-2xl w-full max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col z-10"
            >
              <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-emerald" />
                  <h3 className="font-bold text-lg">Log a Meal</h3>
                </div>
                <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                  <X className="w-5.5 h-5.5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
                
                {/* Image upload area */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Scan Food Image (Optional)</label>
                  <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-brand-emerald dark:hover:border-brand-emerald rounded-2xl p-6 transition-all text-center flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-950/20">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={uploading}
                    />
                    
                    {uploadedImageUrl ? (
                      <div className="flex flex-col items-center gap-2">
                        <img src={uploadedImageUrl} alt="Meal upload" className="h-28 rounded-xl object-cover" />
                        <span className="text-xs text-brand-emerald font-semibold">Image analyzed by AI</span>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                        <p className="text-xs font-semibold">Click to upload photo of your meal</p>
                        <p className="text-[10px] text-slate-450 mt-1">Our vision AI identifies foods & estimates macros instantly</p>
                      </>
                    )}

                    {uploading && (
                      <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 rounded-2xl flex items-center justify-center gap-2">
                        <Camera className="w-5 h-5 animate-bounce text-brand-emerald" />
                        <span className="text-xs font-bold text-brand-emerald">Analyzing food portions...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Categorization & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Meal Category</label>
                    <select
                      value={mealCategory}
                      onChange={(e) => setMealCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-100/50 border border-slate-200/10 dark:bg-slate-900 dark:border-slate-800 outline-none text-sm"
                    >
                      <option>Breakfast</option>
                      <option>Lunch</option>
                      <option>Dinner</option>
                      <option>Snack</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Log Time</label>
                    <input
                      type="time"
                      value={mealTime}
                      onChange={(e) => setMealTime(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-100/50 border border-slate-200/10 dark:bg-slate-900 dark:border-slate-800 outline-none text-sm"
                    />
                  </div>
                </div>

                {/* Editable Foods Grid */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Foods List</label>
                    <button
                      onClick={addEmptyFoodRow}
                      className="text-xs font-bold text-brand-emerald hover:text-brand-emerald-dark flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Add Row
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {foodItems.map((item, idx) => (
                      <div key={idx} className="p-3 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl flex flex-col gap-3 bg-slate-100/10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Food Item e.g. Egg Whites"
                            value={item.name}
                            onChange={(e) => updateFoodField(idx, 'name', e.target.value)}
                            className="px-3 py-1.5 rounded-lg bg-slate-100/50 dark:bg-slate-950 border border-slate-200/10 outline-none text-xs font-medium"
                          />
                          <input
                            type="text"
                            placeholder="Quantity e.g. 3 eggs"
                            value={item.quantity}
                            onChange={(e) => updateFoodField(idx, 'quantity', e.target.value)}
                            className="px-3 py-1.5 rounded-lg bg-slate-100/50 dark:bg-slate-950 border border-slate-200/10 outline-none text-xs"
                          />
                        </div>
                        
                        <div className="grid grid-cols-4 gap-1.5">
                          <div>
                            <span className="text-[9px] text-slate-400 font-semibold uppercase">Cal</span>
                            <input
                              type="number"
                              value={item.calories}
                              onChange={(e) => updateFoodField(idx, 'calories', Number(e.target.value))}
                              className="w-full px-2 py-1 rounded bg-slate-100 dark:bg-slate-950 text-xs border border-slate-200/10"
                            />
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 font-semibold uppercase">Prot (g)</span>
                            <input
                              type="number"
                              value={item.protein}
                              onChange={(e) => updateFoodField(idx, 'protein', Number(e.target.value))}
                              className="w-full px-2 py-1 rounded bg-slate-100 dark:bg-slate-950 text-xs border border-slate-200/10"
                            />
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 font-semibold uppercase">Carb (g)</span>
                            <input
                              type="number"
                              value={item.carbs}
                              onChange={(e) => updateFoodField(idx, 'carbs', Number(e.target.value))}
                              className="w-full px-2 py-1 rounded bg-slate-100 dark:bg-slate-950 text-xs border border-slate-200/10"
                            />
                          </div>
                          <div className="relative">
                            <span className="text-[9px] text-slate-400 font-semibold uppercase">Fat (g)</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={item.fat}
                                onChange={(e) => updateFoodField(idx, 'fat', Number(e.target.value))}
                                className="w-full px-2 py-1 rounded bg-slate-100 dark:bg-slate-950 text-xs border border-slate-200/10"
                              />
                              <button
                                onClick={() => removeFoodRow(idx)}
                                className="text-rose-500 hover:text-rose-600 shrink-0"
                              >
                                <Trash2 className="w-4.5 h-4.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {foodItems.length === 0 && (
                      <div className="text-center py-6 border border-dashed rounded-2xl text-slate-400 text-xs">
                        Add rows manually or upload an image to populate foods.
                      </div>
                    )}
                  </div>
                </div>

                {/* Optional Notes */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Meal Notes (Optional)</label>
                  <textarea
                    rows={2}
                    value={mealNotes}
                    onChange={(e) => setMealNotes(e.target.value)}
                    placeholder="Log how you felt or any meal configurations (e.g. high sodium snack)..."
                    className="w-full px-4 py-3 rounded-2xl bg-slate-100/50 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-900 border border-slate-200/10 dark:border-slate-800/10 outline-none text-xs custom-scrollbar resize-none"
                  />
                </div>

              </div>

              {/* Action Footer */}
              <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50 flex justify-end gap-2 shrink-0">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-900 dark:hover:bg-slate-850 dark:text-slate-300 font-semibold text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveMeal}
                  disabled={foodItems.length === 0 || saveMealMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-brand-emerald text-white hover:bg-brand-emerald-dark font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-brand-emerald/10"
                >
                  <Save className="w-4 h-4" />
                  Save Meal Log
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
