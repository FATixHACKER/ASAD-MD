import settings from "../config/settings.js";
import messages from "../config/messages.js";
import owner from "../config/owner.js";
import queue from "../utils/queue.js";
import { antiCheck } from "../utils/anti.js";
import fs from "fs";
import { exec } from "child_process";

export async function handleMessage(sock, msg) {
  const jid = msg.key.remoteJid;
  const sender = msg.key.participant || msg.key.remoteJid;
  const text =
    msg.message.conversation ||
    msg.message.extendedTextMessage?.text ||
    "";

  const isGroup = jid.endsWith("@g.us");
  const isOwner = sender.includes(owner);

  // 🛡️ Anti system
  if (isGroup) {
    const blocked = await antiCheck(sock, msg, text);
    if (blocked) return;
  }

  // 📜 MENU (IMAGE + TEXT)
  if (text === ".menu") {
    return sock.sendMessage(jid, {
      image: fs.readFileSync(
        new URL("../media/menu.jpg", import.meta.url)
      ),
      caption: messages.menu
    });
  }

  // CORE
  if (text === ".alive")
    return sock.sendMessage(jid, { text: "🤖 Bot Alive & Stable ✅" });

  if (text === ".ping")
    return sock.sendMessage(jid, { text: "🏓 Pong" });

  if (text === ".botinfo")
    return sock.sendMessage(jid, { text: "Power Bot | Mode Based" });

  if (text === ".owner")
    return sock.sendMessage(jid, { text: "👑 Owner: JANI" });

  // MODE CONTROL
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

  // 🔊 TTS COMMAND
  if (text.startsWith(".tts")) {
    const t = text.replace(".tts", "").trim();
    if (!t)
      return sock.sendMessage(jid, {
        text: "Use: .tts your text"
      });

    const file = "./tts.mp3";
    exec(`gtts-cli "${t}" --output ${file}`, async () => {
      await sock.sendMessage(jid, {
        audio: fs.readFileSync(file),
        mimetype: "audio/mpeg",
        ptt: true
      });
      fs.unlinkSync(file);
    });
  }
}
