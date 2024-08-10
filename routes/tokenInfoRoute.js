const express = require("express");
const {
    getAllNFTsInfo,
    createNFTInfo,
    getSingleNFT,
    updateNFT,
    getSongsFromFirebaseToken,
    getOwnerNFTInfo,
    getSameSongNFTInfo,
    getCreatedSongs,
    addComment,
    purchasedNFTInfo
} = require("../controllers/tokenInfoControllers");
const authController = require("../controllers/authController");

const router = express.Router();

router.route('/ownersNFTInfo/:token_id/:token_address/:uid')
    .get(getOwnerNFTInfo);

router.route('/ownersNFTInfo')
    .get(authController.verifyTokenFirebase, getSongsFromFirebaseToken)

router.route('/createdSong').get(getCreatedSongs);

router.route("/addComment/:id").patch(authController.verifyTokenFirebase, addComment);

//Router NFTS
router.route("/")
    .get(getAllNFTsInfo)
    .post(authController.verifyTokenFirebase, authController.restricTo("artist", "admin"), createNFTInfo);

router.route('/purchasedSuccedeed/:token_id/:token_address').post(purchasedNFTInfo);

router.route("/:id")
    .get(getSingleNFT)
    .patch(authController.verifyTokenFirebase, authController.restricTo("admin"), updateNFT);


module.exports = router;