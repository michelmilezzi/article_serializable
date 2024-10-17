class DailyLimitExceeded extends Error {
  constructor(message) {
    super(message);
  }
}

module.exports = DailyLimitExceeded;
