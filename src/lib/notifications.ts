import nodemailer from "nodemailer";
import type { Locale, ReservationRecord, ReservationV2Record } from "@/lib/types";
import { createReservationConfirmUrl } from "@/lib/reservation-confirmation";

type NotificationStatus = {
  channel: "email" | "whatsapp";
  sent: boolean;
  reason?: string;
};

const isPt = (locale: Locale): boolean => locale === "pt";

const reservationSummary = (
  reservation: ReservationRecord,
  locale: Locale,
): string => {
  if (isPt(locale)) {
    return [
      `Nome: ${reservation.firstName} ${reservation.lastName}`,
      `Data: ${reservation.date}`,
      `Hora: ${reservation.time}`,
      `Convidados: ${reservation.guests}`,
      `Telefone: ${reservation.phone}`,
      `Email: ${reservation.email}`,
      `Ocasião: ${reservation.occasion ?? "-"}`,
      `Notas: ${reservation.notes ?? "-"}`,
    ].join("\n");
  }

  return [
    `Name: ${reservation.firstName} ${reservation.lastName}`,
    `Date: ${reservation.date}`,
    `Time: ${reservation.time}`,
    `Guests: ${reservation.guests}`,
    `Phone: ${reservation.phone}`,
    `Email: ${reservation.email}`,
    `Occasion: ${reservation.occasion ?? "-"}`,
    `Notes: ${reservation.notes ?? "-"}`,
  ].join("\n");
};

const reservationV2Summary = (
  reservation: ReservationV2Record,
  locale: Locale,
): string => {
  if (isPt(locale)) {
    return [
      `Nome: ${reservation.fullName}`,
      `Data: ${reservation.date}`,
      `Hora: ${reservation.time}`,
      `Convidados: ${reservation.guests}`,
      `Telefone: ${reservation.phone}`,
      `Email: ${reservation.email ?? "-"}`,
      `Informações: ${reservation.otherInfo ?? "-"}`,
    ].join("\n");
  }

  return [
    `Name: ${reservation.fullName}`,
    `Date: ${reservation.date}`,
    `Time: ${reservation.time}`,
    `Guests: ${reservation.guests}`,
    `Phone: ${reservation.phone}`,
    `Email: ${reservation.email ?? "-"}`,
    `Other info: ${reservation.otherInfo ?? "-"}`,
  ].join("\n");
};

export const sendReservationEmails = async (
  reservation: ReservationRecord,
): Promise<NotificationStatus> => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM ?? user;
  const notifyTo = process.env.RESERVATION_NOTIFY_EMAIL;

  if (!host || !user || !pass || !from || !notifyTo) {
    return {
      channel: "email",
      sent: false,
      reason:
        "Missing SMTP_HOST/SMTP_USER/SMTP_PASS/SMTP_FROM/RESERVATION_NOTIFY_EMAIL.",
    };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const locale = reservation.locale;
  const subjectGuest = isPt(locale)
    ? "Reserva recebida - Tláloc Restaurant"
    : "Reservation received - Tláloc Restaurant";
  const guestText = isPt(locale)
    ? `Ola ${reservation.firstName},\n\nRecebemos o seu pedido de reserva. Em breve entraremos em contacto para confirmar.\n\n${reservationSummary(reservation, locale)}`
    : `Hi ${reservation.firstName},\n\nWe received your reservation request. We will confirm it shortly.\n\n${reservationSummary(reservation, locale)}`;

  const subjectTeam = "New reservation request";
  const confirmUrl = createReservationConfirmUrl(reservation.id);
  const teamText = `${reservationSummary(
    reservation,
    "en",
  )}\n\nConfirm reservation:\n${confirmUrl}`;
  const teamHtml = `
    <p><strong>New reservation request</strong></p>
    <pre style="font-family:inherit;white-space:pre-wrap;line-height:1.5">${reservationSummary(
      reservation,
      "en",
    )}</pre>
    <p>
      <a href="${confirmUrl}" style="display:inline-block;padding:10px 14px;background:#f5a623;color:#130800;text-decoration:none;border-radius:8px;font-weight:700">
        Confirm reservation
      </a>
    </p>
    <p style="font-size:12px;opacity:.8">If the button doesn't work, open this URL:<br/>${confirmUrl}</p>
  `;

  await transporter.sendMail({
    from,
    to: reservation.email,
    subject: subjectGuest,
    text: guestText,
  });

  await transporter.sendMail({
    from,
    to: notifyTo,
    subject: subjectTeam,
    text: teamText,
    html: teamHtml,
  });

  return { channel: "email", sent: true };
};

const sendTwilioWhatsApp = async (
  to: string,
  body: string,
): Promise<Response> => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !from) {
    throw new Error(
      "Missing TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_WHATSAPP_FROM.",
    );
  }

  const form = new URLSearchParams({
    From: from,
    To: to,
    Body: body,
  });

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  return fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
    },
  );
};

