/**
 * Email notification service using Nodemailer
 * Sends admin notifications when contact form is submitted
 * SMTP config is read from site_content table (configurable from admin panel)
 */

import nodemailer from "nodemailer";

interface ContactNotificationData {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  adminEmail: string;
  smtpConfig?: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from?: string;
  };
}

function createTransporter(config?: ContactNotificationData["smtpConfig"]) {
  const host = config?.host || process.env.SMTP_HOST;
  const port = config?.port || parseInt(process.env.SMTP_PORT || "587");
  const user = config?.user || process.env.SMTP_USER;
  const pass = config?.pass || process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn("[Email] SMTP not configured. Skipping email send.");
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });
}

export async function sendContactNotification(data: ContactNotificationData): Promise<boolean> {
  const transporter = createTransporter(data.smtpConfig);
  if (!transporter) return false;

  const fromAddress = data.smtpConfig?.from ||
    process.env.SMTP_FROM ||
    `"OrganizUS Web" <${data.smtpConfig?.user || process.env.SMTP_USER}>`;

  try {
    await transporter.sendMail({
      from: fromAddress,
      to: data.adminEmail,
      replyTo: data.email,
      subject: `[OrganizUS] Nuevo mensaje de ${data.name}${data.subject ? ` — ${data.subject}` : ""}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f97316, #22c55e); padding: 20px 24px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 700;">Nuevo mensaje de contacto</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 5px 0 0 0; font-size: 13px;">organizus.es</p>
          </div>
          <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #374151; width: 110px; font-size: 13px;">Nombre:</td>
                <td style="padding: 8px 0; color: #111827; font-size: 13px;">${data.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #374151; font-size: 13px;">Email:</td>
                <td style="padding: 8px 0; font-size: 13px;"><a href="mailto:${data.email}" style="color: #f97316; text-decoration: none;">${data.email}</a></td>
              </tr>
              ${data.phone ? `<tr>
                <td style="padding: 8px 0; font-weight: 600; color: #374151; font-size: 13px;">Teléfono:</td>
                <td style="padding: 8px 0; color: #111827; font-size: 13px;">${data.phone}</td>
              </tr>` : ""}
              ${data.subject ? `<tr>
                <td style="padding: 8px 0; font-weight: 600; color: #374151; font-size: 13px;">Asunto:</td>
                <td style="padding: 8px 0; color: #111827; font-size: 13px;">${data.subject}</td>
              </tr>` : ""}
            </table>
            <div style="margin-top: 16px; padding: 16px; background: white; border-radius: 6px; border: 1px solid #e5e7eb;">
              <p style="font-weight: 600; color: #374151; margin: 0 0 10px 0; font-size: 13px;">Mensaje:</p>
              <p style="color: #111827; line-height: 1.7; margin: 0; white-space: pre-wrap; font-size: 13px;">${data.message}</p>
            </div>
            <div style="margin-top: 20px; text-align: center;">
              <a href="mailto:${data.email}" style="display: inline-block; background: #f97316; color: white; padding: 10px 24px; border-radius: 50px; text-decoration: none; font-size: 13px; font-weight: 600;">
                Responder a ${data.name}
              </a>
            </div>
            <p style="margin-top: 20px; font-size: 11px; color: #9ca3af; text-align: center;">
              Mensaje recibido desde el formulario de contacto de organizus.es
            </p>
          </div>
        </div>
      `,
    });
    console.log(`[Email] Contact notification sent to ${data.adminEmail}`);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send contact notification:", error);
    return false;
  }
}
