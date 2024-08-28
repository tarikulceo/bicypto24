import * as Sequelize from "sequelize";
import { DataTypes, Model, Optional } from "sequelize";
import type {
  mailwizardTemplate,
  mailwizardTemplateId,
} from "./mailwizardTemplate";

export interface mailwizardCampaignAttributes {
  id: string;
  name: string;
  subject: string;
  status:
    | "PENDING"
    | "PAUSED"
    | "ACTIVE"
    | "STOPPED"
    | "COMPLETED"
    | "CANCELLED";
  speed: number;
  targets?: string;
  templateId: string;
  createdAt?: Date;
  deletedAt?: Date;
  updatedAt?: Date;
}

export type mailwizardCampaignPk = "id";
export type mailwizardCampaignId = mailwizardCampaign[mailwizardCampaignPk];
export type mailwizardCampaignOptionalAttributes =
  | "id"
  | "status"
  | "speed"
  | "targets"
  | "createdAt"
  | "deletedAt"
  | "updatedAt";
export type mailwizardCampaignCreationAttributes = Optional<
  mailwizardCampaignAttributes,
  mailwizardCampaignOptionalAttributes
>;

export class mailwizardCampaign
  extends Model<
    mailwizardCampaignAttributes,
    mailwizardCampaignCreationAttributes
  >
  implements mailwizardCampaignAttributes
{
  id!: string;
  name!: string;
  subject!: string;
  status!:
    | "PENDING"
    | "PAUSED"
    | "ACTIVE"
    | "STOPPED"
    | "COMPLETED"
    | "CANCELLED";
  speed!: number;
  targets?: string;
  templateId!: string;
  createdAt?: Date;
  deletedAt?: Date;
  updatedAt?: Date;

  // mailwizardCampaign belongsTo mailwizardTemplate via templateId
  template!: mailwizardTemplate;
  getTemplate!: Sequelize.BelongsToGetAssociationMixin<mailwizardTemplate>;
  setTemplate!: Sequelize.BelongsToSetAssociationMixin<
    mailwizardTemplate,
    mailwizardTemplateId
  >;
  createTemplate!: Sequelize.BelongsToCreateAssociationMixin<mailwizardTemplate>;

  static initModel(sequelize: Sequelize.Sequelize): typeof mailwizardCampaign {
    return mailwizardCampaign.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        templateId: {
          type: DataTypes.UUID,
          allowNull: false,
          validate: {
            isUUID: {
              args: 4,
              msg: "templateId: Template ID must be a valid UUID",
            },
          },
        },
        name: {
          type: DataTypes.STRING(191),
          allowNull: false,
          validate: {
            notEmpty: { msg: "name: Name cannot be empty" },
          },
        },
        subject: {
          type: DataTypes.STRING(191),
          allowNull: false,
          validate: {
            notEmpty: { msg: "subject: Subject cannot be empty" },
          },
        },
        status: {
          type: DataTypes.ENUM(
            "PENDING",
            "PAUSED",
            "ACTIVE",
            "STOPPED",
            "COMPLETED",
            "CANCELLED"
          ),
          allowNull: false,
          defaultValue: "PENDING",
          validate: {
            isIn: {
              args: [
                [
                  "PENDING",
                  "PAUSED",
                  "ACTIVE",
                  "STOPPED",
                  "COMPLETED",
                  "CANCELLED",
                ],
              ],
              msg: "status: Status must be one of PENDING, PAUSED, ACTIVE, STOPPED, COMPLETED, CANCELLED",
            },
          },
        },
        speed: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
          validate: {
            isInt: { msg: "speed: Speed must be an integer" },
          },
        },
        targets: {
          type: DataTypes.TEXT("long"),
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: "mailwizard_campaign",
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
            name: "mailwizardCampaignTemplateIdForeign",
            using: "BTREE",
            fields: [{ name: "templateId" }],
          },
        ],
      }
    );
  }
}
