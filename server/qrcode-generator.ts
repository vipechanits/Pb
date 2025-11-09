import QRCode from 'qrcode';

export interface UPIPaymentDetails {
  upiId: string;
  name: string;
  amount?: number;
  note?: string;
}

/**
 * Generate UPI payment QR code data URL
 * Format: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&cu=INR&tn=NOTE
 */
export async function generateUPIQRCode(details: UPIPaymentDetails): Promise<string> {
  const { upiId, name, amount, note } = details;
  
  // Build UPI payment URL
  const upiUrl = new URL('upi://pay');
  upiUrl.searchParams.set('pa', upiId); // Payee address (UPI ID)
  upiUrl.searchParams.set('pn', name);  // Payee name
  upiUrl.searchParams.set('cu', 'INR'); // Currency
  
  if (amount) {
    upiUrl.searchParams.set('am', amount.toString()); // Amount
  }
  
  if (note) {
    upiUrl.searchParams.set('tn', note); // Transaction note
  }
  
  // Generate QR code as data URL
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(upiUrl.toString(), {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generate QR code for user's payment details (for receiving payments)
 */
export async function generateUserPaymentQR(
  upiId: string,
  name: string,
  mobile: string,
  amount?: number
): Promise<string> {
  return generateUPIQRCode({
    upiId,
    name,
    amount,
    note: `Payment to ${name} (${mobile})`
  });
}
