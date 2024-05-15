const mongoose = require("mongoose");

const nftOwnersSchema = new mongoose.Schema({
    token_id: {
        type: String,
        required: [true, "An NFT must have an ID"],
    },

    token_address: {
        type: String,
        required: [true, "Specify the smart contract that minted the NFT"],
    },

    owner_of: {
        type: String,
        required: [true, "Specify the owner"]
    },

    amount: {
        type: Number,
        required: [true, "Provide the amount owned"]
    },

    check: {
        type: Boolean,
        default: true,
    },

    isFirstSale: {
        type: Boolean,
        default: false,
    },

    sellingQuantity: {
        type: Number,
        default: 0,
    },

    listing_id: {
        type: Number,
    },

    price: {
        type: Number,
    },

    date: {
        type: Date,
        default: Date.now,
    }
});

const NFTOwners = mongoose.model("NFTOwners", nftOwnersSchema);

module.exports = NFTOwners;