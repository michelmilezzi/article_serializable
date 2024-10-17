const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const port = 3000;
const errorHandling = require("./middleware/errorHandling");
const WithdrawalService = require("./services/withdrawalService");
const withdrawalService = new WithdrawalService();

app.use(bodyParser.json());

app.post("/withdrawals", async (req, res, next) => {
  try {
    const { amount, user, effective_date } = req.body;

    const newWithdrawal = await withdrawalService.processWithdrawal({
      amount,
      user,
      effective_date,
    });

    return res.status(201).json(newWithdrawal);
  } catch (error) {
    next(error);
  }
});

app.use(errorHandling);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
