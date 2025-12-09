// controllers/orderController.js
import Order from "../models/orderModel.js";
import nodemailer from "nodemailer";
import {
  orderCreatedTemplate,
  orderUpdatedTemplate,
  orderDeletedTemplate,
} from "../utils/emailTemp.js";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE,
  EMAIL_FROM,
  NODE_ENV,
} = process.env;

// --- Initialize SMTP transporter (single SMTP path; Resend removed) ---
let smtpTransporter = null;

if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
  const portNum = Number(SMTP_PORT || 587);
  const secureFlag = portNum === 465 || SMTP_SECURE === "true";

  smtpTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: portNum,
    secure: secureFlag, // true for 465, false for 587 (STARTTLS)
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
    requireTLS: !secureFlag,
    tls: {
      // In production you should set rejectUnauthorized: true when certs are valid
      rejectUnauthorized: false,
    },
    logger: NODE_ENV !== "production",
    debug: NODE_ENV !== "production",
  });

  smtpTransporter
    .verify()
    .then(() => console.log("📧 SMTP transporter verified and ready"))
    .catch((err) => console.warn("⚠️ SMTP verify failed:", err?.message || err));
} else {
  console.warn("⚠️ SMTP env variables not fully set. SMTP transporter disabled.");
}


async function sendOrderEmail(to, subject, html) {
  if (!to) {
    console.warn("Email not sent — no recipient provided");
    return;
  }

  if (!smtpTransporter) {
    console.warn("⚠️ No SMTP transporter configured — email not sent.");
    return null;
  }

  const fromAddr = EMAIL_FROM || SMTP_USER || `no-reply@${process.env.DOMAIN || "example.com"}`;

  // Force envelope.from to SMTP_USER (prevents "553 Sender is not allowed to relay" in Zoho)
  const envelopeFrom = SMTP_USER;

  const envelopeTo = Array.isArray(to) ? to.join(", ") : to;

  try {
    const info = await smtpTransporter.sendMail({
      from: fromAddr, // visible From header
      to: envelopeTo,
      subject,
      html,
      envelope: {
        from: envelopeFrom, // SMTP MAIL FROM (must match authenticated user or allowed alias)
        to: envelopeTo,
      },
    });

    console.log(`📧 SMTP: Email sent to ${envelopeTo}: ${info.messageId || "sent"}`);
    return info;
  } catch (err) {
    console.error("📧 SMTP send error:", err?.message || err);
    return null;
  }
}

// 🧩 Create Order (USER)
export const createOrder = async (req, res) => {
  try {
    const order = new Order({
      user: req.user._id,
      ...req.body,
    });
    const created = await order.save();
    res.status(201).json(created);

    try {
      const populated = await created.populate("user", "name email");
      const recipient = populated.user?.email;
      if (recipient) {
        sendOrderEmail(
          recipient,
          `Order Confirmation — ${populated._id}`,
          orderCreatedTemplate(populated)
        ).catch((e) => console.error("Email send error (create):", e?.message || e));
      } else {
        console.warn("No recipient email found for order:", created._id);
      }
    } catch (e) {
      console.error("Error populating order user for email:", e?.message || e);
    }
  } catch (error) {
    res.status(500).json({ message: "Order creation failed", error: error.message });
  }
};

// 📋 Get All Orders (ADMIN)
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch orders", error: error.message });
  }
};

// 👤 Get User Orders
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch user orders", error: error.message });
  }
};

// ✏️ Update Order (ADMIN)
export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedOrder = await Order.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedOrder) return res.status(404).json({ message: "Order not found" });
    res.json(updatedOrder);

    try {
      const populated = await updatedOrder.populate("user", "name email");
      const recipient = populated.user?.email;
      if (recipient) {
        sendOrderEmail(
          recipient,
          `Order Update — ${populated._id}`,
          orderUpdatedTemplate(populated)
        ).catch((e) => console.error("Email send error (update):", e?.message || e));
      } else {
        console.warn("No recipient email found for updated order:", id);
      }
    } catch (e) {
      console.error("Error populating order user for update email:", e?.message || e);
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to update order", error: error.message });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedOrder = await Order.findByIdAndDelete(id);
    if (!deletedOrder) return res.status(404).json({ message: "Order not found" });
    res.json({ message: "Order deleted successfully" });

    try {
      const populated = await deletedOrder.populate("user", "name email");
      const recipient = populated.user?.email;
      if (recipient) {
        sendOrderEmail(
          recipient,
          `Order Deleted — ${populated._id}`,
          orderDeletedTemplate(populated)
        ).catch((e) => console.error("Email send error (delete):", e?.message || e));
      } else {
        console.warn("No recipient email found for deleted order:", id);
      }
    } catch (e) {
      console.error("Error populating order user for delete email:", e?.message || e);
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to delete order", error: error.message });
  }
};
