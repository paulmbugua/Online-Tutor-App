/**
 * Normalize a Kenyan phone number to the format 254XXXXXXXXX.
 * @param {string} phone - The phone number input by the client.
 * @returns {string} - The normalized phone number.
 */
export function normalizePhoneNumber(phone) {
    // Remove any spaces or dashes
    phone = phone.replace(/[\s-]/g, '');
    
    // Remove any leading '+'
    if (phone.startsWith('+')) {
      phone = phone.slice(1);
    }
    
    // If the number starts with '0', remove it and add '254'
    if (phone.startsWith('0')) {
      phone = '254' + phone.slice(1);
    }
    
    return phone;
  }
  
