import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys";
import P from "pino";
import { handleMessage } from "./handlers/message.js";

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session");

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" }),
    browser: ["PowerBot", "Chrome", "1.0"]
  });

  sock.ev.on("creds.update", saveCreds);

  // 🔥 QR HANDLE PROPER WAY
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("📱 Scan this QR code:\n");
      console.log(qr);
    }

    if (connection === "open") {
      console.log("✅ Bot Connected Successfully");
    }

    if (
      connection === "close" &&
      lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut
    ) {
      console.log("🔁 Reconnecting...");
      startBot();
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;
    await handleMessage(sock, msg);
  });
}

startBot();
