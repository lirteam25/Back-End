const TokenOwner = require("../models/tokenOwnerModel");
const User = require("../models/userModel");
const TokenInfo = require("../models/tokenInfoModel");
const catchAsync = require("../Utils/catchAsync");
const APIFeatures = require("../Utils/apiFeatures");
const AppError = require("../Utils/appError");
const admin = require('firebase-admin');
const { sendEmail } = require("../Utils/sendEmail");
const { Alchemy, Network } = require("alchemy-sdk");
const { createThirdwebClient, getContract, readContract, resolveMethod } = require("thirdweb");
const { getActiveClaimCondition } = require("thirdweb/extensions/erc1155");
const { polygonAmoy } = require("thirdweb/chains");
const { ethers } = require("ethers");
const { parse } = require("@ethersproject/transactions");

//Create NFT
exports.createNFTOwner = catchAsync(async (req, res, next) => {
    const newNFTOwner = await TokenOwner.create(req.body);

    //Email creation
    const user = await User.findOne(req.user);
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
                  <p style="margin: 20px 0;">Dear ${user.artist_name},</p>
                  <p style="margin: 20px 0">Congratulations on creating ${req.body.amount} tokens representing your exclusive music contents! We're excited to inform you that ${req.body.sellingQuantity} tokens are available for purchase on our platform at the price of ${req.body.price}$.</p>
                  <p style="margin: 20px 0">Your music has the power to captivate and inspire, and by creating tokens, you're providing a unique opportunity for your fans and supporters to engage with your creative journey. With your tokens, fans can now own a piece of your music in a whole new way, enabling them to participate in the success and growth of your artistic endeavors. We encourage you to share the news with your fans and promote the availability of your tokens. This will help generate interest and create a buzz around your music.</p>
                  <p>You can always listen to your collected tracks in our mobile application, currently only available on the
                  <a style="color: rgb(214, 11, 82); text-decoration: none;" href='https://play.google.com/store/search?q=LIR%20MUSIC&c=apps&hl=it&gl=US&pcampaignid=pcampaignidMKT-Other-global-all-co-prtnr-py-PartBadge-Mar2515-1'>Google Play Store</a>. </p>
                  <p style="margin: 20px 0">If you have any questions or need assistance in managing your tokens or promoting them to your audience, please don't hesitate to reach out to our dedicated support team at <a href="mailto:info@lirmusic.com" style="color:rgb(214, 11, 82); text-decoration: none">info@lirmusic.com</a>.</p>
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
            nftsOwners: newNFTOwner,
        }
    })
});

/* exports.getNFTOwners = catchAsync(async (req, res, next) => {
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
}); */

exports.getNFTOwners = catchAsync(async (req, res, next) => {

    const config = {
        apiKey: process.env.ALCHEMY_API_KEY,
        network: Network.MATIC_AMOY,
    };
    const alchemy = new Alchemy(config);

    const token_address = req.query.token_address;
    const token_id = req.query.token_id;
    let owners = [];

    try {
        // Fetch NFT owners using Alchemy SDK
        const nftsResponse = await alchemy.nft.getOwnersForNft(token_address, token_id);
        owners = nftsResponse.owners;

    } catch (error) {
        console.log(error)
    }
    // Send response
    res.status(200).json({
        status: "success",
        result: owners.length,
        data: {
            owners: owners,
        },
    });
});

