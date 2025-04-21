/**
 * Sends a confirmation email to the user who requested an account
 */
export function sendRequestReceivedMail({ username, email }: { username: string; email: string }) {
  // In a real application, this would send an actual email
  // For now, we'll just log to the console
  console.log(`📧 Sending confirmation email to ${username} <${email}>`);
  console.log(`Subject: Your account request has been received`);
  console.log(`
Dear ${username},

Thank you for requesting an account. We have received your request and will review it shortly.
You will receive another email when your request has been approved.

Best regards,
The Team
  `);
}
