const router = require('express').Router();
const AuthController = require('../controllers/auth');

router.post('/login', AuthController.login);

router.post('/logout', AuthController.logout);

router.post('/logoutall', AuthController.logoutAll);

router.get('/token', AuthController.getAccessToken)

module.exports = router;