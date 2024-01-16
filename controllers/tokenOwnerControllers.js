const TokenOwner = require("../models/tokenOwnerModel");
const User = require("../models/userModel");
const TokenInfo = require("../models/tokenInfoModel");
const catchAsync = require("../Utils/catchAsync");
const APIFeatures = require("../Utils/apiFeatures");
const AppError = require("../Utils/appError");
const admin = require('firebase-admin');
const { sendEmail } = require("../Utils/sendEmail");

//Create NFT
exports.createNFTOwner = catchAsync(async (req, res, next) => {
    const newNFTOwner = await TokenOwner.create(req.body);

    //Email creation
    const user = await User.findOne(req.user);
    const userEmail = await admin.auth()
        .getUser(user.uid).then((result) => {
            const email = result.email
            return email;
        })
        .catch(function (error) {
            return next(new AppError(error, 401));
        });
    await sendEmail(userEmail, "LIR - Your Tokens Have Been Created",
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
                  <p style="margin: 20px 0;">Hello artist,</p>
                  <p style="margin: 20px 0">Congratulations on creating ${req.body.amount} tokens representing your exclusive music contents! We're excited to inform you that ${req.body.sellingQuantity} tokens are available for purchase on our platform at the price of ${req.body.price}$.</p>
                  <p style="margin: 20px 0">Your music has the power to captivate and inspire, and by creating tokens, you're providing a unique opportunity for your fans and supporters to engage with your creative journey. With your tokens, fans can now own a piece of your music in a whole new way, enabling them to participate in the success and growth of your artistic endeavors. We encourage you to share the news with your fans and promote the availability of your tokens. This will help generate interest and create a buzz around your music.</p>
        
                  <p style="margin: 20px 0">If you have any questions or need assistance in managing your tokens or promoting them to your audience, please don't hesitate to reach out to our dedicated support team at <a href="mailto:info@lirmusic.com" style="color:rgb(214, 11, 82); text-decoration: none">info@lirmusic.com</a>.</p>
                  <p style="margin: 20px 0">Once again, congratulations on taking this exciting step in your music career!</p>
                  <p style="margin: 20px 0">Best regards,</p>
                  <p style="margin: 20px 0">The LIR Music Team</p>
                </div>
        <div style="display: grid; grid-template-columns: 0.8fr 1fr 1fr ; align-items: top; margin-bottom: 40px">
        <img src="https://res.cloudinary.com/dihlirr2b/image/upload/v1697982005/Utils/wikqgtsta7zacj8lrqtq.png" alt="LIR Logo" style="width: 80px; display: block;">
        <div style="font-size: 16px; font-family: 'Space Grotesk', sans-serif ">
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
            nftsOwners: newNFTOwner,
        }
    })
});

exports.getNFTOwners = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(TokenOwner.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .pagination();
    const owners = await features.query;
    //Send response
    res.status(200).json({
        status: "success",
        result: owners.length,
        data: {
            owners,
        },
    });
});

exports.getMyNFTs = catchAsync(async (req, res, next) => {
    const user = await User.findOne(req.user);
    if (!user) {
        return next(new AppError("No User found with that Firebase Token", 400))
    };
    const nfts = await TokenOwner.find({ "owner_of": user.wallet });
    //Send response
    res.status(200).json({
        status: "success",
        result: nfts.length,
        data: {
            nfts,
        },
    });
});

