const router = require('express').Router();
const ctrl = require('../controllers/categoryController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

router.get('/', ctrl.getAllCategories);
router.post('/', protect, adminOnly, ctrl.createCategory);

module.exports = router;