const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/productController');
const auth = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);

router.post('/', auth, role('admin'), [
  body('name').trim().notEmpty().withMessage('Nama produk wajib diisi'),
  body('brand').trim().notEmpty().withMessage('Brand wajib diisi'),
  body('price').isFloat({ gt: 0 }).withMessage('Harga harus lebih dari 0'),
  body('stock').isInt({ min: 0 }).withMessage('Stok tidak boleh negatif'),
], ctrl.create);

router.put('/:id', auth, role('admin'), ctrl.update);
router.delete('/:id', auth, role('admin'), ctrl.remove);

module.exports = router;