exports.nftSold = catchAsync(async (req, res, next) => {
    const user = await User.findOne(req.user);
    if (!user) {
        return next(new AppError("No User found with that Firebase Token", 400))
    }
    //Update Seller 
    const seller = await TokenOwner.findOneAndUpdate({ "token_id": req.body.token_id, "token_address": req.body.token_address, "owner_of": req.body.owner_of },
        { $inc: { sellingQuantity: -1, amount: -1 } });
    if (!seller) {
        return next(new AppError(`No seller found with ${req.body.owner_of} address`, 400))
    };
    const price = seller.price

    //Send Email
    const UserSeller = await User.findOne({ "wallet": req.body.owner_of });
    const sellerEmail = await admin.auth()
        .getUser(UserSeller.uid).then((result) => {
            const email = result.email
            return email;
        })
        .catch(function (error) {
            return next(new AppError(error, 401));
        });
    await sendEmail(sellerEmail, "LIR - Your Token Has Been Sold",
        `<html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your token has been sold </title>
            <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400&display=swap" rel="stylesheet" >
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
        
            <style>
        .fab:hover {
                color: rgb(214, 11, 82); /* Change the color on hover */
            }
            body, h1, p, a {
                font-family: 'Space Grotesk', sans-serif;
            }
            </style>
        </head>
        <div style="color:white; background-color:rgb(17,17,17); font-family:sans-serif; padding: 50px 10%; overflow: auto">
                <div style="margin: 50px 0">
        <h1 style="color:rgb(214, 11, 82); text-align:center; text-transform:uppercase; margin: 0;">Congratulations</h1>
        <div style="text-align:center; font-size: 18px; font-family: 'Space Grotesk', sans-serif">your token has been bought</div> 
        </div>
                <div style="background-color:rgb(27,27,27); padding: 10px 30px; border: 1px solid rgb(48, 48, 48); margin: 40px 0; font-size: 18px;">
                  <p style="margin: 20px 0;">Hello seller,</p>
                  <p style="margin: 20px 0">We are delighted to inform you that your token has been sold on our platform. The purchase price for your token was ${price}$. <br/>For more details about this transaction, please visit <a href="https://www.lirmusic.com" style="color: rgb(214, 11, 82); text-decoration: none;">our website</a>.</p>
        
                  <p style="margin: 20px 0">If you have any questions or need assistance in managing your tokens, please don't hesitate to reach out to our dedicated support team at <a href="mailto:info@lirmusic.com" style="color:rgb(214, 11, 82); text-decoration: none">info@lirmusic.com</a>.</p>
                  <p style="margin: 20px 0">Once again, congratulations for the sale!</p>
                  <p style="margin: 20px 0">Best regards,</p>
                  <p style="margin: 20px 0">The LIR Music Team</p>
                </div>
        <div style="display: grid; grid-template-columns: 0.8fr 1fr 1fr ; align-items: top; margin-bottom: 40px">
        <img src="https://res.cloudinary.com/dihlirr2b/image/upload/v1697982005/Utils/wikqgtsta7zacj8lrqtq.png" alt="LIR Logo" style="width: 80px; display: block;">
        <div style="font-size: 16px; font-family: 'Space Grotesk', sans-serif ">
        ©2023 LIR, all rights reserved <br/>
        <a href="https://www.lirmusic.com" style="color: white; text-decoration: none">lirmusic.com</a>
        
        </div>
        <div style="display: flex; gap: 20px; justify-content: flex-end">
                        <a href="https://www.instagram.com/lirmusicofficial" style="color: white"> <i class="fab fa-instagram" style="font-size:23px"></i> </a>
                        <i class="fab fa-discord" style="font-size:23px"></i>
                        <a href="https://www.youtube.com/@lirmusicofficial" style="color: white"> <i class="fab fa-youtube" style="font-size:23px"></i> </a>
                    </div>
        
              </div>
              </html>`
    );
    //Update newOwner
    let updateData = { $inc: { amount: +1 } };
    const check1 = await TokenOwner.findOne({ "token_id": req.body.token_id, "token_address": req.body.token_address, "owner_of": req.body.buyer })
    if (check1) {
        if (check1.amount === 0) {
            updateData.$set = { date: new Date() };
        }
        await TokenOwner.findOneAndUpdate({ "token_id": req.body.token_id, "token_address": req.body.token_address, "owner_of": req.body.buyer },
            updateData
        );
    } else {
        await TokenOwner.create({ "token_id": req.body.token_id, "token_address": req.body.token_address, "owner_of": req.body.buyer, "amount": 1, "name": req.body.name, "symbol": req.body.symbol });
    }
    const newOwner = await TokenOwner.findOne({ "token_id": req.body.token_id, "token_address": req.body.token_address, "owner_of": req.body.buyer });
    //Send an email to the buyer
    const buyerEmail = await admin.auth()
        .getUser(user.uid).then((result) => {
            const email = result.email
            return email;
        })
        .catch(function (error) {
            return next(new AppError(error, 401));
        });
    await sendEmail(buyerEmail, "LIR - Token Purchase Confirmation",
        `<html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Token Purchase Confirmation </title>
            <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400&display=swap" rel="stylesheet" >
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
        
            <style>
        .fab:hover {
                color: rgb(214, 11, 82); /* Change the color on hover */
            }
            body, h1, p, a {
                font-family: 'Space Grotesk', sans-serif;
            }
            </style>
        </head>
        <div style="color:white; background-color:rgb(17,17,17); font-family:sans-serif; padding: 50px 10%; overflow: auto">
                <div style="margin: 50px 0">
        <h1 style="color:rgb(214, 11, 82); text-align:center; text-transform:uppercase; margin: 0;">Congratulations</h1>
        <div style="text-align:center; font-size: 18px; font-family: 'Space Grotesk', sans-serif">your token purchase was successful</div> 
        </div>
                <div style="background-color:rgb(27,27,27); padding: 10px 30px; border: 1px solid rgb(48, 48, 48); margin: 40px 0; font-size: 18px;">
                  <p style="margin: 20px 0;">Hello buyer,</p>
                  <p style="margin: 20px 0">We are pleased to confirm your successful purchase of a token on our platform. For more details about this transaction, please visit <a href="https://www.lirmusic.com" style="color: rgb(214, 11, 82); text-decoration: none;">our website</a>.</p>
        
                  <p style="margin: 20px 0">If you have any questions or need assistance in managing your tokens, please don't hesitate to reach out to our dedicated support team at <a href="mailto:info@lirmusic.com" style="color:rgb(214, 11, 82); text-decoration: none">info@lirmusic.com</a>.</p>
                  <p style="margin: 20px 0">Once again, congratulations for the purchase!</p>
                  <p style="margin: 20px 0">Best regards,</p>
                  <p style="margin: 20px 0">The LIR Music Team</p>
                </div>
        <div style="display: grid; grid-template-columns: 0.8fr 1fr 1fr ; align-items: top; margin-bottom: 40px">
        <img src="https://res.cloudinary.com/dihlirr2b/image/upload/v1697982005/Utils/wikqgtsta7zacj8lrqtq.png" alt="LIR Logo" style="width: 80px; display: block;">
        <div style="font-size: 16px; font-family: 'Space Grotesk', sans-serif ">
        ©2023 LIR, all rights reserved <br/>
        <a href="https://www.lirmusic.com" style="color: white; text-decoration: none">lirmusic.com</a>
        
        </div>
        <div style="display: flex; gap: 20px; justify-content: flex-end">
                        <a href="https://www.instagram.com/lirmusicofficial" style="color: white"> <i class="fab fa-instagram" style="font-size:23px"></i> </a>
                        <i class="fab fa-discord" style="font-size:23px"></i>
                        <a href="https://www.youtube.com/@lirmusicofficial" style="color: white"> <i class="fab fa-youtube" style="font-size:23px"></i> </a>
                    </div>
        
              </div>
              </html>`
    );

    res.status(200).json({
        status: "success",
        data: {
            seller,
            newOwner
        }
    });
});

