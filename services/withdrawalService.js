const { Withdrawal, sequelize } = require("../models");
const DailyLimitExceeded = require("../errors/dailyLimitExceed");
const { Transaction, Op } = require("sequelize");

class WithdrawalService {
  static DEFAULT_DAILY_LIMIT = 5000;
  async getTotalAmount(userId, from, to, transaction) {
    return (
      (await Withdrawal.sum("amount", {
        where: {
          user: userId,
          effective_date: {
            [Op.between]: [from, to],
          },
        },
        transaction,
      })) | 0
    );
  }

  async handleWithdrawalRequest(withdrawal, serializable) {
    const isolationLevel = serializable
      ? Transaction.ISOLATION_LEVELS.SERIALIZABLE
      : Transaction.ISOLATION_LEVELS.READ_COMMITTED;
    console.log("Transaction isolation level", isolationLevel);
    try {
      return await sequelize.transaction(
        {
          isolationLevel,
        },
        async (transaction) => {
          const response = await this.processWithdrawal(
            withdrawal,
            transaction
          );
          //Introducing a delay before committing in order to increase the risk timeframe
          //so we can reproduce the issue without a high load env
          await new Promise((resolve) => setTimeout(resolve, 5000));
          return response;
        }
      );
    } catch (error) {
      console.error(
        "Error while trying to process a withdrawal. Transaction has been rolled back!",
        error
      );
      throw error;
    }
  }

  async processWithdrawal(withdrawal, transaction) {
    const from = new Date();
    from.setHours(0, 0, 0, 0);

    const to = new Date();
    to.setHours(23, 59, 59, 999);

    const totalAmount = await this.getTotalAmount(
      withdrawal.user,
      from,
      to,
      transaction
    );

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

    return await Withdrawal.create(withdrawal, { transaction });
  }
}

module.exports = WithdrawalService;
