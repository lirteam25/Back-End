const express = require("express");
const userControllers = require("./../controllers/userControllers");
const authController = require("./../controllers/authController");

const router = express.Router();

router.route("/")
    .get(authController.verifyTokenFirebase, authController.restricTo("admin"), userControllers.getAllUsers)
    .post(authController.verifyTokenFirebase, userControllers.createUser);

//Update password and updateMe
router.route("/createUserGoogleLogin").post(authController.verifyTokenFirebase, userControllers.createUserGoogleLogin);

router.route("/getMe").get(authController.verifyTokenFirebase, userControllers.getMe);
router.route("/updateMe").patch(authController.verifyTokenFirebase, userControllers.updateMe);
router.route("/deleteMe").delete(authController.verifyTokenFirebase, userControllers.deleteMe);

router.route("/artistName").get(userControllers.fetchArtistName);

router.route("/top10Collectors").get(userControllers.getTopCollectors);

router.route("/supporters/:token_id/:token_address").get(userControllers.getSupporters);

router.route("/:id").get(authController.verifyTokenFirebase, authController.restricTo("admin"), userControllers.getSingleUser);


module.exports = router;