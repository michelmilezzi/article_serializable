const express = require("express");
const bodyParser = require("body-parser");
const errorHandling = require("./middleware/errorHandling");
const WithdrawalService = require("./services/withdrawalService");
require("dotenv").config();

const app = express();
const port = 3000;
const withdrawalService = new WithdrawalService();

app.use(bodyParser.json());

app.post("/withdrawals", async (req, res, next) => {
  try {
    const { serializable = false } = req.query;
    const { amount, user } = req.body;
    const executeUsingSerializableIsolationLevel = serializable === "true";

    const newWithdrawal = await withdrawalService.handleWithdrawalRequest(
      {
        amount,
        user,
      },
      executeUsingSerializableIsolationLevel
    );

    return res.status(201).json(newWithdrawal);
  } catch (error) {
    next(error);
  }
});

app.use(errorHandling);

const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = { server, app };
