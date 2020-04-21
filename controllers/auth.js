const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { promisify } = require('util');
const request = promisify(require('request'));

exports.login = async (req, res, next) => {
    const userName = req.body.userName;
    const password = req.body.password;
    const fingerPrint = req.body.fingerPrint;
    if (!userName || !password || !fingerPrint) {
        const error = new Error('No fields provided');
        error.status = 400;
        return next(error);
    }
    try {
        const userRequest = await request({
            uri: `http://localhost:3002/${userName}`,
            method: 'GET'
        });
        if (userRequest.statusCode !== 200) {
            const error = new Error('No user');
            error.status = 400;
            return next(error);
        }
        const user = JSON.parse(userRequest.body);
        const isEqual = await bcrypt.compare(password, user.password);
        if (!isEqual) {
            const error = new Error('Invalid username or password');
            error.status = 400;
            return next(error);
        }
        const access_token = jwt.sign({ userName: user.user_name }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30m' });
        const refresh_token = jwt.sign({ userName: user.user_name }, process.env.REFRESH_TOKEN_SECRET);
        await req.con.execute("INSERT INTO sessions VALUES(null, ?, ?, ?)", [refresh_token, fingerPrint, user.user_name]);
        res.status(200).json({
            access_token,
            refresh_token
        });
    } catch (err) {
        console.log(err);
        next(new Error('Falied to login'))
    }
};

exports.logout = async (req, res, next) => {
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
};

exports.logoutAll = async (req, res, next) => {
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
};

exports.getAccessToken = async (req, res, next) => {
    const refreshToken = req.body.refresh_token;
    const fingerPrint = req.body.fingerPrint;
    if (!refreshToken || !fingerPrint) {
        const error = new Error('No params');
        error.status = 400;
        return next(error);
    }
    try {
        const session = await req.con.execute("SELECT * FROM sessions WHERE refresh_token=?", [refreshToken]);
        if (session[0].length === 0) {
            const error = new Error('Bad refresh token');
            error.status = 400;
            return next(error);
        }
        let rtDecoded;
        try {
            rtDecoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        } catch (err) {
            console.log(err);
            const error = new Error('Bad refresh token');
            error.status = 403;
            return next(error)
        }
        if (session[0][0].fingerprint !== fingerPrint) {
            await req.con.execute("DELETE FROM sessions WHERE refresh_token=?", [refreshToken]);
            const error = new Error('Bye bye hacker <3');
            error.status = 406;
            return next(error);
        }
        const access_token = jwt.sign({ userName: rtDecoded.userName }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30m' });
        res.json({
            access_token
        });
    } catch (err) {
        console.log(err);
        next(new Error('Failed to get token'));
    }
};