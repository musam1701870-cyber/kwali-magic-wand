import QRCode from "qrcode";

// Real, scannable QR codes.
//
// Every "QR code" in the app used to be decoration: a grid of squares derived
// from summing the character codes of an id (see the block this replaced in
// exporters.ts). It looked the part and scanned as nothing, which on an official
// ID card or receipt is worse than printing no code at all.
//
// What the code carries is a verification URL holding an opaque token — never a
// name, phone number, amount or internal id. Two consequences: scanning it leaks
// nothing if the card is photographed or lost, and because it is a plain URL any
// phone's built-in camera resolves it, so a citizen needs no app and no scanner.

/** Absolute verification URL for a receipt's opaque token. */
export function receiptVerifyUrl(token: string, origin?: string): string {
  return `${origin ?? siteOrigin()}/verify/${token}`;
}

/** Absolute verification URL for a registered entity's QR token. */
export function identityVerifyUrl(token: string, origin?: string): string {
  return `${origin ?? siteOrigin()}/verify/${token}`;
}

function siteOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "https://kwali.gov.ng";
}

/**
 * PNG data URL for embedding in a PDF (jsPDF's addImage) or an <img>.
 * Error-correction level M survives the print quality and handling a market
 * trader's ID card will actually get.
 */
export async function qrDataUrl(text: string, size = 512): Promise<string> {
  return QRCode.toDataURL(text, {
    width: size,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#0f4c3a", light: "#ffffff" },
  });
}
