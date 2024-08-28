import * as Sequelize from "sequelize";
import { DataTypes, Model, Optional } from "sequelize";
import type {
  forexAccountSignal,
  forexAccountSignalId,
} from "./forexAccountSignal";
import type { forexSignal, forexSignalId } from "./forexSignal";
import type { user, userId } from "./user";

export interface forexAccountAttributes {
  id: string;
  userId?: string;
  accountId?: string;
  password?: string;
  broker?: string;
  mt?: number;
  balance: number;
  leverage?: number;
  type: "DEMO" | "LIVE";
  status?: boolean;
  createdAt?: Date;
  deletedAt?: Date;
  updatedAt?: Date;
}

export type forexAccountPk = "id";
export type forexAccountId = forexAccount[forexAccountPk];
export type forexAccountOptionalAttributes =
  | "id"
  | "userId"
  | "accountId"
  | "password"
  | "broker"
  | "mt"
  | "balance"
  | "leverage"
  | "type"
  | "status"
  | "createdAt"
  | "deletedAt"
  | "updatedAt";

export type forexAccountCreationAttributes = Optional<
  forexAccountAttributes,
  forexAccountOptionalAttributes
>;

export class forexAccount
  extends Model<forexAccountAttributes, forexAccountCreationAttributes>
  implements forexAccountAttributes
{
  id!: string;
  userId?: string;
  accountId?: string;
  password?: string;
  broker?: string;
  mt?: number;
  balance: number;
  leverage?: number;
  type!: "DEMO" | "LIVE";
  status?: boolean;
  createdAt?: Date;
  deletedAt?: Date;
  updatedAt?: Date;

  // forexAccount hasMany forexAccountSignal via forexAccountId
  forexAccountSignals!: forexAccountSignal[];
  getForexAccountSignals!: Sequelize.HasManyGetAssociationsMixin<forexAccountSignal>;
  setForexAccountSignals!: Sequelize.HasManySetAssociationsMixin<
    forexAccountSignal,
    forexAccountSignalId
  >;
  addForexAccountSignal!: Sequelize.HasManyAddAssociationMixin<
    forexAccountSignal,
    forexAccountSignalId
  >;
  addForexAccountSignals!: Sequelize.HasManyAddAssociationsMixin<
    forexAccountSignal,
    forexAccountSignalId
  >;
  createForexAccountSignal!: Sequelize.HasManyCreateAssociationMixin<forexAccountSignal>;
  removeForexAccountSignal!: Sequelize.HasManyRemoveAssociationMixin<
    forexAccountSignal,
    forexAccountSignalId
  >;
  removeForexAccountSignals!: Sequelize.HasManyRemoveAssociationsMixin<
    forexAccountSignal,
    forexAccountSignalId
  >;
  hasForexAccountSignal!: Sequelize.HasManyHasAssociationMixin<
    forexAccountSignal,
    forexAccountSignalId
  >;
  hasForexAccountSignals!: Sequelize.HasManyHasAssociationsMixin<
    forexAccountSignal,
    forexAccountSignalId
  >;
  countForexAccountSignals!: Sequelize.HasManyCountAssociationsMixin;
  // forexAccount belongsToMany forexSignal via forexAccountId and forexSignalId
  forexSignalIdForexSignals!: forexSignal[];
  getForexSignalIdForexSignals!: Sequelize.BelongsToManyGetAssociationsMixin<forexSignal>;
  setForexSignalIdForexSignals!: Sequelize.BelongsToManySetAssociationsMixin<
    forexSignal,
    forexSignalId
  >;
  addForexSignalIdForexSignal!: Sequelize.BelongsToManyAddAssociationMixin<
    forexSignal,
    forexSignalId
  >;
  addForexSignalIdForexSignals!: Sequelize.BelongsToManyAddAssociationsMixin<
    forexSignal,
    forexSignalId
  >;
  createForexSignalIdForexSignal!: Sequelize.BelongsToManyCreateAssociationMixin<forexSignal>;
  removeForexSignalIdForexSignal!: Sequelize.BelongsToManyRemoveAssociationMixin<
    forexSignal,
    forexSignalId
  >;
  removeForexSignalIdForexSignals!: Sequelize.BelongsToManyRemoveAssociationsMixin<
    forexSignal,
    forexSignalId
  >;
  hasForexSignalIdForexSignal!: Sequelize.BelongsToManyHasAssociationMixin<
    forexSignal,
    forexSignalId
  >;
  hasForexSignalIdForexSignals!: Sequelize.BelongsToManyHasAssociationsMixin<
    forexSignal,
    forexSignalId
  >;
  countForexSignalIdForexSignals!: Sequelize.BelongsToManyCountAssociationsMixin;
  // forexAccount belongsTo user via userId
  user!: user;
  getUser!: Sequelize.BelongsToGetAssociationMixin<user>;
  setUser!: Sequelize.BelongsToSetAssociationMixin<user, userId>;
  createUser!: Sequelize.BelongsToCreateAssociationMixin<user>;

  static initModel(sequelize: Sequelize.Sequelize): typeof forexAccount {
    return forexAccount.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: true,
          validate: {
            isUUID: { args: 4, msg: "userId: User ID must be a valid UUID" },
          },
        },
        accountId: {
          type: DataTypes.STRING(191),
          allowNull: true,
          validate: {
            notEmpty: { msg: "accountId: Account ID must not be empty" },
          },
        },
        password: {
          type: DataTypes.STRING(191),
          allowNull: true,
          validate: {
            notEmpty: { msg: "password: Password must not be empty" },
            len: {
              args: [6, 191],
              msg: "password: Password must be between 6 and 191 characters long",
            },
          },
        },
        broker: {
          type: DataTypes.STRING(191),
          allowNull: true,
          validate: {
            notEmpty: { msg: "broker: Broker name must not be empty" },
          },
        },
        mt: {
          type: DataTypes.INTEGER,
          allowNull: true,
          validate: {
            isInt: { msg: "mt: MT version must be an integer" },
          },
        },
        balance: {
          type: DataTypes.DOUBLE,
          allowNull: true,
          defaultValue: 0,
          validate: {
            isFloat: { msg: "balance: Balance must be a number" },
          },
        },
        leverage: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 1,
          validate: {
            isInt: { msg: "leverage: Leverage must be an integer" },
          },
        },
        type: {
          type: DataTypes.ENUM("DEMO", "LIVE"),
          allowNull: false,
          defaultValue: "DEMO",
          validate: {
            isIn: {
              args: [["DEMO", "LIVE"]],
              msg: "type: Type must be either 'DEMO' or 'LIVE'",
            },
          },
        },
        status: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          validate: {
            isBoolean: { msg: "status: Status must be a boolean value" },
          },
        },
      },
      {
        sequelize,
        tableName: "forex_account",
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
            name: "forexAccountUserIdFkey",
            using: "BTREE",
            fields: [{ name: "userId" }],
          },
        ],
      }
    );
  }
}
