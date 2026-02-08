import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys";
import P from "pino";

let pairingRequested = false; // 🔒 LOCK

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session");

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" }),
    browser: ["PowerBot", "Chrome", "1.0"]
  });

  sock.ev.on("creds.update", saveCreds);

  // 🔑 PAIRING — ONLY ONCE (NO LOOP)
  if (!state.creds.registered && !pairingRequested) {
    pairingRequested = true;
    try {
      const code = await sock.requestPairingCode(
        process.env.PHONE_NUMBER
      );
      console.log("🔑 PAIRING CODE:", code);
    } catch (e) {
      console.log("❌ Pairing request failed, wait...");
    }
  }

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log("✅ Bot Connected Successfully");
    }

    if (connection === "close") {
      const reason =
        lastDisconnect?.error?.output?.statusCode;

      // ❌ LOGGED OUT → STOP COMPLETELY
      if (reason === DisconnectReason.loggedOut) {
        console.log("❌ Logged out. Delete session & restart.");
        return;
      }

      // ⛔ pairing pending hai → reconnect mat karo
      if (!state.creds.registered) {
        console.log("⏳ Waiting for pairing to complete...");
        return;
      }

      console.log("🔁 Reconnecting...");
      startBot();
    }
  });

  sock.ev.on("messages.upsert", () => {});
}

startBot();
