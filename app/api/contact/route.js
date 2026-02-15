import nodemailer from "nodemailer";
import important from "../../data/important.json";

function normalizePhone(input) {
  const digits = (input || "").replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  return null;
}

function isValidEmail(input) {
  const s = (input || "").trim();
  // Simple and practical email check (good enough for contact forms)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function formatPhone(digits10) {
  return `(${digits10.slice(0, 3)}) ${digits10.slice(3, 6)}-${digits10.slice(6)}`;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const contactRaw = (body.contact || "").trim();
    const message = (body.message || "").trim();

    // 1) validate contact
    const phone10 = normalizePhone(contactRaw);
    const emailOk = isValidEmail(contactRaw);

    if (!contactRaw) {
      return Response.json(
        { ok: false, field: "contact", code: "EMPTY_CONTACT", message: "remember to add a phone number or email address" },
        { status: 400 }
      );
    }

    if (!phone10 && !emailOk) {
      return Response.json(
        { ok: false, field: "contact", code: "INVALID_CONTACT", message: "invalid number or email" },
        { status: 400 }
      );
    }

    // 2) validate message
    if (!message) {
      return Response.json(
        { ok: false, field: "message", code: "EMPTY_MESSAGE", message: "Add a message here" },
        { status: 400 }
      );
    }

    // Recipient from important.json
    const to = important?.[0]?.email;
    if (!to) {
      return Response.json(
        { ok: false, code: "MISSING_TO_EMAIL", message: "Recipient email missing in important.json" },
        { status: 500 }
      );
    }

    // Build human-friendly contact line
    const contactLine = phone10 ? `Phone: ${formatPhone(phone10)}` : `Email: ${contactRaw.trim()}`;

    // Timestamp
    const now = new Date();
    const iso = now.toISOString();

    // Transport (SMTP)
    const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true", // true for 465
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    });
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;

    await transporter.sendMail({
      from,
      to,
      subject: `New website contact message (${iso})`,
      text: `New message from website contact form

${contactLine}
Sent: ${iso}

Message:
${message}
`,
    });

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json(
      { ok: false, code: "SERVER_ERROR", message: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
