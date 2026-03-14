import mongoose, { Schema, Document } from 'mongoose';

export interface IMarketplaceItem extends Document {
  title: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  seller_id: mongoose.Types.ObjectId;
  status: 'available' | 'sold' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

const MarketplaceItemSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image_url: { type: String, required: true },
  category: { type: String, default: 'General' },
  seller_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['available', 'sold', 'archived'], default: 'available' },
}, { timestamps: true });

export default mongoose.model<IMarketplaceItem>('MarketplaceItem', MarketplaceItemSchema);
