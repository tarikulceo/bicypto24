import * as Sequelize from "sequelize";
import { DataTypes, Model, Optional } from "sequelize";

export interface notificationTemplateAttributes {
  id: number;
  name: string;
  subject: string;
  emailBody?: string;
  smsBody?: string;
  pushBody?: string;
  shortCodes?: string;
  email?: boolean;
  sms?: boolean;
  push?: boolean;
}

export type notificationTemplatePk = "id";
export type notificationTemplateId =
  notificationTemplate[notificationTemplatePk];
export type notificationTemplateOptionalAttributes =
  | "id"
  | "emailBody"
  | "smsBody"
  | "pushBody"
  | "shortCodes"
  | "email"
  | "sms"
  | "push";
export type notificationTemplateCreationAttributes = Optional<
  notificationTemplateAttributes,
  notificationTemplateOptionalAttributes
>;

export class notificationTemplate
  extends Model<
    notificationTemplateAttributes,
    notificationTemplateCreationAttributes
  >
  implements notificationTemplateAttributes
{
  id!: number;
  name!: string;
  subject!: string;
  emailBody?: string;
  smsBody?: string;
  pushBody?: string;
  shortCodes?: string;
  email?: boolean;
  sms?: boolean;
  push?: boolean;

  static initModel(
    sequelize: Sequelize.Sequelize
  ): typeof notificationTemplate {
    return notificationTemplate.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
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
        emailBody: {
          type: DataTypes.TEXT("long"),
          allowNull: true,
        },
        smsBody: {
          type: DataTypes.TEXT("long"),
          allowNull: true,
        },
        pushBody: {
          type: DataTypes.TEXT("long"),
          allowNull: true,
        },
        shortCodes: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        email: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: false,
        },
        sms: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: false,
        },
        push: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: false,
        },
      },
      {
        sequelize,
        tableName: "notification_template",
        timestamps: false,
        indexes: [
          {
            name: "PRIMARY",
            unique: true,
            using: "BTREE",
            fields: [{ name: "id" }],
          },
          {
            name: "notificationTemplateNameKey",
            unique: true,
            using: "BTREE",
            fields: [{ name: "name" }],
          },
        ],
      }
    );
  }
}
