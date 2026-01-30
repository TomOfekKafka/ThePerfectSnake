# PayPal Integration Setup Guide

## Quick Start

### 1. Get PayPal Sandbox Credentials

1. Visit [PayPal Developer Dashboard](https://developer.paypal.com)
2. Log in or create a developer account
3. Navigate to **Dashboard → My Apps & Credentials**
4. Create a new app in **Sandbox** mode
5. Copy the **Client ID** and **Secret**
6. Create a sandbox buyer account under **Sandbox → Accounts** for testing

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your PayPal credentials:
```env
VITE_PAYPAL_CLIENT_ID=your_sandbox_client_id_here
PAYPAL_CLIENT_ID=your_sandbox_client_id_here
PAYPAL_CLIENT_SECRET=your_sandbox_client_secret_here
PAYPAL_API_BASE=https://api-m.sandbox.paypal.com
```

### 3. Install Dependencies & Run

```bash
npm install
npm run dev
```

The app will be available at http://localhost:5173

## Testing the Payment Flow

1. Start the development server
2. Scroll down to the "Support The Perfect Snake" section
3. Click the PayPal button
4. Log in with your sandbox buyer account
5. Complete the payment
6. Check the browser console and terminal for verification logs

## Deployment to Vercel

### Initial Setup

```bash
npm install -g vercel
vercel login
vercel
```

### Add Environment Variables

In the Vercel Dashboard:
1. Go to **Settings → Environment Variables**
2. Add all 4 environment variables:
   - `VITE_PAYPAL_CLIENT_ID`
   - `PAYPAL_CLIENT_ID`
   - `PAYPAL_CLIENT_SECRET`
   - `PAYPAL_API_BASE`
3. Set them for all environments (Production, Preview, Development)

### Deploy

```bash
git add .
git commit -m "Add PayPal payment integration"
git push
```

Vercel will automatically deploy on push.

## Going to Production

When ready to accept real payments:

1. Create a **Live** app in PayPal Developer Dashboard
2. Get production Client ID and Secret
3. Update environment variables in Vercel:
   - Keep `PAYPAL_API_BASE=https://api-m.paypal.com` (remove "sandbox")
4. Test with small real payments before announcing

## Architecture

```
User clicks PayPal button
    ↓
PayPal modal opens (hosted by PayPal)
    ↓
User approves payment
    ↓
PayPal processes payment
    ↓
Frontend receives order ID
    ↓
Frontend calls /api/verify-payment
    ↓
Backend verifies with PayPal API
    ↓
Backend logs payment details
    ↓
Success message shown to user
```

## Security Notes

- ✅ `.env.local` is gitignored
- ✅ Client secret never exposed to frontend
- ✅ Backend verifies all payments with PayPal
- ✅ Amount validation on backend ($10.00 exact)
- ✅ HTTPS required (Vercel provides automatically)

## Troubleshooting

**PayPal button doesn't show:**
- Check that `VITE_PAYPAL_CLIENT_ID` is set correctly
- Verify the environment variable starts with `VITE_`
- Restart the dev server after changing `.env.local`

**Payment verification fails:**
- Check that backend environment variables are set
- Verify `PAYPAL_CLIENT_SECRET` is correct
- Check Vercel function logs for errors

**"Payment verification service not configured" error:**
- Environment variables not set in Vercel dashboard
- Deploy a new version after adding environment variables

## File Structure

```
ThePerfectSnake/
├── api/
│   └── verify-payment.ts          # Vercel serverless function
├── src/
│   ├── App.tsx                     # PayPalScriptProvider wrapper
│   ├── App.css                     # Payment section styles
│   ├── components/
│   │   └── PayPalButton.tsx        # PayPal button component
│   ├── services/
│   │   └── paymentService.ts       # API call wrapper
│   └── types/
│       └── payment.ts              # TypeScript types
├── .env.local                      # Local environment variables (gitignored)
└── .env.example                    # Example env file
```

## Next Steps

- [ ] Set up PayPal sandbox credentials
- [ ] Test payment flow locally
- [ ] Deploy to Vercel
- [ ] Add environment variables in Vercel
- [ ] Test on deployed site
- [ ] Optional: Add database to store payment records
- [ ] Optional: Send confirmation emails
- [ ] Optional: Add webhook for payment notifications
