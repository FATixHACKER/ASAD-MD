let busy = false;
const q = [];

export default function queue(task) {
  q.push(task);
  run();
}

async function run() {
  if (busy) return;
  busy = true;
  while (q.length) {
    await q.shift()();
  }
  busy = false;
}