const express = require("express");
const fs = require("fs");
const os = require("os");
const { execSync } = require("child_process");

const app = express();
app.use(express.text({ type: "*/*" }));

function isoNow() {
  // ISO8601 UTC without milliseconds: 2025-09-03T12:06:18Z
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}
function uptimeHours() {
  const h = os.uptime() / 3600;
  return Number.isInteger(h) ? String(h) : h.toFixed(2);
}
function freeDiskMB() {
  try {
    // use df -BM to get free in megabytes
    const out = execSync("df -BM / | tail -1 | awk '{print $4}'")
      .toString()
      .trim();
    return out.replace(/M$/, "");
  } catch (e) {
    return "unknown";
  }
}

function makeRecord() {
  return `Timestamp1: ${isoNow()}: uptime ${uptimeHours()} hours, free disk in root: ${freeDiskMB()} MBytes`;
}

// GET /status: do local record -> storage -> vStorage -> forward to service2 -> return combined
app.get("/status", async (req, res) => {
  const record1 = makeRecord();

  // ensure vstorage dir exists
  try {
    fs.mkdirSync("/vstorage", { recursive: true });
  } catch (e) {}

  // 2) POST to Storage
  try {
    await fetch("http://storage:5001/log", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: record1,
    });
  } catch (e) {
    console.error("Service1: POST to storage failed:", e.message);
    // continue: we still write to vstorage and attempt service2
  }

  // 3) append to vStorage
  try {
    fs.appendFileSync("/vstorage/log.txt", record1 + "\n");
  } catch (e) {
    console.error("Service1: append vStorage failed:", e.message);
  }

  // 4) forward to Service2
  let record2 = "";
  try {
    const r = await fetch("http://service2:5000/status");
    record2 = await r.text();
  } catch (e) {
    console.error("Service1: failed to fetch service2 status:", e.message);
    return res.status(502).type("text/plain").send("Service2 unreachable");
  }

  // 9) return combined (record1\nrecord2)
  res.type("text/plain").send(record1 + "\n" + record2);
});

// GET /log: forward to Storage GET /log and return
app.get("/log", async (req, res) => {
  try {
    const r = await fetch("http://storage:5001/log");
    const text = await r.text();
    res.type("text/plain").send(text);
  } catch (e) {
    console.error("Service1: GET /log -> storage failed:", e.message);
    res.status(502).send("Storage unreachable");
  }
});

// Optionally also accept POST /log (teacher tests might use), forward to Storage and append to vStorage
app.post("/log", async (req, res) => {
  const body =
    typeof req.body === "string" ? req.body : JSON.stringify(req.body || "");
  const entry = `${isoNow()}: POST /log body => ${body}`;

  try {
    fs.mkdirSync("/vstorage", { recursive: true });
  } catch (e) {}
  try {
    fs.appendFileSync("/vstorage/log.txt", entry + "\n");
  } catch (e) {
    console.error(e.message);
  }

  try {
    await fetch("http://storage:5001/log", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: entry,
    });
    res.type("text/plain").send("Forwarded to storage");
  } catch (e) {
    console.error("Service1: POST /log -> storage failed:", e.message);
    res.status(502).send("Storage unreachable");
  }
});

app.listen(8080, "0.0.0.0", () => console.log("Service1 listening on 8080"));
