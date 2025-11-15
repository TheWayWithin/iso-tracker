import { Link, Text } from '@react-email/components';
import { EmailLayout } from '../components/EmailLayout';

interface ReplyNotificationProps {
  recipientName: string;
  replierName: string;
  isoName: string;
  commentPreview: string;
  commentUrl: string;
  unsubscribeToken: string;
}

export function ReplyNotification({
  recipientName,
  replierName,
  isoName,
  commentPreview,
  commentUrl,
  unsubscribeToken,
}: ReplyNotificationProps) {
  return (
    <EmailLayout
      preview={`${replierName} replied to your comment on ${isoName}`}
      heading="New Reply to Your Comment"
      unsubscribeToken={unsubscribeToken}
    >
      <Text style={text}>Hi {recipientName},</Text>

      <Text style={text}>
        <strong>{replierName}</strong> replied to your comment on{' '}
        <strong>{isoName}</strong>:
      </Text>

      <div style={commentBox}>
        <Text style={commentText}>{commentPreview}</Text>
      </div>

      <Link href={commentUrl} style={button}>
        View Reply
      </Link>

      <Text style={text}>
        Continue the conversation and share your insights.
      </Text>
    </EmailLayout>
  );
}

// Styles
const text = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

const commentBox = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderLeft: '4px solid #2563eb',
  borderRadius: '6px',
  padding: '16px',
  margin: '0 0 24px',
};

const commentText = {
  color: '#1f2937',
  fontSize: '14px',
  lineHeight: '20px',
  margin: 0,
  fontStyle: 'italic',
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: '600',
  lineHeight: '20px',
  padding: '12px 24px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  margin: '0 0 24px',
};
