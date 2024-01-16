const express = require("express");
const userListeningActivityControllers = require("./../controllers/userListeningActivityControllers");
const authController = require("../controllers/authController");

const router = express.Router();

router.route("/anonymous").post(userListeningActivityControllers.createAnonymousActivity);

router.route("/").post(authController.verifyTokenFirebase, userListeningActivityControllers.createActivity);

module.exports = router;