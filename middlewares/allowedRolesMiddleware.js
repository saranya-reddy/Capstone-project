export const allowedRoles = (rolesArray) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized. User context missing." });
        }

        // Check if user's role matches any of the allowed roles
        if (!rolesArray.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access forbidden. Role '${req.user.role}' is not authorized to access this resource.`
            });
        }

        next();
    };
};