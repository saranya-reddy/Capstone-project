import { Schema, model } from "mongoose";

const handoverSchema = new Schema({
    reservationId: { type: Schema.Types.ObjectId, ref: 'Reservation', required: true },
    donorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipientOrgId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    volunteerId: { type: Schema.Types.ObjectId, ref: 'User' }, // Optional: tracked if a volunteer handled transport
    handedOverQuantity: { type: Number, required: true },
    handoverTime: { type: Date, default: Date.now },
    cancellationReason: { type: String }
}, { timestamps: true });

export const handoverModel = model('Handover', handoverSchema);