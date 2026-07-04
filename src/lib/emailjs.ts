/**
 * EmailJS integration.
 * Configure via env vars (VITE_EMAILJS_*) — see .env.example.
 * Usa um ÚNICO template no EmailJS para todos os tipos de e-mail
 * (verificação, reset, boas-vindas, alerta). O conteúdo muda através
 * das variáveis passadas — configure no seu template do EmailJS:
 *   { to_email, to_name, code, message, subject }
 */
import emailjs from "@emailjs/browser";

const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined;
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined;

let initialized = false;
function ensureInit() {
  if (!PUBLIC_KEY) throw new Error("EmailJS não configurado: defina VITE_EMAILJS_PUBLIC_KEY no .env");
  if (!SERVICE_ID) throw new Error("EmailJS não configurado: defina VITE_EMAILJS_SERVICE_ID no .env");
  if (!TEMPLATE_ID) throw new Error("EmailJS não configurado: defina VITE_EMAILJS_TEMPLATE_ID no .env");
  if (!initialized) {
    emailjs.init({ publicKey: PUBLIC_KEY });
    initialized = true;
  }
}

type SendParams = Record<string, string>;

export async function sendEmail(params: SendParams) {
  ensureInit();
  return emailjs.send(SERVICE_ID!, TEMPLATE_ID!, params);
}

export const isEmailjsConfigured = () => Boolean(PUBLIC_KEY && SERVICE_ID && TEMPLATE_ID);

export const sendVerificationEmail = (to_email: string, to_name: string, code: string) =>
  sendEmail({
    to_email, to_name, code,
    subject: "Seu código de verificação",
    message: `Seu código de verificação é ${code}. Válido por 15 minutos.`,
  });

export const sendResetEmail = (to_email: string, to_name: string, code: string) =>
  sendEmail({
    to_email, to_name, code,
    subject: "Redefinição de senha",
    message: `Seu código de redefinição é ${code}. Válido por 15 minutos.`,
  });

export const sendWelcomeEmail = (to_email: string, to_name: string) =>
  sendEmail({
    to_email, to_name, code: "",
    subject: "Bem-vindo ao ESP32 Monitor",
    message: `Olá ${to_name}, sua conta foi ativada com sucesso.`,
  });

export const sendAlertEmail = (to_email: string, to_name: string, alertMessage: string) =>
  sendEmail({
    to_email, to_name, code: "",
    subject: "Alerta do dispositivo",
    message: alertMessage,
  });
