const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const { 
    generateAccessKey, 
    revokeAccessKeys 
} = require('../utils/imageAccess');

exports.generateAccessKey = catchAsyncErrors(async (req, res, next) => {
    const { imageId } = req.params;
    const userId = req.user._id;
    const { expiresIn, permissions } = req.body;

    const { token, expiresAt } = await generateAccessKey(
        imageId,
        userId,
        { expiresIn, permissions }
    );

    res.status(201).json({
        success: true,
        token,
        expiresAt,
        imageId
    });
});

exports.revokeAccessKeys = catchAsyncErrors(async (req, res, next) => {
    const { imageId } = req.params;
    const userId = req.user._id;

    await revokeAccessKeys(imageId, userId);

    res.status(200).json({
        success: true,
        message: 'Tous les accès ont été révoqués'
    });
});