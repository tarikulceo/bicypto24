import sgMail from "@sendgrid/mail";
import fs from "fs";
import nodemailer from "nodemailer";
import {
  APP_NODEMAILER_SERVICE,
  APP_NODEMAILER_SERVICE_PASSWORD,
  APP_NODEMAILER_SERVICE_SENDER,
  APP_NODEMAILER_SMTP_ENCRYPTION,
  APP_NODEMAILER_SMTP_HOST,
  APP_NODEMAILER_SMTP_PASSWORD,
  APP_NODEMAILER_SMTP_PORT,
  APP_NODEMAILER_SMTP_SENDER,
  NEXT_PUBLIC_SITE_NAME,
  NEXT_PUBLIC_SITE_URL,
  APP_SENDGRID_API_KEY,
  APP_SENDGRID_SENDER,
  APP_SENDMAIL_PATH,
} from "./constants";
import { createError } from "./error";
import { models } from "@b/db";
import { settings } from "../..";
import { logError } from "@b/utils/logger";

export interface EmailOptions {
  to: string;
  from?: string;
  subject: string;
  html?: string;
  text?: string;
}

export async function sendEmailWithProvider(
  provider: string,
  options: EmailOptions
) {
  try {
    switch (provider) {
      case "local":
        await emailWithLocalSMTP(options);
        break;

      case "nodemailer-service":
        options.from = APP_NODEMAILER_SERVICE_SENDER;
        await emailWithNodemailerService(
          APP_NODEMAILER_SERVICE_SENDER,
          APP_NODEMAILER_SERVICE_PASSWORD,
          APP_NODEMAILER_SERVICE,
          options
        );
        break;

      case "nodemailer-smtp":
        options.from = APP_NODEMAILER_SMTP_SENDER;
        await emailWithNodemailerSmtp(
          APP_NODEMAILER_SMTP_SENDER,
          APP_NODEMAILER_SMTP_PASSWORD,
          APP_NODEMAILER_SMTP_HOST,
          APP_NODEMAILER_SMTP_PORT,
          APP_NODEMAILER_SMTP_ENCRYPTION === "ssl",
          options
        );
        break;

      case "nodemailer-sendgrid":
        options.from = APP_SENDGRID_SENDER;
        await emailWithSendgrid(options);
        break;

      default:
        throw new Error("Unsupported email provider");
    }
  } catch (error) {
    logError("email", error, __filename);
    throw error;
  }
}

