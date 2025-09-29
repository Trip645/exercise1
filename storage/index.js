const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.text({ type: "*/*" }));

const LOGFILE = "/data/log.txt";
try {
  fs.mkdirSync("/data", { recursive: true });
} catch (e) {}

app.post("/log", (req, res) => {
  const text =
    typeof req.body === "string" ? req.body : JSON.stringify(req.body || "");
  fs.appendFileSync(LOGFILE, text + "\n");
  res.type("text/plain").send("OK");
});

app.get("/log", (req, res) => {
  if (!fs.existsSync(LOGFILE)) return res.type("text/plain").send("");
  const content = fs.readFileSync(LOGFILE, "utf8");
  res.type("text/plain").send(content);
});

app.listen(5001, "0.0.0.0", () => console.log("Storage listening on 5001"));
