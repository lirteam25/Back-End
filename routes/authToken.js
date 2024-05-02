const express = require("express");
const authTokenController = require("../controllers/authTokenController");

const router = express.Router();

//Top 5 NFTs by launch_price
/* router.route('/top-5-nfts')
    .get(aliasTopNFTs, getAllNFTsInfo); */

router.route('/')
    .post(authTokenController.authToken)

module.exports = router;