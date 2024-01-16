const mongoose = require("mongoose");

const userListeningActivity = mongoose.Schema({
    uid: {
        type: String,
        required: [true, "Missing uid"]
    },

    token_id: {
        type: String,
        required: [true, "Missing tokenId"]
    },

    token_address: {
        type: String,
        required: [true, "Missing tokenAddress"]
    },

    from_where: {
        type: String,
        required: [true, "Missing from_where"]
    },

    isPreview: {
        type: Boolean,
        default: false
    },

    time_stamp: {
        type: Date,
        default: Date.now
    }
});

const UserListeningActivity = mongoose.model("UserListeningActivity", userListeningActivity);

module.exports = UserListeningActivity;