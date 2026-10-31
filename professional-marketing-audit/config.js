/* HeyLead audit checkout config.
 * PLACEHOLDERS: paste Stripe Payment Link URLs (https://buy.stripe.com/...) for each package.
 * In each Payment Link set "After payment" -> redirect to:
 *   https://heylead.com/professional-marketing-audit/thank-you/?pkg=<id>&session_id={CHECKOUT_SESSION_ID}
 * intakeEndpoint: URL that accepts a POST of the intake form (JSON). Empty = falls back to email.
 */
window.HL_AUDIT = {
  packages: {
    channel: { name: "Channel Audit", price: 100, paymentLink: "" },
    growth:  { name: "Growth Audit", price: 450, paymentLink: "" },
    full:    { name: "Full-Funnel Audit", price: 1200, paymentLink: "" }
  },
  intakeEndpoint: "",
  intakeEmail: "hello@heylead.com" // PLACEHOLDER - confirm inbox
};
