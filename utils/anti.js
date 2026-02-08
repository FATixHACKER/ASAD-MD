const warns = new Map();

export async function antiCheck(sock, msg, text) {
  const jid = msg.key.remoteJid;
  const user = msg.key.participant;

  if (/https?:\/\//i.test(text)) {
    await sock.sendMessage(jid, { delete: msg.key });
    const w = (warns.get(user) || 0) + 1;
    warns.set(user, w);
    if (w >= 2) {
      await sock.groupParticipantsUpdate(jid, [user], "remove");
      warns.delete(user);
    }
    return true;
  }
  return false;
}
