const User = require("./../models/userModel");
const TokenInfo = require("../models/tokenInfoModel");
const TopCollector = require('../models/topCollectorModel');
const catchAsync = require("./../Utils/catchAsync");
const AppError = require("./../Utils/appError");
const APIFeatures = require("../Utils/apiFeatures");
const admin = require('firebase-admin');
const { Alchemy, Network } = require("alchemy-sdk");
const { createThirdwebClient, getContract, readContract, resolveMethod } = require("thirdweb");
const { getActiveClaimCondition } = require("thirdweb/extensions/erc1155");
const { polygonAmoy, polygon } = require("thirdweb/chains");
const { ethers } = require("ethers");
const PriorityQueue = require('js-priority-queue');
const async = require('async');

const alchemyNetwork = process.env.ALCHEMY_NETWORK == "MATIC_MAINNET" ? Network.MATIC_MAINNET : Network.MATIC_AMOY;
const apiKey = process.env.ALCHEMY_NETWORK == "MATIC_MAINNET" ? process.env.ALCHEMY_API_KEY : process.env.ALCHEMY_API_KEY_TEST
const config = {
    apiKey: apiKey,
    network: alchemyNetwork,
};
const alchemy = new Alchemy(config);


exports.getMe = catchAsync(async (req, res, next) => {
    const user = await User.findOne(req.user);
    if (!user) {
        return next(new AppError("No User found with that email", 400))
    }
    res.status(200).json({
        status: "success",
        data: {
            user,
        },
    })
});

exports.updateMe = catchAsync(async (req, res, next) => {
    const user = await User.findOne(req.user);
    if (!user) {
        return next(new AppError("No User found", 400))
    }
    /* if (req.body.wallet == "undefined") {
        await User.findOneAndUpdate(req.user, {
            $unset: {
                "wallet": ""
            }
        }, {
            runValidators: true,
        }); */
    await User.findOneAndUpdate(req.user, req.body, {
        //remove the previous data and create the new one
        new: true,
        runValidators: true,
    });
    const userUpdated = await User.findOne(req.user);
    //Send response
    res.status(200).json({
        status: "success",
        data: {
            userUpdated,
        },
    });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
    const user = await User.findOneAndDelete(req.user);
    if (!user) {
        return next(new AppError("No User found with that email", 400))
    }
    res.status(204).json({
        status: "success",
        data: null,
    });
});

exports.getAllUsers = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(User.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .pagination();
    const user = await features.query;
    //Send response
    res.status(200).json({
        status: "success",
        data: {
            user,
        },
    });
});

exports.getSingleUser = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return next(new AppError("No User found with that ID", 404))
    }
    res.status(200).json({
        status: "success",
        data: {
            user,
        },
    })
});

exports.createUser = catchAsync(async (req, res) => {
    if (req.body.uid) {
        const existingUser = await User.findOne({ uid: req.body.uid });
        if (existingUser) {
            return next(new AppError("User already exists", 400))
        }
    }

    const user = await User.create({ ...req.user, ...req.body });

    res.status(201).json({
        status: "success",
        data: {
            user: user,
        }
    });
});

exports.createUserGoogleLogin = catchAsync(async (req, res) => {
    if (req.body.uid) {
        const existingUser = await User.findOne({ uid: req.body.uid });
        if (existingUser) {
            return next(new AppError("User already exists", 400))
        }
    }
    const newUser = await User.create({ ...req.user, ...req.body });
    res.status(201).json({
        status: "success",
        data: {
            user: newUser,
        }
    });
});

exports.fetchArtistName = catchAsync(async (req, res) => {
    const uid = req.query.uid;
    const artist = await User.findOne({ "uid": uid });
    if (artist.role == "artist") {
        res.status(200).json({
            status: "success",
            data: {
                artist_name: artist.artist_name,
                artist_photo: artist.artist_photo,
                artist_description: artist.artist_description,
                artist_instagram: artist.artist_instagram,
                artist_spotify: artist.artist_spotify,
                artist_soundcloud: artist.artist_soundcloud,
                artist_minting_contract: artist.artist_minting_contract,
                wallet: artist.uid
            }
        })
    } else {
        return next(new AppError("User is not an artist", 400))
    }
});

exports.getTopCollectors = catchAsync(async (req, res) => {
    // Query the TopCollector model to get the top collectors
    const topCollectors = await TopCollector.find()
        .sort({ count: -1 }) // Sort by count in descending order
        .limit(10); // Limit to top 10 collectors

    res.status(200).json({
        status: "success",
        topCollectors: topCollectors
    });
});


exports.getSupporters = catchAsync(async (req, res) => {
    const excludedOwners = ["0x63dd604e72eb0ec35312e1109c29202072ab9cab"];
    const token_id = req.params.token_id;
    const token_address = req.params.token_address;

    // Initialize an array to hold the supporters' data
    let supporters = [];
    let ownerWallets = [];

    try {
        // Fetch owners using Alchemy SDK
        const nftsResponse = await alchemy.nft.getOwnersForNft(token_address, token_id);
        ownerWallets = nftsResponse.owners;
    } catch (error) {
        console.error(`Error fetching owners for token_id ${token_id} and token_address ${token_address}:`, error);
    }

    // Initialize Thirdweb client
    const client = createThirdwebClient({
        clientId: process.env.THIRDWEB_PROJECT_ID,
    });

    const chain = process.env.ACTIVE_CHAIN == "polygon" ? polygon : polygonAmoy; // Assuming polygonAmoy is defined

    for (const wallet of ownerWallets) {
        if (excludedOwners.includes(wallet)) {
            continue;
        }

        // Find user by wallet address
        const user = await User.findOne({ uid: wallet });
        if (user) {
            try {
                // Get contract
                const contract = getContract({ client, chain, address: token_address });

                // Read balance
                const balanceData = await readContract({
                    contract,
                    method: resolveMethod("balanceOf"),
                    params: [wallet, token_id]
                });

                const amount = balanceData.toString();

                // Add user info to the supporters array
                supporters.push({
                    owner_of: wallet,
                    uid: user.uid,
                    count: parseInt(amount, 10), // Assuming count is an integer
                    display_name: user.display_name,
                    picture: user.picture
                });
            } catch (error) {
                console.error(`Error fetching balance for wallet ${wallet}:`, error);
            }
        }
    }

    // Sort supporters by count in descending order
    supporters.sort((a, b) => b.count - a.count);

    res.status(200).json({
        status: "success",
        supporters: supporters,
    });
});