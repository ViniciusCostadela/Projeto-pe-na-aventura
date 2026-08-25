const router = require('express').Router();
const { createContact } = require('../controllers/contactController');
const { listDestinations } = require('../controllers/destinationController');
const { createReservation, listMyReservations, cancelMyReservation } = require('../controllers/reservationController');
const { authenticated } = require('../middlewares/authMiddleware');

router.get('/health', (request, response) => response.json({ status: 'ok' }));

router.get('/destinations', listDestinations);
router.post('/contacts', createContact);
router.post('/reservations', authenticated, createReservation);
router.get('/reservations/me', authenticated, listMyReservations);
router.delete('/reservations/me/:id', authenticated, cancelMyReservation);

module.exports = router;
