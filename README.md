<div align="center">

# ⚙️ MentorLagbe Server

**REST API for the Smart Tuition & Mentorship Platform**

</div>

---

## 📌 Project Name
**MentorLagbe** (Server)

## 🎯 Purpose
The backend of MentorLagbe. It handles authentication, role-based access, tuition moderation, student applications and Stripe subscription payments for Students, Tutors and Admins.


## 🔑 Admin Credentials
| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@mentorlagbe.com` | `Admin@123` |
| Tutor | `tutor@mentorlagbe.com` | `Tutor@123` |
| Student | `student@mentorlagbe.com` | `Student@123` |

## ✨ Key Features
- **BetterAuth** with MongoDB adapter and role-based sign up (admin role cannot be chosen)
- **JWT verification** with custom middlewares: `verifyToken`, `verifyStudent`, `verifyTutor`, `verifyAdmin`
- **4 MongoDB collections:** `users`, `tuitions`, `applications`, `payments`
- **Server-side search, filter and pagination** for approved tuitions
- **Students:** apply (duplicate blocked), view and cancel pending applications
- **Tutors:** tuition CRUD, active/closed toggle, accept or reject applicants, free plan limit of 2 posts
- **Admins:** platform stats, user roles, tuition approval, transactions
- **Stripe Checkout** with payment verification and webhook, then user plan becomes `pro`
- **Seed script** with connected demo data (users, 12 approved tuitions, applications, payments)
- Secrets stored in environment variables

## 📦 NPM Packages Used
| Package | Use |
|---|---|
| `express` | Server framework |
| `cors` | Cross-origin requests |
| `dotenv` | Environment variables |
| `mongodb` | Database driver |
| `better-auth` | Authentication |
| `jsonwebtoken` | JWT sign and verify |
| `stripe` | Payments and webhook |

## 🚀 Run Locally
```bash
npm install
npm run seed   # optional demo data
npm run dev


