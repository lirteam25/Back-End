const express = require("express");
const {
    getAllNFTsInfo,
    createNFTInfo,
    getSingleNFT,
    updateNFT,
    getSongsFromFirebaseToken,
    getOwnerNFTInfo,
    getSameSongNFTInfo,
    getCreatedSongs
} = require("../controllers/tokenInfoControllers");
const authController = require("../controllers/authController");

const router = express.Router();

//Top 5 NFTs by launch_price
/* router.route('/top-5-nfts')
    .get(aliasTopNFTs, getAllNFTsInfo); */

router.route('/ownersNFTInfo/:token_id/:token_address/:uid')
    .get(getOwnerNFTInfo);

router.route('/ownersNFTInfo')
    .get(authController.verifyTokenFirebase, getSongsFromFirebaseToken)

router.route('/sameSongToVersions').get(getSameSongNFTInfo);

router.route('/createdSong').get(getCreatedSongs);

//Router NFTS
router.route("/")
    .get(getAllNFTsInfo)
    .post(authController.verifyTokenFirebase, authController.restricTo("artist", "admin"), createNFTInfo);

router.route("/:id")
    .get(getSingleNFT)
    .patch(authController.verifyTokenFirebase, authController.restricTo("admin"), updateNFT);


module.exports = router;