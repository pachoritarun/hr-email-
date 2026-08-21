import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { data, smtpConfig, emailTemplate, useHtml } = await req.json();

    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.port === 465, // true for 465, false for other ports
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass,
      },
    });

    // Test connection first
    await transporter.verify();

    const results = [];

    for (const student of data) {
      // Auto-detect email column (case-insensitive)
      const emailKey = Object.keys(student).find(k => k.toLowerCase().includes('email'));
      const studentEmail = emailKey ? student[emailKey] : null;

      if (!studentEmail) {
        results.push({ email: "Unknown", success: false, error: "No email column found" });
        continue;
      }

      let subject = emailTemplate.subject;
      let body = emailTemplate.body;

      Object.keys(student).forEach((key) => {
        const value = String(student[key] || "");
        const regex = new RegExp(`{{${key}}}`, 'gi');
        subject = subject.replace(regex, value);
        body = body.replace(regex, value);
      });

      const mailOptions: any = {
        from: smtpConfig.from,
        to: studentEmail,
        subject,
      };

      if (useHtml) {
        mailOptions.html = body;
      } else {
        mailOptions.text = body;
      }

      try {
        await transporter.sendMail(mailOptions);
        results.push({ email: studentEmail, success: true });
      } catch (error: any) {
        console.error(`Failed to send to ${studentEmail}:`, error);
        results.push({ email: studentEmail, success: false, error: error.message || "Failed to send" });
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
