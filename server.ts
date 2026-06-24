import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "DG MITRA FOR ALL API is running" });
  });

  // Razorpay Order Creation
  app.post("/api/payments/create-order", async (req, res) => {
    const { amount, currency = "INR", receipt } = req.body;
    
    try {
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        console.warn("Razorpay keys are not configured. Falling back to mock payment for demo purposes.");
        return res.json({
          id: "order_mock_" + Math.random().toString(36).substring(7),
          amount: Math.round(amount * 100),
          currency,
          isMock: true,
          message: "Demo Mode: Using mock payment because Razorpay keys are missing."
        });
      }

      const { default: Razorpay } = await import("razorpay");
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      const options = {
        amount: Math.round(amount * 100), // amount in the smallest currency unit
        currency,
        receipt,
      };

      const order = await razorpay.orders.create(options);

      res.json(order);
    } catch (error: any) {
      console.error("Razorpay Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Transactional Email API for Order Updates
  app.post("/api/email/notify-status", async (req, res) => {
    const { email, customerName, orderId, status } = req.body;
    
    if (!email || !orderId || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const isConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER);

      let transporter;
      if (isConfigured) {
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
      }

      const statusMessages: Record<string, string> = {
        'pending': 'Your order has been placed and is pending confirmation.',
        'processing': 'We have started processing your order!',
        'cloth_received': 'We have received your clothing items. Our designers will start working on them shortly.',
        'pickup_scheduled': 'Your clothing pickup has been scheduled.',
        'in_progress': 'Your redesign is currently in progress. We are applying the final touches.',
        'in_transformation': 'Your redesign is in transformation. Our experts are working their magic.',
        'quality_check': 'Great news! Your redesigned item has passed our quality check.',
        'shipped': 'Your newly transformed item has been shipped and is on its way to you.',
        'delivered': 'Your order has been delivered! We hope you love your newly upcycled clothes.',
        'cancelled': 'Your order has been cancelled.'
      };

      const messageContent = statusMessages[status.toLowerCase()] || `The status of your order has been updated to: ${status.replace('_', ' ')}.`;

      const mailOptions = {
        from: process.env.SMTP_FROM || '"DG MITRA FOR ALL" <hello@dgmitra.com>',
        to: email,
        subject: `Order Update - DG MITRA FOR ALL (#${orderId.substring(0, 8)})`,
        text: `Hello ${customerName || 'Customer'},\n\n${messageContent}\n\nThank you for choosing DG MITRA FOR ALL!\n\nBest,\nThe DG MITRA Team`,
        html: `
          <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
            <div style="text-align: center; padding: 20px 0;">
              <h1 style="color: #2F6A4F; font-size: 24px; margin: 0;">DG MITRA FOR ALL</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 16px;">
              <h2 style="color: #111; margin-top: 0;">Order Update</h2>
              <p>Hello <strong>${customerName || 'Customer'}</strong>,</p>
              <p style="font-size: 16px;">${messageContent}</p>
              <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;">Order ID: <strong>#${orderId.substring(0, 8)}</strong></p>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Status: <span style="text-transform: uppercase;">${status.replace('_', ' ')}</span></p>
              </div>
              <p>Thank you for choosing DG MITRA FOR ALL to upcycle your wardrobe!</p>
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #888; text-align: center;">This is an automated message. Please do not reply directly to this email.</p>
          </div>
        `
      };

      if (!isConfigured) {
        console.warn("\\n[MOCK EMAIL SENT] - Configure SMTP in .env to send real emails.");
        console.log("To:", mailOptions.to);
        console.log("Subject:", mailOptions.subject);
        console.log("Status:", status);
        console.log("-------------------------------------------\\n");
        return res.json({ success: true, mock: true, message: "Mock email sent (SMTP not configured)." });
      }

      await transporter?.sendMail(mailOptions);
      res.json({ success: true, message: "Email sent successfully" });
    } catch (error: any) {
      console.error("Email API Error:", error.message);
      res.status(500).json({ error: "Failed to send email updates" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
