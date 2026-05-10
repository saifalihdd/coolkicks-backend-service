const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/orderController');
const auth = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');

router.get('/', auth, role('admin'), ctrl.getAll);
router.get('/my', auth, ctrl.getMy);

router.post('/', auth, role('customer'), [
  body('product_id').isInt({ gt: 0 }).withMessage('product_id tidak valid'),
  body('quantity').isInt({ gt: 0 }).withMessage('Quantity harus lebih dari 0'),
], ctrl.create);

router.put('/:id/cancel', auth, role('customer'), ctrl.cancel);
router.put('/:id/status', auth, role('admin'), ctrl.updateStatus);

module.exports = router;