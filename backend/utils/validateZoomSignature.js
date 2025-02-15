import crypto from 'crypto';

// Utility function to validate Zoom signature
export const validateZoomSignature = (req) => {
  const zoomSignature = req.headers['x-zm-signature'];
  const timestamp = req.headers['x-zm-request-timestamp'];
  const rawBody = req.rawBody;

  if (!zoomSignature || !timestamp || !rawBody) {
    throw new Error('Missing signature, timestamp, or raw body');
  }

  // Ensure the timestamp is recent to prevent replay attacks (5 minutes)
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - timestamp) > 300) {
    throw new Error('Timestamp is too old');
  }

  // Generate expected signature
  const message = `v0:${timestamp}:${rawBody}`;
  const expectedSignature = `v0=${crypto
    .createHmac('sha256', process.env.ZOOM_SECRET_TOKEN)
    .update(message)
    .digest('hex')}`;

  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
  const receivedBuffer = Buffer.from(zoomSignature, 'utf8');

  // Compare signatures securely
  if (!crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
    throw new Error('Invalid Zoom webhook signature');
  }
};
