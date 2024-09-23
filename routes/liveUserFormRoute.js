const express = require("express");
const liveUserFormController = require("../controllers/liveUserFormController");
const authController = require("../controllers/authController");

const router = express.Router();

router.route("/")
    .get(authController.verifyTokenFirebase, authController.restricTo("admin"), liveUserFormController.getEmail)
    .post(liveUserFormController.saveEmail);

module.exports = router;