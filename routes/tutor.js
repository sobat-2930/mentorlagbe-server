import { Router } from "express";
import { applications, tuitions, toObjectId } from "../config/db.js";
import { verifyTutor, verifyToken } from "../middleware/auth.js";
import { parseTuition } from "../utils/validate.js";

const router = Router();
router.use(verifyToken, verifyTutor);

const FREE_LIMIT = 2;

// GET /api/tutor/tuitions
router.get("/tuitions", async (req, res) => {
  const list = await tuitions.find({ tutorEmail: req.dbUser.email }).sort({ createdAt: -1 }).toArray();
  res.json(list);
});

// POST /api/tutor/tuitions : free = max 2, pro = unlimited
router.post("/tuitions", async (req, res) => {
  const { data, error } = parseTuition(req.body);
  if (error) return res.status(400).json({ message: error });

  if (req.dbUser.plan !== "pro") {
    const posted = await tuitions.countDocuments({ tutorEmail: req.dbUser.email });
    if (posted >= FREE_LIMIT) {
      return res.status(403).json({ message: `Free plan limit reached (${FREE_LIMIT} posts). Upgrade to Pro for unlimited posts.` });
    }
  }

  const doc = {
    ...data,
    tutorName: req.dbUser.name,
    tutorEmail: req.dbUser.email,
    approvalStatus: "pending",
    isActive: true,
    createdAt: new Date(),
  };
  const result = await tuitions.insertOne(doc);
  res.status(201).json({ ...doc, _id: result.insertedId });
});

// PUT /api/tutor/tuitions/:id
router.put("/tuitions/:id", async (req, res) => {
  const _id = toObjectId(req.params.id);
  const existing = _id && (await tuitions.findOne({ _id, tutorEmail: req.dbUser.email }));
  if (!existing) return res.status(404).json({ message: "Tuition not found" });

  const { data, error } = parseTuition(req.body);
  if (error) return res.status(400).json({ message: error });

  // rejected post edit korle abar admin review er jonno pending hoy
  const approvalStatus = existing.approvalStatus === "rejected" ? "pending" : existing.approvalStatus;
  await tuitions.updateOne({ _id }, { $set: { ...data, approvalStatus, updatedAt: new Date() } });
  res.json(await tuitions.findOne({ _id }));
});

// PATCH /api/tutor/tuitions/:id/status : Active / Closed toggle
router.patch("/tuitions/:id/status", async (req, res) => {
  const _id = toObjectId(req.params.id);
  const existing = _id && (await tuitions.findOne({ _id, tutorEmail: req.dbUser.email }));
  if (!existing) return res.status(404).json({ message: "Tuition not found" });

  const isActive = typeof req.body.isActive === "boolean" ? req.body.isActive : !existing.isActive;
  await tuitions.updateOne({ _id }, { $set: { isActive } });
  res.json({ isActive });
});

// DELETE /api/tutor/tuitions/:id
router.delete("/tuitions/:id", async (req, res) => {
  const _id = toObjectId(req.params.id);
  const result = _id && (await tuitions.deleteOne({ _id, tutorEmail: req.dbUser.email }));
  if (!result?.deletedCount) return res.status(404).json({ message: "Tuition not found" });
  await applications.deleteMany({ tuitionId: String(_id) });
  res.json({ deleted: true });
});

// GET /api/tutor/applicants
router.get("/applicants", async (req, res) => {
  const list = await applications.find({ tutorEmail: req.dbUser.email }).sort({ appliedAt: -1 }).toArray();
  res.json(list);
});

// PATCH /api/tutor/applicants/:id { status: "accepted" | "rejected" }
router.patch("/applicants/:id", async (req, res) => {
  const { status } = req.body;
  if (!["accepted", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Status must be accepted or rejected" });
  }
  const _id = toObjectId(req.params.id);
  const result = _id && (await applications.updateOne({ _id, tutorEmail: req.dbUser.email }, { $set: { status } }));
  if (!result?.matchedCount) return res.status(404).json({ message: "Application not found" });
  res.json({ status });
});

export default router;