import express from "express";
import { surplusLotModel } from "../models/surplusLotModel.js";
import { verifyToken } from "../middlewares/tokenVerificationMiddleware.js"; // Adjust path if needed
import { allowedRoles } from "../middlewares/allowedRolesMiddleware.js";

export const surplusLotRouter = express.Router();

// 1. POST A NEW SURPLUS LOT
surplusLotRouter.post('/addSurplus', verifyToken, allowedRoles(['Donor']), async (req, res) => {
    try {
        const {
            title,
            quantity,
            preparationDetails,
            storageGuidelines,
            allergens,
            foodExpiresAt,
            pickupWindowStart,
            pickupWindowEnd
        } = req.body;

        const newLot = new surplusLotModel({
            donorId: req.user.id || req.user._id, // Attaches logged-in donor's ID
            title,
            quantity,
            preparationDetails,
            storageGuidelines,
            allergens,
            foodExpiresAt,
            pickupWindowStart,
            pickupWindowEnd,
            status: 'active'
        });

        const savedLot = await newLot.save();

        res.status(201).json({
            success: true,
            message: "Surplus food lot created successfully.",
            data: savedLot
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 2. GET ALL ACTIVE SURPLUS LOTS
// GET /api/surplus-lots
surplusLotRouter.get('/getAllSurplusLots', verifyToken, async (req, res) => {
    try {
        // Fetch all lots with status 'active' and populate donor contact info
        const activeLots = await surplusLotModel.find({ status: 'active' })
            .populate('donorId', 'organizationName address contactNumber email');

        res.status(200).json({
            success: true,
            count: activeLots.length,
            data: activeLots
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 3. SEARCH SURPLUS LOTS BY NAME / TITLE
// GET /api/surplus-lots/search?name=...
surplusLotRouter.get('/search', verifyToken, async (req, res) => {
    try {
        const { name } = req.query;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Please provide a 'name' query parameter to search."
            });
        }

        // Case-insensitive regex search on the 'title' field
        // Returns ALL items matching the name
        const matchingLots = await surplusLotModel.find({
            title: { $regex: name, $options: 'i' },
            status: 'active'
        }).populate('donorId', 'organizationName address contactNumber email');

        res.status(200).json({
            success: true,
            count: matchingLots.length,
            data: matchingLots
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 4. UPDATE SURPLUS LOT DETAILS OR STATUS
// PATCH /api/surplus-lots/:id
surplusLotRouter.patch('/:id', verifyToken, async (req, res) => {
    try {
        const lotId = req.params.id;
        const updates = req.body;

        // Ensure user updating the lot is either the creator (donor) or an admin/coordinator
        const lot = await surplusLotModel.findById(lotId);
        if (!lot) {
            return res.status(404).json({ success: false, message: "Surplus lot not found." });
        }

        // Apply updates
        const updatedLot = await surplusLotModel.findByIdAndUpdate(
            lotId,
            { $set: updates },
            { new: true, runValidators: true }
        ).populate('donorId', 'organizationName address contactNumber email');

        res.status(200).json({
            success: true,
            message: "Surplus lot updated successfully.",
            data: updatedLot
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});