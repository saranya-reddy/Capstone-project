import { Schema, model } from "mongoose";

const surplusLotSchema = new Schema({
    donorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    quantity: { type: Number, required: true },
    preparationDetails: { type: String, required: true },
    storageGuidelines: { type: String, required: true },
    allergens: [{ type: String }],
    foodExpiresAt: { type: Date, required: true }, // When the food itself expires/goes bad
    pickupWindowStart: { type: Date, required: true },
    pickupWindowEnd: { type: Date, required: true },
    status: {
        type: String,
        enum: ['active', 'reserved', 'expired', 'fulfilled'],
        default: 'active'
    }
}, { timestamps: true });

export const surplusLotModel = model('SurplusLot', surplusLotSchema);