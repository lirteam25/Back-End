const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    uid: {
        type: String,
        required: [true, "Name is required"],
        unique: true,
    },

    role: {
        type: String,
        enum: ["user", "artist", "admin"],
        default: "user"
    },

    wallet: {
        type: String,
        unique: [true, "One wallet can be connected only to one user. Please change the wallet connected because already connected to another account"],
        sparse: true,
    },

    picture: {
        type: Number,
        default: Math.floor(Math.random() * 4) + 1
    },

    artist_minting_contract: {
        type: String,
    },

    artist_name: {
        type: String,
    },

    artist_photo: {
        type: String
    },

    artist_description: {
        type: String
    },

    artist_instagram: {
        type: String
    },

    artist_soundcloud: {
        type: String
    },

    artist_spotify: {
        type: String
    },

    artist_first_sale_fee: {
        type: Number
    },

    active: {
        type: Boolean,
        default: true,
        select: false
    },
});

userSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;