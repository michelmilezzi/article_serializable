const { Withdrawal } = require("../models");
const DailyLimitExceeded = require("../errors/dailyLimitExceed");
const { Op } = require("sequelize");

class WithdrawalService {
  static DEFAULT_DAILY_LIMIT = 5000;
  async getTotalAmount(userId, from, to) {
    return (
      (await Withdrawal.sum("amount", {
        where: {
          user: userId,
          effective_date: {
            [Op.between]: [from, to],
          },
        },
      })) | 0
    );
  }

  async processWithdrawal(withdrawal) {
    const from = new Date();
    from.setHours(0, 0, 0, 0);

    const to = new Date();
    to.setHours(23, 59, 59, 999);

    const totalAmount = await this.getTotalAmount(withdrawal.user, from, to);

    console.log(
      "User %s made a total of $%d in withdrawals today",
      withdrawal.user,
      totalAmount
    );

    if (
      withdrawal.amount + totalAmount >
      WithdrawalService.DEFAULT_DAILY_LIMIT
    ) {
      throw new DailyLimitExceeded(
        "Not enough limit left to fulfill this request"
      );
    }

    return await Withdrawal.create(withdrawal);
  }
}

module.exports = WithdrawalService;
