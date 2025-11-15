import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface EmailLayoutProps {
  preview: string;
  heading: string;
  children: React.ReactNode;
  unsubscribeToken: string;
}

export function EmailLayout({
  preview,
  heading,
  children,
  unsubscribeToken,
}: EmailLayoutProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>ISO Tracker</Heading>
            <Text style={tagline}>Evidence-Based Analysis of Interstellar Objects</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading as="h2" style={h2}>{heading}</Heading>
            {children}
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              You received this email because you have notifications enabled in ISO Tracker.
            </Text>
            <Text style={footerLinks}>
              <Link href={`${baseUrl}/settings/notifications`} style={link}>
                Notification Settings
              </Link>
              {' • '}
              <Link
                href={`${baseUrl}/api/notifications/unsubscribe?token=${unsubscribeToken}`}
                style={link}
              >
                Unsubscribe
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 48px',
  borderBottom: '1px solid #e6e8eb',
  textAlign: 'center' as const,
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '32px',
  margin: '0 0 8px',
};

const tagline = {
  color: '#6b7280',
  fontSize: '14px',
  margin: 0,
};

const content = {
  padding: '32px 48px',
};

const h2 = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: '600',
  lineHeight: '28px',
  margin: '0 0 16px',
};

const footer = {
  padding: '24px 48px',
  borderTop: '1px solid #e6e8eb',
};

const footerText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 12px',
};

const footerLinks = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '20px',
  margin: 0,
};

const link = {
  color: '#2563eb',
  textDecoration: 'underline',
};
