import cron from 'node-cron';
import TutorSession from '../models/TutorSession.js'; // Adjust path to your model
import { sendNotification } from '../utils/sendNotification.js'; // Adjust path to your email service

// Schedule job to process expired sessions
cron.schedule('0 * * * *', async () => {
  try {
    const expiredSessions = await TutorSession.find({
      status: 'completed_pending',
      completionDeadline: { $lt: new Date() },
    });

    for (const session of expiredSessions) {
      session.status = 'completed';
      await session.save();

      // Notify both parties
      await Promise.all([
        sendNotification({
          to: session.studentId.user.email,
          subject: 'Session Completed Automatically',
          body: `Dear Student, the session "${session.subject}" has been automatically marked as completed after the 24-hour confirmation period.`,
        }),
        sendNotification({
          to: session.tutorId.user.email,
          subject: 'Session Completed Automatically',
          body: `Dear Tutor, the session "${session.subject}" has been automatically confirmed as completed. Your earnings will reflect shortly.`,
        }),
      ]);
    }

    console.log('Automatic session completion processed.');
  } catch (error) {
    console.error('Error processing automatic session completion:', error);
  }
});
