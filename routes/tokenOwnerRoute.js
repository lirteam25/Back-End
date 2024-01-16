const express = require("express");
const tokenOwnerControllers = require("./../controllers/tokenOwnerControllers");
const authController = require("../controllers/authController");

const router = express.Router();

router.route("/")
    .get(tokenOwnerControllers.getNFTOwners)
    .post(authController.verifyTokenFirebase, tokenOwnerControllers.createNFTOwner);

router.route("/mynfts")
    .get(authController.verifyTokenFirebase, tokenOwnerControllers.getMyNFTs);

router.route("/nftSold")
    .patch(authController.verifyTokenFirebase, tokenOwnerControllers.nftSold);

router.route("/nftRelisted")
    .patch(authController.verifyTokenFirebase, tokenOwnerControllers.nftRelisted);

router.route("/updatePrice")
    .patch(authController.verifyTokenFirebase, tokenOwnerControllers.updatePrice);

router.route("/delistItems")
    .patch(authController.verifyTokenFirebase, tokenOwnerControllers.delistItems);

router.route("/discoverItem")
    .get(tokenOwnerControllers.getDiscoverItem);

router.route("/artistNFT")
    .get(tokenOwnerControllers.getArtistSellingNFT);

router.route("/:_id")
    .get(tokenOwnerControllers.getSingleOwner);

module.exports = router;