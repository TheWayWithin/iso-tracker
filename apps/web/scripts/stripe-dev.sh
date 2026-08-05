#!/bin/bash
# stripe-dev.sh - Forward Stripe TEST webhooks to localhost for development
#
# USAGE:
#   ./scripts/stripe-dev.sh
#
# This script:
# 1. Starts the Stripe CLI webhook forwarder
# 2. Forwards all TEST mode events to your local dev server
# 3. Displays a webhook secret to use (different from production!)
#
# IMPORTANT: When running this, you'll see a webhook signing secret.
# Use THIS secret in your .env.local for STRIPE_WEBHOOK_SECRET when testing locally.
#
# Example output:
#   > Ready! Your webhook signing secret is whsec_xxxxx
#
# The CLI secret is DIFFERENT from the Stripe Dashboard webhook secret.
# - Dashboard secret: for production webhooks hitting isotracker.org
# - CLI secret: for local development testing only

PORT=${1:-3001}
ENDPOINT="http://localhost:${PORT}/api/stripe/webhook"

echo "🔗 Starting Stripe webhook forwarding to ${ENDPOINT}"
echo ""
echo "📋 Copy the webhook signing secret shown below and use it in .env.local"
echo "   (It's different from the production webhook secret!)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

stripe listen --forward-to "${ENDPOINT}"
