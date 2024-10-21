"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Withdrawal extends Model {
    static associate(models) {}
  }
  Withdrawal.init(
    {
      effective_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      user: { type: DataTypes.BIGINT, allowNull: false },
      amount: { type: DataTypes.NUMERIC, allowNull: false },
    },
    {
      sequelize,
      modelName: "Withdrawal",
      tableName: "withdrawals",
    }
  );
  return Withdrawal;
};
