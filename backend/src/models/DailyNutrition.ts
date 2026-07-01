import mongoose, { Schema, Document } from 'mongoose';

export interface IDailyNutrition extends Document {
  userId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  caloriesConsumed: number;
  proteinConsumed: number;
  carbsConsumed: number;
  fatConsumed: number;
  fiberConsumed: number;
  waterIntake: number; // in ml
  createdAt: Date;
  updatedAt: Date;
}

const DailyNutritionSchema = new Schema<IDailyNutrition>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    caloriesConsumed: {
      type: Number,
      required: true,
      default: 0,
    },
    proteinConsumed: {
      type: Number,
      required: true,
      default: 0,
    },
    carbsConsumed: {
      type: Number,
      required: true,
      default: 0,
    },
    fatConsumed: {
      type: Number,
      required: true,
      default: 0,
    },
    fiberConsumed: {
      type: Number,
      required: true,
      default: 0,
    },
    waterIntake: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for fast queries and uniqueness per user/day
DailyNutritionSchema.index({ userId: 1, date: 1 }, { unique: true });

export const DailyNutrition = mongoose.model<IDailyNutrition>('DailyNutrition', DailyNutritionSchema);
