const DailyLimitExceeded = require("../errors/dailyLimitExceed");

const errorHandling = (err, req, res, next) => {
  console.error(err.message);

  if (err instanceof DailyLimitExceeded) {
    return res.status(400).json({
      status: "error",
      message: err.message,
    });
  }

  res.status(500).json({
    status: "error",
    message: err.message,
  });
};

module.exports = errorHandling;
