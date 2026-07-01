import mongoose, { Schema, Document } from 'mongoose';

export interface IBodyMeasurements {
  chest?: number;
  waist?: number;
  hips?: number;
  biceps?: number;
  thighs?: number;
}

export interface IWeightHistory extends Document {
  userId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  weight: number; // in kg
  measurements?: IBodyMeasurements;
  progressPhotoUrl?: string;
  cloudinaryPublicId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MeasurementsSchema = new Schema<IBodyMeasurements>({
  chest: Number,
  waist: Number,
  hips: Number,
  biceps: Number,
  thighs: Number,
}, { _id: false });

const WeightHistorySchema = new Schema<IWeightHistory>(
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
    weight: {
      type: Number,
      required: true,
    },
    measurements: MeasurementsSchema,
    progressPhotoUrl: String,
    cloudinaryPublicId: String,
  },
  {
    timestamps: true,
  }
);

// One entry per day allowed
WeightHistorySchema.index({ userId: 1, date: 1 }, { unique: true });

export const WeightHistory = mongoose.model<IWeightHistory>('WeightHistory', WeightHistorySchema);
