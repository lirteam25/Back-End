const mongoose = require("mongoose");

const liveUserFormSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "email is required"]
    }
});

const liveUserForm = mongoose.model("liveEmail", liveUserFormSchema);

module.exports = liveUserForm;