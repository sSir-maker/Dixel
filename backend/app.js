const express = require('express');
const app = express();
const cors = require("cors");

const cookieParser = require('cookie-parser')

const errorMiddleware = require('./middlewares/errors');
const requestLogger = require('./middlewares/requestLogger');

app.use(express.json());
app.use(cookieParser());

// 🔹 Ajouter CORS ici AVANT les routes
app.use(cors({
    origin: "http://localhost:5173", // Autoriser React en local
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

// For Express.js
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Import all routes
const images = require('./routes/image');
const auth = require('./routes/auth'); 


app.use('/api/v1/images', images);
app.use('/api/v1/users', auth);

app.use("/uploads", express.static("public/uploads"));





//Middleware to handler errors
app.use(errorMiddleware);
app.use(requestLogger);

module.exports = app 