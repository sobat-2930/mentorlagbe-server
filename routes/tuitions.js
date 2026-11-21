import { Router } from "express";
import { tuitions, toObjectId } from "../config/db.js";
import { escapeRegex, str } from "../utils/validate.js";

const router = Router();
const live = { approvalStatus: "approved", isActive: true };

// GET /api/tuitions?search=&subject=&classLevel=&mode=&page=&limit=
router.get("/", async (req, res) => {
  const search = str(req.query.search);
  const subject = str(req.query.subject);
  const classLevel = str(req.query.classLevel);
  const mode = str(req.query.mode);
  const limit = Math.min(24, Math.max(1, parseInt(req.query.limit) || 6));
  const requested = Math.max(1, parseInt(req.query.page) || 1);

  const filter = { ...live };
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ title: rx }, { subject: rx }];
  }
  if (subject && subject !== "all") filter.subject = subject;
  if (classLevel && classLevel !== "all") filter.classLevel = classLevel;
  if (mode && mode !== "all") filter.mode = mode;

  const total = await tuitions.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const page = Math.min(requested, totalPages);

  const items = await tuitions
    .find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  res.json({ items, total, page, totalPages });
});

// GET /api/tuitions/latest : home page er 6 ta
router.get("/latest", async (req, res) => {
  const items = await tuitions.find(live).sort({ createdAt: -1 }).limit(6).toArray();
  res.json(items);
});

router.get("/:id", async (req, res) => {
  const _id = toObjectId(req.params.id);
  if (!_id) return res.status(404).json({ message: "Tuition not found" });
  const tuition = await tuitions.findOne({ _id, ...live });
  if (!tuition) return res.status(404).json({ message: "Tuition not found" });
  res.json(tuition);
});

export default router;