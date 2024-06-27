import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import session from 'express-session';
import indexRoutes from './routes/index.js';

// Load environment variables from .env file
dotenv.config();

// Resolve __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Views directory path:', path.join(__dirname, 'views'));

const app = express();
const PORT = process.env.PORT || 3000;

// Set 'views' directory for any views
app.set('views', path.join(__dirname, 'views'));
// Set view engine to 'ejs'
app.set('view engine', 'ejs');

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Session management
app.use(session({
    secret: process.env.SESSION_SECRET, // Use a strong secret key in production
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using https
}));

// Define a route to render the index.ejs view
app.get('/', (req, res) => {
    res.render('index');
});

// Routes setup
app.use('/', indexRoutes);

// Error-handling middleware
app.use((req, res, next) => {
    res.status(404).render('404', { url: req.originalUrl });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('500', { error: err });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
