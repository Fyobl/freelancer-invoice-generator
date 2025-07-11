
import emailjs from 'emailjs-com';

// Initialize EmailJS with your public key
// You'll need to replace these with your actual EmailJS credentials
const SERVICE_ID = 'your_service_id';
const TEMPLATE_ID = 'your_template_id';
const PUBLIC_KEY = 'your_public_key';

export const initEmailJS = () => {
  emailjs.init(PUBLIC_KEY);
};

export const sendQuoteEmail = async (quote, recipientEmail, senderName, companyName) => {
  const templateParams = {
    to_email: recipientEmail,
    from_name: senderName || companyName || 'Your Company',
    quote_number: quote.quoteNumber,
    client_name: quote.clientName,
    amount: parseFloat(quote.amount).toFixed(2),
    vat: quote.vat || 0,
    total: (parseFloat(quote.amount) * (1 + (quote.vat || 0) / 100)).toFixed(2),
    valid_until: quote.validUntil,
    notes: quote.notes || 'N/A',
    status: quote.status,
    created_date: quote.createdAt?.toDate?.()?.toLocaleDateString() || new Date().toLocaleDateString(),
    message: `Please find your quote ${quote.quoteNumber} details below.`
  };

  try {
    const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams);
    return { success: true, response };
  } catch (error) {
    console.error('Email send failed:', error);
    return { success: false, error };
  }
};

export const sendInvoiceEmail = async (invoice, recipientEmail, senderName, companyName) => {
  const templateParams = {
    to_email: recipientEmail,
    from_name: senderName || companyName || 'Your Company',
    invoice_number: invoice.invoiceNumber,
    client_name: invoice.clientName,
    amount: parseFloat(invoice.amount).toFixed(2),
    vat: invoice.vat || 0,
    total: (parseFloat(invoice.amount) * (1 + (invoice.vat || 0) / 100)).toFixed(2),
    due_date: invoice.dueDate,
    notes: invoice.notes || 'N/A',
    status: invoice.status,
    created_date: invoice.createdAt?.toDate?.()?.toLocaleDateString() || new Date().toLocaleDateString(),
    message: `Please find your invoice ${invoice.invoiceNumber} details below. Payment is due by ${invoice.dueDate}.`
  };

  try {
    const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams);
    return { success: true, response };
  } catch (error) {
    console.error('Email send failed:', error);
    return { success: false, error };
  }
};
