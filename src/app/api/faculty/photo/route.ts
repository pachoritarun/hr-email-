import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import fs from "fs";
import path from "path";

// GET /api/faculty/photo?id=... - Serve the photo from MySQL
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return new NextResponse("Missing faculty ID", { status: 400 });
    }

    const pool = await getDbPool();
    const [rows]: any = await pool.query(
      "SELECT photo_mime, photo_base64 FROM faculty_onboarding WHERE id = ?",
      [id]
    );

    if (!rows || rows.length === 0 || !rows[0].photo_base64) {
      // Return sample default professor image if available
      try {
        const fallbackPath = path.join(process.cwd(), "public", "emailer-assets", "sample-professor.png");
        if (fs.existsSync(fallbackPath)) {
          const fallbackBuffer = fs.readFileSync(fallbackPath);
          return new NextResponse(fallbackBuffer, {
            headers: {
              "Content-Type": "image/png",
              "Cache-Control": "public, max-age=3600",
            },
          });
        }
      } catch (err) {
        // continue
      }
      return new NextResponse("Photo not found", { status: 404 });
    }

    const { photo_mime = "image/jpeg", photo_base64 } = rows[0];

    // Clean up base64 string if it contains prefix data:image/xxx;base64,
    const cleanBase64 = photo_base64.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(cleanBase64, "base64");

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": photo_mime,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
        "Content-Length": imageBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("Failed to serve faculty photo:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
