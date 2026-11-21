import { Router } from "express";
import Stripe from "stripe";
import { payments, users } from "../config/db.js";
import { verifyToken } from "../middleware/auth.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const router = Router();

const PLANS = {
  student: { name: "Pro Student Plan", amount: 10 },
  tutor: { name: "Pro Tutor Plan", amount: 15 },
};

// payment record save + plan "pro" (verify ar webhook duitai eta use kore, idempotent)
export async function fulfillSession(session) {
  if (session.payment_status !== "paid") return false;
  const { userEmail, userName, userRole, planName } = session.metadata || {};
  if (!userEmail) return false;

  try {
    await payments.insertOne({
      userEmail,
      userName,
      userRole,
      planName,
      amount: (session.amount_total ?? 0) / 100,
      currency: (session.currency || "usd").toUpperCase(),
      transactionId: typeof session.payment_intent === "string" ? session.payment_intent : session.id,
      stripeSessionId: session.id,
      paymentStatus: "paid",
      paidAt: new Date(),
    });
  } catch (err) {
    if (err.code !== 11000) throw err; // already recorded
  }
  await users.updateOne({ email: userEmail }, { $set: { plan: "pro" } });
  return true;
}

// POST /api/payments/checkout
router.post("/checkout", verifyToken, async (req, res) => {
  const user = await users.findOne({ email: req.user.email });
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.role === "admin") return res.status(403).json({ message: "Admins do not need a plan" });
  if (user.plan === "pro") return res.status(400).json({ message: "You are already on the Pro plan" });

  const plan = PLANS[user.role];
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    line_items: [
      {
        quantity: 1,
        price_data: { currency: "usd", unit_amount: plan.amount * 100, product_data: { name: plan.name } },
      },
    ],
    metadata: { userEmail: user.email, userName: user.name, userRole: user.role, planName: plan.name },
    success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
  });
  res.json({ url: session.url });
});

// POST /api/payments/verify { sessionId } : success page theke call hoy
router.post("/verify", verifyToken, async (req, res) => {
  const sessionId = typeof req.body.sessionId === "string" ? req.body.sessionId : "";
  if (!sessionId.startsWith("cs_")) return res.status(400).json({ message: "Invalid session id" });

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.metadata?.userEmail !== req.user.email) {
    return res.status(403).json({ message: "This payment does not belong to you" });
  }
  const done = await fulfillSession(session);
  if (!done) return res.status(400).json({ message: "Payment not completed" });
  res.json({ plan: "pro" });
});

// POST /api/payments/webhook (index.js e express.raw diye mount kora)
export async function webhookHandler(req, res) {
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if (event.type === "checkout.session.completed") await fulfillSession(event.data.object);
  res.json({ received: true });
}

export default router;