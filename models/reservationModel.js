import { Schema, model } from "mongoose";

const reservationSchema = new Schema({
    surplusLotId: { type: Schema.Types.ObjectId, ref: 'SurplusLot', required: true },

    recipientOrgId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    reservedQuantity: { type: Number, required: true },

    reservationExpiresAt: { type: Date, required: true },

    status: {
        type: String,
        enum: ['pending_confirmation', 'confirmed', 'expired', 'cancelled'],
        default: 'pending_confirmation'
    }
}, { timestamps: true });

export const reservationModel = model('Reservation', reservationSchema);