const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const axios = require('axios');

router.post('/login', async (req, res, next) => {
    const userName = req.body.username;
    const password = req.body.password;
    if (!userName || !password) {
        const error = new Error('No fields provided');
        error.status = 400;
        return next(error);
    }
    try {
        const response = await axios({
            url: `${process.env.PROFILES_SERVICE}/${userName}`,
            method: 'GET',
            json: true
        });
        const user = response.data;
        const isEqual = await bcrypt.compare(password, user.password);
        if (!isEqual) {
            const error = new Error('Invalid password');
            error.status = 403;
            return next(error);
        }
        const access_token = jwt.sign({
            id: user.id,
            userName: user.user_name,
            role: user.role_id,
            banned: user.banned
        }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '40m' });
        const refresh_token = jwt.sign({
            userName: user.user_name
        }, process.env.REFRESH_TOKEN_SECRET);
        await req.con.execute("INSERT INTO sessions VALUES(null, ?, ?)", [refresh_token, user.user_name]);
        res.status(200).json({
            access_token,
            refresh_token
        });
    } catch (err) {
        console.log(err);
        res.sendStatus(err.response.status);
    }
});

router.post('/logout', async (req, res, next) => {
    const refreshToken = req.body.refresh_token;
    if (!refreshToken) {
        const error = new Error('No params');
        error.status = 400;
        return next(error);
    }
    try {
        await req.con.execute("DELETE FROM sessions WHERE refresh_token=?", [refreshToken]);
        res.status(200).json({
            message: "Logged out"
        });
    } catch (err) {
        console.log(err);
        next(new Error('Failed to logout'));
    }
});

router.post('/logoutall', async (req, res, next) => {
    const userName = req.body.userName;
    if (!userName) {
        const error = new Error('No params');
        error.status = 400;
        return next(error);
    }
    try {
        await req.con.execute("DELETE FROM sessions WHERE user_name=?", [userName]);
        res.status(200).json({
            message: "Logged out on all devices!"
        });
    } catch (err) {
        console.log(err);
        next(new Error('Failed to logout all devices'));
    }
});

router.get('/token', async (req, res, next) => {
    const refreshToken = req.body.refresh_token;
    if (!refreshToken) {
        const error = new Error('No params');
        error.status = 400;
        return next(error);
    }
    try {
        const rtDecoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        if (!rtDecoded) {
            const error = new Error('Bad refresh token');
            error.status = 403;
            throw next(error)
        }
        const [session] = await req.con.execute("SELECT * FROM sessions WHERE refresh_token=?", [refreshToken]);
        if (session.length === 0) {
            const error = new Error('Bad refresh token');
            error.status = 400;
            return next(error);
        }
        const response = await axios({
            url: `${process.env.PROFILES_SERVICE}/${rtDecoded.userName}`,
            method: 'GET',
            json: true
        });
        const user = response.data;
        const access_token = jwt.sign({
            id: user.id,
            userName: user.user_name,
            role: user.role_id,
            banned: user.banned
        }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '40m' });
        res.json({
            access_token
        });
    } catch (err) {
        next(err);
    }
})

module.exports = router;