"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Withdrawal extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
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
    }
  );
  return Withdrawal;
};
