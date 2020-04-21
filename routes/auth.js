const router = require('express').Router();
const jwt = require(jwt);
const { promisify } = require('util');
const request = promisify(require('request'));

router.post('/login', async (req, res, next) => {
    const userName = req.body.userName;
    const password = req.body.password;
    if (!userName || !password) {
        const error = new Error('No fields provided');
        error = 400;
        next(error);
    }
    const user = await request({
        uri: `http://localhost:3001/`,
        method: 'GET'
    });
})

module.exports = router;