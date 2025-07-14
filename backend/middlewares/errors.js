const ErrorHandler = require('../utils/errorHandler');
const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || 'Internal Server Error';

    // Log de l'erreur complète en développement
    if (process.env.NODE_ENV === 'DEVELOPMENT') {
        logger.error({
            message: err.message,
            statusCode: err.statusCode,
            stack: err.stack,
            path: req.originalUrl,
            method: req.method,
            ip: req.ip,
            body: req.body,
            params: req.params,
            query: req.query,
            user: req.user ? { id: req.user._id, email: req.user.email } : null
        });

        res.status(err.statusCode).json({
            success: false,
            error: err,
            errMessage: err.message,
            stack: err.stack
        });
    }

    if (process.env.NODE_ENV === 'PRODUCTION') {
        let error = { ...err };
        error.message = err.message;

        // Wrong Mongoose ID object Error
        if (err.name === 'CastError') {
            const message = `Ressource not found. Invalid ${err.path}`;
            error = new ErrorHandler(message, 400);
            logger.warn(`CastError: ${message} - Path: ${err.path} - Value: ${err.value}`);
        }

        // Handling mongoose validation Error
        if (err.name === 'ValidationError') {
            const message = Object.values(err.errors).map(value => value.message);
            error = new ErrorHandler(message, 400);
            logger.warn(`ValidationError: ${message.join(', ')}`);
        }

        // Handling Mongoose duplicate keys errors
        if (err.code === 11000) {
            const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
            error = new ErrorHandler(message, 400);
            logger.warn(`DuplicateKeyError: ${message} - Key: ${JSON.stringify(err.keyValue)}`);
        }

        // Handling wrong JWT error 
        if (err.name === 'JsonWebTokenError') {
            const message = 'JSON Web Token is invalid. Try Again!!!';
            error = new ErrorHandler(message, 400);
            logger.warn(`JWTError: Invalid token - IP: ${req.ip}`);
        }

        // Handling Expired JWT error 
        if (err.name === 'TokenExpiredError') {
            const message = 'JSON Web Token is expired. Try Again!!!';
            error = new ErrorHandler(message, 400);
            logger.warn(`JWTError: Expired token - User: ${req.user ? req.user._id : 'unknown'}`);
        }

        // Log des erreurs en production (sans stack trace)
        logger.error({
            message: error.message,
            statusCode: error.statusCode,
            path: req.originalUrl,
            method: req.method,
            ip: req.ip,
            user: req.user ? { id: req.user._id } : null,
            errorName: err.name || 'UnknownError'
        });

        res.status(error.statusCode).json({
            success: false,
            message: error.message || 'Internal Server Error'
        });
    }

    // Pour les erreurs non gérées spécifiquement
    if (!err.handled) {
        logger.error(`Unhandled error: ${err.message}`, {
            stack: process.env.NODE_ENV === 'DEVELOPMENT' ? err.stack : 'hidden',
            type: 'unhandled'
        });
    }
};