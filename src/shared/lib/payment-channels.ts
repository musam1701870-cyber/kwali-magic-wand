// Where a payer actually sends money, for the channels available while the online
// card gateway is deferred.
//
// These details are configuration, not code. They are read from environment
// variables and NOT hardcoded: printing a plausible-looking but wrong account
// number would send real money to the wrong place, so when a channel is not
// configured the UI says so plainly instead of inventing one.
//
// To enable a channel, set the matching VITE_* variables and redeploy.

export type CouncilBank = {
  bankName: string;
  accountName: string;
  accountNumber: string;
};

const env = import.meta.env as Record<string, string | undefined>;

export const councilBank: CouncilBank | null = (() => {
  const bankName = env.VITE_COUNCIL_BANK_NAME?.trim();
  const accountName = env.VITE_COUNCIL_BANK_ACCOUNT_NAME?.trim();
  const accountNumber = env.VITE_COUNCIL_BANK_ACCOUNT_NUMBER?.trim();
  if (!bankName || !accountName || !accountNumber) return null;
  return { bankName, accountName, accountNumber };
})();

/** e.g. "*7799*" — the council's USSD short code, if one is live. */
export const councilUssd: string | null = env.VITE_COUNCIL_USSD_CODE?.trim() || null;

export type ChannelKey = "transfer" | "ussd" | "cash";

export const CHANNELS: {
  key: ChannelKey;
  title: string;
  blurb: string;
  configured: boolean;
}[] = [
  {
    key: "transfer",
    title: "Bank transfer",
    blurb: "Transfer from your bank app and quote the reference.",
    configured: councilBank !== null,
  },
  {
    key: "ussd",
    title: "USSD / phone",
    blurb: "Pay from a basic phone with no internet.",
    configured: councilUssd !== null,
  },
  {
    key: "cash",
    title: "Cash to an agent",
    blurb: "Pay a marshal, revenue officer or registered café agent.",
    configured: true,
  },
];
