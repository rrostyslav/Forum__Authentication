const express = require('express');
const bodyparser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const dbPool = require('./middleware/dbConnectionPool');

const AuthRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(bodyparser.json());
app.use(morgan('dev'));
app.use(dbPool);

app.use('/', AuthRoutes);

app.use((req, res, next) => {
    const error = new Error('Not found');
    error.status = 404;
    next(error);
});

app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        }
    });
});

app.listen(PORT, () => {
    console.log('Microservice: Authentication. Running on port:', PORT)
})