async function emailWithLocalSMTP(options: EmailOptions): Promise<void> {
  try {
    const transporterOptions: {
      sendmail?: boolean;
      newline?: string;
      path?: string;
      dkim?: {
        privateKey: string;
        domainName: string;
        keySelector: string;
      };
    } = {
      sendmail: true,
      newline: "unix",
      path: APP_SENDMAIL_PATH,
    };

    const APP_NODEMAILER_DKIM_PRIVATE_KEY =
      process.env.APP_NODEMAILER_DKIM_PRIVATE_KEY || "";
    const APP_NODEMAILER_DKIM_DOMAIN =
      process.env.APP_NODEMAILER_DKIM_DOMAIN || "";
    const APP_NODEMAILER_DKIM_SELECTOR =
      process.env.APP_NODEMAILER_DKIM_SELECTOR || "default";

    if (
      APP_NODEMAILER_DKIM_PRIVATE_KEY &&
      APP_NODEMAILER_DKIM_DOMAIN &&
      APP_NODEMAILER_DKIM_SELECTOR
    ) {
      transporterOptions.dkim = {
        privateKey: fs.readFileSync(APP_NODEMAILER_DKIM_PRIVATE_KEY, "utf8"),
        domainName: APP_NODEMAILER_DKIM_DOMAIN,
        keySelector: APP_NODEMAILER_DKIM_SELECTOR,
      };
    }

    const transporter = nodemailer.createTransport(transporterOptions);

    const mailOptions = {
      from: options.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    logError("email", error, __filename);
    throw error;
  }
}

export async function emailWithSendgrid(options: EmailOptions): Promise<void> {
  const apiKey = APP_SENDGRID_API_KEY;

  if (!apiKey)
    throw createError({
      statusCode: 500,
      message: "Sendgrid Api key not found. Cannot send email. Aborting.",
    });

  try {
    sgMail.setApiKey(apiKey);

    const msg: any = {
      to: options.to,
      from: options.from,
      subject: options.subject,
      html: options.html ? options.html : options.text,
    };

    await sgMail.send(msg);
  } catch (error) {
    logError("email", error, __filename);
    throw error;
  }
}

export async function emailWithNodemailerService(
  sender: string,
  password: string,
  service: string,
  options: EmailOptions
): Promise<void> {
  const emailOptions = {
    from: options.from,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  if (!service)
    throw createError({
      statusCode: 500,
      message: "Email service not specified. Aborting email send.",
    });

  if (!sender)
    throw createError({
      statusCode: 500,
      message: "Email user not specified. Aborting email send.",
    });

  if (!password)
    throw createError({
      statusCode: 500,
      message: "Email password not specified. Aborting email send.",
    });

  try {
    const transporter = await nodemailer.createTransport({
      service: service,
      auth: {
        user: sender,
        pass: password,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    await transporter.verify();
    await transporter.sendMail(emailOptions);
  } catch (error) {
    logError("email", error, __filename);
    throw error;
  }
}

export async function emailWithNodemailerSmtp(
  sender: string,
  password: string,
  host: string,
  port: string,
  smtpEncryption: boolean,
  options: EmailOptions
): Promise<void> {
  const emailOptions = {
    from: options.from,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  if (!host)
    throw createError({
      statusCode: 500,
      message: "Email host not specified. Aborting email send.",
    });

  if (!sender)
    throw createError({
      statusCode: 500,
      message: "Email user not specified. Aborting email send.",
    });

  if (!password)
    throw createError({
      statusCode: 500,
      message: "Email password not specified. Aborting email send.",
    });

  try {
    const transporter = await nodemailer.createTransport({
      host: host,
      port: port,
      pool: true,
      secure: false,
      auth: {
        user: sender,
        pass: password,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    await transporter.verify();
    await transporter.sendMail(emailOptions);
  } catch (error) {
    logError("email", error, __filename);
    throw error;
  }
}

export async function prepareEmailTemplate(
  processedTemplate: string,
  processedSubject: string
): Promise<string> {
  const generalTemplate = fs.readFileSync(
    `${process.cwd()}/template/generalTemplate.html`,
    "utf-8"
  );

  if (!generalTemplate) {
    throw createError({
      statusCode: 500,
      message: "General email template not found",
    });
  }

  const fullLogo = settings.get("fullLogo");
  const siteName = settings.get("siteName");

  const replacements = {
    "%SITE_URL%": NEXT_PUBLIC_SITE_URL,
    "%HEADER%": fullLogo?.value
      ? `<img src="${NEXT_PUBLIC_SITE_URL}${fullLogo?.value}" style="max-height:96px;" />`
      : `<h1>${siteName?.value || NEXT_PUBLIC_SITE_NAME || "Bicrypto"}</h1>`,
    "%MESSAGE%": processedTemplate,
    "%SUBJECT%": processedSubject,
    "%FOOTER%": siteName?.value || NEXT_PUBLIC_SITE_NAME || "Bicrypto",
  };

  return Object.entries(replacements).reduce(
    (acc, [key, value]) => replaceAllOccurrences(acc, key, value),
    generalTemplate
  );
}

export async function fetchAndProcessEmailTemplate(
  specificVariables: any,
  templateName: string
): Promise<{
  processedTemplate: string;
  processedSubject: string;
  templateRecord: any;
}> {
  try {
    const templateRecord = await models.notificationTemplate.findOne({
      where: { name: templateName },
    });

    if (!templateRecord || !templateRecord.email || !templateRecord.emailBody)
      throw createError({
        statusCode: 404,
        message: "Email template not found or email not enabled",
      });

    const basicVariables = {
      URL: NEXT_PUBLIC_SITE_URL,
    };

    const variables = {
      ...basicVariables,
      ...specificVariables,
    };

    const processedTemplate = replaceTemplateVariables(
      templateRecord.emailBody,
      variables
    );

    const processedSubject = replaceTemplateVariables(
      templateRecord.subject,
      variables
    );

    return { processedTemplate, processedSubject, templateRecord };
  } catch (error) {
    logError("email", error, __filename);
    throw error;
  }
}

export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string | number | undefined>
): string {
  if (typeof template !== "string") {
    console.error("Template is not a string");
    return "";
  }
  return Object.entries(variables).reduce((acc, [key, value]) => {
    if (value === undefined) {
      console.warn(`Variable ${key} is undefined`);
      return acc;
    }
    return acc.replace(new RegExp(`%${key}%`, "g"), String(value));
  }, template);
}

function replaceAllOccurrences(
  str: string,
  search: string | RegExp,
  replace: string
): string {
  if (str == null) {
    console.error("Input string is null or undefined");
    return "";
  }
  const regex = new RegExp(search, "g");
  return str.replace(regex, replace);
}