exports.getMyNFTs = catchAsync(async (req, res, next) => {
    const user = await User.findOne(req.user);
    if (!user) {
        return next(new AppError("No User found with that Firebase Token", 400))
    };
    const nfts = await TokenOwner.find({ "owner_of": user.uid });
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
    const checkamount = await TokenOwner.find({ "token_id": req.body.token_id, "token_address": req.body.token_address, "owner_of": req.body.owner_of });
    if (!checkamount) {
        return next(new AppError(`No seller found with ${req.body.owner_of} address`, 400))
    };
    let seller;
    if (checkamount[0].amount <= 0) {
        seller = await TokenOwner.findOneAndUpdate({ "token_id": req.body.token_id, "token_address": req.body.token_address, "owner_of": req.body.owner_of },
            { $inc: { sellingQuantity: -1 } });
    } else {
        seller = await TokenOwner.findOneAndUpdate({ "token_id": req.body.token_id, "token_address": req.body.token_address, "owner_of": req.body.owner_of },
            { $inc: { sellingQuantity: -1, amount: -1 } });
    }

    const price = seller.price;
    const sellerUser = await User.findOne({ "uid": req.body.owner_of })

    if (sellerUser.artist_email) {
        //Send Email
        await sendEmail(sellerUser.artist_email, "LIR MUSIC - Your Track Has Been Sold",
            `<html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your token has been sold </title>
            <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400&display=swap" rel="stylesheet" >
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
        
            <style>
        .fab:hover {
                color: rgb(214, 11, 82); /* Change the color on hover
            }
            body, h1, p, a {
                font-family: 'Space Grotesk', sans-serif;
            }
            </style>
        </head>
        <div style="color:white; background-color:rgb(17,17,17); font-family:sans-serif; padding: 50px 10%; overflow: auto">
                <div style="margin: 50px 0">
        <h1 style="color:rgb(214, 11, 82); text-align:center; text-transform:uppercase; margin: 0;">Congratulations</h1>
        <div style="text-align:center; font-size: 18px; font-family: 'Space Grotesk', sans-serif">your track has been bought</div> 
        </div>
                <div style="background-color:rgb(27,27,27); padding: 10px 30px; border: 1px solid rgb(48, 48, 48); margin: 40px 0; font-size: 18px;">
                  <p style="margin: 20px 0;">Dear,</p>
                  <p style="margin: 20px 0">We are delighted to inform you that your track has been sold on our platform. The purchase price for your track was ${price}$. <br/>For more details about this transaction, please visit <a href="https://www.lirmusic.com" style="color: rgb(214, 11, 82); text-decoration: none;">lirmusic.com</a>.</p>
                  <p style="margin: 20px 0">If you have any questions or need assistance in managing your tracks, please don't hesitate to reach out to our dedicated support team at <a href="mailto:info@lirmusic.com" style="color:rgb(214, 11, 82); text-decoration: none">info@lirmusic.com</a>.</p>
                  <p style="margin: 20px 0">Once again, congratulations for the sale!</p>
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
              </html>`
        );
    }

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
    /*     const buyerEmail = await admin.auth()
            .getUser(user.uid).then((result) => {
                const email = result.email
                return email;
            })
            .catch(function (error) {
                return next(new AppError(error, 401));
            });
        await sendEmail(buyerEmail, "LIR MUSIC - Track Purchase Confirmation",
            `<html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Token Purchase Confirmation </title>
                <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400&display=swap" rel="stylesheet" >
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
            
                <style>
            .fab:hover {
                    color: rgb(214, 11, 82); /* Change the color on hover 
                }
                body, h1, p, a {
                    font-family: 'Space Grotesk', sans-serif;
                }
                </style>
            </head>
            <div style="color:white; background-color:rgb(17,17,17); font-family:sans-serif; padding: 50px 10%; overflow: auto">
                    <div style="margin: 50px 0">
            <h1 style="color:rgb(214, 11, 82); text-align:center; text-transform:uppercase; margin: 0;">Congratulations</h1>
            <div style="text-align:center; font-size: 18px; font-family: 'Space Grotesk', sans-serif">your track purchase was successful</div> 
            </div>
                    <div style="background-color:rgb(27,27,27); padding: 10px 30px; border: 1px solid rgb(48, 48, 48); margin: 40px 0; font-size: 18px;">
                      <p style="margin: 20px 0;">Dear,</p>
                      <p style="margin: 20px 0">
                      We are pleased to confirm that you have successfully collected a track on our platform. 
                      Consider it a little treasure, as you are one of the exclusive holders of this track. 
                      For more details about this transaction, please visit
                      <a href="https://www.lirmusic.com" style="color: rgb(214, 11, 82); text-decoration: none;">lirmusic.com</a>.
                      </p>
                      <p>You can always listen to your collected tracks in our mobile application, currently only available for
                      <a style="color: rgb(214, 11, 82); text-decoration: none;" href='https://play.google.com/store/search?q=LIR%20MUSIC&c=apps&hl=it&gl=US&pcampaignid=pcampaignidMKT-Other-global-all-co-prtnr-py-PartBadge-Mar2515-1'>Android</a>. </p>
                      <p style="margin: 20px 0">If you have any questions or need assistance in managing your collected tracks, please don't hesitate to reach out to our dedicated support team at <a href="mailto:info@lirmusic.com" style="color:rgb(214, 11, 82); text-decoration: none">info@lirmusic.com</a>.</p>
                      <p style="margin: 20px 0">Once again, congratulations for the purchase!</p>
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
                  </html>`
        ); */

    res.status(200).json({
        status: "success",
        data: {
            seller,
            newOwner
        }
    });
});

