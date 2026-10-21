import jwt from "jsonwebtoken";

export function verifyToken(req, res, next) {
    //get token from req
    let accessToken = req.cookies.accessToken;
    //if token not avaialble
    if (accessToken === undefined) {
        res.status(401).json({ success: false, message: "You must login to continue" });
    } else {
        // token validity(decoding)

        try {
            let decodedToken = jwt.verify(accessToken, "abcdefghijklmnopqrstuvwxyz");
            console.log("decoded token :", decodedToken);
            req.user = decodedToken;
            next();
        } catch (err) {
            res.status(401).json({ success: false, message: "Please relogin to continue" });
        }
    }
}