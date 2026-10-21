import { Schema, model } from "mongoose";

const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true }, // Hashed with bcrypt
    role: {
        type: String,
        enum: ['Donor', 'Recipient coordinator', 'Platform coordinator', 'Volunteer'],
        required: true
    },
    organizationName: {
        type: String,
        // Only required if the user is NOT a volunteer
        required: function () { return this.role !== 'Volunteer'; }
    },
    isVerified: { type: Boolean, default: false }, // Requires platform coordinator approval
    address: { type: String, required: true },
    contactNumber: { type: String, required: true }
}, { timestamps: true });

export const userModel = model('User', userSchema);