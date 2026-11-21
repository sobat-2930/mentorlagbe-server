import { Router } from "express";
import { applications, tuitions, toObjectId } from "../config/db.js";
import { verifyStudent, verifyToken } from "../middleware/auth.js";
import { phoneRx, str } from "../utils/validate.js";

const router = Router();
router.use(verifyToken, verifyStudent);

// POST /api/applications
router.post("/", async (req, res) => {
  const tuitionId = str(req.body.tuitionId);
  const studentPhone = str(req.body.phone);
  const preferredSchedule = str(req.body.preferredSchedule);
  const studentNote = str(req.body.studentNote);

  if (!phoneRx.test(studentPhone)) return res.status(400).json({ message: "Enter a valid Bangladeshi phone number" });
  if (!preferredSchedule) return res.status(400).json({ message: "Preferred schedule is required" });
  if (studentNote.length < 10) return res.status(400).json({ message: "Note must be at least 10 characters" });

  const _id = toObjectId(tuitionId);
  const tuition = _id && (await tuitions.findOne({ _id, approvalStatus: "approved", isActive: true }));
  if (!tuition) return res.status(404).json({ message: "This tuition is not available" });

  const studentEmail = req.dbUser.email;
  if (await applications.findOne({ tuitionId, studentEmail })) {
    return res.status(409).json({ message: "You have already applied for this tuition" });
  }

  const doc = {
    tuitionId,
    tuitionTitle: tuition.title,
    subject: tuition.subject,
    monthlyFee: tuition.monthlyFee,
    tutorName: tuition.tutorName,
    tutorEmail: tuition.tutorEmail,
    studentName: req.dbUser.name,
    studentEmail,
    studentPhone,
    preferredSchedule,
    studentNote,
    status: "pending",
    appliedAt: new Date(),
  };

  try {
    const result = await applications.insertOne(doc);
    res.status(201).json({ ...doc, _id: result.insertedId });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: "You have already applied for this tuition" });
    throw err;
  }
});

// GET /api/applications/mine
router.get("/mine", async (req, res) => {
  const list = await applications.find({ studentEmail: req.dbUser.email }).sort({ appliedAt: -1 }).toArray();
  res.json(list);
});

// GET /api/applications/check/:tuitionId : apply form e "Already Applied" dekhate
router.get("/check/:tuitionId", async (req, res) => {
  const found = await applications.findOne({ tuitionId: req.params.tuitionId, studentEmail: req.dbUser.email });
  res.json({ applied: !!found });
});

// DELETE /api/applications/:id : shudhu nijer + pending
router.delete("/:id", async (req, res) => {
  const _id = toObjectId(req.params.id);
  const app = _id && (await applications.findOne({ _id, studentEmail: req.dbUser.email }));
  if (!app) return res.status(404).json({ message: "Application not found" });
  if (app.status !== "pending") return res.status(400).json({ message: "Only pending applications can be cancelled" });
  await applications.deleteOne({ _id });
  res.json({ deleted: true });
});

export default router;