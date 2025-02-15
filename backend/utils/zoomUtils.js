import axios from 'axios';
import crypto from 'crypto';


// Function to create a Zoom meeting
export const createZoomMeeting = async (topic, startTime, duration, tutorName) => {
  try {
    const accessToken = await getZoomAccessToken();

    const meetingResponse = await axios.post(
      'https://api.zoom.us/v2/users/me/meetings',
      {
        topic,
        type: 2, // Scheduled meeting
        start_time: startTime, // ISO 8601 format
        duration,
        agenda: `Tutoring session by ${tutorName}`,
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: true,
          approval_type: 0, // Automatic approval
          enforce_login: false,
          auto_adapted_timeout: true, // End meeting when everyone leaves
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const meeting = meetingResponse.data;

    console.log('Zoom meeting created successfully:', meeting);

    // Return meeting details
    return meeting;
  } catch (error) {
    console.error('Error creating Zoom meeting:', error.response?.data || error.message);
    throw new Error('Failed to create Zoom meeting');
  }
};



// Function to fetch a Zoom API access token
export const getZoomAccessToken = async () => {
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;
  const accountId = process.env.ZOOM_ACCOUNT_ID;

  const tokenUrl = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`;

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const response = await axios.post(tokenUrl, null, {
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    });
    return response.data.access_token; // Use this token in your API calls
  } catch (error) {
    console.error('Error fetching Zoom access token:', error.response?.data || error.message);
    throw error;
  }
};


