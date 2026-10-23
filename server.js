import exp from "express";
import { connect } from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from 'dotenv';
dotenv.config();

import { authRouter } from "./api/authenticationRoutes.js"; // Adjust filename if yours is authenticationRoutes_2.js
import { surplusLotRouter } from "./api/surplusLotRoutes.js";
import { needRouter } from "./api/needRoutes.js";
import { reservationRouter } from "./api/reservationRoutes.js";
import { volunteerAssignmentRouter } from "./api/volunteerAssignmentRoutes.js";
import { handoverRouter } from "./api/handoverRoutes.js";

const app = exp();
app.use(exp.json());
app.use(cookieParser());
app.use(cors());

app.use('/api/users', authRouter);
app.use('/api/surplus-lots', surplusLotRouter);
app.use('/api/needs', needRouter);
app.use('/api/reservations', reservationRouter);
app.use('/api/volunteer-assignments', volunteerAssignmentRouter);
app.use('/api/handovers', handoverRouter);

// Base health-check route
app.get('/', (req, res) => {
    res.status(200).json({ success: true, message: "Community Food Rescue Coordinator API is running on port 2000!" });
});

async function connectDB() {
    try {
        await connect(process.env.DB_URL);
        console.log("DB Connected Successfully");
        const PORT = process.env.PORT;
        app.listen(PORT, () => console.log(`Server listening on port ${PORT}...`));
    } catch (err) {
        console.log("err in db connect :", err);
    }
}

connectDB();

// Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.log("err is", err);
    res.status(500).json({ success: false, message: err.message });
});