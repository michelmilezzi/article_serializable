const { PostgreSqlContainer } = require("@testcontainers/postgresql");
const request = require("supertest");
const process = require("process");
const dateUtils = require("../utils/dateUtils");

//setting a high timeout just in case you don't have a postgresql docker image locally
const timeout = 60000;
let server, app, sequelize;

//helper function for sending a post request to withdrawals endpoint
const sendWithdrawalRequest = (amount, serializable = false) => {
  return request(app).post(`/withdrawals?serializable=${serializable}`).send({
    amount,
    user: 1,
  });
};

//helper function for getting the current daily withdrawal amount of the test user, this is not relying on any existing service on purpose
const getWithdrawalsMadeToday = async () => {
  return await sequelize.query(
    'SELECT sum(amount) as total FROM withdrawals w WHERE w."user" = :user AND effective_date BETWEEN :from AND :to',
    {
      replacements: {
        user: 1,
        from: dateUtils.getTodayAtMidnight(),
        to: dateUtils.getTodayAtEndOfDay(),
      },
      type: sequelize.Sequelize.QueryTypes.SELECT,
    }
  );
};

describe("Checking Withdrawals endpoint concurrent capabilities", () => {
  let postgresContainer, Withdrawal;

  beforeAll(async () => {
    postgresContainer = await new PostgreSqlContainer().start();
    process.env.DATABASE_URL = postgresContainer.getConnectionUri();

    ({ server, app } = require("../index"));
    ({ sequelize, Withdrawal } = require("../models"));
    await sequelize.sync({ force: true });
  }, timeout);

  afterAll(async () => {
    server.close();
    await postgresContainer.stop();
  });

  beforeEach(async () => {
    await Withdrawal.truncate();
  });

  /*
   This is intentionally failing. As we're sending two concurrent withdrawals requests for same user
   and the default isolation level is READ COMMITED (we're sending serializable query parameter as false), 
   the system is unable to properly validate the daily limit, leading to an inconsistent state.
  */
  it(
    "given 2 concurrent requests leading to an exceeded limit, should return an error (read commited example)",
    async () => {
      const [res1, res2] = await Promise.all([
        sendWithdrawalRequest(1000),
        sendWithdrawalRequest(5000),
      ]);

      //Expect only one successfully request
      expect([res1.status, res2.status]).toEqual(
        expect.arrayContaining([201, 400])
      );

      const [withdrawalsMadeToday] = await getWithdrawalsMadeToday();

      //total made today should be always less than or equal daily limit
      expect(withdrawalsMadeToday.total).toBeLessThanOrEqual(5000);
    },
    timeout
  );

  /*
   This test version will pass. Now we're setting the isolation level as serializable, so database will deny similar concurrent 
   changes. In that case the system is able to properly validate the daily limit, protecting data against an inconsistency.
  */
  it(
    "given 2 concurrent requests leading to an exceeded limit, should return an error (serializable example)",
    async () => {
      const [res1, res2] = await Promise.all([
        sendWithdrawalRequest(1000, true),
        sendWithdrawalRequest(5000, true),
      ]);

      //Expect only one successfully request
      expect([res1.status, res2.status]).toEqual(
        expect.arrayContaining([201, 400])
      );

      const [withdrawalsMadeToday] = await getWithdrawalsMadeToday();

      //total made today should be always less than or equal daily limit
      expect(Number(withdrawalsMadeToday.total)).toBeLessThanOrEqual(5000);
    },
    timeout
  );
});
