const prisma = require('../lib/prisma');

const TYPE_LABELS = {
  DEBT: '🏦 Deuda',
  SUBSCRIPTION: '📱 Suscripción',
  LOAN: '💳 Préstamo',
  SERVICE: '🔧 Servicio',
  TAX: '📋 Impuesto',
  CUSTOM: '📌 Recordatorio',
};

const formatCOP = (amount) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);

const sendReminderEmail = async ({ user, reminder }) => {
  if (!process.env.RESEND_API_KEY) return;

  const now = new Date();
  const due = new Date(reminder.dueDate);
  const diffMs = due - now;
  const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const urgencyText =
    daysUntil <= 0  ? '⚠️ ¡Vence hoy!' :
    daysUntil === 1 ? '⏳ Vence mañana' :
                      `⏳ Faltan ${daysUntil} día(s)`;

  const urgencyColor =
    daysUntil <= 0  ? '#ef4444' :
    daysUntil <= 2  ? '#f59e0b' :
                      '#6366f1';

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#f1f5f9;font-family:sans-serif;">
      <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:24px 32px;">
          <h1 style="margin:0;color:#fff;font-size:22px;">⏰ Recordatorio de pago</h1>
          <p style="margin:4px 0 0;color:#c7d2fe;font-size:14px;">FinanzasPro</p>
        </div>
        <div style="padding:24px 32px;">
          <p style="color:#374151;">Hola <strong>${user.name}</strong>,</p>
          <p style="color:#374151;">Tienes un pago próximo que no debes olvidar:</p>

          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
              <span style="font-size:18px;">${TYPE_LABELS[reminder.type] || '📌'}</span>
            </div>
            <h2 style="margin:0 0 12px;color:#1e293b;font-size:20px;">${reminder.title}</h2>
            ${reminder.amount ? `<p style="margin:6px 0;color:#374151;">💰 Monto: <strong>${formatCOP(reminder.amount)}</strong></p>` : ''}
            <p style="margin:6px 0;color:#374151;">📅 Fecha: <strong>${due.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></p>
            <p style="margin:12px 0 0;font-size:16px;font-weight:bold;color:${urgencyColor};">${urgencyText}</p>
            ${reminder.description ? `<p style="margin:8px 0 0;color:#64748b;font-size:14px;">${reminder.description}</p>` : ''}
          </div>

          <div style="text-align:center;margin-top:24px;">
            <a href="${process.env.FRONTEND_URL || 'https://finanzas-frontend-vl9c.onrender.com'}/calendar"
               style="background:#6366f1;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
              Ver en FinanzasPro →
            </a>
          </div>
        </div>
        <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
            FinanzasPro · Tu aliado financiero personal
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const subject = daysUntil <= 0
    ? `⚠️ Vence hoy: ${reminder.title}`
    : `⏰ Recordatorio: ${reminder.title} vence en ${daysUntil} día(s)`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'FinanzasPro <onboarding@resend.dev>',
        to: [user.email],
        subject,
        html,
      }),
    });
    const data = await res.json();
    if (!res.ok) console.error('Resend error:', data);
    else console.log(`📧 Email enviado a ${user.email}: ${subject}`);
  } catch (err) {
    console.error('Error enviando email:', err.message);
  }
};

// Enviar emails para recordatorios que vencen hoy o mañana
// Se llama al hacer login para asegurarse de que se envían aunque el servidor duerma
const sendUpcomingRemindersEmail = async (userId) => {
  if (!process.env.RESEND_API_KEY) return;

  try {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const in2Days = new Date(now);
    in2Days.setDate(in2Days.getDate() + 2);
    in2Days.setHours(23, 59, 59, 999);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const reminders = await prisma.reminder.findMany({
      where: {
        userId,
        isPaid: false,
        dueDate: { gte: now, lte: in2Days },
        OR: [
          { lastEmailSent: null },
          { lastEmailSent: { lt: todayStart } },
        ],
      },
      include: { user: true },
    });

    for (const reminder of reminders) {
      await sendReminderEmail({
        user: reminder.user,
        reminder: { ...reminder, amount: reminder.amount ? Number(reminder.amount) : null },
      });
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { lastEmailSent: new Date() },
      });
    }
  } catch (err) {
    console.error('Error en sendUpcomingRemindersEmail:', err.message);
  }
};

// ─── Código de verificación de cuenta ────────────────────────────────────────
// Retorna true si el correo salió aceptado por Resend, false si no — el caller
// decide qué comunicar al usuario (no se lanza excepción para no romper el registro).
const sendVerificationEmail = async ({ email, name, code }) => {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY no configurada — no se puede enviar el código de verificación');
    return false;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#f1f5f9;font-family:sans-serif;">
      <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#10b981,#059669);padding:24px 32px;">
          <h1 style="margin:0;color:#fff;font-size:22px;">Verifica tu cuenta</h1>
          <p style="margin:4px 0 0;color:#d1fae5;font-size:14px;">FinanzasPro</p>
        </div>
        <div style="padding:24px 32px;">
          <p style="color:#374151;">Hola <strong>${name}</strong>,</p>
          <p style="color:#374151;">Tu código de verificación es:</p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
            <p style="margin:0;font-size:36px;font-weight:800;letter-spacing:10px;color:#059669;">${code}</p>
          </div>
          <p style="color:#64748b;font-size:14px;">Este código vence en <strong>15 minutos</strong>. Si no creaste una cuenta en FinanzasPro, ignora este correo.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'FinanzasPro <onboarding@resend.dev>',
        to: [email],
        subject: `${code} es tu código de verificación — FinanzasPro`,
        html,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('Resend error (verificación):', data);
      return false;
    }
    console.log(`📧 Código de verificación enviado a ${email}`);
    return true;
  } catch (err) {
    console.error('Error enviando código de verificación:', err.message);
    return false;
  }
};

module.exports = { sendReminderEmail, sendUpcomingRemindersEmail, sendVerificationEmail };
