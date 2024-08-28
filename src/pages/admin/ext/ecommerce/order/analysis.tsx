// pages/chart.tsx
import React from "react";
import Layout from "@/layouts/Default";
import { AnalyticsChart } from "@/components/charts/AnalyticsChart";
import { useTranslation } from "next-i18next";
const path = "/admin/ext/ecommerce/order";
const EcommerceOrdersAnalytics = () => {
  const { t } = useTranslation();
  const availableFilters: AvailableFilters = {
    status: [
      {
        value: "PENDING",
        label: "pending",
        color: "warning",
        icon: "ph:circle",
        path: `${path}?status=PENDING`,
      },
      {
        value: "COMPLETED",
        label: "completed",
        color: "success",
        icon: "ph:check-circle",
        path: `${path}?status=COMPLETED`,
      },
      {
        value: "CANCELLED",
        label: "cancelled",
        color: "muted",
        icon: "ph:stop-circle",
        path: `${path}?status=CANCELLED`,
      },
      {
        value: "REJECTED",
        label: "rejected",
        color: "danger",
        icon: "ph:x-circle",
        path: `${path}?status=REJECTED`,
      },
    ],
  };
  return (
    <Layout color="muted" title={t("Ecommerce Orders Analytics")}>
      <AnalyticsChart
        model="ecommerceOrder"
        modelName={t("Ecommerce Orders")}
        cardName={t("Orders")}
        availableFilters={availableFilters}
        color="primary"
      />
    </Layout>
  );
};
export default EcommerceOrdersAnalytics;
export const permission = "Access Ecommerce Order Management";
