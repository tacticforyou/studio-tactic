// Prefill new Privacy drafts from the website's existing notice. This is editor
// initial-value data only; it neither changes existing documents nor publishes.
/** @param {string} key @param {string} text @param {string} [style] */
function block(key, text, style = 'normal') {
  return {
    _type: 'block',
    _key: key,
    style,
    children: [{_type: 'span', _key: 'text', text, marks: []}],
    markDefs: [],
  }
}

export const privacyInitialValue = {
  title: 'Privacy notice',
  description:
    'TACTIC is a creative studio based in Iran. This notice describes how this website handles information.',
  blocks: [
    block('text-1', 'Project enquiries', 'h2'),
    block(
      'text-2',
      'When you send an enquiry, we use your name, email address, chosen service, and message to respond and discuss your project. Resend delivers the message to our receiving inbox. Do not include passwords, payment details, or sensitive personal information. Preparing a brief alone does not email it to us.',
    ),
    block('text-3', 'Optional recordings and heatmaps', 'h2'),
    block(
      'text-4',
      'Microsoft Clarity is enabled by default to provide heatmaps and session recordings that help us improve the website, subject to provider restrictions. You can stop it by choosing Reject recordings in Privacy settings, and change your choice by selecting Allow recordings. The saved choice in Privacy settings controls whether Clarity loads; browser privacy signals do not change this default. Advertising storage is always denied. Contact-form contents and brief previews are masked for recordings. We do not use Google Analytics or Plausible.',
    ),
    block('text-5', 'Reliability and spam prevention', 'h2'),
    block(
      'text-6',
      'Vercel hosts this website and processes requests. Sentry receives filtered technical error reports to help us fix faults; Sentry session replay, performance tracing, and log collection are disabled. Upstash Redis stores a short-lived submission counter for spam prevention. We do not put enquiry contents or IP addresses into that counter.',
    ),
    block('text-7', 'Cookies and choices', 'h2'),
    block(
      'text-8',
      'We store your privacy choices in your browser for up to 180 days. Clarity analytics storage is denied unless you choose Allow recordings; default activation is not treated as consent to cookies. You can revisit Privacy settings at any time to reject recordings. Rejecting stops future recording and clears accessible first-party Clarity cookies; it does not automatically remove information already processed by providers. When a saved choice expires, the default applies again.',
    ),
    block('text-9', 'Providers and retention', 'h2'),
    block(
      'text-10',
      'Our providers may process information outside Iran under their own terms and retention settings. We keep enquiry correspondence only as long as needed to respond, manage a project, or meet applicable obligations. Ask us to delete correspondence you no longer want us to keep. Browser privacy settings control local cookies and storage.',
    ),
    block('text-11', 'Contact and requests', 'h2'),
    block(
      'text-12',
      'For questions, access requests, corrections, or deletion requests, contact us through the project enquiry form when sending is available. Our branded address, admin@tacticforyou.com, will become available after the domain and email forwarding are activated.',
    ),
  ],
}
