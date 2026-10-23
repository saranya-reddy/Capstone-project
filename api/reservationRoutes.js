import express from "express";
import { reservationModel } from "../models/reservationModel.js"; // Adjust model path/name if needed
import { surplusLotModel } from "../models/surplusLotModel.js";
import { verifyToken } from "../middlewares/tokenVerificationMiddleware.js";
import { allowedRoles } from "../middlewares/allowedRolesMiddleware.js";

export const reservationRouter = express.Router();

// 1. CREATE A NEW RESERVATION (Claim a Lot)
// POST /api/reservations
// Inside reservationRoutes.js (POST /newOrder)
reservationRouter.post('/newOrder', verifyToken, allowedRoles(['Recipient coordinator']), async (req, res) => {
    try {
        const { surplusLotId, reservedQuantity } = req.body;
        const recipientOrgId = req.user.id || req.user._id;

        // 1. Check if the surplus lot exists and is active
        const lot = await surplusLotModel.findById(surplusLotId);
        if (!lot || lot.status !== 'active') {
            return res.status(404).json({ success: false, message: "Surplus lot not found or no longer active." });
        }

        // Determine the quantity to reserve (either specified amount or the whole lot)
        const amountToReserve = reservedQuantity || lot.quantity;

        // Check if requested quantity exceeds available quantity
        if (amountToReserve > lot.quantity) {
            return res.status(400).json({ success: false, message: `Requested quantity exceeds available lot quantity (${lot.quantity}).` });
        }

        // 2. Create the reservation
        const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
        const newReservation = new reservationModel({
            surplusLotId,
            recipientOrgId,
            reservedQuantity: amountToReserve,
            reservationExpiresAt: expiresAt,
        });
        const savedReservation = await newReservation.save();

        // 3. INSTANTLY REDUCE THE QUANTITY ON THE SURPLUS LOT
        lot.quantity -= amountToReserve;

        // If the lot is completely claimed, mark its status as 'reserved' or 'depleted'
        if (lot.quantity === 0) {
            lot.status = 'reserved';
        }
        await lot.save();

        res.status(201).json({
            success: true,
            message: "Surplus lot reserved and quantity deducted successfully.",
            data: savedReservation
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// 2. GET ALL RESERVATIONS
// GET /api/reservations
reservationRouter.get('/seeAllOrders', verifyToken, async (req, res) => {
    try {
        let query = {};
        // Use recipientOrgId to match reservationModel.js schema
        if (req.user.role === 'Recipient coordinator') {
            query.recipientOrgId = req.user.id || req.user._id;
        }

        const reservations = await reservationModel.find(query)
            .populate('surplusLotId')
            .populate('recipientOrgId', 'organizationName address contactNumber email');

        res.status(200).json({
            success: true,
            count: reservations.length,
            data: reservations
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// 3. UPDATE RESERVATION STATUS (Confirm/Cancel)
// PATCH /api/reservations/:id/status
reservationRouter.patch('/:id/status', verifyToken, allowedRoles(['Donor', 'Recipient coordinator', 'Platform coordinator']), async (req, res) => {
    try {
        const { status } = req.body; // e.g., 'confirmed', 'cancelled', 'completed'
        const reservationId = req.params.id;

        const reservation = await reservationModel.findById(reservationId);
        if (!reservation) {
            return res.status(404).json({ success: false, message: "Reservation not found." });
        }

        reservation.status = status;
        const updatedReservation = await reservation.save();

        // If cancelled, make the surplus lot active again
        if (status === 'cancelled') {
            await surplusLotModel.findByIdAndUpdate(reservation.surplusLotId, { status: 'active' });
        }

        res.status(200).json({
            success: true,
            message: `Reservation status updated to '${status}'.`,
            data: updatedReservation
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});