/**
 * إشعار المالك بتيليجرام عند كل طلب جديد.
 * الإعدادات المخزنة في قاعدة البيانات تتقدم على متغيرات البيئة.
 * لا يفشل ولا يبطئ إتمام الطلب أبداً: أي خطأ يُبتلع.
 */
import { getSetting } from "./settings";

export function telegramConfig(): { token: string; chatId: string } {
  return {
    token: getSetting("telegram_bot_token") || process.env.TELEGRAM_BOT_TOKEN || "",
    chatId: getSetting("telegram_chat_id") || process.env.TELEGRAM_CHAT_ID || "",
  };
}

export async function sendTelegram(text: string): Promise<boolean> {
  const { token, chatId } = telegramConfig();
  if (!token || !chatId) return false;
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(5000),
    });
    return r.ok;
  } catch {
    return false;
  }
}
