import dotenv from "dotenv";
dotenv.config(); // Ensure this is at the very top

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import indexRoutes from "./routes/index.js";
import fs from "fs";
import rateLimit from "express-rate-limit"; // Import express-rate-limit

// Resolve __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.set("trust proxy", 1);

// Set 'views' directory for any views
app.set("views", path.join(__dirname, "views"));
// Set view engine to 'ejs'
app.set("view engine", "ejs");

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Middleware to parse request bodies
app.use(express.urlencoded({ extended: false }));

function getClientIp(req) {
  // Cloudflare provides the original client IP in the 'cf-connecting-ip' header
  const clientIp =
    req.headers["cf-connecting-ip"] || req.headers["x-forwarded-for"];
  if (clientIp) {
    return clientIp.split(",")[0].trim();
  }
  return req.connection.remoteAddress;
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 12, // Limit each IP to 12 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next) => {
    const clientIp = req.ip;

    // Append the blocked IP to a log file
    const logMessage = `[${new Date().toISOString()}] - Rate limit exceeded for IP: ${clientIp}\n`;
    fs.appendFile(
      path.join(__dirname, "rate-limit-logs.txt"),
      logMessage,
      (err) => {
        if (err) {
          console.error("Error logging rate limit violation:", err);
        } else {
          console.log(`Rate limit violation logged for IP: ${clientIp}`);
        }
      }
    );

    // Send response
    res
      .status(429)
      .send("Too many requests from this IP, please try again later.");
  },
});

app.use(limiter);

// Session management
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Use a strong secret key in production
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true },
  })
);

// Define a route to render the index.ejs view
app.get("/", (req, res) => {
  res.render("index");
});

// Routes setup
app.use("/", indexRoutes);

// Error-handling middleware
app.use((req, res, next) => {
  res.status(404).render("404", { url: req.originalUrl });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render("500", { error: err });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
