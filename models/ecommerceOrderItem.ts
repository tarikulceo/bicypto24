import * as Sequelize from "sequelize";
import { DataTypes, Model, Optional } from "sequelize";
import type { ecommerceOrder, ecommerceOrderId } from "./ecommerceOrder";
import type { ecommerceProduct, ecommerceProductId } from "./ecommerceProduct";

export interface ecommerceOrderItemAttributes {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  key?: string;
  filePath?: string;
}

export type ecommerceOrderItemPk = "id";
export type ecommerceOrderItemId = ecommerceOrderItem[ecommerceOrderItemPk];
export type ecommerceOrderItemOptionalAttributes = "id" | "key";
export type ecommerceOrderItemCreationAttributes = Optional<
  ecommerceOrderItemAttributes,
  ecommerceOrderItemOptionalAttributes
>;

export class ecommerceOrderItem
  extends Model<
    ecommerceOrderItemAttributes,
    ecommerceOrderItemCreationAttributes
  >
  implements ecommerceOrderItemAttributes
{
  id!: string;
  orderId!: string;
  productId!: string;
  quantity!: number;
  key?: string;
  filePath?: string;

  // ecommerceOrderItem belongsTo ecommerceOrder via orderId
  order!: ecommerceOrder;
  getOrder!: Sequelize.BelongsToGetAssociationMixin<ecommerceOrder>;
  setOrder!: Sequelize.BelongsToSetAssociationMixin<
    ecommerceOrder,
    ecommerceOrderId
  >;
  createOrder!: Sequelize.BelongsToCreateAssociationMixin<ecommerceOrder>;
  // ecommerceOrderItem belongsTo ecommerceProduct via productId
  product!: ecommerceProduct;
  getProduct!: Sequelize.BelongsToGetAssociationMixin<ecommerceProduct>;
  setProduct!: Sequelize.BelongsToSetAssociationMixin<
    ecommerceProduct,
    ecommerceProductId
  >;
  createProduct!: Sequelize.BelongsToCreateAssociationMixin<ecommerceProduct>;

  static initModel(sequelize: Sequelize.Sequelize): typeof ecommerceOrderItem {
    return ecommerceOrderItem.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        orderId: {
          type: DataTypes.UUID,
          allowNull: false,

          validate: {
            isUUID: { args: 4, msg: "orderId: Order ID must be a valid UUID" },
          },
        },
        productId: {
          type: DataTypes.UUID,
          allowNull: false,

          validate: {
            isUUID: {
              args: 4,
              msg: "productId: Product ID must be a valid UUID",
            },
          },
        },
        quantity: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: {
            isInt: { msg: "quantity: Quantity must be an integer" },
            min: { args: [1], msg: "quantity: Quantity must be at least 1" },
          },
        },
        key: {
          type: DataTypes.STRING(191),
          allowNull: true,
        },
        filePath: {
          type: DataTypes.STRING(191),
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: "ecommerce_order_item",
        timestamps: false,
        indexes: [
          {
            name: "PRIMARY",
            unique: true,
            using: "BTREE",
            fields: [{ name: "id" }],
          },
          {
            name: "ecommerceOrderItemOrderIdProductIdKey",
            unique: true,
            using: "BTREE",
            fields: [{ name: "orderId" }, { name: "productId" }],
          },
          {
            name: "ecommerceOrderItemProductIdFkey",
            using: "BTREE",
            fields: [{ name: "productId" }],
          },
        ],
      }
    );
  }
}
