const express = require("express");
const router = express.Router();

const mainController = require("../controllers");

router.post("/getToken/:account", mainController.getTransaction);
router.get("/cancell/listener/:chainid", mainController.stopListening);
router.get("/getStartTime", mainController.getStartTime);

module.exports = router;