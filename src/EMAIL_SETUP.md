
# Email Setup Instructions

To enable email functionality for quotes and invoices, you need to set up EmailJS:

## Step 1: Create EmailJS Account
1. Go to https://www.emailjs.com/
2. Create a free account
3. Create a new email service (Gmail, Outlook, etc.)

## Step 2: Create Email Template
1. In EmailJS dashboard, go to "Email Templates"
2. Create a new template with these variables:
   - `{{to_email}}` - Recipient email
   - `{{from_name}}` - Your company/name
   - `{{quote_number}}` or `{{invoice_number}}` - Document number
   - `{{client_name}}` - Client name
   - `{{amount}}` - Amount
   - `{{vat}}` - VAT percentage
   - `{{total}}` - Total amount
   - `{{valid_until}}` or `{{due_date}}` - Valid until/due date
   - `{{notes}}` - Notes
   - `{{status}}` - Status
   - `{{created_date}}` - Creation date
   - `{{message}}` - Custom message

Example template:
```
Subject: {{quote_number}} - Quote from {{from_name}}

Dear {{client_name}},

{{message}}

Quote Details:
- Quote Number: {{quote_number}}
- Amount: £{{amount}}
- VAT: {{vat}}%
- Total: £{{total}}
- Valid Until: {{valid_until}}
- Status: {{status}}

Notes: {{notes}}

Best regards,
{{from_name}}
```

## Step 3: Update Configuration
1. In `src/emailService.js`, replace:
   - `your_service_id` with your EmailJS service ID
   - `your_template_id` with your template ID
   - `your_public_key` with your EmailJS public key

## Step 4: Test
1. Create a quote or invoice
2. Click the "📧 Email" button
3. Enter recipient email and send

Note: EmailJS free plan allows 200 emails per month.
