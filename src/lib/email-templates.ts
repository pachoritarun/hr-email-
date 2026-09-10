export interface FacultyEmailData {
  id?: number | string;
  name: string;
  designation: string;
  department: string;
  qualification?: string;
  previousExperience?: string;
  hobbies?: string;
  email: string;
  photoUrl?: string; // Web URL or base64 or cid:facultyPhoto
  customBody?: string;
  bannerLogoUrl?: string;
  hostUrl?: string;
}

/**
 * Generates responsive, cross-client HTML email template matching
 * the official JECRC University "Welcome Aboard" announcement design.
 */
export function generateFacultyWelcomeEmailHtml(data: FacultyEmailData): string {
  const {
    name = "Ms. Bidisha Chakraborty",
    designation = "Assistant Professor-II",
    department = "Department of Forensic Science",
    qualification = "M.Sc (2025) in Forensic Science",
    previousExperience = "Assistant Professor in the Department of Forensic Science at Aditya University, Andhra Pradesh",
    hobbies = "sports and travelling",
    email = "bidisha.chakraborty@jecrcu.edu.in",
    photoUrl = "/emailer-assets/sample-professor.png",
    customBody,
    bannerLogoUrl,
  } = data;

  // Determine pronouns intelligently based on title or prefix
  const isFemale =
    name.toLowerCase().startsWith("ms.") ||
    name.toLowerCase().startsWith("mrs.") ||
    name.toLowerCase().startsWith("miss") ||
    name.toLowerCase().includes("dr. (ms.)");
  const pronounSubject = isFemale ? "she" : "he";
  const pronounPossessive = isFemale ? "her" : "his";
  const pronounObject = isFemale ? "her" : "him";

  // Build the body content (either custom or default official template)
  const bodyContentHtml = customBody
    ? `<div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.75; color: #2d3748; white-space: pre-wrap;">${customBody}</div>`
    : `
      <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.7; color: #2d3748;">
        Dear All,
      </p>
      <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.7; color: #2d3748;">
        We are pleased to inform you that <strong>${escapeHtml(name)}</strong> has joined the JU family as <strong>${escapeHtml(designation)}, ${escapeHtml(department)}</strong> at JECRC University, Jaipur.
      </p>
      <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.7; color: #2d3748;">
        Academically, ${pronounSubject} holds an <strong>${escapeHtml(qualification)}</strong>. Before joining JU, ${pronounSubject} worked as an <strong>${escapeHtml(previousExperience)}</strong>.
      </p>
      <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.7; color: #2d3748;">
        In ${pronounPossessive} free time, ${pronounSubject} loves <strong>${escapeHtml(hobbies)}</strong>.
      </p>
      <div style="margin: 20px 0; padding: 14px 18px; background-color: #f8fafc; border-left: 4px solid #c8102e; border-radius: 6px;">
        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 4px;">Official Coordinates</div>
        <div style="font-size: 14px; color: #1e293b;">
          <strong>Email:</strong> <a href="mailto:${escapeHtml(email)}" style="color: #c8102e; font-weight: 600; text-decoration: underline;">${escapeHtml(email)}</a>
        </div>
      </div>
      <p style="margin: 16px 0 0 0; font-size: 14px; line-height: 1.7; color: #2d3748;">
        Wishing all success to <strong>${escapeHtml(name)}</strong> in ${pronounPossessive} new assignment at JU.
      </p>
    `;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Welcome Aboard - ${escapeHtml(name)} | JECRC University</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Great+Vibes&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style type="text/css">
    @media only screen and (max-width: 640px) {
      .main-table { width: 100% !important; }
      .photo-frame { width: 210px !important; height: 230px !important; }
      .name-heading { font-size: 22px !important; }
      .content-padding { padding: 24px 18px 28px 18px !important; }
      .welcome-script { font-size: 38px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #1a0206; font-family: 'Plus Jakarta Sans', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <!-- Outer Wrapper Table -->
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #1a0206; padding: 24px 12px;">
    <tr>
      <td align="center" valign="top">
        
        <!-- Main Email Container Card -->
        <table class="main-table" width="620" border="0" cellpadding="0" cellspacing="0" style="width: 620px; max-width: 620px; background: #b8001f; background: linear-gradient(160deg, #9e0017 0%, #c8102e 45%, #880012 100%); border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15);">
          
          <!-- Row 1: Top White Rounded Header Pill -->
          <tr>
            <td align="center" style="padding: 0 20px;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 490px; margin: 0 auto; background-color: #ffffff; border-radius: 0 0 20px 20px; box-shadow: 0 6px 16px rgba(0,0,0,0.18);">
                <tr>
                  <td align="center" style="padding: 10px 16px;">
                    ${
                      bannerLogoUrl
                        ? `<img src="${bannerLogoUrl}" alt="JECRC University Header" width="440" style="display: block; width: 100%; max-width: 440px; height: auto; border: 0;" />`
                        : `
                        <table width="100%" border="0" cellpadding="0" cellspacing="0">
                          <tr>
                            <!-- JECRC University Logo -->
                            <td align="left" valign="middle" style="width: 38%; padding: 4px 6px;">
                              <img src="${data.hostUrl || ""}/jecrc-logo.png" alt="JECRC University" width="135" style="display: block; width: 100%; max-width: 135px; height: auto; border: 0;" />
                            </td>
                            <!-- Divider 1 -->
                            <td align="center" valign="middle" style="width: 1px; background-color: #d1d5db; height: 36px;"></td>
                            <!-- 27 Years Milestone -->
                            <td align="center" valign="middle" style="width: 24%; padding: 4px 8px; text-align: center;">
                              <div style="font-family: Georgia, serif; font-size: 26px; font-weight: bold; color: #c8102e; line-height: 1; letter-spacing: -1px;">27</div>
                              <div style="font-size: 8px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.1; margin-top: 2px;">Celebrating Years Of Building Talent</div>
                            </td>
                            <!-- Divider 2 -->
                            <td align="center" valign="middle" style="width: 1px; background-color: #d1d5db; height: 36px;"></td>
                            <!-- JECRC Medical College -->
                            <td align="right" valign="middle" style="width: 36%; padding: 4px 6px; text-align: right;">
                              <div style="font-family: Georgia, serif; font-size: 14px; font-weight: bold; color: #c8102e; line-height: 1.1;">JECRC</div>
                              <div style="font-size: 8px; font-weight: 600; color: #1f2937; line-height: 1.2;">Medical College Hospital &amp; Research Centre</div>
                            </td>
                          </tr>
                        </table>
                        `
                    }
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Row 2: Elegant Cursive "Welcome Aboard" Headline -->
          <tr>
            <td align="center" style="padding: 24px 20px 14px 20px;">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <span class="welcome-script" style="font-family: 'Great Vibes', 'Caveat', 'Brush Script MT', 'Dancing Script', cursive; font-size: 48px; color: #ffffff; line-height: 1.2; text-shadow: 0 2px 10px rgba(0,0,0,0.35); display: block;">
                      Welcome Aboard
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Row 3: Arched Portrait Photo Frame with Decorative Flanking Lines -->
          <tr>
            <td align="center" style="padding: 0 24px;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <!-- Left Architectural Accent Line -->
                  <td align="right" valign="bottom" style="width: 30%; padding-bottom: 30px; padding-right: 16px;">
                    <div style="height: 100px; width: 2px; background-color: rgba(255,255,255,0.4); margin-left: auto;"></div>
                  </td>

                  <!-- Center Arched Photo Frame -->
                  <td align="center" valign="bottom" style="width: 40%;">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding-bottom: 0;">
                          <div class="photo-frame" style="width: 240px; height: 265px; border-radius: 120px 120px 0 0; background-color: #ffffff; overflow: hidden; border: 4px solid #ffffff; box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
                            <img src="${photoUrl}" alt="${escapeHtml(name)}" width="240" height="265" style="display: block; width: 100%; height: 100%; object-fit: cover; border-radius: 116px 116px 0 0; border: 0;" />
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>

                  <!-- Right Architectural Accent Line -->
                  <td align="left" valign="bottom" style="width: 30%; padding-bottom: 30px; padding-left: 16px;">
                    <div style="height: 100px; width: 2px; background-color: rgba(255,255,255,0.4); margin-right: auto;"></div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Row 4: Announcement Content Card -->
          <tr>
            <td align="center" style="padding: 0 20px 24px 20px;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f1f2f5; border-radius: 18px; box-shadow: 0 12px 28px rgba(0,0,0,0.18);">
                <tr>
                  <td class="content-padding" style="padding: 28px 36px 36px 36px;">
                    
                    <!-- Professor Name -->
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <h1 class="name-heading" style="margin: 0; font-family: 'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif; font-size: 26px; font-weight: 800; color: #1e293b; letter-spacing: -0.5px; line-height: 1.25;">
                            ${escapeHtml(name)}
                          </h1>
                          <div style="margin-top: 6px; font-size: 16px; font-weight: 700; color: #334155; letter-spacing: -0.2px;">
                            ${escapeHtml(designation)}
                          </div>
                          <div style="margin-top: 3px; font-size: 15px; font-weight: 700; color: #475569;">
                            ${escapeHtml(department)}
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Divider -->
                    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 20px 0 22px 0;">
                      <tr>
                        <td style="border-bottom: 1px solid #e2e8f0;"></td>
                      </tr>
                    </table>

                    <!-- Announcement Body -->
                    ${bodyContentHtml}

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Row 5: Official Footer -->
          <tr>
            <td align="center" style="padding: 0 24px 24px 24px;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="font-size: 11px; color: rgba(255,255,255,0.7); line-height: 1.6; text-align: center;">
                    <div style="font-weight: 700; color: #ffffff; letter-spacing: 0.5px; text-transform: uppercase;">
                      JECRC University, Jaipur
                    </div>
                    <div>Plot No. IS-2036 to 2039, Ramchandrapura Industrial Area, Vidhani, Jaipur, Rajasthan 303905</div>
                    <div style="margin-top: 6px;">
                      <a href="https://jecrcuniversity.edu.in" target="_blank" style="color: #ffffff; text-decoration: underline; font-weight: 600;">jecrcuniversity.edu.in</a>
                      &nbsp;|&nbsp;
                      Official Faculty Announcement Dispatch
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!-- End Main Email Container Card -->

      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string = ""): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
