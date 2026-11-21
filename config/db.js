import dns from "node:dns";
if (!process.env.VERCEL) dns.setServers(["8.8.8.8", "1.1.1.1"]); // local e Google/Cloudflare DNS





import { MongoClient, ObjectId } from "mongodb";


const client = new MongoClient(process.env.MONGODB_URI);
export const db = client.db(process.env.DB_NAME || "mentorlagbe");

export const users = db.collection("users");
export const tuitions = db.collection("tuitions");
export const applications = db.collection("applications");
export const payments = db.collection("payments");

export const toObjectId = (id) => (ObjectId.isValid(id) ? new ObjectId(id) : null);

// BetterAuth er user _id ObjectId ba string, duitai handle kore
export const userIdFilter = (id) => {
  const oid = toObjectId(id);
  return oid ? { $or: [{ _id: oid }, { _id: id }] } : { _id: id };
};

let indexing;
export function ensureIndexes() {
  indexing ??= Promise.all([
    // same student, same tuition: duplicate application hobe na
    applications.createIndex({ tuitionId: 1, studentEmail: 1 }, { unique: true }),
    // same Stripe session duibar record hobe na
    payments.createIndex({ stripeSessionId: 1 }, { unique: true }),
    tuitions.createIndex({ approvalStatus: 1, isActive: 1, createdAt: -1 }),
  ]).catch((err) => {
    console.error("Index error:", err.message);
    indexing = undefined;
  });
  return indexing;
}