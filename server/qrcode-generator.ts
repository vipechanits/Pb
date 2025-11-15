import QRCode from "qrcode";

/**
 * Generate UPI payment QR code for user payment details
 * @param upiId - UPI ID of the user
 * @param name - Name of the user
 * @param mobile - Mobile number of the user
 * @param amount - Optional amount for the payment
 * @returns Base64 encoded QR code image data URL
 */
export async function generateUserPaymentQR(
  upiId: string,
  name: string,
  mobile: string,
  amount?: number
): Promise<string> {
  try {
    // Create UPI payment string
    // Format: upi://pay?pa=<UPI_ID>&pn=<NAME>&tn=<NOTE>&am=<AMOUNT>
    let upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}`;
    
    if (amount && amount > 0) {
      upiString += `&am=${amount}`;
    }
    
    // Add transaction note with mobile number
    upiString += `&tn=${encodeURIComponent(`Payment to ${name}`)}`;
    
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(upiString, {
      errorCorrectionLevel: "M",
      type: "image/png",
      width: 300,
      margin: 1,
    });
    
    return qrCodeDataUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
}
