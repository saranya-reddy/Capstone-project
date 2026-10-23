import express from "express";
import { handoverModel } from "../models/handoverModel.js";
import { reservationModel } from "../models/reservationModel.js";
import { surplusLotModel } from "../models/surplusLotModel.js";
import { verifyToken } from "../middlewares/tokenVerificationMiddleware.js";
import { allowedRoles } from "../middlewares/allowedRolesMiddleware.js";

export const handoverRouter = express.Router();

// 1. RECORD A COMPLETED HANDOVER
// POST /api/handovers/handedover
handoverRouter.post('/handedover', verifyToken, allowedRoles(['Recipient coordinator', 'Platform coordinator', 'Volunteer']), async (req, res) => {
    try {
        const { reservationId, handedOverQuantity, cancellationReason } = req.body;
        const recordedBy = req.user.id || req.user._id;

        // Verify the reservation exists and populate surplusLotId to find the donor
        const reservation = await reservationModel.findById(reservationId).populate('surplusLotId');
        if (!reservation) {
            return res.status(404).json({ success: false, message: "Reservation not found." });
        }

        // Check if a handover for this reservation has already been recorded
        const existingHandover = await handoverModel.findOne({ reservationId });
        if (existingHandover) {
            return res.status(400).json({ success: false, message: "Handover for this reservation has already been recorded." });
        }

        // Extract donor ID from the associated surplus lot
        const surplusLot = reservation.surplusLotId;
        const donorId = surplusLot ? (surplusLot.donorOrgId || surplusLot.donorId || surplusLot.userId) : null;

        const newHandover = new handoverModel({
            reservationId,
            donorId,
            recipientOrgId: reservation.recipientOrgId, // Matches schema field name
            handedOverQuantity: handedOverQuantity || reservation.reservedQuantity, // Matches schema field name
            cancellationReason
        });

        const savedHandover = await newHandover.save();

        // Update reservation status to completed
        reservation.status = 'completed';
        await reservation.save();

        res.status(201).json({
            success: true,
            message: "Handover recorded successfully. Audit entry saved.",
            data: savedHandover
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 2. GET ALL HANDOVER AUDIT RECORDS
// GET /api/handovers/allhandovers
handoverRouter.get('/allhandovers', verifyToken, allowedRoles(['Platform coordinator', 'Recipient coordinator', 'Donor']), async (req, res) => {
    try {
        let query = {};

        // Filter based on user role using correct schema fields
        if (req.user.role === 'Recipient coordinator') {
            query.recipientOrgId = req.user.id || req.user._id;
        } else if (req.user.role === 'Donor') {
            query.donorId = req.user.id || req.user._id;
        }

        const handovers = await handoverModel.find(query)
            .populate({
                path: 'reservationId',
                populate: { path: 'surplusLotId' }
            })
            .populate('recipientOrgId', 'organizationName address contactNumber email')
            .populate('donorId', 'organizationName name email contactNumber')
            .populate('volunteerId', 'name email contactNumber');

        res.status(200).json({
            success: true,
            count: handovers.length,
            data: handovers
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});