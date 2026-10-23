import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
    try {
        // Retrieve token exclusively from HTTP-only cookies
        const token = req.cookies && req.cookies.token;

        if (!token) {
            return res.status(401).json({ success: false, message: "Access denied. No token provided." });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        req.user = decoded; // Attaches { id, role } to req.user
        next();
    } catch (error) {
        return res.status(403).json({ success: false, message: "Invalid or expired token." });
    }
};