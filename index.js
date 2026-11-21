import "dotenv/config";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import { auth } from "./config/auth.js";
import { ensureIndexes, users } from "./config/db.js";
import tuitionRoutes from "./routes/tuitions.js";
import meRoutes from "./routes/me.js";
import applicationRoutes from "./routes/applications.js";
import tutorRoutes from "./routes/tutor.js";
import adminRoutes from "./routes/admin.js";
import paymentRoutes, { webhookHandler } from "./routes/payments.js";

const app = express();

app.use(cors({ origin: [process.env.CLIENT_URL, "http://localhost:3000"].filter(Boolean), credentials: true }));

app.use(async (req, res, next) => {
  await ensureIndexes();
  next();
});

// Stripe webhook: raw body lage, tai express.json() er AGE
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), webhookHandler);

// Session thakle JWT dey (BetterAuth handler er AGE)
app.get("/api/auth/mentor-jwt", async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) return res.status(401).json({ message: "Unauthorized" });
  const { email, name } = session.user;
  const dbUser = await users.findOne({ email });
  const token = jwt.sign({ email, name, role: dbUser?.role || "student" }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  res.json({ token });
});

// BetterAuth: express.json() er AGE
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.get("/", (req, res) => res.send("MentorLagbe server is running"));

app.use("/api/tuitions", tuitionRoutes);
app.use("/api/me", meRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/tutor", tutorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);

app.use((req, res) => res.status(404).json({ message: "Route not found" }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

// Vercel e app export hoy, local e listen
if (!process.env.VERCEL) {
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
}

export default app;