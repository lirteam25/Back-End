const express = require("express");
const artistFormController = require("../controllers/artistFormController");
const authController = require("../controllers/authController");

const router = express.Router();

router.route("/")
    .get(authController.verifyTokenFirebase, authController.restricTo("admin"), artistFormController.getEmail)
    .post(artistFormController.createEmail);

module.exports = router;