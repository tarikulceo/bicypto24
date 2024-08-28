import * as Sequelize from "sequelize";
import { DataTypes, Model, Optional } from "sequelize";
import type { forexInvestment, forexInvestmentId } from "./forexInvestment";
import type {
  forexPlanDuration,
  forexPlanDurationId,
} from "./forexPlanDuration";

export interface forexPlanAttributes {
  id: string;
  name: string;
  title?: string;
  description?: string;
  image?: string;
  currency: string;
  walletType: string;
  minProfit: number;
  maxProfit: number;
  minAmount?: number;
  maxAmount?: number;
  invested: number;
  profitPercentage: number;
  status?: boolean;
  defaultProfit: number;
  defaultResult: "WIN" | "LOSS" | "DRAW";
  trending?: boolean;
  createdAt?: Date;
  deletedAt?: Date;
  updatedAt?: Date;
}

export type forexPlanPk = "id";
export type forexPlanId = forexPlan[forexPlanPk];
export type forexPlanOptionalAttributes =
  | "id"
  | "title"
  | "description"
  | "image"
  | "minAmount"
  | "maxAmount"
  | "invested"
  | "profitPercentage"
  | "status"
  | "defaultProfit"
  | "trending"
  | "createdAt"
  | "deletedAt"
  | "updatedAt";
export type forexPlanCreationAttributes = Optional<
  forexPlanAttributes,
  forexPlanOptionalAttributes
>;

