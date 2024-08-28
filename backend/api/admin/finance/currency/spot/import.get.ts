import ExchangeManager from "@b/utils/exchange";
import { models, sequelize } from "@b/db";
import {
  notFoundMetadataResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@b/utils/query";
import {
  standardizeBinanceData,
  standardizeKucoinData,
  standardizeOkxData,
} from "../../exchange/utils";
import { Op } from "sequelize";
import { processCurrenciesPrices } from "@b/utils/cron";

export const metadata = {
  summary: "Import Exchange Currencies",
  operationId: "importCurrencies",
  tags: ["Admin", "Settings", "Exchange"],
  description:
    "Imports currencies from the specified exchange, processes their data, and saves them to the database.",
  requiresAuth: true,
  responses: {
    200: {
      description: "Currencies imported successfully",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    401: unauthorizedResponse,
    404: notFoundMetadataResponse("Exchange"),
    500: serverErrorResponse,
  },
  permission: "Access Spot Currency Management",
};

export default async (data: Handler) => {
  const exchange = await ExchangeManager.startExchange();
  const provider = await ExchangeManager.getProvider();
  if (!exchange) {
    throw new Error(`Failed to start exchange provider: ${provider}`);
  }

  await exchange.loadMarkets();
  const currencies = exchange.currencies;

  const transformedCurrencies: Record<string, any> = {};
  Object.values(currencies).forEach((currency: any) => {
    let standardizedNetworks: any;
    if (provider === "binance") {
      standardizedNetworks = standardizeBinanceData(currency.networks || {});
    } else if (provider === "kucoin") {
      standardizedNetworks = standardizeKucoinData(currency);
    } else if (provider === "okx") {
      standardizedNetworks = standardizeOkxData(currency.networks || {});
    }

    if (currency["precision"]) {
      transformedCurrencies[currency["code"]] = {
        currency: currency["code"],
        name: currency["name"] || currency["code"], // Ensure name is not null
        precision: parseInt(currency["precision"]),
        status: currency["active"],
        deposit: currency["deposit"],
        withdraw: currency["withdraw"],
        fee: currency["fee"],
        chains: standardizedNetworks,
      };
    }
  });

  const newCurrencyCodes = Object.keys(transformedCurrencies);

  // Fetch existing currencies
  const existingCurrencies = await models.exchangeCurrency.findAll({
    attributes: ["currency"],
  });
  const existingCurrencyCodes = new Set(
    existingCurrencies.map((c) => c.currency)
  );

  // Determine currencies to delete
  const currenciesToDelete = [...existingCurrencyCodes].filter(
    (code) => !newCurrencyCodes.includes(code)
  );

  // Begin transaction
  await sequelize.transaction(async (transaction) => {
    // Delete unwanted currencies
    if (currenciesToDelete.length > 0) {
      await models.exchangeCurrency.destroy({
        where: {
          currency: { [Op.in]: currenciesToDelete },
        },
        transaction,
      });
    }

    // Save valid currencies
    await saveValidCurrencies(transformedCurrencies, transaction);
  });

  try {
    await processCurrenciesPrices();
  } catch (error) {
    console.error("Error processing currencies prices", error);
  }

  return {
    message: "Exchange currencies imported and saved successfully!",
  };
};

async function saveValidCurrencies(
  transformedCurrencies: any,
  transaction: any
) {
  const existingCurrencies = await models.exchangeCurrency.findAll({
    attributes: ["currency"],
    transaction,
  });
  const existingCurrencyCodes = new Set(
    existingCurrencies.map((c) => c.currency)
  );

  for (const currencyCode of Object.keys(transformedCurrencies)) {
    const currencyData = transformedCurrencies[currencyCode];

    if (!existingCurrencyCodes.has(currencyCode)) {
      await models.exchangeCurrency.create(
        {
          currency: currencyData.currency,
          name: currencyData.name || currencyData.currency, // Ensure name is not null
          precision: currencyData.precision,
          status: false,
          fee: currencyData.fee,
        },
        { transaction }
      );
    } else {
      await models.exchangeCurrency.update(
        {
          name: currencyData.name || currencyData.currency, // Ensure name is not null
          precision: currencyData.precision,
          status: false,
          fee: currencyData.fee,
        },
        { where: { currency: currencyCode }, transaction }
      );
    }
  }
}
