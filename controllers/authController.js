const User = require("./../models/userModel");
const catchAsync = require("./../Utils/catchAsync");
const AppError = require("./../Utils/appError");
const admin = require('firebase-admin');

//Verify Firebase Token
exports.verifyTokenFirebase = catchAsync(async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const idToken = authHeader.split(" ")[1];
        admin
            .auth()
            .verifyIdToken(idToken)
            .then(async function (decodedToken) {
                const uid = decodedToken.uid;
                req.user = { "uid": uid };
                next();
            })
            .catch(function (error) {
                let code = error.code;
                code = code.replace('auth/', '').replaceAll('-', ' ');
                return next(new AppError(`Firebase ID token: ${code}. Please log in again`, 401));
            });
    } else {
        return next(new AppError("No Firebase ID token sent in the request header", 400));
    }
});

exports.restricTo = (...roles) => {
    return async (req, res, next) => {
        const user = await User.findOne(req.user);
        if (!roles.includes(user.role)) {
            return next(new AppError("You have no rights to access this resource", 403))
        };
        next();
    }
};
