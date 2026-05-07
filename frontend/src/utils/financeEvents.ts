export const FINANCE_DATA_UPDATED_EVENT = "finance-data-updated";

export const notifyFinanceDataUpdated = () => {
  window.dispatchEvent(new Event(FINANCE_DATA_UPDATED_EVENT));
};
