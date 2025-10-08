const axios = require("axios");
const pool = require("../db/db");
const getMpesaToken = require("../db/mpesaAuth");
require("dotenv").config();

/* ✅ SAVE TRANSACTION */
async function saveTransaction(userId, type, amount, status, phone) {
  try {
    const query = `
      INSERT INTO transactions (user_id, type, amount, status, phone)
      VALUES ($1, $2, $3, $4, $5) RETURNING *;
    `;
    const values = [userId, type, amount, status, phone];
    const { rows } = await pool.query(query, values);
    return rows[0];
  } catch (err) {
    console.error("❌ Error saving transaction:", err.message);
  }
}

/* ✅ UPDATE BALANCE */
async function updateUserBalance(userId, amount, type) {
  try {
    let query = "";
    if (type === "deposit") {
      query = `UPDATE users SET balance = balance + $1 WHERE firebase_uid = $2`;
    } else if (type === "payment" || type === "withdraw") {
      query = `UPDATE users SET balance = balance - $1 WHERE firebase_uid = $2`;
    }
    await pool.query(query, [amount, userId]);
  } catch (err) {
    console.error("❌ Error updating balance:", err.message);
  }
}

/* ✅ DEPOSIT */
exports.deposit = async (req, res) => {
  const { userId, amount, phone } = req.body;
  if (!userId || !amount || !phone) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const formattedPhone = phone.startsWith('0') ? `254${phone.slice(1)}` : phone;

  try {
    const token = await getMpesaToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString("base64");

    const stkRes = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: formattedPhone,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: formattedPhone,
        CallBackURL: process.env.MPESA_CALLBACK_URL,
        AccountReference: "Reloc App",
        TransactionDesc: "Deposit to wallet",
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    await saveTransaction(userId, "deposit", amount, "pending", formattedPhone);

    res.status(200).json({
      message: "Deposit initiated. Check your phone.",
      response: stkRes.data,
    });
  } catch (err) {
    console.error("❌ Deposit Error:", err.response?.data || err.message);
    res.status(500).json({
      message: "Deposit failed",
      error: err.response?.data || err.message,
    });
  }
};

/* ✅ PAYMENT */
exports.payment = async (req, res) => {
  const { userId, recipientId, amount, phone } = req.body;
  if (!userId || !recipientId || !amount || !phone) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const formattedPhone = phone.startsWith('0') ? `254${phone.slice(1)}` : phone;

  try {
    const token = await getMpesaToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString("base64");

    const stkRes = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: formattedPhone,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: formattedPhone,
        CallBackURL: process.env.MPESA_CALLBACK_URL,
        AccountReference: `Pay to ${recipientId}`,
        TransactionDesc: "Payment to another user",
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    await saveTransaction(userId, "payment", amount, "pending", formattedPhone);

    res.status(200).json({
      message: "Payment initiated. Check your phone.",
      response: stkRes.data,
    });
  } catch (err) {
    console.error("❌ Payment Error:", err.response?.data || err.message);
    res.status(500).json({
      message: "Payment failed",
      error: err.response?.data || err.message,
    });
  }
};

/* ✅ WITHDRAW */
exports.withdraw = async (req, res) => {
  const { userId, amount, phone } = req.body;
  if (!userId || !amount || !phone) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const formattedPhone = phone.startsWith('0') ? `254${phone.slice(1)}` : phone;

  try {
    const token = await getMpesaToken();

    const b2cRes = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest",
      {
        InitiatorName: process.env.MPESA_INITIATOR,
        SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
        CommandID: "BusinessPayment",
        Amount: amount,
        PartyA: process.env.MPESA_SHORTCODE,
        PartyB: formattedPhone,
        Remarks: "Withdraw funds",
        QueueTimeOutURL: process.env.MPESA_CALLBACK_URL,
        ResultURL: process.env.MPESA_CALLBACK_URL,
        Occasion: "Reloc App Withdraw",
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    await saveTransaction(userId, "withdraw", amount, "pending", formattedPhone);

    res.status(200).json({
      message: "Withdrawal initiated.",
      response: b2cRes.data,
    });
  } catch (err) {
    console.error("❌ Withdraw Error:", err.response?.data || err.message);
    res.status(500).json({
      message: "Withdraw failed",
      error: err.response?.data || err.message,
    });
  }
};

/* ✅ CALLBACK */
exports.mpesaCallback = async (req, res) => {
  console.log("📩 Callback Data:", req.body);

  try {
    const { Body } = req.body;
    const stkCallback = Body?.stkCallback;

    if (stkCallback) {
      const resultCode = stkCallback.ResultCode;
      const status = resultCode === 0 ? "success" : "failed";
      const amount =
        stkCallback.CallbackMetadata?.Item.find((i) => i.Name === "Amount")?.Value || 0;
      const phone =
        stkCallback.CallbackMetadata?.Item.find((i) => i.Name === "PhoneNumber")?.Value ||
        "unknown";

      await pool.query(
        "UPDATE transactions SET status=$1 WHERE phone=$2 AND amount=$3 AND status='pending'",
        [status, phone, amount]
      );

      if (status === "success") {
        const txTypeRes = await pool.query(
          "SELECT user_id, type FROM transactions WHERE phone=$1 AND amount=$2 ORDER BY created_at DESC LIMIT 1",
          [phone, amount]
        );

        const txType = txTypeRes.rows[0]?.type;
        const userId = txTypeRes.rows[0]?.user_id;

        if (userId && txType) {
          await updateUserBalance(userId, amount, txType);
        }
      }
    }

    res.status(200).json({ message: "Callback received" });
  } catch (err) {
    console.error("❌ Callback Error:", err.message);
    res.status(500).json({ message: "Callback processing failed" });
  }
};