exports.nftRelisted = catchAsync(async (req, res, next) => {
    const user = await User.findOne(req.user);
    if (!user) {
        return next(new AppError("No User found with that Firebase Token", 400))
    }
    const check = await TokenOwner.findOneAndUpdate({ "token_id": req.body.token_id, "token_address": req.body.token_address, "owner_of": req.body.owner_of },
        { $inc: { sellingQuantity: + req.body.sellingQuantity }, "price": req.body.price });
    if (!check) {
        await TokenOwner.create({ "token_id": req.body.token_id, "token_address": req.body.token_address, "owner_of": req.body.owner_of, "amount": req.body.sellingQuantity, "name": req.body.name, "symbol": req.body.symbol, "sellingQuantity": req.body.sellingQuantity, "price": req.body.price });
    };
    const newSeller = await TokenOwner.findOne({ "token_id": req.body.token_id, "token_address": req.body.token_address, "owner_of": req.body.owner_of })
    res.status(200).json({
        status: "success",
        data: {
            newSeller,
        }
    });
});

exports.updatePrice = catchAsync(async (req, res, next) => {
    const user = await User.findOne(req.user);
    if (!user) {
        return next(new AppError("No User found with that Firebase Token", 400))
    }
    const changePrice = await TokenOwner.findOneAndUpdate({ "token_id": req.body.token_id, "token_address": req.body.token_address, "owner_of": req.body.owner_of },
        {
            "price": req.body.price
        }, {
        new: true,
        runValidators: true,
    }
    );
    if (!changePrice) {
        return next(new AppError("No NFT registered owned by you", 400))
    };

    res.status(200).json({
        status: "success",
        data: {
            changePrice,
        }
    });
});

