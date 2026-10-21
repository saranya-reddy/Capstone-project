import { Schema, model } from "mongoose";

const volunteerAssignmentSchema = new Schema({
    reservationId: { type: Schema.Types.ObjectId, ref: 'Reservation', required: true },
    volunteerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
        type: String,
        enum: ['assigned', 'en_route_to_donor', 'picked_up', 'delivered', 'cancelled'],
        default: 'assigned'
    },
    acceptedAt: { type: Date, default: Date.now },
    completedAt: { type: Date }
}, { timestamps: true });

export const volunteerAssignmentModel = model('VolunteerAssignment', volunteerAssignmentSchema);