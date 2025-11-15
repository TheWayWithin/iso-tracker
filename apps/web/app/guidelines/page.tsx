import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community Guidelines | ISO Tracker',
  description: 'Community guidelines and moderation policy for ISO Tracker - promoting evidence-based discourse and intellectual honesty',
};

export default function GuidelinesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Community Guidelines
          </h1>
          <p className="text-lg text-gray-600">
            ISO Tracker is a platform for evidence-based analysis of interstellar objects.
            We value intellectual honesty, scientific rigor, and curiosity over certainty.
          </p>
        </div>

        {/* Core Guidelines */}
        <section id="core-guidelines" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Core Guidelines
          </h2>

          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              1. Be Respectful and Constructive
            </h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Engage in good faith with other community members</li>
              <li>Critique ideas, not people</li>
              <li>Assume others are acting with good intentions</li>
              <li>Maintain a professional and collegial tone</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              2. Cite Sources and Evidence
            </h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Provide credible sources for factual claims</li>
              <li>Link to original data, research papers, or authoritative sources</li>
              <li>Acknowledge uncertainty and limitations in data</li>
              <li>Be transparent about methodology and assumptions</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              3. Distinguish Opinions from Facts
            </h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Clearly label speculation, hypotheses, and personal interpretations</li>
              <li>Separate observational data from theoretical frameworks</li>
              <li>Acknowledge alternative explanations and competing theories</li>
              <li>Update your position when presented with new evidence</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              4. Prohibited Behavior
            </h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li><strong>No personal attacks or harassment:</strong> Do not attack, insult, or harass other users</li>
              <li><strong>No hate speech or discrimination:</strong> No content targeting race, gender, religion, nationality, etc.</li>
              <li><strong>No threats or violence:</strong> Threats of violence or harm are strictly prohibited</li>
              <li><strong>No spam or self-promotion:</strong> No excessive self-promotion, advertising, or off-topic content</li>
              <li><strong>No plagiarism:</strong> Respect intellectual property and credit original authors</li>
            </ul>
          </div>
        </section>

        {/* Evidence Submission Standards */}
        <section id="evidence-standards" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Evidence Submission Standards
          </h2>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <p className="text-gray-800 mb-4">
              As an Evidence Analyst subscriber, you have the privilege of contributing to our evidence database.
              With this comes the responsibility to maintain high standards:
            </p>

            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <div>
                  <strong>Provide Methodology:</strong> Explain how data was collected, processed, or analyzed
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <div>
                  <strong>Include Sources:</strong> Link to raw data, original reports, or authoritative references
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <div>
                  <strong>Be Transparent:</strong> Acknowledge limitations, uncertainties, and potential biases
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <div>
                  <strong>Accept Peer Review:</strong> Welcome scrutiny and constructive criticism of your evidence
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <div>
                  <strong>Update When Corrected:</strong> If errors are found, acknowledge them and update your submission
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* Moderation Policy */}
        <section id="moderation-policy" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Moderation Policy
          </h2>

          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              How Content Gets Flagged
            </h3>
            <p className="text-gray-700 mb-3">
              Any community member can flag content that violates these guidelines. Flags are submitted with a reason
              and reviewed by our moderation team.
            </p>
            <p className="text-gray-700">
              <strong>Your identity as a reporter is kept confidential</strong> and never disclosed to the content owner.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Review Process
            </h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Flagged content is reviewed by admin moderators within 48 hours</li>
              <li>Moderators assess whether content violates guidelines</li>
              <li>Actions may include: dismissing the flag, issuing a warning, or removing content</li>
              <li>All moderation actions are logged for transparency and accountability</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Appeal Process
            </h3>
            <p className="text-gray-700 mb-3">
              If you believe content was unfairly removed or your account was wrongly suspended:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Email <a href="mailto:support@isotracker.app" className="text-blue-600 hover:underline">support@isotracker.app</a> with your flag ID or username</li>
              <li>Provide context and reasoning for your appeal</li>
              <li>Appeals are reviewed by a different moderator within 5 business days</li>
              <li>Final decisions are made by senior admins</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Consequences for Violations
            </h3>
            <p className="text-gray-700 mb-3">
              We enforce guidelines fairly and proportionately:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li><strong>First offense:</strong> Warning and content removal (minor violations)</li>
              <li><strong>Second offense:</strong> Temporary suspension (7-30 days depending on severity)</li>
              <li><strong>Severe violations:</strong> Immediate permanent ban (threats, harassment, hate speech)</li>
              <li><strong>Repeat offenders:</strong> Permanent ban after 3 violations</li>
            </ul>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Questions or Concerns
          </h2>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-gray-700 mb-4">
              If you have questions about these guidelines or need to report a moderation concern:
            </p>
            <p className="text-gray-900 font-medium">
              📧 Email: <a href="mailto:support@isotracker.app" className="text-blue-600 hover:underline">support@isotracker.app</a>
            </p>
            <p className="text-gray-700 mt-4 text-sm">
              Our support team typically responds within 24 hours (weekdays) or 48 hours (weekends).
            </p>
          </div>
        </section>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-8">
          <p className="text-sm text-gray-500 text-center">
            Last updated: January 12, 2025
          </p>
          <p className="text-sm text-gray-500 text-center mt-2">
            These guidelines may be updated periodically. Major changes will be announced to the community.
          </p>
        </div>
      </div>
    </div>
  );
}
