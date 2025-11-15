import { Link, Text } from '@react-email/components';
import { EmailLayout } from '../components/EmailLayout';

interface EvidenceNotificationProps {
  recipientName: string;
  submitterName: string;
  isoName: string;
  evidenceType: string;
  evidenceTitle: string;
  evidenceUrl: string;
  unsubscribeToken: string;
}

export function EvidenceNotification({
  recipientName,
  submitterName,
  isoName,
  evidenceType,
  evidenceTitle,
  evidenceUrl,
  unsubscribeToken,
}: EvidenceNotificationProps) {
  return (
    <EmailLayout
      preview={`New ${evidenceType} evidence submitted for ${isoName}`}
      heading="New Evidence Submitted"
      unsubscribeToken={unsubscribeToken}
    >
      <Text style={text}>Hi {recipientName},</Text>

      <Text style={text}>
        <strong>{submitterName}</strong> submitted new{' '}
        <strong>{evidenceType}</strong> evidence for <strong>{isoName}</strong>:
      </Text>

      <div style={evidenceBox}>
        <Text style={evidenceLabel}>
          {evidenceType.toUpperCase()}
        </Text>
        <Text style={evidenceTitleStyle}>{evidenceTitle}</Text>
      </div>

      <Link href={evidenceUrl} style={button}>
        Review Evidence
      </Link>

      <Text style={text}>
        Help evaluate this evidence and contribute to the analysis.
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

const evidenceBox = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderLeft: '4px solid #10b981',
  borderRadius: '6px',
  padding: '16px',
  margin: '0 0 24px',
};

const evidenceLabel = {
  color: '#059669',
  fontSize: '11px',
  fontWeight: '600',
  letterSpacing: '0.5px',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px',
};

const evidenceTitleStyle = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '24px',
  margin: 0,
};

const button = {
  backgroundColor: '#10b981',
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