exports.nftSondCreditCard = catchAsync(async (req, res, next) => {
    const user = await User.findOne(req.user);
    if (!user) {
        return next(new AppError("No User found with that Firebase Token", 400))
    }
    if (!user) {
        return next(new AppError("No User found with that wallet", 400))
    }
    //Update Seller 
    const seller = await TokenOwner.findOneAndUpdate({ "token_id": req.body.token_id, "token_address": req.body.token_address, "isFirstSale": true },
        { $inc: { sellingQuantity: -1 } });

    if (!seller) {
        return next(new AppError(`No seller found`, 400))
    };
    const price = seller.price;
    const sellerUser = await User.findOne({ "uid": seller.owner_of })

    if (sellerUser.artist_email) {
        //Send Email
        await sendEmail(sellerUser.artist_email, "LIR MUSIC - Your Track Has Been Sold",
            `<html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your token has been sold </title>
            <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400&display=swap" rel="stylesheet" >
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
        
            <style>
        .fab:hover {
                color: rgb(214, 11, 82); /* Change the color on hover
            }
            body, h1, p, a {
                font-family: 'Space Grotesk', sans-serif;
            }
            </style>
        </head>
        <div style="color:white; background-color:rgb(17,17,17); font-family:sans-serif; padding: 50px 10%; overflow: auto">
                <div style="margin: 50px 0">
        <h1 style="color:rgb(214, 11, 82); text-align:center; text-transform:uppercase; margin: 0;">Congratulations</h1>
        <div style="text-align:center; font-size: 18px; font-family: 'Space Grotesk', sans-serif">your track has been bought</div> 
        </div>
                <div style="background-color:rgb(27,27,27); padding: 10px 30px; border: 1px solid rgb(48, 48, 48); margin: 40px 0; font-size: 18px;">
                  <p style="margin: 20px 0;">Dear,</p>
                  <p style="margin: 20px 0">We are delighted to inform you that your track has been sold on our platform. The purchase price for your track was ${price}$. <br/>For more details about this transaction, please visit <a href="https://www.lirmusic.com" style="color: rgb(214, 11, 82); text-decoration: none;">lirmusic.com</a>.</p>
                  <p style="margin: 20px 0">If you have any questions or need assistance in managing your tracks, please don't hesitate to reach out to our dedicated support team at <a href="mailto:info@lirmusic.com" style="color:rgb(214, 11, 82); text-decoration: none">info@lirmusic.com</a>.</p>
                  <p style="margin: 20px 0">Once again, congratulations for the sale!</p>
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
              </html>`
        );
    }

    //Update newOwner
    let updateData = { $inc: { amount: +1 } };
    const check1 = await TokenOwner.findOne({ "token_id": req.body.token_id, "token_address": req.body.token_address, "owner_of": req.user.uid })
    if (check1) {
        if (check1.amount === 0) {
            updateData.$set = { date: new Date() };
        }
        await TokenOwner.findOneAndUpdate({ "token_id": req.body.token_id, "token_address": req.body.token_address, "owner_of": req.user.uid },
            updateData
        );
    } else {
        await TokenOwner.create({ "token_id": req.body.token_id, "token_address": req.body.token_address, "owner_of": req.user.uid, "amount": 1 });
    }
    const newOwner = await TokenOwner.findOne({ "token_id": req.body.token_id, "token_address": req.body.token_address, "owner_of": req.user.uid });
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
        { $inc: { sellingQuantity: + req.body.sellingQuantity }, "price": req.body.price, "listing_id": req.body.listing_id });
    if (!check) {
        await TokenOwner.create(req.body);
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

    const client = createThirdwebClient({
        clientId: process.env.THIRDWEB_PROJECT_ID,
    });

    // Step 1: Fetch distinct smart contracts from TokenInfo
    const contracts = await TokenInfo.distinct("token_address");

    let discoverNFT = [];

    // Step 2: Loop through each contract
    for (const address of contracts) {
        // Fetch all token info for the current contract
        const tokens = await TokenInfo.find({ token_address: address });

        for (const token of tokens) {
            try {
                const chain = polygonAmoy;

                // Step 3: Use Thirdweb SDK to get active claim conditions
                const contract = getContract({ client, chain, address });
                const activeClaimConditions = await getActiveClaimCondition({
                    contract,
                    tokenId: token.token_id
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

                // Remove supply and price attributes from token object
                const { supply, launch_price, ...tokenWithoutSupplyAndPrice } = token.toObject();

                // Merge converted conditions into the token object
                const modifiedItems = {
                    ...tokenWithoutSupplyAndPrice,
                    ...convertedConditions
                };

                discoverNFT.push(modifiedItems);
            } catch (error) {
                console.error(`Error fetching claim conditions for token ID ${token.token_id} at address ${address}:`, error);
            }
        }
    }

    // Step 4: Sort the discoverNFT array by created_at date
    discoverNFT.sort((b, a) => new Date(a.created_at) - new Date(b.created_at));

    // Step 5: Send the response
    res.status(200).json({
        status: "success",
        data: {
            discoverNFT
        },
    });
});

/* exports.getDiscoverItem = catchAsync(async (req, res, next) => {
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
}) */

exports.getArtistSellingNFT = catchAsync(async (req, res, next) => {
    const client = createThirdwebClient({
        clientId: process.env.THIRDWEB_PROJECT_ID,
    });

    const artistWallet = req.query.uid;

    // Step 1: Fetch token info for the given artist wallet address
    const tokens = await TokenInfo.find({ author_address: artistWallet });

    if (tokens.length === 0) {
        return next(new AppError("No tokens found for the given artist wallet address", 404));
    }

    let artNFT = [];

    // Step 2: Loop through each token for the given artist
    for (const token of tokens) {
        try {
            const chain = polygonAmoy;
            const token_address = token.token_address;
            const token_id = token.token_id;

            // Step 3: Use Thirdweb SDK to get active claim conditions
            const contract = getContract({ client, chain, address: token_address });
            const activeClaimConditions = await getActiveClaimCondition({
                contract,
                tokenId: token_id
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

            // Remove supply and price attributes from token object
            const { supply, launch_price, ...tokenWithoutSupplyAndPrice } = token.toObject();

            // Merge converted conditions into the token object
            const modifiedItems = {
                ...tokenWithoutSupplyAndPrice,
                ...convertedConditions
            };

            artNFT.push(modifiedItems);
        } catch (error) {
            console.error(`Error fetching active claim conditions for token ID ${token.token_id} at address ${token.token_address}:`, error);
        }
    }

    // Step 4: Sort the artNFT array by created_at date
    artNFT.sort((b, a) => new Date(a.created_at) - new Date(b.created_at));

    // Step 5: Send the response
    res.status(200).json({
        status: "success",
        data: {
            artNFT
        }
    });
});

/* exports.getArtistSellingNFT = catchAsync(async (req, res, next) => {
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
}) */