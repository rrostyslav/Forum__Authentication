'use strict';
const express = require('express');
const bodyparser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const dbPool = require('./middleware/dbConnectionPool');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const AuthRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyparser.json());
app.use(morgan('dev'));
app.use(dbPool);

app.use('/', AuthRoutes);

app.use((error, req, res, next) => {
  res.status(200).json({
    success: false,
    message: error.message
  });
})

app.listen(PORT, () => {
  console.log('Microservice: Authentication. Running on port:', PORT)
})

module.exports = app;