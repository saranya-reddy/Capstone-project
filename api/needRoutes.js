import express from "express";
import { needModel as recipientNeedModel } from "../models/needModel.js";
import { verifyToken } from "../middlewares/tokenVerificationMiddleware.js";
import { allowedRoles } from "../middlewares/allowedRolesMiddleware.js";
import mongoose from "mongoose";
export const needRouter = express.Router();

// 1. POST A NEW RECIPIENT NEED
// POST /api/needs
needRouter.post('/newneed', verifyToken, allowedRoles(['Recipient coordinator']), async (req, res) => {
    try {
        const {
            title,
            targetQuantity,
            requiredTimeframeStart,
            requiredTimeframeEnd,
            dietaryConstraints,
            notes
        } = req.body;
        console.log(req.user);
        const newNeed = new recipientNeedModel({
            recipientOrgId: new mongoose.Types.ObjectId(req.user.id), // Attaches logged-in recipient coordinator's ID
            title,
            targetQuantity,
            dietaryConstraints,
            requiredTimeframeStart,
            requiredTimeframeEnd,
            notes,
            status: 'open'
        });

        const savedNeed = await newNeed.save();

        res.status(201).json({
            success: true,
            message: "Recipient need posted successfully.",
            data: savedNeed
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 2. GET ALL OPEN RECIPIENT NEEDS
// GET /api/needs
needRouter.get('/allneeds', verifyToken, async (req, res) => {
    try {
        const openNeeds = await recipientNeedModel.find({ status: 'open' })
            .populate('recipientOrgId', 'organizationName address contactNumber email');

        res.status(200).json({
            success: true,
            count: openNeeds.length,
            data: openNeeds
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 3. UPDATE OR CLOSE A RECIPIENT NEED
// PATCH /api/needs/:id
needRouter.patch('/update/:id', verifyToken, async (req, res) => {
    try {
        const needId = req.params.id;
        const updates = req.body;

        const need = await recipientNeedModel.findById(needId);
        if (!need) {
            return res.status(404).json({ success: false, message: "Recipient need not found." });
        }

        const updatedNeed = await recipientNeedModel.findByIdAndUpdate(
            needId,
            { $set: updates },
            { new: true, runValidators: true }
        ).populate('recipientId', 'organizationName address contactNumber email');

        res.status(200).json({
            success: true,
            message: "Recipient need updated successfully.",
            data: updatedNeed
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});