const User = require('../models/user');

const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const sendToken = require('../utils/jwtToken');
const sendEmail = require('../utils/sendEmail');
const logger = require('../utils/logger');

const crypto = require('crypto');
const { send } = require('process');

// Register a user => /api/v1/register
// Register a user => /api/v1/register
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
    const { name, email, password } = req.body;

    logger.info(`Tentative d'inscription: ${email}`);

    const user = await User.create({
        name,
        email,
        password,
        avatar: {
            public_id: 'avatars/images.unsplash.com/photo-1700675654205-408570c8078c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxlZGl0b3JpYWwtZmVlZHw1MHx8fGVufDB8fHx8fA%3D%3D',
            url: 'https://images.unsplash.com/photo-1700675654205-408570c8078c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxlZGl0b3JpYWwtZmVlZHw1MHx8fGVufDB8fHx8fA%3D%3D'
        }
    });

    logger.info(`Utilisateur enregistré avec succès: ${user._id}`);
    sendToken(user, 200, res);
});

// Login User => /api/v1/login
// Login User => /api/v1/login
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
    const { email, password } = req.body;

    logger.info(`Tentative de connexion: ${email}`);

    if (!email || !password) {
        logger.warn('Tentative de connexion sans email ou mot de passe');
        return next(new ErrorHandler('Please enter email & password', 400));
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        logger.warn(`Tentative de connexion avec email inconnu: ${email}`);
        return next(new ErrorHandler('Invalid Email or Password', 401));
    }

    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
        logger.warn(`Mot de passe incorrect pour l'utilisateur: ${email}`);
        return next(new ErrorHandler('Invalid Email or Password', 401));
    }

    logger.info(`Connexion réussie pour l'utilisateur: ${user._id}`);
    sendToken(user, 200, res);
});

// Forgot Password  =>  /api/v1/password/forgot
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
    const { email } = req.body;
    logger.info(`Demande de réinitialisation de mot de passe pour: ${email}`);

    const user = await User.findOne({ email });

    if (!user) {
        logger.warn(`Demande de réinitialisation pour email inconnu: ${email}`);
        return next(new ErrorHandler('User not found with this email', 404));
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/password/reset/${resetToken}`;
    const message = `Your password reset token is as follow:\n\n${resetUrl}\n\nIf you have not requested this email, then ignore it.`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Impact_event Password Recovery',
            message
        });

        logger.info(`Email de réinitialisation envoyé à: ${user.email}`);
        res.status(200).json({
            success: true,
            message: `Email sent to ${user.email}`
        });
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });

        logger.error(`Erreur lors de l'envoi de l'email de réinitialisation: ${error.message}`);
        return next(new ErrorHandler(error.message, 500));
    }
});

// Reset Password  =>  /api/v1/password/reset/:token
exports.resetPassword = catchAsyncErrors(async (req, res, next)=>{

    // Hash URL token 
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');


    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    })

    if (!user) {
       return next(new ErrorHandler('Password reset token is invalid or has been expired', 400)
       ) 
    }

    if (req.body.password !== req.body.confirmPassword) {
        return next(new ErrorHandler('Password does not match', 400))
    }

    // Setup new password
    user.password = req.body.password;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save()

    sendToken(user, 200, res)

})

// Get currently logged in user details  =>  /api/v1/me
exports.getUserProfile = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        user
    })
})

// Update / Change password  =>  /api/v1/password/update
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password');

    // Check previous user password
    const isMatched = await user.comparePassword(req.body.oldPassword)
    if (!isMatched) {
        return next(new ErrorHandler('Old password is incorrect'));
    }

    user.password = req.body.password;
    await user.save();

    sendToken(user, 200, res)

})

// Update user profile  =>  /api/v1/me/update 
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
    }

    // Update avatar: TODO

    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    })

    res.status(200).json({
        success: true 
    })
})

// Logout user => /api/v1/logout
exports.logout = catchAsyncErrors(async (req, res, next) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({
            success: false,
            message: "Utilisateur non authentifié"
        });
    }

    logger.info(`Déconnexion de l'utilisateur: ${req.user.id}`);

    res.cookie('token', '', {
        httpOnly: true,
        secure: true, // important si HTTPS
        sameSite: 'Lax', // ou 'Strict'
        expires: new Date(0),
        path: '/',
    });

    res.status(200).json({
        success: true,
        message: 'Logged out'
    });
});


// Admin Routes 


// Get all users  =>  /api/v1/admin/users
exports.allUsers = catchAsyncErrors( async (req, res , next) => {
    const users = await User.find();

    res.status(200).json({
        success: true,
        users
    })
})

// Get user details  =>  /api/v1/admin/user/:id 
exports.getUserDetails = catchAsyncErrors( async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new ErrorHandler(`User does not found with id: ${req.params.id}`))
    }

    res.status(200).json({
        success: true,
        user
    })
})


// Update user profile  =>  /api/v1/admin/user/:id 
exports.updateUser = catchAsyncErrors(async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role
    }

    const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    })

    res.status(200).json({
        success: true 
    })
})


// Delete user  =>  /api/v1/admin/user/:id
exports.deleteUser = catchAsyncErrors( async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new ErrorHandler(`User does not found with id: ${req.params.id}`))
    }

    // Remove avatar from cloudinary -TODO
    await user.deleteOne();

    res.status(200).json({
        success: true,
    })
})
