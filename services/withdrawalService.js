const { Withdrawal, sequelize } = require("../models");
const DailyLimitExceeded = require("../errors/dailyLimitExceed");
const { Transaction, Op } = require("sequelize");
const dateUtils = require("../utils/dateUtils");

const { wait } = require("../utils/wait");

class WithdrawalService {
  static DEFAULT_DAILY_LIMIT = 5000;

  async handleWithdrawalRequest(withdrawal, serializable) {
    if (serializable) {
      console.log(
        "Handling withdrawal request using serializable transaction isolation level"
      );
      return await this.handleWithdrawalRequestSequentially(withdrawal);
    }

    console.log(
      "Handling withdrawal request using default transaction isolation level"
    );
    return await this.processWithdrawalTransactionally(
      withdrawal,
      Transaction.ISOLATION_LEVELS.READ_COMMITTED
    );
  }

  /**
   * This method is intented to handle the withdrawal request sequentially, i.e. using serializable transaction level
   * so the database will protect against concurrent conflicting changes
   */
  async handleWithdrawalRequestSequentially(withdrawal) {
    let attempt = 0,
      delay = 1000;
    const retries = 1;

    while (true) {
      try {
        return await this.processWithdrawalTransactionally(
          withdrawal,
          Transaction.ISOLATION_LEVELS.SERIALIZABLE
        );
      } catch (error) {
        // Serializable transactions might rollback the transaction if a conflict is detected (SQLSTATE = 40001),
        // so we need to retry the operation until we get satisfactory results or retry attempts are exhausted
        if (error.original?.code === "40001" && attempt < retries) {
          attempt++;
          console.log(
            `Attempt ${attempt} failed. Retrying after ${delay} ms...`
          );

          await wait(delay);

          delay *= 2;
        } else {
          throw error;
        }
      }
    }
  }

  async processWithdrawalTransactionally(withdrawal, isolationLevel) {
    return await sequelize.transaction(
      {
        isolationLevel,
      },
      async (transaction) => {
        const response = await this.processWithdrawal(withdrawal, transaction);
        //Introducing a delay before committing in order to increase the risk timeframe
        //so we can reproduce the issue without a high load env
        await wait(5000);
        return response;
      }
    );
  }

  async processWithdrawal(withdrawal, transaction) {
    const from = dateUtils.getTodayAtMidnight();
    const to = dateUtils.getTodayAtEndOfDay();

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
}

module.exports = WithdrawalService;