export const sendReservationWhatsApp = async (
  reservation: ReservationRecord,
): Promise<NotificationStatus> => {
  const notifyTo = process.env.WHATSAPP_NOTIFY_TO;

  if (!notifyTo) {
    return {
      channel: "whatsapp",
      sent: false,
      reason: "Missing WHATSAPP_NOTIFY_TO.",
    };
  }

  try {
    const locale = reservation.locale;
    const guestBody = isPt(locale)
      ? `Tláloc Restaurant: pedido de reserva recebido para ${reservation.date} às ${reservation.time}. Vamos confirmar em breve.`
      : `Tláloc Restaurant: reservation request received for ${reservation.date} at ${reservation.time}. We will confirm shortly.`;
    const teamBody = `New reservation from ${reservation.firstName} ${reservation.lastName} on ${reservation.date} ${reservation.time} for ${reservation.guests} guests.`;

    const guestTo =
      reservation.phone.startsWith("whatsapp:")
        ? reservation.phone
        : `whatsapp:${reservation.phone}`;

    const guestResponse = await sendTwilioWhatsApp(guestTo, guestBody);
    if (!guestResponse.ok) {
      throw new Error("Failed to send WhatsApp message to guest.");
    }

    const teamTo = notifyTo.startsWith("whatsapp:")
      ? notifyTo
      : `whatsapp:${notifyTo}`;
    const teamResponse = await sendTwilioWhatsApp(teamTo, teamBody);
    if (!teamResponse.ok) {
      throw new Error("Failed to send WhatsApp message to team.");
    }

    return { channel: "whatsapp", sent: true };
  } catch (error) {
    return {
      channel: "whatsapp",
      sent: false,
      reason: error instanceof Error ? error.message : "Unknown WhatsApp error",
    };
  }
};

export const sendReservationV2Emails = async (
  reservation: ReservationV2Record,
): Promise<NotificationStatus> => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM ?? user;
  const notifyTo = process.env.RESERVATION_NOTIFY_EMAIL;

  if (!host || !user || !pass || !from || !notifyTo) {
    return {
      channel: "email",
      sent: false,
      reason:
        "Missing SMTP_HOST/SMTP_USER/SMTP_PASS/SMTP_FROM/RESERVATION_NOTIFY_EMAIL.",
    };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const locale = reservation.locale;
  const subjectGuest = isPt(locale)
    ? "Reserva recebida - Tláloc Restaurant"
    : "Reservation received - Tláloc Restaurant";
  const guestText = isPt(locale)
    ? `Ola ${reservation.fullName},\n\nRecebemos o seu pedido de reserva. Em breve entraremos em contacto para confirmar.\n\n${reservationV2Summary(reservation, locale)}`
    : `Hi ${reservation.fullName},\n\nWe received your reservation request. We will confirm it shortly.\n\n${reservationV2Summary(reservation, locale)}`;

  const subjectTeam = "New reservation v2 request";
  const teamText = reservationV2Summary(reservation, "en");

  if (reservation.email) {
    await transporter.sendMail({
      from,
      to: reservation.email,
      subject: subjectGuest,
      text: guestText,
    });
  }

  await transporter.sendMail({
    from,
    to: notifyTo,
    subject: subjectTeam,
    text: teamText,
    html: `<pre style="font-family:inherit;white-space:pre-wrap;line-height:1.5">${teamText}</pre>`,
  });

  return { channel: "email", sent: true };
};

export const sendReservationV2WhatsApp = async (
  reservation: ReservationV2Record,
): Promise<NotificationStatus> => {
  const notifyTo = process.env.WHATSAPP_NOTIFY_TO;

  if (!notifyTo) {
    return {
      channel: "whatsapp",
      sent: false,
      reason: "Missing WHATSAPP_NOTIFY_TO.",
    };
  }

  try {
    const locale = reservation.locale;
    const guestBody = isPt(locale)
      ? `Tláloc Restaurant: pedido de reserva recebido para ${reservation.date} às ${reservation.time}. Vamos confirmar em breve.`
      : `Tláloc Restaurant: reservation request received for ${reservation.date} at ${reservation.time}. We will confirm shortly.`;
    const teamBody = `New reservation v2 from ${reservation.fullName} on ${reservation.date} ${reservation.time} for ${reservation.guests} guests.`;

    const guestTo = reservation.phone.startsWith("whatsapp:")
      ? reservation.phone
      : `whatsapp:${reservation.phone}`;
    const teamTo = notifyTo.startsWith("whatsapp:")
      ? notifyTo
      : `whatsapp:${notifyTo}`;

    const [guestResponse, teamResponse] = await Promise.all([
      sendTwilioWhatsApp(guestTo, guestBody),
      sendTwilioWhatsApp(teamTo, teamBody),
    ]);
    if (!guestResponse.ok || !teamResponse.ok) {
      throw new Error("Failed to send WhatsApp message.");
    }

    return { channel: "whatsapp", sent: true };
  } catch (error) {
    return {
      channel: "whatsapp",
      sent: false,
      reason: error instanceof Error ? error.message : "Unknown WhatsApp error",
    };
  }
};
