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
  description: String,
  price: Number,
  category: String,
  image: { type: [String], default: [] }, // New array field
  image_url: String, // Old single field
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // New camelCase
  seller_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Old snake_case
  status: { type: String, default: 'available' },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model<IProduct>('Product', ProductSchema, 'marketplaceitems');
