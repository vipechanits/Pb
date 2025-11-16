import QRCode from "qrcode";

/**
 * Generate UPI payment QR code with only UPI ID
 * Minimal UPI Deep Link Format: upi://pay?pa=<UPI_ID>
 * 
 * @param upiId - UPI ID (VPA - Virtual Payment Address)
 * @returns Base64 encoded QR code image data URL
 */
/**
 * Validate UPI ID format according to NPCI specifications
 * Format: username@bankcode (e.g., user123@paytm, name@okaxis)
 */
function validateUpiId(upiId: string): boolean {
  if (!upiId || typeof upiId !== 'string') return false;
  
  // UPI ID regex: username@psp
  // Username: 2-256 chars, alphanumeric, dots, hyphens, underscores
  // PSP/Bank: 2-64 chars, letters only
  const upiRegex = /^[\w.-]{2,256}@[a-zA-Z]{2,64}$/;
  
  return upiRegex.test(upiId);
}

export async function generateUserPaymentQR(
  upiId: string
): Promise<string> {
  try {
    // Validate required field
    if (!upiId) {
      throw new Error("UPI ID is required");
    }
    
    // Validate UPI ID format
    if (!validateUpiId(upiId)) {
      throw new Error(`Invalid UPI ID format: ${upiId}. Expected format: username@bank`);
    }
    
    // Create minimal UPI payment string with only UPI ID
    const upiString = `upi://pay?pa=${encodeURIComponent(upiId)}`;
    
    console.log(`[QR] Generating minimal UPI QR code for: ${upiId}`);
    console.log(`[QR] UPI String: ${upiString}`);
    
    // Generate QR code as data URL with optimized settings
    const qrCodeDataUrl = await QRCode.toDataURL(upiString, {
      errorCorrectionLevel: "M", // Medium error correction (15% recovery)
      type: "image/png",
      width: 300, // 300x300 pixels
      margin: 2, // 2 modules margin for better scanning
      color: {
        dark: "#000000", // Black QR code
        light: "#FFFFFF" // White background
      }
    });
    
    console.log(`[QR] Successfully generated QR code`);
    return qrCodeDataUrl;
  } catch (error) {
    console.error("[QR] Error generating QR code:", error);
    throw new Error(`Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
