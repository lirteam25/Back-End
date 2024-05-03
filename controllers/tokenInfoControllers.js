const TokenInfo = require("../models/tokenInfoModel");
const User = require("../models/userModel");
const TokenOwner = require("../models/tokenOwnerModel");
const APIFeatures = require("../Utils/apiFeatures");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");


exports.getAllNFTsInfo = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(TokenInfo.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .pagination();
    const nfts = await features.query;
    //Send response
    res.status(200).json({
        status: "success",
        result: nfts.length,
        data: {
            nfts,
        },
    });
});

exports.getSameSongNFTInfo = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(TokenInfo.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .pagination();
    let nfts = await features.query;
    let result = [];
    for (let i = 0; i < nfts.length; i++) {
        const trova = await TokenOwner.find({ "token_id": nfts[i].token_id, "token_address": nfts[i].token_address, "sellingQuantity": { $gt: 0 } }).sort({ "price": 1 }).limit(1);
        console.log("trova", trova);
        const newObj = {
            ...nfts[i].toObject(),
            lowest_price: trova.length > 0 ? trova[0].price : "Not available",
            owner_id: trova.length > 0 ? trova[0]._id : undefined
        };

        console.log("new object", newObj);

        result.push(newObj);
    }
    //Send response
    res.status(200).json({
        status: "success",
        result: nfts.length,
        data: {
            result,
        },
    });
});

exports.aliasTopNFTs = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = "-launch_price, created_at";
    next();
}

//Create NFT
exports.createNFTInfo = catchAsync(async (req, res, next) => {
    const user = await User.findOne(req.user);
    if (!user) {
        return next(new AppError("No User found with that email", 404))
    };
    const newNFT = await TokenInfo.create(req.body)
    res.status(201).json({
        status: "success",
        data: {
            nftInfo: newNFT,
        }
    })
});

//Get sigle NFT. The path that we want to use is the id of the NFT. The id will be available in the params
exports.getSingleNFT = catchAsync(async (req, res, next) => {
    const nft = await TokenInfo.findById(req.params.id);

    if (!nft) {
        return next(new AppError("No nft found with that ID", 404))
    }

    res.status(200).json({
        status: "success",
        data: {
            nft,
        },
    })
});

//Patch Method: method to not update the entire data (like get) but to update 
//Currently not working
exports.updateNFT = catchAsync(async (req, res, next) => {
    const user = await User.findOne(req.user);
    if (!user) {
        return next(new AppError("No User found with that email", 404))
    }
    const nft = await TokenInfo.findByIdAndUpdate(req.params.id, req.body,
        {
            //remove the previous data and create the new one
            new: true,
            runValidators: true,
        });
    if (!nft) {
        return next(new AppError("No nft found with that ID", 404))
    }
    res.status(200).json({
        status: "success",
        data: {
            nft,
        }
    });
});

exports.getOwnerNFTInfo = catchAsync(async (req, res, next) => {
    const NFTOwned = await TokenOwner.findById(req.params.id);
    if (!NFTOwned) {
        return next(new AppError("No NFT Owner found with that ID", 400))
    }

    // Compute the total listed quantity
    const totalListed = await TokenOwner.aggregate([
        {
            $match: {
                "token_id": NFTOwned.token_id,
                "token_address": NFTOwned.token_address
            }
        },
        {
            $group: {
                _id: null,
                totalListed: { $sum: "$sellingQuantity" }
            }
        }
    ]);

    console.log(totalListed);
    // Check if there is a result (there should always be a result)
    if (totalListed.length === 0) {
        return next(new AppError("No NFT Owners found for the given criteria", 404));
    }

    // Get the total listed quantity from the result
    const totalListedQuantity = totalListed[0].totalListed;

    // Get the additional information from TokenInfo
    const item = await TokenInfo.findOne({ "token_id": NFTOwned.token_id, "token_address": NFTOwned.token_address }).select("+description");

    // Create the ownerNFTInfo object with the new parameter
    const ownerNFTInfo = {
        ...item.toObject(),
        "owner_of": NFTOwned.owner_of,
        "amount": NFTOwned.amount,
        "sellingQuantity": NFTOwned.sellingQuantity,
        "price": NFTOwned.price,
        "isFirstSale": NFTOwned.isFirstSale ? NFTOwned.isFirstSale : false,
        "listing_id": NFTOwned.listing_id,
        "totalListed": totalListedQuantity // Add the totalListed parameter
    };

    res.status(200).json({
        status: "success",
        result: ownerNFTInfo.length,
        data: {
            ownerNFTInfo
        }
    });
});


exports.getSongsFromFirebaseToken = catchAsync(async (req, res, next) => {
    const user = await User.findOne(req.user);
    if (!user) {
        return next(new AppError("No User found with that email", 400))
    }
    const NFTowned = await TokenOwner.find({ "owner_of": user.uid, "amount": { $gt: 0 } }).sort({ date: -1 });
    console.log(NFTowned);
    let NFTInfoOwned = [];
    if (NFTowned.length === 0) {
        return res.status(200).json({
            status: "success",
            data: {
                NFTInfoOwned
            }
        })
    };
    for (let i = 0; i < NFTowned.length; i++) {
        const item = await TokenInfo.findOne({ "token_id": NFTowned[i].token_id, "token_address": NFTowned[i].token_address }).select("+audioCloudinary");
        if (item) {
            const minPriceItem = await TokenOwner.aggregate([
                {
                    $match: {
                        token_id: NFTowned[i].token_id,
                        token_address: NFTowned[i].token_address
                    }
                },
                {
                    $group: {
                        _id: {
                            token_id: "$token_id",
                            token_address: "$token_address"
                        },
                        min_price: { $min: "$price" }
                    }
                },
                {
                    $limit: 1
                }
            ]);

            const modifiedItems = { ...item.toObject(), "owner_id": NFTowned[i]._id, "owner_of": user.uid, "amount": NFTowned[i].amount, "sellingQuantity": NFTowned[i].sellingQuantity, "price": NFTowned[i].price, "date": NFTowned[i].date, "floor_price": minPriceItem[0].min_price };
            NFTInfoOwned = [...NFTInfoOwned, modifiedItems];
        }
    }
    res.status(200).json({
        status: "success",
        result: NFTInfoOwned.length,
        data: {
            NFTInfoOwned
        }
    })
});

exports.getCreatedSongs = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(TokenInfo.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .pagination();
    const nfts = await features.query;
    let items = []
    for (let i = 0; i < nfts.length; i++) {
        let check = 0
        if (i != 0) {
            for (let j = 0; j < items.length; j++) {
                if (nfts[i].song_number == items[j].song_number) {
                    check = 1;
                }
            }
        }
        if (check == 0) {
            items.push({ "song": nfts[i].song, "song_number": nfts[i].song_number, "imageSong": nfts[i].imageSong })
        }
    }
    res.status(200).json({
        status: "success",
        data: {
            items,
        },
    });
});