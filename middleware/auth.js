import jwt from "jsonwebtoken";
import { users } from "../config/db.js";

export const verifyToken = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: token missing" });
  }
  try {
    req.user = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Unauthorized: invalid or expired token" });
  }
};

// role DB theke check hoy, tai admin role change korle sathe sathe kaj kore
const verifyRole = (role) => async (req, res, next) => {
  const dbUser = await users.findOne({ email: req.user.email });
  if (!dbUser || dbUser.role !== role) {
    return res.status(403).json({ message: `Forbidden: ${role} access only` });
  }
  req.dbUser = dbUser;
  next();
};

export const verifyStudent = verifyRole("student");
export const verifyTutor = verifyRole("tutor");
export const verifyAdmin = verifyRole("admin");