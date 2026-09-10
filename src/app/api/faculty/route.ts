import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";

// GET /api/faculty - List all saved faculty records
export async function GET() {
  try {
    const pool = await getDbPool();
    const [rows]: any = await pool.query(`
      SELECT 
        id, name, salutation, designation, department, 
        qualification, previous_experience, hobbies, 
        email, photo_mime, custom_body, created_at, 
        sent_count, last_sent_at
      FROM faculty_onboarding 
      ORDER BY id DESC
    `);

    return NextResponse.json({
      success: true,
      faculty: rows,
    });
  } catch (error: any) {
    console.error("Failed to fetch faculty records:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch faculty records" },
      { status: 500 }
    );
  }
}

// POST /api/faculty - Save or update faculty record
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      name,
      salutation = "Dr.",
      designation,
      department,
      qualification,
      previousExperience,
      hobbies,
      email,
      photoBase64,
      photoMime = "image/jpeg",
      customBody,
    } = body;

    if (!name || !email || !designation || !department) {
      return NextResponse.json(
        { success: false, error: "Name, email, designation, and department are required." },
        { status: 400 }
      );
    }

    const pool = await getDbPool();

    if (id) {
      // Update existing record
      if (photoBase64) {
        await pool.query(
          `
          UPDATE faculty_onboarding 
          SET name = ?, salutation = ?, designation = ?, department = ?, 
              qualification = ?, previous_experience = ?, hobbies = ?, 
              email = ?, photo_mime = ?, photo_base64 = ?, custom_body = ?
          WHERE id = ?
        `,
          [
            name,
            salutation,
            designation,
            department,
            qualification,
            previousExperience,
            hobbies,
            email,
            photoMime,
            photoBase64,
            customBody || null,
            id,
          ]
        );
      } else {
        await pool.query(
          `
          UPDATE faculty_onboarding 
          SET name = ?, salutation = ?, designation = ?, department = ?, 
              qualification = ?, previous_experience = ?, hobbies = ?, 
              email = ?, custom_body = ?
          WHERE id = ?
        `,
          [
            name,
            salutation,
            designation,
            department,
            qualification,
            previousExperience,
            hobbies,
            email,
            customBody || null,
            id,
          ]
        );
      }

      return NextResponse.json({
        success: true,
        id,
        message: `Faculty record for ${name} updated successfully.`,
      });
    } else {
      // Insert new record
      const [result]: any = await pool.query(
        `
        INSERT INTO faculty_onboarding 
          (name, salutation, designation, department, qualification, previous_experience, hobbies, email, photo_mime, photo_base64, custom_body)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          name,
          salutation,
          designation,
          department,
          qualification,
          previousExperience,
          hobbies,
          email,
          photoMime,
          photoBase64 || null,
          customBody || null,
        ]
      );

      return NextResponse.json({
        success: true,
        id: result.insertId,
        message: `Faculty record for ${name} created successfully in MySQL.`,
      });
    }
  } catch (error: any) {
    console.error("Failed to save faculty record:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/faculty?id=... - Delete faculty record
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
    }

    const pool = await getDbPool();
    await pool.query("DELETE FROM faculty_onboarding WHERE id = ?", [id]);

    return NextResponse.json({ success: true, message: "Faculty profile removed." });
  } catch (error: any) {
    console.error("Failed to delete faculty record:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
