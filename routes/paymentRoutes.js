const express = require("express");
const router = express.Router();
const {
  deposit,
  payment,
  withdraw,
  mpesaCallback,
} = require("../controllers/paymentController");

// ✅ Payment Routes
router.post("/deposit", deposit);
router.post("/payment", payment);
router.post("/withdraw", withdraw);
router.post("/callback", mpesaCallback);

module.exports = router;
