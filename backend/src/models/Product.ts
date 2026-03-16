import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  title: string;
  price: number;
  category: string;
  image: string;
  sellerId: string | mongoose.Types.ObjectId;
  createdAt: Date;
}

const ProductSchema: Schema = new Schema({
  title: String,
  price: Number,
  category: String,
  image: String,
  sellerId: { type: String, ref: 'User' }, // Keeping ref for population
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// For convenience, we can add a virtual or just ensure population works
export default mongoose.model<IProduct>('Product', ProductSchema);
