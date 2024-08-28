import * as Sequelize from "sequelize";
import { DataTypes, Model, Optional } from "sequelize";
import type { mlmReferral, mlmReferralId } from "./mlmReferral";

export interface mlmBinaryNodeAttributes {
  id: string;
  referralId: string;
  parentId?: string;
  leftChildId?: string;
  rightChildId?: string;
}

export type mlmBinaryNodePk = "id";
export type mlmBinaryNodeId = mlmBinaryNode[mlmBinaryNodePk];
export type mlmBinaryNodeOptionalAttributes =
  | "parentId"
  | "leftChildId"
  | "rightChildId";
export type mlmBinaryNodeCreationAttributes = Optional<
  mlmBinaryNodeAttributes,
  mlmBinaryNodeOptionalAttributes
>;

export class mlmBinaryNode
  extends Model<mlmBinaryNodeAttributes, mlmBinaryNodeCreationAttributes>
  implements mlmBinaryNodeAttributes
{
  id!: string;
  referralId!: string;
  parentId?: string;
  leftChildId?: string;
  rightChildId?: string;

  // mlmBinaryNode belongsTo mlmBinaryNode via parentId
  parent!: mlmBinaryNode;
  getParent!: Sequelize.BelongsToGetAssociationMixin<mlmBinaryNode>;
  setParent!: Sequelize.BelongsToSetAssociationMixin<
    mlmBinaryNode,
    mlmBinaryNodeId
  >;
  createParent!: Sequelize.BelongsToCreateAssociationMixin<mlmBinaryNode>;
  // mlmBinaryNode belongsTo mlmBinaryNode via leftChildId
  leftChild!: mlmBinaryNode;
  getLeftChild!: Sequelize.BelongsToGetAssociationMixin<mlmBinaryNode>;
  setLeftChild!: Sequelize.BelongsToSetAssociationMixin<
    mlmBinaryNode,
    mlmBinaryNodeId
  >;
  createLeftChild!: Sequelize.BelongsToCreateAssociationMixin<mlmBinaryNode>;
  // mlmBinaryNode belongsTo mlmBinaryNode via rightChildId
  rightChild!: mlmBinaryNode;
  getRightChild!: Sequelize.BelongsToGetAssociationMixin<mlmBinaryNode>;
  setRightChild!: Sequelize.BelongsToSetAssociationMixin<
    mlmBinaryNode,
    mlmBinaryNodeId
  >;
  createRightChild!: Sequelize.BelongsToCreateAssociationMixin<mlmBinaryNode>;
  // mlmBinaryNode belongsTo mlmReferral via referralId
  referral!: mlmReferral;
  getReferral!: Sequelize.BelongsToGetAssociationMixin<mlmReferral>;
  setReferral!: Sequelize.BelongsToSetAssociationMixin<
    mlmReferral,
    mlmReferralId
  >;
  createReferral!: Sequelize.BelongsToCreateAssociationMixin<mlmReferral>;

  static initModel(sequelize: Sequelize.Sequelize): typeof mlmBinaryNode {
    return mlmBinaryNode.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        referralId: {
          type: DataTypes.UUID,
          allowNull: false,
          validate: {
            isUUID: {
              args: 4,
              msg: "referralId: Referral ID must be a valid UUID",
            },
          },
        },
        parentId: {
          type: DataTypes.UUID,
          allowNull: true,
          validate: {
            isUUID: {
              args: 4,
              msg: "parentId: Parent ID must be a valid UUID when provided",
            },
          },
        },
        leftChildId: {
          type: DataTypes.UUID,
          allowNull: true,
          validate: {
            isUUID: {
              args: 4,
              msg: "leftChildId: Left Child ID must be a valid UUID when provided",
            },
          },
        },
        rightChildId: {
          type: DataTypes.UUID,
          allowNull: true,
          validate: {
            isUUID: {
              args: 4,
              msg: "rightChildId: Right Child ID must be a valid UUID when provided",
            },
          },
        },
      },
      {
        sequelize,
        tableName: "mlm_binary_node",
        timestamps: false,
        indexes: [
          {
            name: "PRIMARY",
            unique: true,
            using: "BTREE",
            fields: [{ name: "id" }],
          },
          {
            name: "mlmBinaryNodeReferralIdKey",
            unique: true,
            using: "BTREE",
            fields: [{ name: "referralId" }],
          },
          {
            name: "mlmBinaryNodeParentIdFkey",
            using: "BTREE",
            fields: [{ name: "parentId" }],
          },
          {
            name: "mlmBinaryNodeLeftChildIdFkey",
            using: "BTREE",
            fields: [{ name: "leftChildId" }],
          },
          {
            name: "mlmBinaryNodeRightChildIdFkey",
            using: "BTREE",
            fields: [{ name: "rightChildId" }],
          },
        ],
      }
    );
  }
}
