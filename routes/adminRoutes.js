const router = require('express').Router();
const { protect, adminOnly } = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/adminController');

router.get('/users', protect, adminOnly, ctrl.getAllUsers);
router.patch('/users/:id/block', protect, adminOnly, ctrl.toggleUserBlock);
router.get('/income', protect, adminOnly, ctrl.getDailyIncome);
router.patch('/orders/:id/verify', protect, adminOnly, ctrl.verifyOrder);
router.patch('/orders/:id/delivery', protect, adminOnly, ctrl.updateDelivery);
module.exports = router;