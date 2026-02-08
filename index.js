import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys";
import P from "pino";

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session");

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" }),
    browser: ["PowerBot", "Chrome", "1.0"]
  });

  sock.ev.on("creds.update", saveCreds);

  // ❗ PAIRING CODE — ONLY ONCE
  if (!state.creds.registered) {
    try {
      const code = await sock.requestPairingCode(
        process.env.PHONE_NUMBER
      );
      console.log("🔑 PAIRING CODE:", code);
    } catch (e) {
      console.log("❌ Pairing already requested, wait...");
    }
  }

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log("✅ Bot Connected Successfully");
    }

    if (connection === "close") {
      const reason =
        lastDisconnect?.error?.output?.statusCode;

      // ❌ logged out hua to ruk jao
      if (reason === DisconnectReason.loggedOut) {
        console.log("❌ Logged out. Stop retrying.");
        return;
      }

      // 🔁 warna reconnect
      console.log("🔁 Reconnecting...");
      startBot();
    }
  });

  sock.ev.on("messages.upsert", () => {});
}

startBot();
