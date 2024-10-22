# Serializable Isolation Level explained

<img src="resources/cover.png" alt="Cover">

> A small project showing serializable transactions usage and capability, made as part of this article https://www.linkedin.com/pulse/draft/preview/7249171219676057601 (WIP).
> The aim of this project is to have a self-contained test showing a possible use-case of SERIALIZABLE Isolation Level.

## 📜 Overview

This small app emulates a bank account withdrawal process. We have only one endpoint exposed, which is `withdrawals`:

Definition: POST /withdrawals?serializable={false|true}
Body: `{ "amount": <withdrawal_amount>, "user": <user_id> }`

If you pass `serializable` parameter as false (or don´t pass it at all), the withdrawal request will be handled using `READ COMMITED` isolation level, which will fail validating the daily withdrawal limit of $5000 in case of two or more concurrent requests for same user. Otherwise, if you pass `serializable` as true, the request will be handle using `SERIALIZABLE` isolation level, protecting the database from an inconsistent state.

## 💻 Prerequisites

Before you begin, make sure you have met the following requirements:

- NodeJS v18 or above
- Docker v27 or above

## ☕ Preparing

Clone this repo and issue a `npm install` at the root directory to install its dependencies.

## 🚀 Running

To run this project, you have two options: either start the application and send concurrent requests manually (in that case you also need an PostgreSQL instance running locally), or run the integration tests, which include this scenario and starts a PostgreSQL container automatically.

### Running manually

- Create a `.env` file and add your PostgreSQL URI there, such as `DATABASE_URL=postgres://myuser:mypass@localhost:5432/mydatabase`.
- Issue a `npx sequelize-cli db:migrate` to run all database migrations (create tables, etc.)
- Now you're good to go, just issue a `npm start` to start the app
- Then you can send requests, e.g.:

```
curl --request POST \
  --url 'http://localhost:3000/withdrawals?serializable=false' \
  --header 'Content-Type: application/json' \
  --data '{
	"amount": 1000,
	"user": 1
}'
```

Remember to run at least 2 requests simultaneously for same user and to play with `serializable` query parameter.

### Running integration tests

- Issue a `npm test` and inspect test results

We're covering these scenarios:

1. Two concurrent requests for same user to be handled by `READ COMMITED` isolation level. This test is intentionally failing due to inability of applying the limit.
2. Two concurrent requests for same user to be handled by `SERIALIZABLE` isolation level. This test is running fine.

## 📝 License

This project is licensed under the GNU General Public License v3.0. See the [LICENSE](LICENSE.md) file for more details.
