import mongoose, { Schema, Document } from 'mongoose';

export interface IAIInsight extends Document {
  userId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  type: 'daily' | 'weekly' | 'monthly' | 'recommendation';
  summary: string;
  actionPoints: string[];
  suggestions: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const AIInsightSchema = new Schema<IAIInsight>(
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
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'recommendation'],
      required: true,
    },
    summary: {
      type: String,
      required: true,
    },
    actionPoints: [String],
    suggestions: [String],
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Indexing for search
AIInsightSchema.index({ userId: 1, date: -1, type: 1 });

export const AIInsight = mongoose.model<IAIInsight>('AIInsight', AIInsightSchema);
