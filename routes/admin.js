import { Router } from "express";
import { payments, tuitions, users, toObjectId, userIdFilter } from "../config/db.js";
import { verifyAdmin, verifyToken } from "../middleware/auth.js";

const router = Router();
router.use(verifyToken, verifyAdmin);

// GET /api/admin/stats
router.get("/stats", async (req, res) => {
  const [totalUsers, totalTutors, totalStudents, pending, approved, rejected, revenue] = await Promise.all([
    users.countDocuments(),
    users.countDocuments({ role: "tutor" }),
    users.countDocuments({ role: "student" }),
    tuitions.countDocuments({ approvalStatus: "pending" }),
    tuitions.countDocuments({ approvalStatus: "approved" }),
    tuitions.countDocuments({ approvalStatus: "rejected" }),
    payments.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]).toArray(),
  ]);
  res.json({
    totalUsers,
    totalTutors,
    totalStudents,
    pendingTuitions: pending,
    approvedTuitions: approved,
    rejectedTuitions: rejected,
    totalTuitions: pending + approved + rejected,
    totalRevenue: revenue[0]?.total ?? 0,
  });
});

// GET /api/admin/users
router.get("/users", async (req, res) => {
  const list = await users
    .find({}, { projection: { name: 1, email: 1, role: 1, plan: 1, image: 1, createdAt: 1 } })
    .sort({ createdAt: -1 })
    .toArray();
  res.json(list);
});

// PATCH /api/admin/users/:id/role
router.patch("/users/:id/role", async (req, res) => {
  const { role } = req.body;
  if (!["student", "tutor", "admin"].includes(role)) return res.status(400).json({ message: "Invalid role" });

  const target = await users.findOne(userIdFilter(req.params.id));
  if (!target) return res.status(404).json({ message: "User not found" });
  if (target.email === req.user.email) return res.status(400).json({ message: "You cannot change your own role" });

  await users.updateOne({ _id: target._id }, { $set: { role } });
  res.json({ role });
});

// GET /api/admin/tuitions : sob status
router.get("/tuitions", async (req, res) => {
  res.json(await tuitions.find({}).sort({ createdAt: -1 }).toArray());
});

// PATCH /api/admin/tuitions/:id/approval
router.patch("/tuitions/:id/approval", async (req, res) => {
  const { approvalStatus } = req.body;
  if (!["approved", "rejected"].includes(approvalStatus)) {
    return res.status(400).json({ message: "approvalStatus must be approved or rejected" });
  }
  const _id = toObjectId(req.params.id);
  const result = _id && (await tuitions.updateOne({ _id }, { $set: { approvalStatus } }));
  if (!result?.matchedCount) return res.status(404).json({ message: "Tuition not found" });
  res.json({ approvalStatus });
});

// GET /api/admin/payments
router.get("/payments", async (req, res) => {
  res.json(await payments.find({}).sort({ paidAt: -1 }).toArray());
});

export default router;