import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getDbPool } from "@/lib/db";
import { generateFacultyWelcomeEmailHtml } from "@/lib/email-templates";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const {
      facultyId,
      facultyData,
      smtpConfig,
      recipientMode = "faculty_only", // "faculty_only" | "test" | "all_directory" | "custom_list"
      testEmail,
      customEmails = [],
    } = await req.json();

    if (!smtpConfig || !smtpConfig.host || !smtpConfig.user || !smtpConfig.pass) {
      return NextResponse.json(
        { success: false, error: "SMTP configuration is incomplete." },
        { status: 400 }
      );
    }

    // Set up nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: Number(smtpConfig.port) || 465,
      secure: Number(smtpConfig.port) === 465,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass,
      },
    });

    // Verify SMTP connection
    await transporter.verify();

    // Determine photo buffer and CID
    let photoBuffer: Buffer | null = null;
    let photoMime = "image/jpeg";

    if (facultyData.photoBase64) {
      const mimeMatch = facultyData.photoBase64.match(/^data:(image\/[a-zA-Z0-9.-]+);base64,/);
      if (mimeMatch) {
        photoMime = mimeMatch[1];
      }
      const cleanBase64 = facultyData.photoBase64.replace(/^data:image\/[a-zA-Z0-9.-]+;base64,/, "");
      photoBuffer = Buffer.from(cleanBase64, "base64");
    } else if (facultyId) {
      // Fetch photo from MySQL if not sent in payload
      const pool = await getDbPool();
      const [rows]: any = await pool.query(
        "SELECT photo_mime, photo_base64 FROM faculty_onboarding WHERE id = ?",
        [facultyId]
      );
      if (rows && rows.length > 0 && rows[0].photo_base64) {
        photoMime = rows[0].photo_mime || "image/jpeg";
        const cleanBase64 = rows[0].photo_base64.replace(/^data:image\/[a-zA-Z0-9.-]+;base64,/, "");
        photoBuffer = Buffer.from(cleanBase64, "base64");
      }
    }

    // Fallback photo buffer if none provided
    if (!photoBuffer) {
      try {
        const fallbackPath = path.join(process.cwd(), "public", "emailer-assets", "sample-professor.png");
        if (fs.existsSync(fallbackPath)) {
          photoBuffer = fs.readFileSync(fallbackPath);
          photoMime = "image/png";
        }
      } catch (e) {
        // continue
      }
    }

    // Prepare attachments:
    // 1. CID faculty photo (instant display with 0 external image blocking)
    // 2. CID header banner
    const attachments: any[] = [];
    let photoImgSrc = "cid:facultyPhoto";

    if (photoBuffer) {
      attachments.push({
        filename: `faculty-photo.${photoMime.includes("png") ? "png" : "jpg"}`,
        content: photoBuffer,
        cid: "facultyPhoto",
        contentType: photoMime,
      });
    } else {
      photoImgSrc = facultyData.photoUrl || "";
    }

    // Header banner attachment
    try {
      const bannerPath = path.join(process.cwd(), "public", "emailer-assets", "jecrc-banner-clean.png");
      if (fs.existsSync(bannerPath)) {
        const bannerBuffer = fs.readFileSync(bannerPath);
        attachments.push({
          filename: "jecrc-banner.png",
          content: bannerBuffer,
          cid: "jecrcBanner",
          contentType: "image/png",
        });
      }
    } catch (e) {
      // continue
    }

    const hasBannerCid = attachments.some((a) => a.cid === "jecrcBanner");

    // Welcome Aboard headline attachment
    try {
      const welcomePath = path.join(process.cwd(), "public", "emailer-assets", "welcome-aboard-clean.png");
      if (fs.existsSync(welcomePath)) {
        const welcomeBuffer = fs.readFileSync(welcomePath);
        attachments.push({
          filename: "welcome-aboard.png",
          content: welcomeBuffer,
          cid: "welcomeAboard",
          contentType: "image/png",
        });
      }
    } catch (e) {
      // continue
    }

    const hasWelcomeCid = attachments.some((a) => a.cid === "welcomeAboard");

    // Generate HTML with CID image sources
    const htmlEmail = generateFacultyWelcomeEmailHtml({
      ...facultyData,
      photoUrl: photoImgSrc,
      bannerLogoUrl: hasBannerCid ? "cid:jecrcBanner" : undefined,
      welcomeAboardUrl: hasWelcomeCid ? "cid:welcomeAboard" : undefined,
    });

    const subject = `Welcome Aboard - ${facultyData.name} | JECRC University`;

    // Determine target recipient list
    let recipients: string[] = [];

    if (recipientMode === "faculty_only") {
      if (facultyData.email) recipients.push(facultyData.email);
    } else if (recipientMode === "test") {
      if (testEmail) recipients.push(testEmail);
    } else if (recipientMode === "custom_list") {
      recipients = customEmails.filter((e: string) => e && e.includes("@"));
    } else if (recipientMode === "all_directory") {
      // Fetch all Faculty contacts from MySQL
      const pool = await getDbPool();
      const [rows]: any = await pool.query(
        "SELECT email FROM contacts WHERE role = 'Faculty' OR role = 'All'"
      );
      if (rows && rows.length > 0) {
        recipients = rows.map((r: any) => r.email).filter(Boolean);
      }
      // If none in contacts table, also include the professor
      if (recipients.length === 0 && facultyData.email) {
        recipients.push(facultyData.email);
      }
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: "No recipient email addresses found." },
        { status: 400 }
      );
    }

    // Dispatch emails
    const dispatchResults: { email: string; success: boolean; error?: string }[] = [];

    for (const recipient of recipients) {
      try {
        await transporter.sendMail({
          from: smtpConfig.from,
          to: recipient,
          subject,
          html: htmlEmail,
          attachments,
        });
        dispatchResults.push({ email: recipient, success: true });
      } catch (err: any) {
        console.error(`Error sending welcome email to ${recipient}:`, err);
        dispatchResults.push({
          email: recipient,
          success: false,
          error: err.message || "Failed to send email",
        });
      }

      // Small pacing throttle to prevent rate limiting
      if (recipients.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
    }

    // Update sent stats in database if facultyId exists
    if (facultyId) {
      try {
        const pool = await getDbPool();
        await pool.query(
          "UPDATE faculty_onboarding SET sent_count = sent_count + ?, last_sent_at = NOW() WHERE id = ?",
          [dispatchResults.filter((r) => r.success).length, facultyId]
        );
      } catch (dbErr) {
        console.error("Failed to update sent count:", dbErr);
      }
    }

    const successCount = dispatchResults.filter((r) => r.success).length;

    return NextResponse.json({
      success: true,
      message: `Successfully dispatched to ${successCount} of ${recipients.length} recipients.`,
      results: dispatchResults,
    });
  } catch (error: any) {
    console.error("Failed in welcome email dispatch:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
