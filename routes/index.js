import { Router } from 'express';
const router = Router();


// View routes
router.get('/terms-and-conditions', (req, res) => res.render('terms-and-conditions'));
router.get('/privacy', (req, res) => res.render('privacy'));
router.get('/solutions', (req, res) => res.render('solutions'));
router.get('/dashboard', (req, res) => res.render('dashboard'));

router.get('/logout', (req, res) => {
    // Logic to handle logout
    // Destroy the session and redirect to home or login
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/dashboard');
        }
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});

export default router;