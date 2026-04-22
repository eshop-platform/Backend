const router = require('express').Router();
// const { protect } = require('../middlewares/authMiddleware');
const { upload } = require('../utils/cloudinary');
const ctrl = require('../controllers/productController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');
router.get('/', ctrl.getAllProducts);
router.post('/', protect, upload.fields([
  { name: 'frontView', maxCount: 1 }, 
  { name: 'backView', maxCount: 1 }, 
  { name: 'sideView', maxCount: 1 }
]), ctrl.postProduct);
router.put('/:id', protect, ctrl.updateProduct);
router.post('/:id/rate', protect, ctrl.rateProduct);
router.patch('/:id/review', protect, adminOnly, ctrl.reviewProduct);
router.get('/:id', ctrl.getSingleProduct);
router.get('/my-products', protect, ctrl.getMyProducts);
router.delete('/:id', protect, ctrl.deleteProduct);
router.delete('/:id/cancel', protect, ctrl.cancelProduct);
module.exports = router;