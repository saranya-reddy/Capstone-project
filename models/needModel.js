import { Schema, model } from "mongoose";

const needSchema = new Schema({
    recipientOrgId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetQuantity: { type: Number, required: true },
    requiredTimeframeStart: { type: Date, required: true },
    requiredTimeframeEnd: { type: Date, required: true },
    dietaryConstraints: [{ type: String }],
    status: { type: String, enum: ['open', 'matched', 'fulfilled'], default: 'open' }
}, { timestamps: true });

export const needModel = model('Need', needSchema);