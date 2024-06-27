const PriorityQueue = require('js-priority-queue');
const async = require('async');
const User = require('../models/userModel');
const TokenInfo = require('../models/tokenInfoModel');
const TopCollector = require('../models/topCollectorModel');

/* const fetchNFTsForOwner = async (owner, pageKey = null) => {
    const alchemyNetwork = process.env.ALCHEMY_NETWORK == "MATIC_MAINNET" ? "polygon-mainnet" : "polygon-amoy";
    const options = {
        method: 'GET',
        headers: { accept: 'application/json' },
        url: `https://${alchemyNetwork}.g.alchemy.com/nft/v3/${process.env.ALCHEMY_API_KEY}/getNFTsForOwner?owner=${owner}&withMetadata=true&pageSize=100${pageKey ? `&pageKey=${pageKey}` : ''}`
    };

    const response = await axios(options);
    return response.data;
}; */

const fetchNFTsForOwner = async (owner, pageKey = null) => {
    const alchemyNetwork = process.env.ALCHEMY_NETWORK === "MATIC_MAINNET" ? "polygon-mainnet" : "polygon-amoy";
    const url = `https://${alchemyNetwork}.g.alchemy.com/nft/v3/${process.env.ALCHEMY_API_KEY}/getNFTsForOwner?owner=${owner}&withMetadata=true&pageSize=100${pageKey ? `&pageKey=${pageKey}` : ''}`;

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

            if (!response.ok) {
                throw new Error(`Failed to fetch NFTs: ${response.statusText}`);
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
    const excludedOwners = ["0x63dd604e72eb0ec35312e1109c29202072ab9cab"];
    const BATCH_SIZE = 10; // Reduce the batch size to lower the number of simultaneous requests
    const CONCURRENCY_LIMIT = 2; // Lower concurrency to reduce API load
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

    let lastUserId = null;

    const processUser = async (user) => {
        if (excludedOwners.includes(user.uid)) {
            return;
        }

        let pageKey = null;
        let validNFTCount = 0;

        do {
            const nftsResponse = await fetchNFTsForOwner(user.uid, pageKey);
            const NFTs = nftsResponse.ownedNfts;
            pageKey = nftsResponse.pageKey;

            for (const nft of NFTs) {
                const token_id = nft.tokenId;
                const token_address = nft.contract.address;
                const item = await TokenInfo.findOne({ token_id, token_address });
                if (item) {
                    validNFTCount++;
                }
            }
        } while (pageKey);

        if (validNFTCount > 0) {
            const collector = {
                owner_of: user.uid,
                uid: user.uid,
                display_name: user.display_name,
                count: validNFTCount
            };
            updateTopCollectorsQueue(collector);
        }
    };

    while (true) {
        const query = lastUserId ? { _id: { $gt: lastUserId } } : {};
        const usersBatch = await User.find(query).sort({ _id: 1 }).limit(BATCH_SIZE);
        if (usersBatch.length === 0) break;

        await async.eachLimit(usersBatch, CONCURRENCY_LIMIT, async (user) => {
            await processUser(user);
        });

        lastUserId = usersBatch[usersBatch.length - 1]._id;

        // Add delay between batches
        console.log(`Batch processed. Waiting for ${BATCH_DELAY / 1000} seconds before processing the next batch...`);
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
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
