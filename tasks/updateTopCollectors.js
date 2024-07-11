const PriorityQueue = require('js-priority-queue');
const async = require('async');
const User = require('../models/userModel');
const TokenInfo = require('../models/tokenInfoModel');
const TopCollector = require('../models/topCollectorModel');

const fetchOwnersForNFT = async (contractAddress, tokenId) => {
    const alchemyNetwork = process.env.ALCHEMY_NETWORK === "MATIC_MAINNET" ? "polygon-mainnet" : "polygon-amoy";
    const apiKey = process.env.ALCHEMY_NETWORK == "MATIC_MAINNET" ? process.env.ALCHEMY_API_KEY_CRON_PROD : process.env.ALCHEMY_API_KEY_TEST;
    const url = `https://${alchemyNetwork}.g.alchemy.com/nft/v3/${apiKey}/getOwnersForNFT?contractAddress=${contractAddress}&tokenId=${tokenId}`;

    const options = {
        method: 'GET',
        headers: { accept: 'application/json' },
    };

    const fetch = await import('node-fetch').then(mod => mod.default); // Dynamic import

    let attempts = 0;
    const maxAttempts = 5;
    const baseDelay = 1000; // Initial delay in milliseconds

    while (attempts < maxAttempts) {
        try {
            const response = await fetch(url, options);

            if (response.status === 429) {
                throw new Error('Rate limit exceeded');
            }

            if (response.status === 404) {
                console.error(`NFT not found: Contract Address: ${contractAddress}, Token ID: ${tokenId}`);
                return null; // Skip if NFT not found
            }

            if (!response.ok) {
                throw new Error(`Failed to fetch owners: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            if (error.message === 'Rate limit exceeded' && attempts < maxAttempts - 1) {
                const delay = baseDelay * Math.pow(2, attempts); // Exponential backoff
                console.log(`Rate limit exceeded. Retrying in ${delay / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                attempts++;
            } else {
                throw error;
            }
        }
    }

    throw new Error('Max retries reached');
};

const updateTopCollectors = async () => {
    const BATCH_SIZE = 10; // Reduce the batch size to lower the number of simultaneous requests
    const BATCH_DELAY = 10000; // 10 seconds delay between batches

    const topCollectorsQueue = new PriorityQueue({ comparator: (a, b) => a.count - b.count });

    const updateTopCollectorsQueue = (collector) => {
        if (topCollectorsQueue.length < 10) {
            topCollectorsQueue.queue(collector);
        } else if (collector.count > topCollectorsQueue.peek().count) {
            topCollectorsQueue.dequeue();
            topCollectorsQueue.queue(collector);
        }
    };

    const tokenInfoList = await TokenInfo.find({});
    const userMap = new Map();

    for (const tokenInfo of tokenInfoList) {
        try {
            const ownersResponse = await fetchOwnersForNFT(tokenInfo.token_address, tokenInfo.token_id);
            if (!ownersResponse) continue; // Skip if NFT not found

            const owners = ownersResponse.owners;
            for (const owner of owners) {
                if (!userMap.has(owner)) {
                    const user = await User.findOne({ uid: owner });
                    if (user) {
                        userMap.set(owner, { user, count: 0 });
                    }
                }
                if (userMap.has(owner)) {
                    userMap.get(owner).count++;
                }
            }

            // Add delay between batches
            console.log(`Batch processed. Waiting for ${BATCH_DELAY / 1000} seconds before processing the next batch...`);
            await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));

        } catch (error) {
            console.error(`Error processing token: Contract Address: ${tokenInfo.token_address}, Token ID: ${tokenInfo.token_id}, Error: ${error.message}`);
            continue; // Skip the current tokenInfo and proceed with the next one
        }
    }

    for (const [owner, { user, count }] of userMap) {
        if (count > 0) {
            const collector = {
                owner_of: owner,
                uid: user.uid,
                display_name: user.display_name,
                count: count
            };
            updateTopCollectorsQueue(collector);
        }
    }

    const topCollectors = [];
    while (topCollectorsQueue.length > 0) {
        topCollectors.push(topCollectorsQueue.dequeue());
    }
    topCollectors.reverse();

    await TopCollector.deleteMany({});
    await TopCollector.insertMany(topCollectors);
};

module.exports = { updateTopCollectors };
