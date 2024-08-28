import { memo, useEffect } from "react";
import ListBox from "@/components/elements/form/listbox/Listbox";
import Button from "@/components/elements/base/button/Button";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useWithdrawStore } from "@/stores/user/wallet/withdraw";
import { useTranslation } from "next-i18next";
import RadioHeadless from "@/components/elements/form/radio/RadioHeadless";
const SelectWalletTypeBase = ({}) => {
  const { t } = useTranslation();
  const {
    walletTypes,
    selectedWalletType,
    setSelectedWalletType,
    setStep,
    fetchCurrencies,
  } = useWithdrawStore();

  return (
    <div>
      <div className="mb-12 space-y-1 text-center font-sans">
        <h2 className="text-2xl font-light text-muted-800 dark:text-muted-100">
          {t("Select a Wallet Type")}
        </h2>
        <p className="text-sm text-muted-400">
          {t("Pick one of the following wallet types to continue")}
        </p>
      </div>

      <div className="mx-auto mb-4 w-full max-w-lg rounded px-8 pb-8">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {walletTypes.map((walletType) => (
            <RadioHeadless
              key={walletType.value}
              name="walletType"
              checked={selectedWalletType.value === walletType.value}
              onChange={() => setSelectedWalletType(walletType)}
            >
              <div className="flex items-center justify-between p-4 bg-white dark:bg-muted-800 rounded-md shadow-md">
                <div className="flex items-center space-x-4">
                  <h5 className="text-lg font-medium text-muted-800 dark:text-muted-100">
                    {t(walletType.label)}
                  </h5>
                </div>
                <div className="flex items-center">
                  {selectedWalletType.value === walletType.value && (
                    <Icon
                      icon="ph:check-circle-duotone"
                      className="h-7 w-7 text-success-500"
                    />
                  )}
                </div>
              </div>
            </RadioHeadless>
          ))}
        </div>

        <div className="mt-6">
          <Button
            type="button"
            color="primary"
            size="lg"
            className="w-full"
            onClick={() => {
              fetchCurrencies();
              setStep(2);
            }}
            disabled={selectedWalletType.value === ""}
          >
            {t("Continue")}
            <Icon icon="mdi:chevron-right" className="h-5 w-5" />
          </Button>
        </div>
        <hr className="my-6 border-t border-muted-200 dark:border-muted-800" />
        <div className="text-center">
          <p className="mt-8 space-x-2 font-sans text-sm leading-5 text-muted-600 dark:text-muted-400">
            <span>{t("Having any trouble")}</span>
            <Link
              href="#"
              className="font-medium text-primary-600 underline-offset-4 transition duration-150 ease-in-out hover:text-primary-500 hover:underline focus:underline focus:outline-none"
            >
              {t("Contact us")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
export const SelectWalletType = memo(SelectWalletTypeBase);