exports.delistItems = catchAsync(async (req, res, next) => {
    const user = await User.findOne(req.user);
    if (!user) {
        return next(new AppError("No User found with that Firebase Token", 400))
    };
    const changePrice = await TokenOwner.findOneAndUpdate({ "token_id": req.body.token_id, "token_address": req.body.token_address, "owner_of": req.body.owner_of },
        { $inc: { sellingQuantity: -req.body.amount } }, { new: true }
    );
    if (!changePrice) {
        return next(new AppError("No NFT registered owned by you", 400))
    };

    res.status(200).json({
        status: "success",
        data: {
            changePrice,
        }
    });
});

exports.getSingleOwner = catchAsync(async (req, res, next) => {
    const owner = await TokenOwner.findById(req.params._id);

    if (!owner) {
        return next(new AppError("No nft found with that ID", 404))
    }

    res.status(200).json({
        status: "success",
        data: {
            owner
        },
    })
});

exports.getDiscoverItem = catchAsync(async (req, res, next) => {
    const sellingNFT = await TokenOwner.aggregate([
        { $match: { sellingQuantity: { $gte: 1 } } },
        { $sort: { token_id: 1, token_address: 1, price: 1 } },
        {
            $group: {
                _id: { token_id: "$token_id", token_address: "$token_address" },
                document: { $first: "$$ROOT" }
            }
        },
        { $replaceRoot: { newRoot: "$document" } }
    ]);
    let discoverNFT = [];
    for (let i = 0; i < sellingNFT.length; i++) {
        const item = await TokenInfo.findOne({ "token_id": sellingNFT[i].token_id, "token_address": sellingNFT[i].token_address });
        if (item) {
            const modifiedItems = { ...item.toObject(), "owner_id": sellingNFT[i]._id, "sellingQuantity": sellingNFT[i].sellingQuantity, "price": sellingNFT[i].price };
            discoverNFT = [...discoverNFT, modifiedItems];
        }
    }

    discoverNFT.sort((b, a) => new Date(a.created_at) - new Date(b.created_at));

    res.status(200).json({
        status: "success",
        data: {
            discoverNFT
        },
    })
})

exports.getArtistSellingNFT = catchAsync(async (req, res, next) => {
    const cnt = req.query.cnt;
    const artistNFT = await TokenOwner.aggregate([
        { $match: { token_address: cnt, sellingQuantity: { $gt: 0 } } },
        { $sort: { token_id: 1, token_address: 1, price: 1 } },
        {
            $group: {
                _id: { token_id: "$token_id", token_address: "$token_address" },
                document: { $first: "$$ROOT" }
            }
        },
        { $replaceRoot: { newRoot: "$document" } }
    ]);

    let artNFT = [];
    for (let i = 0; i < artistNFT.length; i++) {
        const item = await TokenInfo.findOne({ "token_id": artistNFT[i].token_id, "token_address": artistNFT[i].token_address });
        if (item) {
            console.log(artistNFT[i]);
            console.log(artistNFT[i].price);
            const modifiedItems = { ...item.toObject(), "sellingQuantity": artistNFT[i].sellingQuantity, "owner_id": artistNFT[i]._id, "floor_price": artistNFT[i].price };
            artNFT = [...artNFT, modifiedItems];
        }
    }

    artNFT.sort((b, a) => new Date(a.created_at) - new Date(b.created_at));

    res.status(200).json({
        status: "success",
        data: {
            artNFT
        },
    })
})