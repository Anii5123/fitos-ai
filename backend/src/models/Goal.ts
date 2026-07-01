import mongoose, { Schema, Document } from 'mongoose';

export interface IGoal extends Document {
  userId: mongoose.Types.ObjectId;
  targetWeight: number;
  targetCalories: number;
  proteinGoal: number; // in grams
  carbsGoal: number; // in grams
  fatGoal: number; // in grams
  waterGoal: number; // in ml
  dailyStepGoal: number;
  targetDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema = new Schema<IGoal>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetWeight: {
      type: Number,
      required: true,
    },
    targetCalories: {
      type: Number,
      required: true,
    },
    proteinGoal: {
      type: Number,
      required: true,
    },
    carbsGoal: {
      type: Number,
      default: 0,
    },
    fatGoal: {
      type: Number,
      default: 0,
    },
    waterGoal: {
      type: Number,
      required: true,
    },
    dailyStepGoal: {
      type: Number,
      required: true,
    },
    targetDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Before saving a new goal as active, set other goals for the same user as inactive
GoalSchema.pre('save', async function (next) {
  if (this.isModified('isActive') && this.isActive) {
    await mongoose.model('Goal').updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { $set: { isActive: false } }
    );
  }
  next();
});

export const Goal = mongoose.model<IGoal>('Goal', GoalSchema);
