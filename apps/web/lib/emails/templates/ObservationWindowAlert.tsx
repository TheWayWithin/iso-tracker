import { Link, Text } from '@react-email/components';
import { EmailLayout } from '../components/EmailLayout';

interface ObservationWindowAlertProps {
  recipientName: string;
  isoName: string;
  windowStartDate: string;
  windowEndDate: string;
  daysUntilWindow: number;
  isoUrl: string;
  unsubscribeToken: string;
}

export function ObservationWindowAlert({
  recipientName,
  isoName,
  windowStartDate,
  windowEndDate,
  daysUntilWindow,
  isoUrl,
  unsubscribeToken,
}: ObservationWindowAlertProps) {
  const urgency = daysUntilWindow <= 1 ? 'urgent' : 'normal';

  return (
    <EmailLayout
      preview={`Observation window ${urgency === 'urgent' ? 'starts tomorrow' : `in ${daysUntilWindow} days`} for ${isoName}`}
      heading="Observation Window Alert"
      unsubscribeToken={unsubscribeToken}
    >
      <Text style={text}>Hi {recipientName},</Text>

      <Text style={text}>
        The observation window for <strong>{isoName}</strong> is approaching:
      </Text>

      <div style={urgency === 'urgent' ? alertBoxUrgent : alertBox}>
        {urgency === 'urgent' && (
          <Text style={urgentBadge}>⚠️ STARTS TOMORROW</Text>
        )}

        <Text style={windowLabel}>Observation Window</Text>
        <Text style={windowDates}>
          {windowStartDate} → {windowEndDate}
        </Text>

        {urgency === 'normal' && (
          <Text style={daysRemaining}>
            {daysUntilWindow} {daysUntilWindow === 1 ? 'day' : 'days'} remaining
          </Text>
        )}
      </div>

      <Link href={isoUrl} style={urgency === 'urgent' ? buttonUrgent : button}>
        View ISO Details
      </Link>

      <Text style={text}>
        {urgency === 'urgent'
          ? 'Prepare your observation plans now!'
          : 'Plan your observation strategy and coordinate with other observers.'}
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

const alertBox = {
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderLeft: '4px solid #3b82f6',
  borderRadius: '6px',
  padding: '16px',
  margin: '0 0 24px',
};

const alertBoxUrgent = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderLeft: '4px solid #ef4444',
  borderRadius: '6px',
  padding: '16px',
  margin: '0 0 24px',
};

const urgentBadge = {
  backgroundColor: '#ef4444',
  color: '#ffffff',
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '0.5px',
  padding: '4px 8px',
  borderRadius: '4px',
  display: 'inline-block',
  margin: '0 0 12px',
};

const windowLabel = {
  color: '#6b7280',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 8px',
};

const windowDates = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: '600',
  lineHeight: '28px',
  margin: '0 0 8px',
};

const daysRemaining = {
  color: '#3b82f6',
  fontSize: '14px',
  fontWeight: '600',
  margin: 0,
};

const button = {
  backgroundColor: '#3b82f6',
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

const buttonUrgent = {
  backgroundColor: '#ef4444',
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
