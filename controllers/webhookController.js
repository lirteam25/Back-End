// controllers/webhookController.js
const NFTOwners = require('../models/tokenOwnerModel');
const User = require('../models/userModel');
const TokenInfo = require('../models/tokenInfoModel');
const sendEmail = require("../Utils/sendEmail");
const AppError = require("../Utils/appError");
const catchAsync = require('../utils/catchAsync');

exports.crossmintWebhook = catchAsync(async (req, res, next) => {
    if (req.method !== "POST") {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    console.log(`[webhook] Successfully received event: ${JSON.stringify(req.body)}`);

    const { type, status, walletAddress, contractAddress, tokenIds } = req.body;

    if (type !== "purchase.succeeded" || status !== "success") {
        console.log(`[webhook] Unsupported event type or status`);
        return res.status(400).json({ message: 'Unsupported event type or status' });
    }

    try {
        // Fetch the user who made the purchase
        const user = await User.findOne({ uid: walletAddress });
        if (!user) {
            return next(new AppError("No User found with that wallet address", 400));
        }

        // Update token ownership information
        const tokenOwnerData = tokenIds.map(tokenId => ({
            token_id: tokenId,
            token_address: contractAddress,
            owner_of: walletAddress,
            amount: 1, // Assuming each purchase is for 1 token, adjust if needed
        }));

        for (const tokenData of tokenOwnerData) {
            const existingTokenOwner = await NFTOwners.findOne({
                token_id: tokenData.token_id,
                token_address: tokenData.token_address,
                owner_of: tokenData.owner_of
            });

            if (existingTokenOwner) {
                await NFTOwners.findOneAndUpdate({
                    token_id: tokenData.token_id,
                    token_address: tokenData.token_address,
                    owner_of: tokenData.owner_of
                }, { $inc: { amount: +1 } });
            } else {
                await NFTOwners.create(tokenData);
            }
        }

        // Update seller information
        const tokenId = tokenIds[0]; // Assuming all token IDs are from the same NFT
        const seller = await NFTOwners.findOneAndUpdate({
            token_id: tokenId,
            token_address: contractAddress,
            isFirstSale: true
        }, { $inc: { sellingQuantity: -1 } });

        if (!seller) {
            return next(new AppError(`No seller found`, 400));
        }

        const price = seller.price;
        const sellerUser = await User.findOne({ uid: seller.owner_of });

        if (sellerUser && sellerUser.artist_email) {
            // Send Email
            await sendEmail(sellerUser.artist_email, "LIR MUSIC - Your Track Has Been Sold", `
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Your token has been sold</title>
                    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400&display=swap" rel="stylesheet">
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
                    <style>
                        .fab:hover { color: rgb(214, 11, 82); }
                        body, h1, p, a { font-family: 'Space Grotesk', sans-serif; }
                    </style>
                </head>
                <body style="color:white; background-color:rgb(17,17,17); font-family:sans-serif; padding: 50px 10%; overflow: auto">
                    <div style="margin: 50px 0">
                        <h1 style="color:rgb(214, 11, 82); text-align:center; text-transform:uppercase; margin: 0;">Congratulations</h1>
                        <div style="text-align:center; font-size: 18px; font-family: 'Space Grotesk', sans-serif">Your track has been bought</div>
                    </div>
                    <div style="background-color:rgb(27,27,27); padding: 10px 30px; border: 1px solid rgb(48, 48, 48); margin: 40px 0; font-size: 18px;">
                        <p style="margin: 20px 0;">Dear ${sellerUser.artist_name},</p>
                        <p style="margin: 20px 0">We are delighted to inform you that your track has been sold on our platform. The purchase price for your track was $${price}. <br/>For more details about this transaction, please visit <a href="https://www.lirmusic.com" style="color: rgb(214, 11, 82); text-decoration: none;">lirmusic.com</a>.</p>
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
                </body>
                </html>
            `);
        }

        console.log(`[webhook] Successfully registered new token owners: ${JSON.stringify(tokenOwnerData)}`);
        res.status(200).json({ message: 'Event processed and data saved' });
    } catch (error) {
        console.error(`[webhook] Error processing event: ${error.message}`);
        res.status(500).json({ message: 'Error processing event', error: error.message });
    }
});

