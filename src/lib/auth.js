import jwt from "jsonwebtoken";

export function verifyJWT(req) {
    const auth = req.headers.authorization;

    if (!auth) {
        throw new Error("Token no autorizado");
    }

    const parts = auth.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
        throw new Error("Formato invalido");
    }

    const token = parts[1];
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        throw new Error("Token invalido o expirado");
    }
}