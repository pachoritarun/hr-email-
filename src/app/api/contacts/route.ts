import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";

// GET: Fetch contacts by role
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");

    const pool = await getDbPool();
    let query = "SELECT * FROM contacts ORDER BY name ASC";
    let params: any[] = [];

    if (role && ["Faculty", "Student", "Alumni"].includes(role)) {
      query = "SELECT * FROM contacts WHERE role = ? ORDER BY name ASC";
      params = [role];
    }

    const [rows] = await pool.query(query, params);
    return NextResponse.json({ success: true, contacts: rows });
  } catch (error: any) {
    console.error("Failed to fetch contacts:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Add single contact or bulk import contacts
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const pool = await getDbPool();

    // Check if bulk import or single insert
    if (body.contacts && Array.isArray(body.contacts)) {
      const contacts = body.contacts;
      if (contacts.length === 0) {
        return NextResponse.json({ success: true, count: 0 });
      }

      // Group/prepare values for batch insert
      // Using ON DUPLICATE KEY UPDATE to avoid errors and update existing records
      const values: any[] = [];
      const query = `
        INSERT INTO contacts (name, phone, email, role)
        VALUES ?
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          phone = VALUES(phone)
      `;

      const rowsToInsert = contacts.map((c: any) => [
        c.name || "Unknown",
        String(c.phone || ""),
        c.email || "",
        c.role || "Student",
      ]);

      await pool.query(query, [rowsToInsert]);

      return NextResponse.json({
        success: true,
        message: `Successfully imported ${contacts.length} contacts.`,
        count: contacts.length,
      });
    } else {
      // Single contact insert
      const { name, phone, email, role } = body;
      if (!phone || !email || !role) {
        return NextResponse.json(
          { success: false, error: "Missing required fields: phone, email, role" },
          { status: 400 }
        );
      }

      const query = `
        INSERT INTO contacts (name, phone, email, role)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          phone = VALUES(phone)
      `;
      await pool.query(query, [name || "Unknown", String(phone), email, role]);

      return NextResponse.json({
        success: true,
        message: "Contact saved successfully.",
      });
    }
  } catch (error: any) {
    console.error("Failed to save contact(s):", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete contact(s)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const role = searchParams.get("role");

    const pool = await getDbPool();

    if (id) {
      // Delete single contact by ID
      await pool.query("DELETE FROM contacts WHERE id = ?", [id]);
      return NextResponse.json({ success: true, message: "Contact deleted successfully." });
    } else if (role && ["Faculty", "Student", "Alumni"].includes(role)) {
      // Clear all contacts for a specific role
      await pool.query("DELETE FROM contacts WHERE role = ?", [role]);
      return NextResponse.json({
        success: true,
        message: `Successfully cleared all contacts for role: ${role}`,
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Specify contact 'id' or role for deletion." },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Failed to delete contact(s):", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
