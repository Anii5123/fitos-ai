export interface IUser {
  _id: string;
  email: string;
  name?: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  height?: number; // in cm
  createdAt: string;
  updatedAt: string;
}

export interface IGoal {
  _id: string;
  userId: string;
  targetWeight: number;
  targetCalories: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  waterGoal: number; // in ml
  dailyStepGoal: number;
  targetDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IFoodItem {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface IMealImage {
  _id: string;
  imageUrl: string;
  mealId?: string;
  createdAt: string;
}

export interface IMeal {
  _id: string;
  userId: string;
  name: string;
  time: string;
  date: string;
  foodItems: IFoodItem[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  notes?: string;
  images: IMealImage[];
  createdAt: string;
  updatedAt: string;
}

export interface IDailyActivity {
  _id: string;
  userId: string;
  date: string;
  stepsWalked: number;
  caloriesBurned: number;
  exerciseDuration: number;
  sleepHours: number;
  workoutType?: string;
  mood?: string;
  energyLevel?: number;
  createdAt: string;
  updatedAt: string;
}

export interface IWeightLog {
  _id: string;
  userId: string;
  date: string;
  weight: number;
  measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    biceps?: number;
    thighs?: number;
  };
  progressPhotoUrl?: string;
  createdAt: string;
}

export interface IAIInsight {
  _id: string;
  userId: string;
  date: string;
  type: 'daily' | 'weekly' | 'monthly' | 'recommendation';
  summary: string;
  actionPoints: string[];
  suggestions: string[];
  createdAt: string;
}

export interface IWeeklyReport {
  _id: string;
  userId: string;
  startDate: string;
  endDate: string;
  averageCalories: number;
  averageProtein: number;
  averageSteps: number;
  highestCalorieDay: {
    date: string;
    calories: number;
  };
  lowestProteinDay: {
    date: string;
    protein: number;
  };
  weightChange: number;
  predictedFatLoss: number;
  aiSummary: string;
  suggestions: string[];
  createdAt: string;
}

export interface IMonthlyReport {
  _id: string;
  userId: string;
  month: string;
  averageCalories: number;
  averageProtein: number;
  averageSteps: number;
  weightChange: number;
  bmiChange: number;
  cheatMealsCount: number;
  topFoodsConsumed: { name: string; count: number }[];
  complianceScores: {
    calorie: number;
    protein: number;
    activity: number;
  };
  aiSummary: string;
  suggestions: string[];
  pdfCloudinaryUrl?: string;
  createdAt: string;
}

export interface INotification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
}
