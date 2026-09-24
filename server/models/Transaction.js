import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    id: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'PHP',
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    merchant: {
      type: String,
      default: '',
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

transactionSchema.index({ userId: 1, date: -1 });

export const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
