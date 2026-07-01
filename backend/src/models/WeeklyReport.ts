import mongoose, { Schema, Document } from 'mongoose';

export interface IWeeklyReport extends Document {
  userId: mongoose.Types.ObjectId;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
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
  weightChange: number; // in kg, negative means loss
  predictedFatLoss: number; // estimated fat loss in kg
  aiSummary: string;
  suggestions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const WeeklyReportSchema = new Schema<IWeeklyReport>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    averageCalories: { type: Number, required: true },
    averageProtein: { type: Number, required: true },
    averageSteps: { type: Number, required: true },
    highestCalorieDay: {
      date: String,
      calories: Number,
    },
    lowestProteinDay: {
      date: String,
      protein: Number,
    },
    weightChange: { type: Number, default: 0 },
    predictedFatLoss: { type: Number, default: 0 },
    aiSummary: { type: String, required: true },
    suggestions: [String],
  },
  {
    timestamps: true,
  }
);

WeeklyReportSchema.index({ userId: 1, startDate: -1 });

export const WeeklyReport = mongoose.model<IWeeklyReport>('WeeklyReport', WeeklyReportSchema);
