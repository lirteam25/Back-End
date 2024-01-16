const mongoose = require("mongoose");

const ArtistFormSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "name is required"]
    },

    email: {
        type: String,
        required: [true, "email is required"]
    },

    instagram: {
        type: String
    },

    spotify: {
        type: String
    },

    soundcloud: {
        type: String
    },

    other: {
        type: String
    }
});

const ArtistForm = mongoose.model("Email", ArtistFormSchema);

module.exports = ArtistForm;