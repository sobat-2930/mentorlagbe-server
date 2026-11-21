import { Router } from "express";
import { users } from "../config/db.js";
import { verifyToken } from "../middleware/auth.js";
import { isUrl, phoneRx, str } from "../utils/validate.js";

const router = Router();

router.get("/", verifyToken, async (req, res) => {
  const user = await users.findOne({ email: req.user.email });
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

// Update Profile: name, phone, bio, image (ImgBB url)
router.patch("/", verifyToken, async (req, res) => {
  const name = str(req.body.name);
  const phone = str(req.body.phone);
  const bio = str(req.body.bio);
  const image = str(req.body.image);

  if (name.length < 2 || name.length > 60) return res.status(400).json({ message: "Name must be 2 to 60 characters" });
  if (phone && !phoneRx.test(phone)) return res.status(400).json({ message: "Invalid Bangladeshi phone number" });
  if (bio.length > 300) return res.status(400).json({ message: "Bio can be at most 300 characters" });
  if (image && !isUrl(image)) return res.status(400).json({ message: "Image must be a valid URL" });

  await users.updateOne(
    { email: req.user.email },
    { $set: { name, phone, bio, image: image || null, updatedAt: new Date() } }
  );
  res.json(await users.findOne({ email: req.user.email }));
});

export default router;