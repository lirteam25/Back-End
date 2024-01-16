const TokenTransaction = require("../models/tokenTransactionModel");
const APIFeatures = require("../Utils/apiFeatures");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");

exports.getAllTransactions = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(TokenTransaction.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .pagination();
    const transactions = await features.query;
    //Send response
    res.status(200).json({
        status: "success",
        results: transactions.length,
        data: {
            transactions,
        },
    });
});

exports.createNFTTransactionRecords = catchAsync(async (req, res, next) => {
    const newNFTtransaction = await TokenTransaction.create(req.body);
    res.status(201).json({
        status: "success",
        data: {
            transaction: newNFTtransaction
        }
    });
});

exports.addTransaction = catchAsync(async (req, res, next) => {
    const NFTtransactionUpdated = await TokenTransaction.findOneAndUpdate({ "token_id": req.body.token_id, "token_address": req.body.token_address },
        {
            $push: {
                "transactions": req.body.transactions,
                "transactions_type": req.body.transactions_type,
                "price": req.body.price,
                "quantity": req.body.quantity,
                "date": Date.now()
            }
        });
    if (!NFTtransactionUpdated) {
        return next(new AppError("No transaction record found with that token ID and address", 400))
    };
    res.status(200).json({
        status: "success",
        data: {
            NFTtransactionUpdated,
        },
    });
});

