import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { userModel } from "../models/userModel.js";
import { verifyToken } from "../middlewares/tokenVerificationMiddleware.js"; // Adjust path if needed based on your folder structure

export const authRouter = express.Router();

// 1. REGISTER NEW USER
// POST /api/users/register
authRouter.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, organizationName, address, contactNumber } = req.body;

        // Check if user already exists
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User with this email already exists." });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user (isVerified defaults to false)
        const newUser = new userModel({
            name,
            email,
            password: hashedPassword,
            role,
            organizationName,
            address,
            contactNumber,
            isVerified: false
        });

        const savedUser = await newUser.save();

        // Remove password from response object
        const userResponse = savedUser.toObject();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            message: "User registered successfully. Awaiting platform coordinator verification.",
            data: userResponse
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 2. USER LOGIN (Updated to use HTTP-only Cookie)
authRouter.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid email or password." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid email or password." });
        }

        // Create JWT Token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );

        // Set token in an HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax', // Change from 'strict' to 'lax'
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(200).json({
            success: true,
            message: "Login successful",
            tokenassigned: token,
            data: userResponse // Token is no longer sent in JSON body
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 4. USER LOGOUT (Clears the cookie)
authRouter.post('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production'
    });
    res.status(200).json({ success: true, message: "Logged out successfully." });
});

// 3. GET LOGGED-IN USER PROFILE
// GET /api/users/profile
authRouter.get('/profile', verifyToken, async (req, res) => {
    try {
        // Assumes verifyToken attaches the user id to req.user (or req.user.id depending on your middleware setup)
        const userId = req.user.id || req.user._id;
        const user = await userModel.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
