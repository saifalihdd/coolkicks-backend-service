const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/authController');
const auth = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Nama wajib diisi'),
  body('email').isEmail().withMessage('Email tidak valid'),
  body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
], ctrl.register);

router.post('/login', [
  body('email').isEmail().withMessage('Email tidak valid'),
  body('password').notEmpty().withMessage('Password wajib diisi'),
], ctrl.login);

router.get('/profile', auth, ctrl.profile);
router.get('/users', auth, role('admin'), ctrl.getAllUsers);
router.delete('/users/:id', auth, role('admin'), ctrl.deleteUser);

module.exports = router;