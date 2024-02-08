const mongoose = require("mongoose");

const SnapshotSchema = new mongoose.Schema({
    date: {
        type: Date,
        default: Date.now,
        unique: true,
    },

    numberOfUsers: {
        type: Number,
        required: [true, "Insert number of users"]
    },

    numberOfWallets: {
        type: Number,
        required: [true, "Insert numberOfCryptoWallets"]
    },

    numberOfCollectingUsers: {
        type: Number,
        required: [true, "Insert number of users"]
    },

    usersToWallet: {
        type: Number,
        required: [true, "Insert usersToWalletRatio"]
    },

    usersToCollectingUsers: {
        type: Number,
        required: [true, "Insert usersHowReedemedATokenToUserRatio"]
    },

    walletToCollectingUsers: {
        type: Number,
        required: [true, "Insert number of walletToUsersHowReedemedAToken"]
    },

    numberOfReproductionsTotalTrack: {
        type: Number,
        required: [true, "Insert number of reproductions"]
    },

    numberOfReproductionsPreview: {
        type: Number,
        required: [true, "Insert number of reproductions"]
    },

    ReproductionsTotalTrackPerCollectingUser: {
        type: Number,
        required: [true, "Insert number of reproductions per user"]
    },



    numberOfOnboardedArtists: {
        type: Number,
        required: [true, "Insert number of onboarded artist"]
    },

    usersToArtist: {
        type: Number,
        required: [true, "Insert artist to users ratio"]
    },

    walletsToArtist: {
        type: Number,
        required: [true, "Insert artist to users ratio"]
    },

    collectingUsersToArtist: {
        type: Number,
        required: [true, "Insert artist to users ratio"]
    },

    totalArtistsFans: {
        type: Number,
        required: [true, "Insert number of total artists fans"]
    },

    percentageOfAttractedFans: {
        type: Number,
        required: [true, "Insert percentage of attracted fans"]
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

    totalNumberOfTransactions: {
        type: Number,
        required: [true, "Insert number of totalNumberOfTransaction"]
    },

    transactionsToUser: {
        type: Number,
        required: [true, "Insert number of transactionsToUser"]
    },

    transactionsToWallet: {
        type: Number,
        required: [true, "Insert number of transactionsToWallet"]
    },

    transactionsToCollectingUser: {
        type: Number,
        required: [true, "Insert number of transactionsToCollectingUser"]
    },

    totalTokensSupply: {
        type: Number,
        required: [true, "Insert number of totalTokensSupply"]
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