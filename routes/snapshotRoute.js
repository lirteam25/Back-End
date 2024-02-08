const express = require("express");
const snapshotController = require("../controllers/snapshotController");
const authController = require("../controllers/authController");

const router = express.Router();

router.route("/")
    .get(authController.verifyTokenFirebase, authController.restricTo("admin"), snapshotController.getReport);

module.exports = router;