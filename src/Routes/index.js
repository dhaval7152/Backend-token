const express = require("express");
const router = express.Router();

const mainController = require("../controllers");

router.get("/getToken/:account", mainController.getTransaction);
router.get("/getToken_calulation/:account", mainController.getTransactionWithCalculation);
router.get("/cancell/listener/:chainid", mainController.stopListening);
router.get("/getStartTime", mainController.getStartTime);
router.post("/updateBalance", mainController.updateBalance);
router.get("/getTrxs", mainController.viewTrx);

module.exports = router;
// 