import "dotenv/config";
import { ObjectId } from "mongodb";
import { auth } from "./config/auth.js";
import { applications, ensureIndexes, payments, tuitions, users } from "./config/db.js";

const daysAgo = (n) => new Date(Date.now() - n * 86400000);

const PEOPLE = [
  { name: "Site Admin", email: "admin@mentorlagbe.com", password: "Admin@123", role: "admin" },
  { name: "Tanvir Hasan", email: "tutor@mentorlagbe.com", password: "Tutor@123", role: "tutor" },
  { name: "Arif Rahman", email: "protutor@mentorlagbe.com", password: "Tutor@123", role: "tutor", plan: "pro" },
  { name: "Nusrat Jahan", email: "nusrat@mentorlagbe.com", password: "Tutor@123", role: "tutor", plan: "pro" },
  { name: "Sadia Islam", email: "sadia@mentorlagbe.com", password: "Tutor@123", role: "tutor" },
  { name: "Mahbub Alam", email: "mahbub@mentorlagbe.com", password: "Tutor@123", role: "tutor" },
  { name: "Farhana Akter", email: "farhana@mentorlagbe.com", password: "Tutor@123", role: "tutor" },
  { name: "Rumana Sultana", email: "rumana@mentorlagbe.com", password: "Tutor@123", role: "tutor" },
  { name: "Imran Hossain", email: "imran@mentorlagbe.com", password: "Tutor@123", role: "tutor" },
  { name: "Rakib Hasan", email: "student@mentorlagbe.com", password: "Student@123", role: "student" },
  { name: "Samira Noor", email: "samira@mentorlagbe.com", password: "Student@123", role: "student" },
  { name: "Mahin Chowdhury", email: "mahin@mentorlagbe.com", password: "Student@123", role: "student" },
  { name: "Tasnim Ahmed", email: "tasnim@mentorlagbe.com", password: "Student@123", role: "student", plan: "pro" },
];
const person = (email) => PEOPLE.find((p) => p.email === email);

const t = (tutor, title, subject, classLevel, mode, location, monthlyFee, daysPerWeek, schedule, description, approvalStatus = "approved", isActive = true) => ({
  _id: new ObjectId(),
  title, subject, classLevel, mode, location, monthlyFee, daysPerWeek, schedule, description,
  bannerImage: "",
  tutorName: person(tutor).name,
  tutorEmail: tutor,
  approvalStatus,
  isActive,
});

const TUITIONS = [
  t("protutor@mentorlagbe.com", "HSC Physics Crash Batch", "Physics", "HSC", "Online", "Zoom", 2500, 3, "Sat, Mon, Wed · 8:00 PM", "A focused crash batch covering the full HSC Physics syllabus with weekly model tests, doubt-solving sessions and recorded lectures for revision."),
  t("nusrat@mentorlagbe.com", "Higher Math Mastery", "Math", "HSC", "Offline", "Dhanmondi, Dhaka", 3000, 4, "Sun, Tue, Thu, Fri · 5:00 PM", "Concept-first Higher Math teaching with chapter-wise practice sheets. Small batch of 8 students for personal attention."),
  t("tutor@mentorlagbe.com", "IELTS 7+ Intensive", "IELTS", "Admission", "Online", "Google Meet", 4000, 3, "Sat, Mon, Wed · 9:00 PM", "Complete IELTS preparation: Listening, Reading, Writing and Speaking with weekly mock tests and personal feedback on every essay."),
  t("sadia@mentorlagbe.com", "Python for Beginners", "Programming", "University", "Online", "Zoom", 3500, 2, "Fri, Sat · 10:00 PM", "Learn Python from zero with hands-on mini projects. Covers variables, loops, functions, OOP and basic problem solving."),
  t("mahbub@mentorlagbe.com", "SSC Chemistry 1-on-1", "Chemistry", "SSC", "Offline", "Agrabad, Chattogram", 2200, 3, "Sat, Mon, Wed · 4:30 PM", "Personal mentorship for SSC Chemistry with step-by-step explanations, weekly tests and board-question practice."),
  t("farhana@mentorlagbe.com", "English Spoken Fluency", "English", "Any", "Online", "Zoom", 1800, 2, "Sun, Thu · 8:30 PM", "Practice-based spoken English course focusing on confidence, pronunciation and everyday conversation."),
  t("rumana@mentorlagbe.com", "SSC Biology Concept Batch", "Biology", "SSC", "Offline", "Mirpur, Dhaka", 2000, 3, "Sun, Tue, Thu · 6:00 PM", "Diagram-based Biology teaching with chapter tests and easy memory techniques for SSC examinees."),
  t("imran@mentorlagbe.com", "Web Development with React", "Programming", "University", "Online", "Google Meet", 5000, 3, "Sat, Mon, Wed · 10:00 PM", "Build real projects with HTML, CSS, JavaScript and React. Includes code reviews and portfolio guidance."),
  t("protutor@mentorlagbe.com", "HSC ICT Complete Course", "ICT", "HSC", "Online", "Zoom", 1500, 2, "Tue, Fri · 7:30 PM", "Chapter-wise HSC ICT coverage including programming basics, database and number systems with practice questions."),
  t("protutor@mentorlagbe.com", "Medical Admission Physics", "Physics", "Admission", "Offline", "Khulshi, Chattogram", 3200, 4, "Sat, Sun, Tue, Thu · 7:00 AM", "Admission-focused Physics batch with daily MCQ practice, speed-solving techniques and weekly exams."),
  t("nusrat@mentorlagbe.com", "General Math for Class 8-9", "Math", "SSC", "Online", "Zoom", 1700, 3, "Sat, Mon, Wed · 6:30 PM", "Algebra, geometry and arithmetic made simple. Weekly assessments and parent progress updates."),
  t("tutor@mentorlagbe.com", "Academic Writing Workshop", "English", "University", "Online", "Google Meet", 2600, 2, "Fri, Sat · 9:00 PM", "Improve essay and report writing with structured feedback, grammar clinics and real academic samples."),
  t("farhana@mentorlagbe.com", "Weekend Spoken English Club", "English", "Any", "Offline", "Panchlaish, Chattogram", 1200, 2, "Fri, Sat · 10:00 AM", "A friendly weekend club for speaking practice, group discussion and presentation skills.", "pending"),
  t("mahbub@mentorlagbe.com", "Guaranteed A+ in 7 Days", "Chemistry", "SSC", "Online", "Zoom", 9000, 7, "Daily", "Unrealistic promises and no syllabus details, rejected during moderation by the admin team.", "rejected"),
].map((x, i) => ({ ...x, createdAt: daysAgo(i * 2 + 1) }));

