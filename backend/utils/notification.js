/**
 * EXO GLOBLE ERP — Real WhatsApp Notification Utility (Twilio)
 */
require('dotenv').config();

// Install using: npm install twilio
const twilio = require('twilio');

const sendWhatsApp = async (to, message, customContentSid = null, customVars = null) => {
  if (!to) return { status: 'error', message: 'No recipient' };

  const sid   = process.env.TWILIO_SID;
  const token = process.env.TWILIO_TOKEN;
  const from  = process.env.TWILIO_PHONE;

  if (!sid || !token || !from) {
    console.log('\x1b[33m%s\x1b[0m', '⚠️ [WHATSAPP SIMULATION MODE]');
    console.log(`To: ${to} | Msg: ${message}`);
    return { status: 'simulated', message: message };
  }

  try {
    const client = twilio(sid, token);
    let formattedTo = to.replace(/[^0-9]/g, ''); // Remove non-digits
    
    // Smart Prefixing
    if (formattedTo.length === 9) formattedTo = '351' + formattedTo;  // Portugal
    else if (formattedTo.length === 10) formattedTo = '91' + formattedTo; // India
    
    if (!formattedTo.startsWith('+')) formattedTo = '+' + formattedTo; 

    const messageParams = { 
      from: from, 
      to: `whatsapp:${formattedTo}`,
      body: message // Direct message text is better for Sandbox testing
    };

    await client.messages.create(messageParams);
    console.log(`✅ WhatsApp sent to ${formattedTo} | Msg: ${message}`);
    return { status: 'sent' };
  } catch (error) {
    console.error(`❌ Twilio Error:`, error.message);
    return { status: 'error', message: error.message };
  }
};

module.exports = { sendWhatsApp };
