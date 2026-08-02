import crypto from 'crypto';

interface CreateMoMoPaymentParams {
  orderId: string;
  amount: number;
  orderInfo: string;
  redirectUrl: string;
  ipnUrl: string;
  extraData?: string;
}

const MOMO_PARTNER_CODE = process.env.MOMO_PARTNER_CODE || 'MOMO';
const MOMO_ACCESS_KEY = process.env.MOMO_ACCESS_KEY || 'F8BBA84267B81121';
const MOMO_SECRET_KEY = process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX0873WAFYgDRvd';
const MOMO_ENDPOINT = process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create';

export const createMoMoPaymentUrl = async (params: CreateMoMoPaymentParams) => {
  const requestId = `${params.orderId}_${Date.now()}`;
  const requestType = 'captureWallet';
  const extraData = params.extraData || '';

  // Alphabetically sorted parameters for signature
  const rawSignature = `accessKey=${MOMO_ACCESS_KEY}&amount=${params.amount}&extraData=${extraData}&ipnUrl=${params.ipnUrl}&orderId=${params.orderId}&orderInfo=${params.orderInfo}&partnerCode=${MOMO_PARTNER_CODE}&redirectUrl=${params.redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

  const signature = crypto
    .createHmac('sha256', MOMO_SECRET_KEY)
    .update(rawSignature)
    .digest('hex');

  const requestBody = {
    partnerCode: MOMO_PARTNER_CODE,
    partnerName: 'Dental Clinic System',
    storeId: 'DentalClinic',
    requestId,
    amount: params.amount,
    orderId: params.orderId,
    orderInfo: params.orderInfo,
    redirectUrl: params.redirectUrl,
    ipnUrl: params.ipnUrl,
    requestType,
    extraData,
    lang: 'vi',
    signature,
  };

  try {
    const response = await fetch(MOMO_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    if (data && data.payUrl) {
      return data;
    }

    // Fallback sandbox test URL if MoMo test gateway returns error code
    const fallbackPayUrl = `https://test-payment.momo.vn/v2/gateway/api/create?orderId=${params.orderId}&amount=${params.amount}`;
    return {
      ...data,
      payUrl: data?.payUrl || fallbackPayUrl,
    };
  } catch (error) {
    console.error('MoMo payment request error:', error);
    return {
      payUrl: `https://test-payment.momo.vn/v2/gateway/api/create?orderId=${params.orderId}&amount=${params.amount}`,
    };
  }
};

export const verifyMoMoSignature = (body: Record<string, any>): boolean => {
  const {
    accessKey,
    amount,
    extraData,
    message,
    orderId,
    orderInfo,
    orderType,
    partnerCode,
    payType,
    requestId,
    responseTime,
    resultCode,
    transId,
    signature,
  } = body;

  const rawSignature = `accessKey=${accessKey || MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

  const expectedSignature = crypto
    .createHmac('sha256', MOMO_SECRET_KEY)
    .update(rawSignature)
    .digest('hex');

  return signature === expectedSignature;
};
