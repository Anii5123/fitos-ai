import mongoose, { Schema, Document } from 'mongoose';

export interface ITopFood {
  name: string;
  count: number;
}

export interface IMonthlyReport extends Document {
  userId: mongoose.Types.ObjectId;
  month: string; // YYYY-MM
  averageCalories: number;
  averageProtein: number;
  averageSteps: number;
  weightChange: number; // in kg
  bmiChange: number;
  cheatMealsCount: number;
  topFoodsConsumed: ITopFood[];
  complianceScores: {
    calorie: number;  // percent target reached
    protein: number;  // percent target reached
    activity: number; // percent step goal reached
  };
  aiSummary: string;
  suggestions: string[];
  pdfCloudinaryUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TopFoodSchema = new Schema<ITopFood>({
  name: String,
  count: Number,
}, { _id: false });

const MonthlyReportSchema = new Schema<IMonthlyReport>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    month: { type: String, required: true },
    averageCalories: { type: Number, required: true },
    averageProtein: { type: Number, required: true },
    averageSteps: { type: Number, required: true },
    weightChange: { type: Number, default: 0 },
    bmiChange: { type: Number, default: 0 },
    cheatMealsCount: { type: Number, default: 0 },
    topFoodsConsumed: [TopFoodSchema],
    complianceScores: {
      calorie: { type: Number, default: 0 },
      protein: { type: Number, default: 0 },
      activity: { type: Number, default: 0 },
    },
    aiSummary: { type: String, required: true },
    suggestions: [String],
    pdfCloudinaryUrl: String,
  },
  {
    timestamps: true,
  }
);

MonthlyReportSchema.index({ userId: 1, month: -1 });

export const MonthlyReport = mongoose.model<IMonthlyReport>('MonthlyReport', MonthlyReportSchema);
