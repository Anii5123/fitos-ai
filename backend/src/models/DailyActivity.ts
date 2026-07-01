import mongoose, { Schema, Document } from 'mongoose';

export interface IDailyActivity extends Document {
  userId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  stepsWalked: number;
  caloriesBurned: number;
  exerciseDuration: number; // in minutes
  sleepHours: number;
  workoutType?: string; // e.g. "Cardio", "Strength", "Yoga", "None"
  mood?: string; // e.g. "Energetic", "Happy", "Neutral", "Tired", "Stressed"
  energyLevel?: number; // scale 1-10
  createdAt: Date;
  updatedAt: Date;
}

const DailyActivitySchema = new Schema<IDailyActivity>(
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
    stepsWalked: {
      type: Number,
      default: 0,
    },
    caloriesBurned: {
      type: Number,
      default: 0,
    },
    exerciseDuration: {
      type: Number,
      default: 0,
    },
    sleepHours: {
      type: Number,
      default: 0,
    },
    workoutType: {
      type: String,
      default: 'None',
    },
    mood: {
      type: String,
      default: 'Neutral',
    },
    energyLevel: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index per user/day
DailyActivitySchema.index({ userId: 1, date: 1 }, { unique: true });

export const DailyActivity = mongoose.model<IDailyActivity>('DailyActivity', DailyActivitySchema);
