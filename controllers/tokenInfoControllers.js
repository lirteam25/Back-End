const TokenInfo = require("../models/tokenInfoModel");
const User = require("../models/userModel");
const TokenOwner = require("../models/tokenOwnerModel");
const APIFeatures = require("../Utils/apiFeatures");
const catchAsync = require("../Utils/catchAsync");
const { sendEmail } = require("../Utils/sendEmail");
const AppError = require("../Utils/appError");
const { Alchemy, Network } = require("alchemy-sdk");
const { createThirdwebClient, getContract, readContract, resolveMethod } = require("thirdweb");
const { getActiveClaimCondition } = require("thirdweb/extensions/erc1155");
const { polygonAmoy, polygon } = require("thirdweb/chains");
const { ethers } = require("ethers");

const alchemyNetwork = process.env.ALCHEMY_NETWORK == "MATIC_MAINNET" ? Network.MATIC_MAINNET : Network.MATIC_AMOY;
const apiKey = process.env.ALCHEMY_NETWORK == "MATIC_MAINNET" ? process.env.ALCHEMY_API_KEY : process.env.ALCHEMY_API_KEY_TEST
const config = {
    apiKey: apiKey,
    network: alchemyNetwork,
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


//Create NFT
exports.createNFTInfo = catchAsync(async (req, res, next) => {
    const user = await User.findOne(req.user);
    if (!user) {
        return next(new AppError("No User found with that email", 404))
    };
    const newNFT = await TokenInfo.create(req.body)
    const userEmail = user.artist_email;
    await sendEmail(userEmail, "LIR MUSIC - Your Tokens Have Been Created",
        `<html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your tokens have been created</title>
            <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400&display=swap" rel="stylesheet" >
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
        
            <style>
        .fab:hover {
                color: rgb(214, 11, 82);
            }
            body, h1, p, a {
                font-family: 'Space Grotesk', sans-serif;
            }
            </style>
        </head>
        <div style="color:white; background-color:rgb(17,17,17); font-family:sans-serif; padding: 50px 10%; overflow: auto">
                <div style="margin: 50px 0">
        <h1 style="color:rgb(214, 11, 82); text-align:center; text-transform:uppercase; margin: 0;">Congratulations</h1>
        <div style="text-align:center; font-size: 18px; font-family: 'Space Grotesk', sans-serif">your tokens have been created</div> 
        </div>
                <div style="background-color:rgb(27,27,27); padding: 10px 30px; border: 1px solid rgb(48, 48, 48); margin: 40px 0; font-size: 18px;">
                  <p style="margin: 20px 0;">Dear ${newNFT.artist},</p>
                  <p style="margin: 20px 0">Congratulations on creating your token! We're excited to inform you that it wiil be available for purchase on our platform on ${newNFT.launch_date}.</p>
                  <p style="margin: 20px 0">Your music has the power to captivate and inspire, and by creating tokens, you're providing a unique opportunity for your fans and supporters to engage with your creative journey. We encourage you to share the news with your fans and promote your tokens sale. This will help generate interest and create a buzz around your music.</p>
                  <p style="margin: 20px 0">If you have any questions or need assistance, please don't hesitate to reach out to our dedicated support team at <a href="mailto:info@lirmusic.com" style="color:rgb(214, 11, 82); text-decoration: none">info@lirmusic.com</a>.</p>
                  <p style="margin: 20px 0">Once again, congratulations on taking this exciting step in your music career!</p>
                  <p style="margin: 20px 0">Best regards,</p>
                  <p style="margin: 20px 0">The LIR Music Team</p>
                </div>
                <div style="display: grid; grid-template-columns: 0.2fr 0.1fr 1fr 1fr ; align-items: top; margin-bottom: 40px">
                <svg id="Livello_1" data-name="Livello 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 850.39 340.16"><defs><style>.cls-1{fill:#fff;}</style></defs><path class="cls-1" d="M237.27-74.54V95.54H208.92V-74.54ZM38.85,67.19V-74.54H10.5V95.54H180.58V67.19Zm315-56.69,49.09,85H435.7l-49.1-85Zm-88.25-85v28.35H407.35V10.5H435.7v-85Zm-422,0,49.1,85-49.1,85h32.73l49.1-85-49.1-85Zm-258.33-85v85h28.35v-56.69h283.46v56.69h28.35v-85Zm49.1,85-49.1,85,49.1,85h32.73L-382,10.5l49.09-85Zm262.71,226.77H-386.35V95.54H-414.7v85H-74.54v-85h-28.35Z" transform="translate(414.7 159.58)"/ style="width: 80px; display: block;"></svg>
                        <div style="font-size: 16px; font-family: 'Space Grotesk', sans-serif; grid-column: 3">
                        ©2023 LIR, all rights reserved <br/>
                        <a href="https://www.lirmusic.com" style="color: white; text-decoration: none">lirmusic.com</a>
                        
                        </div>
                        <div style="display: flex; gap: 20px; justify-content: flex-end">
                                        <a href="https://www.instagram.com/lirmusicofficial" style="color: white"> <i class="fab fa-instagram" style="font-size:23px"></i> </a>
                                        <i class="fab fa-discord" style="font-size:23px"></i>
                                        <a href="https://www.youtube.com/@lirmusicofficial" style="color: white"> <i class="fab fa-youtube" style="font-size:23px"></i> </a>
                                    </div>
                        
                              </div>
              </html>`);
    res.status(201).json({
        status: "success",
        data: {
            nftInfo: newNFT,
        }
    })
});

//Create NFT
exports.purchasedNFTInfo = catchAsync(async (req, res, next) => {
    // Fetch the NFT info
    const tokenId = req.params.token_id;
    const tokenAddress = req.params.token_address;
    const nft = await TokenInfo.findOne({ token_id: tokenId, token_address: tokenAddress })
    if (!nft) {
        return next(new AppError("No NFT found with that token ID", 404));
    }

    // Fetch the user's email using author_address from NFT info
    const user = await User.findOne({ uid: nft.author_address[0] }); // Assuming author_address is an array
    if (!user) {
        return next(new AppError("No User found with that author address", 404));
    }

    const userEmail = user.artist_email;
    await sendEmail(userEmail, "LIR MUSIC - You sold one of your tracks!",
        `<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your track has been sold</title>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">

    <style>
        .fab:hover {
            color: rgb(214, 11, 82);
        }
        body, h1, p, a {
            font-family: 'Space Grotesk', sans-serif;
        }
        body {
            margin: 0;
            padding: 0;
            background-color: rgb(17, 17, 17);
            color: white;
        }
        .container {
            padding: 50px 10%;
            overflow: auto;
        }
        .header {
            margin: 50px 0;
            text-align: center;
        }
        .header h1 {
            color: rgb(214, 11, 82);
            text-transform: uppercase;
            margin: 0;
        }
        .message {
            background-color: rgb(27, 27, 27);
            padding: 10px 30px;
            border: 1px solid rgb(48, 48, 48);
            margin: 40px 0;
            font-size: 18px;
        }
        .footer {
            display: grid;
            grid-template-columns: 1fr 1fr;
            align-items: top;
            margin-bottom: 40px;
            gap: 10px;
        }
        .footer svg {
            width: 80px;
            display: block;
            margin: auto;
        }
        .footer .contact-info {
            font-size: 16px;
            text-align: center;
        }
        .footer .social-links {
            display: flex;
            gap: 20px;
            justify-content: center;
        }
        .social-links a {
            color: white;
            text-decoration: none;
        }
        @media (max-width: 600px) {
            .container {
                padding: 20px 5%;
            }
            .footer {
                grid-template-columns: 1fr;
                text-align: center;
            }
            .footer .contact-info {
                margin-bottom: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Congratulations</h1>
            <div>Your track has been sold</div>
        </div>
        <div class="message">
            <p>Dear ${user.display_name},</p>
            <p>Congratulations on selling your track!</p>
            <p>If you have any questions or need assistance, please don't hesitate to reach out to our dedicated support team at <a href="mailto:info@lirmusic.com" style="color:rgb(214, 11, 82); text-decoration: none">info@lirmusic.com</a>.</p>
            <p>Once again, congratulations on taking this exciting step in your music career!</p>
            <p>Best regards,</p>
            <p>The LIR Music Team</p>
        </div>
        <div class="footer">
            <svg id="Livello_1" data-name="Livello 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 850.39 340.16"><defs><style>.cls-1{fill:#fff;}</style></defs><path class="cls-1" d="M237.27-74.54V95.54H208.92V-74.54ZM38.85,67.19V-74.54H10.5V95.54H180.58V67.19Zm315-56.69,49.09,85H435.7l-49.1-85Zm-88.25-85v28.35H407.35V10.5H435.7v-85Zm-422,0,49.1,85-49.1,85h32.73l49.1-85-49.1-85Zm-258.33-85v85h28.35v-56.69h283.46v56.69h28.35v-85Zm49.1,85-49.1,85,49.1,85h32.73L-382,10.5l49.09-85Zm262.71,226.77H-386.35V95.54H-414.7v85H-74.54v-85h-28.35Z" transform="translate(414.7 159.58)"/></svg>
            <div class="contact-info">
                ©2023 LIR, all rights reserved <br/>
                <a href="https://www.lirmusic.com" style="color: white; text-decoration: none">lirmusic.com</a>
            </div>
            <div class="social-links">
                <a href="https://www.instagram.com/lirmusicofficial"><i class="fab fa-instagram" style="font-size:23px"></i></a>
                <a href="#"><i class="fab fa-discord" style="font-size:23px"></i></a>
                <a href="https://www.youtube.com/@lirmusicofficial"><i class="fab fa-youtube" style="font-size:23px"></i></a>
            </div>
        </div>
    </div>
</body>
</html>
`);
    res.status(201).json({
        status: "success",
        data: {
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

exports.addComment = catchAsync(async (req, res, next) => {
    // Find the user making the comment
    const user = await User.findOne(req.user);
    if (!user) {
        return next(new AppError("No User found with that token", 404));
    }

    // Create the new comment object
    const newComment = {
        user_wallet: user.uid, // assuming user object has a wallet property
        user_picture: user.picture, // assuming user object has a picture property
        user_display_name: user.display_name, // assuming user object has a display_name property
        comment: req.body.comment, // comment text should be provided in the request body
        date: Date.now(), // or use the default in schema
    };

    // Find the NFT by ID and push the new comment to the comments array
    const nft = await TokenInfo.findByIdAndUpdate(
        req.params.id,
        { $push: { comments: newComment } },
        {
            new: true,
            runValidators: true,
        }
    );

    if (!nft) {
        return next(new AppError("No NFT found with that ID", 404));
    }

    const artist = await User.findOne({ uid: nft.author_address[0] });
    if (!artist) {
        return next(new AppError("Artist not found", 404));
    }

    await sendEmail(artist.artist_email, "LIR MUSIC - A new comment on your track",
        `<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your track has been commented on</title>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">

    <style>
        .fab:hover {
            color: rgb(214, 11, 82);
        }
        body, h1, p, a {
            font-family: 'Space Grotesk', sans-serif;
        }
    </style>
</head>
<body style="color:white; background-color:rgb(17,17,17); font-family:sans-serif; padding: 50px 10%; overflow: auto">
    <div style="margin: 50px 0">
        <h1 style="color:rgb(214, 11, 82); text-align:center; text-transform:uppercase; margin: 0;">New Comment on Your Track</h1>
        <div style="text-align:center; font-size: 18px; font-family: 'Space Grotesk', sans-serif">someone has commented on your track</div> 
    </div>
    <div style="background-color:rgb(27,27,27); padding: 10px 30px; border: 1px solid rgb(48, 48, 48); margin: 40px 0; font-size: 18px;">
        <p style="margin: 20px 0;">Dear ${artist.artist_name},</p>
        <p style="margin: 20px 0">We are pleased to inform you that your track has received a new comment!</p>
        <p style="margin: 20px 0"><strong>Comment:</strong></p>
        <p style="margin: 20px 0; padding: 10px; background-color: rgb(37,37,37); border-left: 4px solid rgb(214, 11, 82);">${newComment.comment}</p>
        <p style="margin: 20px 0">Commented by: ${newComment.user_display_name}</p>
        <p style="margin: 20px 0">We encourage you to engage with your fans by replying to their comments and sharing this exciting update with your followers. Your interaction can help build a stronger connection with your audience.</p>
        <p style="margin: 20px 0">If you have any questions or need assistance, please don't hesitate to reach out to our dedicated support team at <a href="mailto:info@lirmusic.com" style="color:rgb(214, 11, 82); text-decoration: none">info@lirmusic.com</a>.</p>
        <p style="margin: 20px 0">Best regards,</p>
        <p style="margin: 20px 0">The LIR Music Team</p>
    </div>
    <div style="display: grid; grid-template-columns: 0.2fr 0.1fr 1fr 1fr ; align-items: top; margin-bottom: 40px">
        <svg id="Livello_1" data-name="Livello 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 850.39 340.16" style="width: 80px; display: block;">
            <defs><style>.cls-1{fill:#fff;}</style></defs>
            <path class="cls-1" d="M237.27-74.54V95.54H208.92V-74.54ZM38.85,67.19V-74.54H10.5V95.54H180.58V67.19Zm315-56.69,49.09,85H435.7l-49.1-85Zm-88.25-85v28.35H407.35V10.5H435.7v-85Zm-422,0,49.1,85-49.1,85h32.73l49.1-85-49.1-85Zm-258.33-85v85h28.35v-56.69h283.46v56.69h28.35v-85Zm49.1,85-49.1,85,49.1,85h32.73L-382,10.5l49.09-85Zm262.71,226.77H-386.35V95.54H-414.7v85H-74.54v-85h-28.35Z" transform="translate(414.7 159.58)"/>
        </svg>
        <div style="font-size: 16px; font-family: 'Space Grotesk', sans-serif; grid-column: 3">
            ©2023 LIR, all rights reserved <br/>
            <a href="https://www.lirmusic.com" style="color: white; text-decoration: none">lirmusic.com</a>
        </div>
        <div style="display: flex; gap: 20px; justify-content: flex-end">
            <a href="https://www.instagram.com/lirmusicofficial" style="color: white"> <i class="fab fa-instagram" style="font-size:23px"></i> </a>
            <a href="https://discord.com/" style="color: white"> <i class="fab fa-discord" style="font-size:23px"></i> </a>
            <a href="https://www.youtube.com/@lirmusicofficial" style="color: white"> <i class="fab fa-youtube" style="font-size:23px"></i> </a>
        </div>
    </div>
</body>
</html>
`)


    // Send the updated NFT as the response
    res.status(200).json({
        status: "success",
        data: {
            nft,
        }
    });
});

exports.deleteComment = catchAsync(async (req, res, next) => {
    // Extract the comment ID from the request parameters
    const commentId = req.params.id;

    // Find the NFT that contains the comment
    const nft = await TokenInfo.findOne({ "comments._id": commentId });

    if (!nft) {
        return next(new AppError("No NFT found with that comment", 404));
    }

    // Find the comment to delete
    const comment = nft.comments.id(commentId);

    if (!comment) {
        return next(new AppError("Comment not found", 404));
    }

    // Check if the comment belongs to the user making the request
    if (comment.user_wallet !== req.user.uid) {
        return next(new AppError("You do not have permission to delete this comment", 403));
    }

    // Remove the comment using pull method on the array
    nft.comments.pull(commentId);

    // Save the updated NFT document
    await nft.save();

    // Send the updated NFT as the response
    res.status(200).json({
        status: "success",
        data: {
            nft,
        },
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

    const chain = process.env.ACTIVE_CHAIN == "polygon" ? polygon : polygonAmoy;
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
        let maxClaimableSupply = 0;
        let supplyClaimed = 0;
        let sellingQuantity = 0;

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

        if (item.author_address.includes(walletAddress)) {
            maxClaimableSupply = Number(activeClaimConditions.maxClaimableSupply);
            supplyClaimed = Number(activeClaimConditions.supplyClaimed);
            sellingQuantity = maxClaimableSupply - supplyClaimed;
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
    let nftsResponse;
    let pageKey;

    // Initialize Thirdweb client
    const client = createThirdwebClient({
        clientId: process.env.THIRDWEB_PROJECT_ID,
    });

    const chain = process.env.ACTIVE_CHAIN == "polygon" ? polygon : polygonAmoy;

    // Function to process individual NFT
    const processNFT = async (nft) => {
        const token_id = nft.tokenId;
        const token_address = nft.contract.address;

        const item = await TokenInfo.findOne({ "token_id": token_id, "token_address": token_address }).select("+audioCloudinary");
        if (item) {
            let maxClaimableSupply = 0;
            let supplyClaimed = 0;
            let pricePerToken = 0;
            let sellingQuantity = 0;
            let amount = 0;

            const contract = getContract({ client, chain, address: token_address });

            try {
                // Use Thirdweb SDK to get active claim conditions
                const activeClaimConditions = await getActiveClaimCondition({
                    contract,
                    tokenId: token_id
                });

                // Convert BigInt values to numbers and handle price conversion for USDC
                if (activeClaimConditions) {
                    pricePerToken = parseFloat(ethers.utils.formatUnits(activeClaimConditions.pricePerToken.toString(), 6)); // Convert smallest unit to USDC (6 decimals)
                    if (item.author_address === user.uid) {
                        maxClaimableSupply = Number(activeClaimConditions.maxClaimableSupply);
                        supplyClaimed = Number(activeClaimConditions.supplyClaimed);
                        sellingQuantity = maxClaimableSupply - supplyClaimed;
                    }
                }
            } catch (error) {
                console.error(`Error fetching active claim conditions for token ID ${token_id} at address ${token_address}:`, error);
            }

            try {
                // Read the balance of the wallet (user.id) for the specific token_id
                const balanceData = await readContract({
                    contract,
                    method: resolveMethod("balanceOf"),
                    params: [user.uid, token_id]
                });
                amount = Number(balanceData);
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

            return modifiedItem;
        }
        return null;
    };

    // Loop through all pages of the Alchemy API response
    do {
        // Get NFTs using Alchemy API
        nftsResponse = await alchemy.nft.getNftsForOwner(user.uid, { pageKey });
        const NFTs = nftsResponse.ownedNfts;
        pageKey = nftsResponse.pageKey;

        // Process NFTs concurrently
        const processedNFTs = await Promise.all(NFTs.map(processNFT));
        NFTInfoOwned.push(...processedNFTs.filter(item => item !== null));
    } while (pageKey);

    res.status(200).json({
        status: "success",
        result: NFTInfoOwned.length,
        data: {
            NFTInfoOwned
        }
    });
});

/* exports.getSongsFromFirebaseToken = catchAsync(async (req, res, next) => {
    const user = await User.findOne(req.user);
    if (!user) {
        return next(new AppError("No User found with that email", 400));
    }

    // Initialize Thirdweb client
    const client = createThirdwebClient({
        clientId: process.env.THIRDWEB_PROJECT_ID,
    });

    const chain = process.env.ACTIVE_CHAIN === "polygon" ? polygon : polygonAmoy;

    // Query TokenOwner model to find NFTs owned by the user
    const ownedTokens = await TokenOwner.find({ owner_of: user.uid });

    // Process each owned NFT
    const NFTInfoOwned = await Promise.all(ownedTokens.map(async (ownedToken) => {
        const token_id = ownedToken.token_id;
        const token_address = ownedToken.token_address;

        const item = await TokenInfo.findOne({ token_id, token_address }).select("+audioCloudinary");
        if (item) {
            let maxClaimableSupply = 0;
            let supplyClaimed = 0;
            let pricePerToken = 0;
            let sellingQuantity = 0;
            let amount = ownedToken.amount;

            const contract = getContract({ client, chain, address: token_address });

            try {
                // Use Thirdweb SDK to get active claim conditions
                const activeClaimConditions = await getActiveClaimCondition({
                    contract,
                    tokenId: token_id
                });

                // Convert BigInt values to numbers and handle price conversion for USDC
                if (activeClaimConditions) {
                    pricePerToken = parseFloat(ethers.utils.formatUnits(activeClaimConditions.pricePerToken.toString(), 6)); // Convert smallest unit to USDC (6 decimals)
                    if (item.author_address === user.uid) {
                        maxClaimableSupply = Number(activeClaimConditions.maxClaimableSupply);
                        supplyClaimed = Number(activeClaimConditions.supplyClaimed);
                        sellingQuantity = maxClaimableSupply - supplyClaimed;
                    }
                }
            } catch (error) {
                console.error(`Error fetching active claim conditions for token ID ${token_id} at address ${token_address}:`, error);
            }

            // Create the item with pricePerToken, maxClaimableSupply, and amount
            const modifiedItem = {
                ...item.toObject(),
                pricePerToken,
                sellingQuantity,
                amount
            };

            return modifiedItem;
        }
        return null;
    }));

    res.status(200).json({
        status: "success",
        result: NFTInfoOwned.length,
        data: {
            NFTInfoOwned: NFTInfoOwned.filter(item => item !== null) // Filter out any null items
        }
    });
});
 */



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