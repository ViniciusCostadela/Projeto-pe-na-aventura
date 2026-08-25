const router = require('express').Router();
const { register, login, logout, me } = require('../controllers/authController');
const { authenticated } = require('../middlewares/authMiddleware');
const { limitAuthentication } = require('../middlewares/rateLimitMiddleware');

router.post('/register', limitAuthentication, register);
router.post('/login', limitAuthentication, login);
router.post('/logout', logout);
router.get('/me', authenticated, me);

module.exports = router;
