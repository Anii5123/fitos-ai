import mongoose, { Schema, Document } from 'mongoose';

export interface IFoodItem {
  name: string;
  quantity: string; // e.g., "150 gm", "2 slices"
  calories: number;
  protein: number; // in grams
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface IMeal extends Document {
  userId: mongoose.Types.ObjectId;
  name: string; // e.g. "Breakfast", "Lunch", "Snack"
  time: string; // e.g., "08:30", "13:15"
  date: string; // YYYY-MM-DD format for aggregation
  foodItems: IFoodItem[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  notes?: string;
  images: mongoose.Types.ObjectId[]; // reference to MealImage docs
  createdAt: Date;
  updatedAt: Date;
}

const FoodItemSchema = new Schema<IFoodItem>({
  name: { type: String, required: true },
  quantity: { type: String, required: true },
  calories: { type: Number, required: true },
  protein: { type: Number, required: true },
  carbs: { type: Number, required: true },
  fat: { type: Number, required: true },
  fiber: { type: Number, default: 0 },
  sugar: { type: Number, default: 0 },
  sodium: { type: Number, default: 0 },
});

const MealSchema = new Schema<IMeal>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    foodItems: [FoodItemSchema],
    calories: {
      type: Number,
      required: true,
      default: 0,
    },
    protein: {
      type: Number,
      required: true,
      default: 0,
    },
    carbs: {
      type: Number,
      required: true,
      default: 0,
    },
    fat: {
      type: Number,
      required: true,
      default: 0,
    },
    fiber: {
      type: Number,
      default: 0,
    },
    sugar: {
      type: Number,
      default: 0,
    },
    sodium: {
      type: Number,
      default: 0,
    },
    notes: String,
    images: [
      {
        type: Schema.Types.ObjectId,
        ref: 'MealImage',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to calculate meal aggregate macros automatically
MealSchema.pre('save', function (next) {
  const meal = this as IMeal;
  if (meal.foodItems && meal.foodItems.length > 0) {
    meal.calories = Math.round(meal.foodItems.reduce((acc, item) => acc + item.calories, 0));
    meal.protein = Math.round(meal.foodItems.reduce((acc, item) => acc + item.protein, 0) * 10) / 10;
    meal.carbs = Math.round(meal.foodItems.reduce((acc, item) => acc + item.carbs, 0) * 10) / 10;
    meal.fat = Math.round(meal.foodItems.reduce((acc, item) => acc + item.fat, 0) * 10) / 10;
    meal.fiber = Math.round(meal.foodItems.reduce((acc, item) => acc + (item.fiber || 0), 0) * 10) / 10;
    meal.sugar = Math.round(meal.foodItems.reduce((acc, item) => acc + (item.sugar || 0), 0) * 10) / 10;
    meal.sodium = Math.round(meal.foodItems.reduce((acc, item) => acc + (item.sodium || 0), 0));
  }
  next();
});

export const Meal = mongoose.model<IMeal>('Meal', MealSchema);
