// utils/generateSecurityCredential.js
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

// Retrieve the certificate path from environment variables
const certificatePath = process.env.MPESA_CERTIFICATE_PATH;
if (!certificatePath) {
  throw new Error('MPESA_CERTIFICATE_PATH is not defined in the environment variables.');
}

// Resolve and read the certificate file (DER format)
const resolvedPath = path.resolve(certificatePath);
const certificateDer = fs.readFileSync(resolvedPath);

// Retrieve the initiator password from environment variables
const initiatorPassword = process.env.MPESA_INITIATOR_PASSWORD;
if (!initiatorPassword) {
  throw new Error('MPESA_INITIATOR_PASSWORD is not defined in the environment variables.');
}

// Create a public key object from the DER-formatted certificate
const publicKey = crypto.createPublicKey({
  key: certificateDer,
  format: 'der',
  type: 'spki'  // most X.509 certificates in DER are in SPKI format
});

// Encrypt the initiator password using the public key with RSA PKCS1 padding
function generateSecurityCredential(password, publicKey) {
  const buffer = Buffer.from(password);
  const encrypted = crypto.publicEncrypt(
    { key: publicKey, padding: crypto.constants.RSA_PKCS1_PADDING },
    buffer
  );
  return encrypted.toString('base64');
}

export const securityCredential = generateSecurityCredential(initiatorPassword, publicKey);
console.log('Generated Security Credential:', securityCredential);
