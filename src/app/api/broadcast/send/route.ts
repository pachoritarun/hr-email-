import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getDbPool } from "@/lib/db";

// Helper to sanitize phone numbers into Meta-compliant formats (e.g. 919876543210)
function sanitizePhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, ""); // remove all non-digit characters
  // If it's a 10-digit number, prepend India's country code 91 by default
  if (cleaned.length === 10) {
    cleaned = "91" + cleaned;
  }
  return cleaned;
}

export async function POST(req: Request) {
  try {
    const {
      recipients,
      messageText,
      sendWhatsApp,
      sendEmail,
      smtpConfig,
      emailSubject,
      role = "Student",
    } = await req.json();

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: "No recipients provided" },
        { status: 400 }
      );
    }

    // Retrieve Meta WhatsApp Credentials
    const whatsappToken =
      process.env.WHATSAPP_TOKEN ||
      "EAAW4FrRE3wkBRoN5Hsmte2b7M1Gdr9fgnzfinGHgbIqdOZBbX9f79bPifFlLZCqaBgZAgdf6CMVhgRyCzIRZCgEGt2o9MPsk2fLuT21Af4SrvQ29yIZBtBiZAlgxfFRQbxBUA89hO7ii7q28LfAB1XIF2T7x7O202ad2ZB3ZAQAcwItlK9SHTF6gFWCAukQmqgZDZD";
    const whatsappPhoneId = process.env.WHATSAPP_PHONE_ID || "1133153459884742";
    const whatsappUrl = `https://graph.facebook.com/v25.0/${whatsappPhoneId}/messages`;

    // Initialize Mail Transporter if sending email
    let transporter: any = null;
    if (sendEmail) {
      if (!smtpConfig || !smtpConfig.host || !smtpConfig.user || !smtpConfig.pass) {
        return NextResponse.json(
          { success: false, error: "SMTP configuration is incomplete" },
          { status: 400 }
        );
      }
      transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.port === 465,
        auth: {
          user: smtpConfig.user,
          pass: smtpConfig.pass,
        },
      });
      // Test SMTP connection first
      await transporter.verify();
    }

    const pool = await getDbPool();
    const results: any[] = [];
    let whatsappSuccess = 0;
    let whatsappFailed = 0;
    let emailSuccess = 0;
    let emailFailed = 0;

    for (const recipient of recipients) {
      const name = recipient.name || "Recipient";
      // Find dynamic email and phone columns
      const emailKey = Object.keys(recipient).find((k) => k.toLowerCase().includes("email"));
      const phoneKey = Object.keys(recipient).find((k) =>
        /phone|mobile|whatsapp|contact/i.test(k)
      );

      const emailVal = emailKey ? recipient[emailKey] : "";
      const phoneVal = phoneKey ? recipient[phoneKey] : "";

      // Replace variables in Message Text and Email Subject
      let resolvedMessage = messageText || "";
      let resolvedSubject = emailSubject || "";

      Object.keys(recipient).forEach((key) => {
        const val = String(recipient[key] || "");
        const regex = new RegExp(`{{${key}}}`, "gi");
        resolvedMessage = resolvedMessage.replace(regex, val);
        resolvedSubject = resolvedSubject.replace(regex, val);
      });

      let whatsappStatus = "skipped";
      let whatsappError: string | null = null;
      let emailStatus = "skipped";
      let emailError: string | null = null;

      // 1. Send WhatsApp Text Message (Meta Graph API)
      if (sendWhatsApp && phoneVal) {
        const cleanNumber = sanitizePhone(String(phoneVal));
        try {
          const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: cleanNumber,
            type: "text",
            text: {
              preview_url: false,
              body: resolvedMessage,
            },
          };

          const response = await fetch(whatsappUrl, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${whatsappToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          const resData = await response.json();

          if (response.ok && (resData.messages || resData.success)) {
            whatsappStatus = "success";
            whatsappSuccess++;
          } else {
            whatsappStatus = "failed";
            whatsappFailed++;
            whatsappError = resData.error?.message || JSON.stringify(resData);
            console.error(`Meta API Error for ${cleanNumber}:`, resData);
          }
        } catch (error: any) {
          whatsappStatus = "failed";
          whatsappFailed++;
          whatsappError = error.message || "Network error";
          console.error(`Network Error sending WhatsApp to ${cleanNumber}:`, error);
        }
      } else if (sendWhatsApp) {
        whatsappStatus = "failed";
        whatsappFailed++;
        whatsappError = "No valid phone number found";
      }

      // 2. Send Email
      if (sendEmail && emailVal) {
        try {
          const mailOptions = {
            from: smtpConfig.from,
            to: emailVal,
            subject: resolvedSubject,
            text: resolvedMessage, // default as plain text message
          };

          await transporter.sendMail(mailOptions);
          emailStatus = "success";
          emailSuccess++;
        } catch (error: any) {
          emailStatus = "failed";
          emailFailed++;
          emailError = error.message || "Failed to send email";
          console.error(`SMTP Error for ${emailVal}:`, error);
        }
      } else if (sendEmail) {
        emailStatus = "failed";
        emailFailed++;
        emailError = "No valid email found";
      }

      // 3. Log results to MySQL database
      try {
        await pool.query(
          `INSERT INTO broadcast_logs 
           (recipient_name, phone, email, role, message_body, whatsapp_status, whatsapp_error, email_status, email_error) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            name,
            String(phoneVal),
            String(emailVal),
            role,
            resolvedMessage,
            whatsappStatus,
            whatsappError,
            emailStatus,
            emailError,
          ]
        );
      } catch (dbError) {
        console.error("Failed to log broadcast to DB:", dbError);
      }

      results.push({
        name,
        phone: phoneVal,
        email: emailVal,
        whatsapp: { status: whatsappStatus, error: whatsappError },
        emailResult: { status: emailStatus, error: emailError },
      });

      // Brief delay to prevent SMTP & WhatsApp API rate limits
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: recipients.length,
        whatsappSuccess,
        whatsappFailed,
        emailSuccess,
        emailFailed,
      },
      results,
    });
  } catch (error: any) {
    console.error("Broadcast Execution Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: Retrieve past broadcast logs history
export async function GET(req: Request) {
  try {
    const pool = await getDbPool();
    const [rows] = await pool.query(
      "SELECT * FROM broadcast_logs ORDER BY sent_at DESC LIMIT 500"
    );
    return NextResponse.json({ success: true, logs: rows });
  } catch (error: any) {
    console.warn("MySQL Logs Fetch Notice:", error?.message || error);
    return NextResponse.json({
      success: true,
      logs: [],
      warning: "MySQL database not connected or credentials missing.",
    });
  }
}
