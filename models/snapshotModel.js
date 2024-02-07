const mongoose = require("mongoose");

const SnapshotSchema = new mongoose.Schema({
    date: {
        type: Date,
        default: Date.now,
    },

    numberOfUsers: {
        type: Number,
        required: [true, "Insert number of users"]
    },

    numberOfReproductions: {
        type: Number,
        required: [true, "Insert number of reproductions"]
    },

    reproductionsPerUser: {
        type: Number,
        required: [true, "Insert number of reproductions per user"]
    },

    totalArtistsFans: {
        type: Number,
        required: [true, "Insert number of total artists fans"]
    },

    numberOfOnboardedArtist: {
        type: Number,
        required: [true, "Insert number of onboarded artist"]
    },

    percentageOfAttractedFans: {
        type: Number,
        required: [true, "Insert percentage of attracted fans"]
    },

    artistToUsersRatio: {
        type: Number,
        required: [true, "Insert artist to users ratio"]
    },

    numberOfCryptoWallets: {
        type: Number,
        required: [true, "Insert numberOfCryptoWallets"]
    },

    usersToWalletRatio: {
        type: Number,
        required: [true, "Insert usersToWalletRatio"]
    },

    numberOfContactedArtists: {
        type: Number,
        required: [true, "Insert numberOfContactedArtists"]
    },

    waitingArtistsToContactedRatio: {
        type: Number,
        required: [true, "Insert numberOfContactedArtists"]
    },

    onboardedArtistsToContactedRatio: {
        type: Number,
        required: [true, "Insert numberOfContactedArtists"]
    },

    totalNumberOfTransaction: {
        type: Number,
        required: [true, "Insert number of totalNumberOfTransaction"]
    },

    transactionsToUser: {
        type: Number,
        required: [true, "Insert number of transactionsToUser"]
    },

    transactionsToTokensSupply: {
        type: Number,
        required: [true, "Insert number of transactionsToUser"]
    },

    transactionsToArtist: {
        type: Number,
        required: [true, "Insert number of transactionsToArtist"]
    },

    transactionsToValue: {
        type: Number,
    }

});

const Snapshot = mongoose.model("Email", SnapshotSchema);

module.exports = Snapshot;