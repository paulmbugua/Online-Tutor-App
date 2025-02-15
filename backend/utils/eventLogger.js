import ZoomWebhook from '../models/ZoomWebhook.js';

export const logZoomEvent = async (event, payload, rawPayload, customEvent = event) => {
  try {
    console.log(`Logging event: ${customEvent}`);
    await ZoomWebhook.create({
      event: customEvent,
      meetingId: payload.object?.id || null,
      rawPayload,
      timestamp: new Date(),
    });
    console.log(`Logged event successfully: ${customEvent}`);
  } catch (error) {
    console.error('Error logging Zoom event:', error.message || error);
  }
};
