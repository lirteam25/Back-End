const TokenTransaction = require("../models/tokenTransactionModel");
const APIFeatures = require("../Utils/apiFeatures");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const { getContractEvents, createThirdwebClient, getContract, } = require("thirdweb");
const { tokensClaimedEvent } = require("thirdweb/extensions/erc1155");
const { polygonAmoy, polygon } = require("thirdweb/chains");

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

exports.getContractTransactions = catchAsync(async (req, res, next) => {
    try {
        const token_id = req.params.token_id;
        const token_address = req.params.token_address;

        const client = createThirdwebClient({
            clientId: process.env.THIRDWEB_PROJECT_ID,
        });

        const chain = process.env.ACTIVE_CHAIN == "polygon" ? polygon : polygonAmoy;

        const contract = getContract({ client, chain, address: token_address });
        console.log(contract);

        const events = await getContractEvents({
            contract: contract,
            events: [
                tokensClaimedEvent({
                    tokenId: token_id,
                })
            ],
            blockRange: 1000000
        });

        console.log(events);

        // Extract the required fields from each event and convert BigInt values to strings
        const formattedEvents = events.map(event => ({
            transactionHash: event.transactionHash,
            quantityClaimed: event.args.quantityClaimed.toString(),
            receiver: event.args.receiver
        }));

        // Send response
        res.status(200).json({
            status: "success",
            results: formattedEvents.length,
            data: {
                events: formattedEvents,
            },
        });
    } catch (error) {
        console.log(error);
    }
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

