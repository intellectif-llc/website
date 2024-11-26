import dotenv from "dotenv";
dotenv.config(); // Ensure this is at the very top

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import indexRoutes from "./routes/index.js";
import rateLimit from "express-rate-limit"; // Import express-rate-limit

// Resolve __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Views directory path:", path.join(__dirname, "views"));

const app = express();
const PORT = process.env.PORT || 3000;

// Set 'views' directory for any views
app.set("views", path.join(__dirname, "views"));
// Set view engine to 'ejs'
app.set("view engine", "ejs");

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Middleware to parse request bodies
app.use(express.urlencoded({ extended: false }));

// Session management
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Use a strong secret key in production
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use(limiter);

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
