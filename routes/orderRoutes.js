const router = require('express').Router();
const ctrl = require('../controllers/orderController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, ctrl.createOrder);
router.get('/my-orders', protect, ctrl.getMyOrders);
module.exports = router;