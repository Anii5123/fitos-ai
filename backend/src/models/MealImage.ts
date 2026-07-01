import mongoose, { Schema, Document } from 'mongoose';

export interface IMealImage extends Document {
  userId: mongoose.Types.ObjectId;
  mealId?: mongoose.Types.ObjectId; // Optional until linked
  imageUrl: string;
  cloudinaryPublicId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MealImageSchema = new Schema<IMealImage>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mealId: {
      type: Schema.Types.ObjectId,
      ref: 'Meal',
      index: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    cloudinaryPublicId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const MealImage = mongoose.model<IMealImage>('MealImage', MealImageSchema);
