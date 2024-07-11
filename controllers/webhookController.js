// controllers/webhookController.js
const NFTOwners = require('../models/tokenOwnerModel');

exports.crossmintWebhook = async (req, res) => {
    if (req.method === "POST") {
        console.log(`[webhook] Successfully received event: ${JSON.stringify(req.body)}`);

        const { type, status, walletAddress, contractAddress, tokenIds, passThroughArgs } = req.body;

        if (type === "purchase.succeeded" && status === "success") {
            try {
                const tokenOwnerData = tokenIds.map(tokenId => ({
                    token_id: tokenId,
                    token_address: contractAddress,
                    owner_of: walletAddress,
                    amount: 1, // Assuming each purchase is for 1 token, adjust if needed
                }));

                await NFTOwners.insertMany(tokenOwnerData);

                console.log(`[webhook] Successfully registered new token owners: ${JSON.stringify(tokenOwnerData)}`);
                res.status(200).json({ message: 'Event processed and data saved' });
            } catch (error) {
                console.error(`[webhook] Error processing event: ${error.message}`);
                res.status(500).json({ message: 'Error processing event', error: error.message });
            }
        } else {
            console.log(`[webhook] Unsupported event type or status`);
            res.status(400).json({ message: 'Unsupported event type or status' });
        }
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
};
