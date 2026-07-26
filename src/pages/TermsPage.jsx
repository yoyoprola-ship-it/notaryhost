import LegalPage from './LegalPage'

export default function TermsPage() {
  return (
    <LegalPage title="Terms & Conditions" updated="July 25, 2026">
      <p className="legal__note">
        This is a general-purpose terms template drafted for NotaryHost's actual services and
        pricing. It is not legal advice — have it reviewed by an attorney, and fill in your
        governing-law jurisdiction, before treating it as final.
      </p>

      <>
        <h2>1. Acceptance of these terms</h2>
        <p>
          By creating a NotaryHost account or using notaryhost.com (the &ldquo;Service&rdquo;),
          you agree to these Terms &amp; Conditions. If you don&apos;t agree, don&apos;t use the
          Service.
        </p>

        <h2>2. What NotaryHost provides</h2>
        <p>NotaryHost is a platform built for practicing notaries. Depending on what you subscribe to, it provides:</p>
        <ul>
          <li>A website and subdomain (yourname.notaryhost.com) with an admin dashboard</li>
          <li>An online booking system for appointments</li>
          <li>A bilingual phone robot (IVR) that answers calls, books appointments, and takes voice consultations</li>
        </ul>

        <h2>3. Eligibility</h2>
        <p>
          The Service is for individuals or businesses authorized to perform notarial acts in
          their jurisdiction. You&apos;re responsible for confirming you hold any license,
          commission, or bond required by your state or territory, and for complying with the
          laws governing notary conduct and advertising where you practice. NotaryHost does not
          verify notary licensing and is not responsible for your compliance with notary law.
        </p>

        <h2>4. Subscription plans and billing</h2>
        <p>Current plans (subject to change with notice):</p>
        <ul>
          <li><strong>Website + dashboard</strong> — $64/month, unlimited visits</li>
          <li><strong>Booking system</strong> — $19/month, includes up to 40 bookings/month; $0.52 per additional booking</li>
          <li><strong>Phone robot (IVR)</strong> — $25/month, includes up to 50 minutes/month; $0.59 per additional minute</li>
          <li><strong>Bundle (all three)</strong> — $99/month</li>
        </ul>
        <p>
          These fees are for a <strong>subscription to use the Service</strong> — you&apos;re
          renting your website, booking system, and phone robot for as long as you keep paying;
          you don&apos;t own the software, the hosting, or the subdomain. Subscriptions bill
          monthly in advance and renew automatically until cancelled. Usage-based fees (extra
          bookings, extra minutes) bill in arrears. You can cancel anytime from your dashboard or
          by emailing us; cancellation stops future billing but we don&apos;t provide refunds for
          the current billing period. We&apos;ll give reasonable notice before any price changes.
        </p>
        <p>
          <strong>Non-payment.</strong> If a payment isn&apos;t received by its due date, your
          website, booking system, and phone robot may be suspended or cancelled immediately and
          without further notice, until the account is brought current. We&apos;re not
          responsible for any loss — missed appointments, calls, or business — that results from
          a suspension caused by non-payment.
        </p>

        <h2>5. Your responsibilities</h2>
        <ul>
          <li>Keep your login credentials confidential and your contact phone/email current</li>
          <li>Make sure content on your notary website and IVR script is accurate and lawful</li>
          <li>Comply with notary-specific advertising and consumer-protection rules in your jurisdiction — including rules about the use of terms like &ldquo;notario&rdquo; and disclosures for immigration-related services, where applicable</li>
          <li>Don&apos;t use the Service for anything illegal, fraudulent, or abusive</li>
        </ul>

        <h2>6. Third-party services</h2>
        <p>
          The Service relies on third-party providers — Twilio (calls/SMS), Resend (email),
          Google Firebase/Cloud (hosting and storage), and Stripe (payments). Your use of the
          Service means your data and your clients&apos; data will flow through these providers
          as described in our <a href="/privacy">Privacy Policy</a>.
        </p>

        <h2>7. Intellectual property</h2>
        <p>
          You own your business content — your business name, branding, and the material you
          put on your site. NotaryHost and its licensors own the underlying platform, software,
          and design. Nothing here transfers ownership of the platform to you.
        </p>

        <h2>8. Termination</h2>
        <p>
          Either party can terminate the subscription at any time. We may suspend or terminate
          your account for violation of these terms, non-payment, or unlawful use. On
          termination, your site is taken offline and your data is handled per our retention
          practices described in the Privacy Policy.
        </p>

        <h2>9. Disclaimers and limitation of liability</h2>
        <p>
          The Service is provided &ldquo;as is&rdquo; without warranties of any kind, including
          uptime or fitness for a particular purpose. To the maximum extent permitted by law,
          NotaryHost&apos;s total liability for any claim relating to the Service is limited to
          the amount you paid us in the three months before the claim arose. NotaryHost is not
          liable for indirect, incidental, or consequential damages.
        </p>

        <h2>10. Indemnification</h2>
        <p>
          You agree to indemnify and hold NotaryHost harmless from claims arising out of your
          use of the Service, your notary services, or your violation of these terms or
          applicable law.
        </p>

        <h2>11. Governing law</h2>
        <p>
          These terms are governed by the laws of <em>[state/jurisdiction — to be filled in]</em>,
          without regard to conflict-of-law rules.
        </p>

        <h2>12. Changes to these terms</h2>
        <p>
          We may update these terms from time to time. Continuing to use the Service after
          changes take effect means you accept the updated terms.
        </p>

        <h2>13. Contact</h2>
        <p>
          Questions? Email <a href="mailto:yoyoprola@gmail.com">yoyoprola@gmail.com</a>.
        </p>
      </>
    </LegalPage>
  )
}
