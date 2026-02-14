# Google Cloud Context & Runbook

## Current Configuration
*   **Project Name:** `second-brain`
*   **Project ID:** `second-brain-463904`
*   **Billing Account:** `01A3E9-148922-CD6A2E` (Active)
*   **Enabled APIs:** `aiplatform.googleapis.com` (Vertex AI), `cloudresourcemanager.googleapis.com`

## Environment Setup
The `gcloud` CLI is installed via Homebrew. Does not currently persist in `$PATH`.
**Temporary Usage:**
```bash
/opt/homebrew/bin/gcloud config list
```
**Permanent Fix:**
Add this to your `~/.zshrc`:
```bash
export PATH="/opt/homebrew/bin:$PATH"
```

## 🚨 Hackathon Action Plan: When You Receive Credits

When the Cerebral Valley team sends you the credit code/link:

### 1. Redeem the Credits
1.  Click the redemption link provided in email/Discord.
2.  Select your personal Google account.
3.  This will likely craete a **NEW** Billing Account (e.g., *"Billing Account for Cerebral Valley Hackathon"*).

### 2. Switch Project Billing
Your project is currently linked to your personal billing. You must switch it to the Hackathon billing to use their free money.

**Command Line Method:**
```bash
# 1. List valid billing accounts to find the new ID
/opt/homebrew/bin/gcloud billing accounts list

# 2. Link your project to the NEW billing ID
/opt/homebrew/bin/gcloud billing projects link second-brain-463904 --billing-account=NEW_BILLING_ACCOUNT_ID
```

**Console Method (Easier visual verification):**
1.  Go to [Google Cloud Console - Billing](https://console.cloud.google.com/billing).
2.  Select your project `second-brain-463904`.
3.  Click **"Manage Billing Account"** (or "Change Billing").
4.  Select the new "Hackathon" billing account from the dropdown.

### 3. Verify
Run this to confirm the switch:
```bash
/opt/homebrew/bin/gcloud billing projects describe second-brain-463904
```
*Ensure `billingAccountName` matches the new Hackathon ID.*
