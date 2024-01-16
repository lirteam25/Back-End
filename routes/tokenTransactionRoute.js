const express = require("express");
const tokenTransactionController = require("../controllers/tokenTransactionControllers");
const authController = require("../controllers/authController");

const router = express.Router();

router.route("/").get(tokenTransactionController.getAllTransactions);
router.route("/").post(authController.verifyTokenFirebase, authController.restricTo("artist", "admin"), tokenTransactionController.createNFTTransactionRecords);

router.route("/addTransaction").patch(authController.verifyTokenFirebase, tokenTransactionController.addTransaction);

module.exports = router;