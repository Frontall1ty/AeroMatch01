const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usd2 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const num1 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

export const money = (n: number) => usd0.format(n);
export const moneyPrecise = (n: number) => usd2.format(n);
export const kg = (n: number) => `${num0.format(n)} kg`;
export const m3 = (n: number) => `${num1.format(n)} m³`;
export const int = (n: number) => num0.format(n);
