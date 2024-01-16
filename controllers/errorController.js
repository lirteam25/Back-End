const AppError = require("../Utils/appError");

const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        error: err,
        stack: err.stack,
    })
};

const sendErrorPro = (err, res) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            codeName: err.codeName
        })
    } else {
        res.status(500).json({
            status: "error",
            message: "Something went wrong",
        })
    }
};

const handleCastError = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
};

const handleDuplicateFields = (err) => {
    const message = `Duplicate field value. Please use another value`;
    return new AppError(message, 400);
};

const handleValidationError = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data. ${errors.join(". ")}`;
    return new AppError(message, 400);
}

module.exports = (err, req, res, next) => {

    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";

    if (process.env.NODE_ENV === "development") {
        if (err.name == "ValidationError") {
            err = handleValidationError(err);
        };
        if (err.name == "CastError") {
            err = handleCastError(err);
        }
        if (err.code == 11000) {
            err = handleDuplicateFields(err);
        }
        sendErrorDev(err, res);
    } else if (process.env.NODE_ENV === "production") {
        if (err.name == "CastError") {
            err = handleCastError(err);
        };
        if (err.code == 11000) {
            err = handleDuplicateFields(err);
        };
        if (err.name == "ValidationError") {
            err = handleValidationError(err);
        };
        sendErrorPro(err, res);
    }
    next();
};