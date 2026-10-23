import express from "express";
import { volunteerAssignmentModel } from "../models/volunteerAssignmentModel.js"; // Adjust model path/name if needed
import { reservationModel } from "../models/reservationModel.js";
import { verifyToken } from "../middlewares/tokenVerificationMiddleware.js";
import { allowedRoles } from "../middlewares/allowedRolesMiddleware.js";

export const volunteerAssignmentRouter = express.Router();

// 1. ASSIGN OR ACCEPT A VOLUNTEER PICKUP
// POST /api/volunteer-assignments
volunteerAssignmentRouter.post('/assignPickup', verifyToken, allowedRoles(['Volunteer', 'Platform coordinator']), async (req, res) => {
    try {
        const { reservationId } = req.body;
        const volunteerId = req.user.id || req.user._id; // Attaches logged-in volunteer's ID

        // Verify the reservation exists and is confirmed/ready
        const reservation = await reservationModel.findById(reservationId);
        if (!reservation) {
            return res.status(404).json({ success: false, message: "Reservation not found." });
        }

        // Check if an assignment already exists for this reservation
        const existingAssignment = await volunteerAssignmentModel.findOne({ reservationId });
        if (existingAssignment) {
            return res.status(400).json({ success: false, message: "A volunteer is already assigned to this reservation." });
        }

        const newAssignment = new volunteerAssignmentModel({
            reservationId,
            volunteerId,
            transitStatus: 'en_route_to_donor' // Initial transit state
        });

        const savedAssignment = await newAssignment.save();

        res.status(201).json({
            success: true,
            message: "Volunteer assignment created successfully.",
            data: savedAssignment
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 2. GET ALL VOLUNTEER ASSIGNMENTS
// GET /api/volunteer-assignments
volunteerAssignmentRouter.get('/allAssignments', verifyToken, async (req, res) => {
    try {
        let query = {};
        // If logged-in user is a volunteer, show only their assignments
        if (req.user.role === 'Volunteer') {
            query.volunteerId = req.user.id || req.user._id;
        }

        const assignments = await volunteerAssignmentModel.find(query)
            .populate({
                path: 'reservationId',
                populate: { path: 'surplusLotId' }
            })
            .populate('volunteerId', 'name email contactNumber');

        res.status(200).json({
            success: true,
            count: assignments.length,
            data: assignments
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 3. UPDATE TRANSIT STATUS
// PATCH /api/volunteer-assignments/:id/status
volunteerAssignmentRouter.patch('/:id/statusUpdate', verifyToken, allowedRoles(['Volunteer', 'Platform coordinator']), async (req, res) => {
    try {
        const { transitStatus } = req.body; // e.g., 'en_route_to_donor', 'picked_up', 'delivered', 'cancelled'
        const assignmentId = req.params.id;

        const assignment = await volunteerAssignmentModel.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({ success: false, message: "Volunteer assignment not found." });
        }

        assignment.transitStatus = transitStatus;
        const updatedAssignment = await assignment.save();

        res.status(200).json({
            success: true,
            message: `Transit status updated to '${transitStatus}'.`,
            data: updatedAssignment
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});