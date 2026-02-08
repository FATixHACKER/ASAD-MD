import settings from "../config/settings.js";
import messages from "../config/messages.js";
import owner from "../config/owner.js";
import queue from "../utils/queue.js";
import { antiCheck } from "../utils/anti.js";
import fs from "fs";

export async function handleMessage(sock, msg) {
  const jid = msg.key.remoteJid;
  const sender = msg.key.participant || msg.key.remoteJid;
  const text =
    msg.message.conversation ||
    msg.message.extendedTextMessage?.text ||
    "";

  const isGroup = jid.endsWith("@g.us");
  const isOwner = sender.includes(owner);

  // 🛡️ ANTI SYSTEM
  if (isGroup) {
    const blocked = await antiCheck(sock, msg, text);
    if (blocked) return;
  }

  // 📜 MENU (IMAGE + TEXT)
  if (text === ".menu") {
    return sock.sendMessage(jid, {
      image: fs.readFileSync("./media/menu.jpg"),
      caption: messages.menuText
    });
  }

  // CORE
  if (text === ".alive")
    return sock.sendMessage(jid, { text: "🤖 Power Bot Alive ✅" });

  if (text === ".ping")
    return sock.sendMessage(jid, { text: "🏓 Pong" });

  if (text === ".botinfo")
    return sock.sendMessage(jid, { text: "Power Bot | Mode Based" });

  if (text === ".owner")
    return sock.sendMessage(jid, { text: "👑 Owner: JANI" });

  // MODE CONTROL (OWNER)
  if (isOwner && text === ".mode status")
    return sock.sendMessage(jid, {
      text: JSON.stringify(settings.mode, null, 2)
    });

  if (isOwner && text === ".mode download on") {
    settings.mode.download = true;
    return sock.sendMessage(jid, { text: "✅ Download ON" });
  }

  if (isOwner && text === ".mode download off") {
    settings.mode.download = false;
    return sock.sendMessage(jid, { text: "⛔ Download OFF" });
  }

  // GROUP
  if (settings.mode.group && text.startsWith(".kick"))
    return sock.sendMessage(jid, { text: "👢 Kick ready" });

  if (settings.mode.group && text === ".tagall")
    return sock.sendMessage(jid, { text: "📢 Tagall executed" });

  // TOOLS
  if (settings.mode.tools && text.startsWith(".calc"))
    return sock.sendMessage(jid, { text: "🧮 Calculator ready" });

  if (settings.mode.tools && text === ".qr")
    return sock.sendMessage(jid, { text: "📷 QR generator ready" });

  // DOWNLOAD (CONTROLLED)
  if (text.startsWith(".ytmp3")) {
    if (!settings.mode.download)
      return sock.sendMessage(jid, {
        text: "⛔ Download OFF (admin only)"
      });

    return queue(async () => {
      await sock.sendMessage(jid, {
        text: "⬇️ YTMP3 processing..."
      });
    });
  }
}
