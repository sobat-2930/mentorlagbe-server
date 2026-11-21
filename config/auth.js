import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { db } from "./db.js";

export const auth = betterAuth({
  database: mongodbAdapter(db),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [process.env.CLIENT_URL, "http://localhost:3000"].filter(Boolean),
  emailAndPassword: { enabled: true, minPasswordLength: 6 },
  user: {
    modelName: "users", // doc er collection name
    additionalFields: {
      role: { type: "string", defaultValue: "student", input: true },
      plan: { type: "string", defaultValue: "free", input: false },
      phone: { type: "string", required: false, input: true },
      bio: { type: "string", required: false, input: true },
    },
  },
  databaseHooks: {
    user: {
      create: {
        // Security: sign-up e keu admin hote parbe na, plan sobar free
        before: async (user) => ({
          data: { ...user, role: user.role === "tutor" ? "tutor" : "student", plan: "free" },
        }),
      },
    },
  },
});