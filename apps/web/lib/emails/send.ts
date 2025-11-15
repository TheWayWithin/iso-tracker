import { Resend } from 'resend';
import { render } from '@react-email/components';
import { ReplyNotification } from './templates/ReplyNotification';
import { EvidenceNotification } from './templates/EvidenceNotification';
import { ObservationWindowAlert } from './templates/ObservationWindowAlert';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send reply notification email
 */
export async function sendReplyNotification(params: {
  to: string;
  recipientName: string;
  replierName: string;
  isoName: string;
  commentPreview: string;
  commentUrl: string;
  unsubscribeToken: string;
}): Promise<SendEmailResult> {
  try {
    const html = await render(
      ReplyNotification({
        recipientName: params.recipientName,
        replierName: params.replierName,
        isoName: params.isoName,
        commentPreview: params.commentPreview,
        commentUrl: params.commentUrl,
        unsubscribeToken: params.unsubscribeToken,
      })
    );

    const { data, error } = await resend.emails.send({
      from: 'ISO Tracker <notifications@isotracker.app>',
      to: params.to,
      subject: `${params.replierName} replied to your comment on ${params.isoName}`,
      html,
    });

    if (error) {
      console.error('Failed to send reply notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Error sending reply notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send evidence notification email
 */
export async function sendEvidenceNotification(params: {
  to: string;
  recipientName: string;
  submitterName: string;
  isoName: string;
  evidenceType: string;
  evidenceTitle: string;
  evidenceUrl: string;
  unsubscribeToken: string;
}): Promise<SendEmailResult> {
  try {
    const html = await render(
      EvidenceNotification({
        recipientName: params.recipientName,
        submitterName: params.submitterName,
        isoName: params.isoName,
        evidenceType: params.evidenceType,
        evidenceTitle: params.evidenceTitle,
        evidenceUrl: params.evidenceUrl,
        unsubscribeToken: params.unsubscribeToken,
      })
    );

    const { data, error } = await resend.emails.send({
      from: 'ISO Tracker <notifications@isotracker.app>',
      to: params.to,
      subject: `New ${params.evidenceType} evidence submitted for ${params.isoName}`,
      html,
    });

    if (error) {
      console.error('Failed to send evidence notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Error sending evidence notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send observation window alert email
 */
export async function sendObservationWindowAlert(params: {
  to: string;
  recipientName: string;
  isoName: string;
  windowStartDate: string;
  windowEndDate: string;
  daysUntilWindow: number;
  isoUrl: string;
  unsubscribeToken: string;
}): Promise<SendEmailResult> {
  try {
    const html = await render(
      ObservationWindowAlert({
        recipientName: params.recipientName,
        isoName: params.isoName,
        windowStartDate: params.windowStartDate,
        windowEndDate: params.windowEndDate,
        daysUntilWindow: params.daysUntilWindow,
        isoUrl: params.isoUrl,
        unsubscribeToken: params.unsubscribeToken,
      })
    );

    const urgency = params.daysUntilWindow <= 1 ? 'urgent' : 'normal';
    const subject = urgency === 'urgent'
      ? `⚠️ Observation window starts tomorrow for ${params.isoName}`
      : `Observation window in ${params.daysUntilWindow} days for ${params.isoName}`;

    const { data, error } = await resend.emails.send({
      from: 'ISO Tracker <alerts@isotracker.app>',
      to: params.to,
      subject,
      html,
    });

    if (error) {
      console.error('Failed to send observation window alert:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Error sending observation window alert:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
