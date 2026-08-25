const router = require('express').Router();
const { authenticated, administrator } = require('../middlewares/authMiddleware');
const { listUsers, deleteUser } = require('../controllers/adminController');
const { listContacts, deleteContact } = require('../controllers/contactController');
const { createDestination, updateDestination, deleteDestination } = require('../controllers/destinationController');
const { listReservations, cancelAdminReservation } = require('../controllers/reservationController');

router.use(authenticated, administrator);
router.get('/users', listUsers);
router.delete('/users/:id', deleteUser);
router.get('/contacts', listContacts);
router.delete('/contacts/:id', deleteContact);
router.post('/destinations', createDestination);
router.put('/destinations/:id', updateDestination);
router.delete('/destinations/:id', deleteDestination);
router.get('/reservations', listReservations);
router.delete('/reservations/:id', cancelAdminReservation);

module.exports = router;
