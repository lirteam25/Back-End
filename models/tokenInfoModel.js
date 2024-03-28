const mongoose = require("mongoose");

const TokenInfoSchema = new mongoose.Schema({
    token_id: {
        type: String,
        required: [true, "Provide the token ID"],
    },

    token_address: {
        type: String,
        required: [true, "Specify the smart contract that minted the NFT"],
    },

    name: {
        type: String,
        required: [true, "Provide the name of the tokens"],
    },

    symbol: {
        type: String,
        required: [true, "Provide the symbol of the tokens"],
    },

    royalties: {
        type: Number,
        required: [true, "Provide royalties"],
    },

    supply: {
        type: Number,
        required: [true, "Provide supply"]
    },

    song: {
        type: String,
        required: [true, "Provide name of the song"],
    },

    artist: {
        type: String,
        required: [true, "Provide the name of the artist"]
    },

    author_address: {
        type: String,
        required: [true, "Provide the author address"],
    },

    description: {
        type: String,
        trim: true,
        required: [true, "Provide the cover image"],
        select: false,
    },

    musicTag: {
        type: Array,
        required: [true, "Provide the music tag"]
    },

    imageSongPinata: {
        type: String,
        required: [true, "Provide the imageSong"]
    },

    imageSongCloudinary: {
        type: String,
        required: [true, "Provide the imageSongCloudinary"]
    },

    audioPinata: {
        type: String,
        required: [true, "Provide the audio IPFS link"],
        select: false
    },

    audioPreview: {
        type: String,
        required: [true, "Provide the audio url"],
    },

    audioCloudinary: {
        type: String,
        required: [true, "Provide the audio url"],
        select: false
    },

    audioDuration: {
        type: String,
    },

    token_URI: {
        type: String,
        required: [true, "Provide the token URI"],
        select: false
    },

    launch_price: {
        type: Number,
        required: [true, 'Provide the launch price'],
    },

    launch_date: {
        type: Date,
        default: Date.now
    },

    created_at: {
        type: Date,
        default: Date.now
    }
});


//Mongoose MiddleWare

//Document Middleware: runs before .save() or .create(). Do not work when you update a document
// The slug is the URL
/* nftInfoSchema.pre("save", function (next) {
    //console.log(this);
    this.slug = slugify(this.song, { lower: true });
    next();
}) */

/* nftSchema.pre('findOneAndUpdate', function (next) {
    this.set({ lastInteractionAt: Date.now() });
    next();
});

nftSchema.pre('update', function (next) {
    this.set({ lastInteractionAt: Date.now() });
    next();
}); */

//Run after the data is saved into the database
/* nftSchema.post("save", function (doc, next) {
    console.log(doc);
    next();
}) */

//How to hide NFTs
/* TokenInfoSchema.pre(/^find/, function (next) {
    const currentDate = new Date();
    this.find({ launch_date: { $lte: currentDate } });
    next();
}); */

const TokenInfo = mongoose.model("NFTInfo", TokenInfoSchema);

module.exports = TokenInfo;