export class forexPlan
  extends Model<forexPlanAttributes, forexPlanCreationAttributes>
  implements forexPlanAttributes
{
  id!: string;
  name!: string;
  title?: string;
  description?: string;
  image?: string;
  currency!: string;
  walletType!: string;
  minProfit!: number;
  maxProfit!: number;
  minAmount?: number;
  maxAmount?: number;
  invested!: number;
  profitPercentage!: number;
  status?: boolean;
  defaultProfit!: number;
  defaultResult!: "WIN" | "LOSS" | "DRAW";
  trending?: boolean;
  createdAt?: Date;
  deletedAt?: Date;
  updatedAt?: Date;

  // forexPlan hasMany forexInvestment via planId
  forexInvestments!: forexInvestment[];
  getForexInvestments!: Sequelize.HasManyGetAssociationsMixin<forexInvestment>;
  setForexInvestments!: Sequelize.HasManySetAssociationsMixin<
    forexInvestment,
    forexInvestmentId
  >;
  addForexInvestment!: Sequelize.HasManyAddAssociationMixin<
    forexInvestment,
    forexInvestmentId
  >;
  addForexInvestments!: Sequelize.HasManyAddAssociationsMixin<
    forexInvestment,
    forexInvestmentId
  >;
  createForexInvestment!: Sequelize.HasManyCreateAssociationMixin<forexInvestment>;
  removeForexInvestment!: Sequelize.HasManyRemoveAssociationMixin<
    forexInvestment,
    forexInvestmentId
  >;
  removeForexInvestments!: Sequelize.HasManyRemoveAssociationsMixin<
    forexInvestment,
    forexInvestmentId
  >;
  hasForexInvestment!: Sequelize.HasManyHasAssociationMixin<
    forexInvestment,
    forexInvestmentId
  >;
  hasForexInvestments!: Sequelize.HasManyHasAssociationsMixin<
    forexInvestment,
    forexInvestmentId
  >;
  countForexInvestments!: Sequelize.HasManyCountAssociationsMixin;
  // forexPlan hasMany forexPlanDuration via planId
  durations!: forexPlanDuration[];
  getDurations!: Sequelize.HasManyGetAssociationsMixin<forexPlanDuration>;
  setDurations!: Sequelize.HasManySetAssociationsMixin<
    forexPlanDuration,
    forexPlanDurationId
  >;
  addDuration!: Sequelize.HasManyAddAssociationMixin<
    forexPlanDuration,
    forexPlanDurationId
  >;
  addDurations!: Sequelize.HasManyAddAssociationsMixin<
    forexPlanDuration,
    forexPlanDurationId
  >;
  createDuration!: Sequelize.HasManyCreateAssociationMixin<forexPlanDuration>;
  removeDuration!: Sequelize.HasManyRemoveAssociationMixin<
    forexPlanDuration,
    forexPlanDurationId
  >;
  removeDurations!: Sequelize.HasManyRemoveAssociationsMixin<
    forexPlanDuration,
    forexPlanDurationId
  >;
  hasDuration!: Sequelize.HasManyHasAssociationMixin<
    forexPlanDuration,
    forexPlanDurationId
  >;
  hasDurations!: Sequelize.HasManyHasAssociationsMixin<
    forexPlanDuration,
    forexPlanDurationId
  >;
  countDurations!: Sequelize.HasManyCountAssociationsMixin;

  static initModel(sequelize: Sequelize.Sequelize): typeof forexPlan {
    return forexPlan.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING(191),
          allowNull: false,
          unique: "forexPlanNameKey",
          validate: {
            notEmpty: { msg: "name: Name cannot be empty" },
          },
        },
        title: {
          type: DataTypes.STRING(191),
          allowNull: true,
        },
        description: {
          type: DataTypes.STRING(191),
          allowNull: true,
        },
        image: {
          type: DataTypes.STRING(191),
          allowNull: true,
        },
        currency: {
          type: DataTypes.STRING(191),
          allowNull: false,
          validate: {
            notEmpty: { msg: "currency: Currency cannot be empty" },
          },
        },
        walletType: {
          type: DataTypes.STRING(191),
          allowNull: false,
          validate: {
            notEmpty: { msg: "walletType: Wallet type cannot be empty" },
          },
        },
        minProfit: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          validate: {
            isFloat: { msg: "minProfit: Minimum profit must be a number" },
          },
        },
        maxProfit: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          validate: {
            isFloat: { msg: "maxProfit: Maximum profit must be a number" },
          },
        },
        minAmount: {
          type: DataTypes.DOUBLE,
          allowNull: true,
          defaultValue: 0,
          validate: {
            isFloat: { msg: "minAmount: Minimum amount must be a number" },
          },
        },
        maxAmount: {
          type: DataTypes.DOUBLE,
          allowNull: true,
          validate: {
            isFloat: { msg: "maxAmount: Maximum amount must be a number" },
          },
        },
        invested: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          validate: {
            isInt: { msg: "invested: Invested value must be an integer" },
          },
        },
        profitPercentage: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          defaultValue: 0,
          validate: {
            isFloat: {
              msg: "profitPercentage: Profit percentage must be a number",
            },
          },
        },
        status: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: false,
          validate: {
            isBoolean: { msg: "status: Status must be a boolean value" },
          },
        },
        defaultProfit: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          validate: {
            isInt: { msg: "defaultProfit: Default profit must be an integer" },
          },
        },
        defaultResult: {
          type: DataTypes.ENUM("WIN", "LOSS", "DRAW"),
          allowNull: false,
          validate: {
            isIn: {
              args: [["WIN", "LOSS", "DRAW"]],
              msg: "defaultResult: Must be one of 'WIN', 'LOSS', 'DRAW'",
            },
          },
        },
        trending: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: false,
          validate: {
            isBoolean: { msg: "trending: Trending must be a boolean value" },
          },
        },
      },
      {
        sequelize,
        tableName: "forex_plan",
        timestamps: true,
        paranoid: true,
        indexes: [
          {
            name: "PRIMARY",
            unique: true,
            using: "BTREE",
            fields: [{ name: "id" }],
          },
          {
            name: "forexPlanNameKey",
            unique: true,
            using: "BTREE",
            fields: [{ name: "name" }],
          },
        ],
      }
    );
  }
}
