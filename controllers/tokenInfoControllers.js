const TokenInfo = require("../models/tokenInfoModel");
const User = require("../models/userModel");
const TokenOwner = require("../models/tokenOwnerModel");
const APIFeatures = require("../Utils/apiFeatures");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const { Alchemy, Network } = require("alchemy-sdk");
const { createThirdwebClient, getContract, readContract, resolveMethod } = require("thirdweb");
const { getActiveClaimCondition } = require("thirdweb/extensions/erc1155");
const { polygonAmoy } = require("thirdweb/chains");
const { ethers } = require("ethers");

const config = {
    apiKey: process.env.ALCHEMY_API_KEY,
    network: Network.MATIC_AMOY,
};
const alchemy = new Alchemy(config);


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

/* exports.getOwnerNFTInfo = catchAsync(async (req, res, next) => {
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
}); */

exports.getOwnerNFTInfo = catchAsync(async (req, res, next) => {
    const client = createThirdwebClient({
        clientId: process.env.THIRDWEB_PROJECT_ID,
    });

    const tokenId = req.params.token_id;
    const tokenAddress = req.params.token_address;
    const walletAddress = req.params.uid;

    // Find the NFT information from the TokenInfo model
    const item = await TokenInfo.findOne({ token_id: tokenId, token_address: tokenAddress }).select("+description");
    if (!item) {
        return next(new AppError("No NFT found with the given token ID and address", 400));
    }

    try {
        let sellingQuantity = 0;
        const chain = polygonAmoy;

        // Use Thirdweb SDK to get active claim conditions
        const contract = getContract({ client, chain, address: tokenAddress });
        const activeClaimConditions = await getActiveClaimCondition({
            contract,
            tokenId: tokenId
        });

        // Convert BigInt values to strings and handle price conversion for USDC
        const convertedConditions = Object.entries(activeClaimConditions).reduce((acc, [key, value]) => {
            if (key === "pricePerToken") {
                acc[key] = parseFloat(ethers.utils.formatUnits(value.toString(), 6)); // Convert smallest unit to USDC (6 decimals)
            } else {
                acc[key] = typeof value === 'bigint' ? value.toString() : value;
            }
            return acc;
        }, {});

        if (item.author_address === walletAddress) {
            maxClaimableSupply = activeClaimConditions.maxClaimableSupply;
            supplyClaimed = activeClaimConditions.supplyClaimed;
            sellingQuantity = maxClaimableSupply - supplyClaimed;
            sellingQuantity = sellingQuantity;
        }

        // Remove supply and price attributes from token object
        const { supply, launch_price, ...tokenWithoutSupplyAndPrice } = item.toObject();

        // Merge converted conditions into the token object
        const ownerNFTInfo = {
            ...tokenWithoutSupplyAndPrice,
            ...convertedConditions,
            sellingQuantity
        };

        res.status(200).json({
            status: "success",
            data: {
                ownerNFTInfo
            }
        });
    } catch (error) {
        console.error(`Error fetching active claim conditions for token ID ${tokenId} at address ${tokenAddress}:`, error);
        return next(new AppError("Error fetching active claim conditions", 500));
    }
});



exports.getSongsFromFirebaseToken = catchAsync(async (req, res, next) => {
    const user = await User.findOne(req.user);
    if (!user) {
        return next(new AppError("No User found with that email", 400));
    }

    let NFTInfoOwned = [];

    // Get NFTs using Alchemy API
    const nftsResponse = await alchemy.nft.getNftsForOwner(user.uid);
    const NFTs = nftsResponse.ownedNfts;

    if (NFTs.length === 0) {
        return res.status(200).json({
            status: "success",
            data: {
                NFTInfoOwned
            }
        });
    }

    const client = createThirdwebClient({
        clientId: process.env.THIRDWEB_PROJECT_ID,
    });

    for (const nft of NFTs) {
        const token_id = nft.tokenId;
        const token_address = nft.contract.address;

        const item = await TokenInfo.findOne({ "token_id": token_id, "token_address": token_address }).select("+audioCloudinary");
        if (item) {
            let pricePerToken = "0";
            let sellingQuantity = 0;
            let amount = 0;

            const chain = polygonAmoy;
            const contract = getContract({ client, chain, address: token_address });

            // Check if the wallet (user.uid) is the author of the TokenInfo model

            try {
                // Use Thirdweb SDK to get active claim conditions
                const activeClaimConditions = await getActiveClaimCondition({
                    contract,
                    tokenId: token_id
                });

                // Convert BigInt values to strings and handle price conversion for USDC
                if (activeClaimConditions) {
                    pricePerToken = parseFloat(ethers.utils.formatUnits(activeClaimConditions.pricePerToken.toString(), 6)); // Convert smallest unit to USDC (6 decimals)
                    if (item.author_address === user.uid) {
                        maxClaimableSupply = activeClaimConditions.maxClaimableSupply;
                        supplyClaimed = activeClaimConditions.supplyClaimed;
                        sellingQuantity = maxClaimableSupply - supplyClaimed;
                        sellingQuantity = sellingQuantity.toString();
                    }
                }
            } catch (error) {
                console.error(`Error fetching active claim conditions for token ID ${token_id} at address ${token_address}:`, error);
            }


            // Read the balance of the wallet (user.id) for the specific token_id
            try {
                const balanceData = await readContract({
                    contract,
                    method: resolveMethod("balanceOf"),
                    params: [user.uid, token_id]
                });
                amount = balanceData;
            } catch (error) {
                console.error(`Error reading balance for token ID ${token_id} at address ${token_address}:`, error);
            }

            // Create the item with pricePerToken, maxClaimableSupply, and amount
            const modifiedItem = {
                ...item.toObject(),
                pricePerToken,
                sellingQuantity,
                amount
            };

            NFTInfoOwned.push(modifiedItem);
        }
    }

    res.status(200).json({
        status: "success",
        result: NFTInfoOwned.length,
        data: {
            NFTInfoOwned
        }
    });
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