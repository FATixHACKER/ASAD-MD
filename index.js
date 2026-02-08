import makeWASocket, {
  useMultiFileAuthState
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

  if (!sock.authState.creds.registered) {
    const code = await sock.requestPairingCode(process.env.PHONE_NUMBER);
    console.log("PAIRING CODE:", code);
  }

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;
    handleMessage(sock, msg);
  });
}

startBot();