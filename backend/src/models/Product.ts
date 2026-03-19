import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  title: string;
  price: number;
  category: string;
  image: string | string[]; // Support both single image and array of images
  sellerId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ProductSchema: Schema = new Schema({
  title: String,
  price: Number,
  category: String,
  image: { type: [String], default: [] }, // Array of image URLs
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // ObjectId for proper populate()
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model<IProduct>('Product', ProductSchema);
