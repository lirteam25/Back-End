const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
    token_id: {
        type: String,
        required: [true, "An NFT must have an ID"]
    },

    token_address: {
        type: String,
        required: [true, "Specify the smart contract that minted the NFT"],
    },

    quantity: {
        type: [Number],
    },

    transactions: {
        type: [String],
    },

    transactions_type: {
        type: [String],
    },

    price: {
        type: [Number],
    },

    date: {
        type: [Date],
    },
});

transactionSchema.pre("save", function (next) {
    if (this.isNew) {
        this.date = Date.now();
        next();
    }
    else {
        return;
    }
});

const Transactions = mongoose.model("Transactions", transactionSchema);

module.exports = Transactions;