const A = (student, n, status, ago, note) => {
  const tu = TUITIONS[n - 1];
  const s = person(student);
  return {
    tuitionId: String(tu._id),
    tuitionTitle: tu.title,
    subject: tu.subject,
    monthlyFee: tu.monthlyFee,
    tutorName: tu.tutorName,
    tutorEmail: tu.tutorEmail,
    studentName: s.name,
    studentEmail: s.email,
    studentPhone: `0171${String(1000000 + PEOPLE.indexOf(s) * 111111).slice(0, 7)}`,
    preferredSchedule: "Evening, after 7 PM",
    studentNote: note,
    status,
    appliedAt: daysAgo(ago),
  };
};

const NOTE = "I want to improve my fundamentals and score better in the upcoming exam.";
const APPLICATIONS = [
  A("student@mentorlagbe.com", 1, "accepted", 8, NOTE),
  A("student@mentorlagbe.com", 3, "pending", 6, NOTE),
  A("student@mentorlagbe.com", 4, "pending", 5, NOTE),
  A("student@mentorlagbe.com", 6, "rejected", 9, NOTE),
  A("student@mentorlagbe.com", 8, "accepted", 4, NOTE),
  A("samira@mentorlagbe.com", 1, "pending", 3, NOTE),
  A("samira@mentorlagbe.com", 3, "accepted", 7, NOTE),
  A("mahin@mentorlagbe.com", 3, "pending", 2, NOTE),
  A("mahin@mentorlagbe.com", 2, "pending", 4, NOTE),
  A("tasnim@mentorlagbe.com", 5, "accepted", 5, NOTE),
];

async function run() {
  await ensureIndexes();
  await Promise.all([tuitions.deleteMany({}), applications.deleteMany({}), payments.deleteMany({})]);

  for (const p of PEOPLE) {
    if (!(await users.findOne({ email: p.email }))) {
      await auth.api.signUpEmail({ body: { name: p.name, email: p.email, password: p.password, role: p.role } });
    }
    // admin role ar plan seed e directly set kora hoy
    await users.updateOne({ email: p.email }, { $set: { role: p.role, plan: p.plan || "free" } });
  }

  await tuitions.insertMany(TUITIONS);
  await applications.insertMany(APPLICATIONS);

  const pro = PEOPLE.filter((p) => p.plan === "pro");
  await payments.insertMany(
    pro.map((p, i) => ({
      userEmail: p.email,
      userName: p.name,
      userRole: p.role,
      planName: p.role === "tutor" ? "Pro Tutor Plan" : "Pro Student Plan",
      amount: p.role === "tutor" ? 15 : 10,
      currency: "USD",
      transactionId: `pi_seed_${i + 1}`,
      stripeSessionId: `cs_seed_${i + 1}`,
      paymentStatus: "paid",
      paidAt: daysAgo(20 - i * 4),
    }))
  );

  console.log(`Seeded ${PEOPLE.length} users, ${TUITIONS.length} tuitions, ${APPLICATIONS.length} applications, ${pro.length} payments`);
  console.log("Admin   : admin@mentorlagbe.com   / Admin@123");
  console.log("Tutor   : tutor@mentorlagbe.com   / Tutor@123 (free, 2/2 posts used)");
  console.log("Pro tutor: protutor@mentorlagbe.com / Tutor@123");
  console.log("Student : student@mentorlagbe.com / Student@123 (free)");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});