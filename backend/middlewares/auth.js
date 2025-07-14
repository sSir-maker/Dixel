const User = require('../models/user');

const jwt = require("jsonwebtoken");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("./catchAsyncErrors");

// Checks if user is authenticate or not 
exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => { 
    let token;

    // Vérifie d'abord le cookie
    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }
    // Puis l'en-tête Authorization: Bearer <token>
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new ErrorHandler('Login first to access this ressource.', 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    next();
});


// Handling users roles 
exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
            new ErrorHandler(`Role (${req.user.role}) is not allowed to access this ressource`,
            403))
        }
        next()
    }
}