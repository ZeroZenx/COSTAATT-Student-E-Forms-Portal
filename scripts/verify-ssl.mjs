import crypto from "crypto";
import fs from "fs";

const certificatePath = process.env.SSL_CERT_PATH || "C:\\Student E-Forms\\SSL Private Key\\eforms.costaatt.edu.tt\\831f8f7a1833747d.pem";
const keyPath = process.env.SSL_KEY_PATH || "C:\\Student E-Forms\\SSL Private Key\\eforms.costaatt.edu.tt.key";
const chainPath = process.env.SSL_CA_PATH || "C:\\Student E-Forms\\SSL Private Key\\eforms.costaatt.edu.tt\\gd_bundle_dv-r1-g2.crt.pem";
const hostname = process.env.PRODUCTION_HOSTNAME || "eforms.costaatt.edu.tt";

function readCertificate(filePath) {
  return new crypto.X509Certificate(fs.readFileSync(filePath));
}

function publicKeyHash(keyObject) {
  return crypto.createHash("sha256").update(keyObject.export({ type: "spki", format: "der" })).digest("hex");
}

const certificate = readCertificate(certificatePath);
const privateKey = crypto.createPrivateKey(fs.readFileSync(keyPath));
const chain = readCertificate(chainPath);
const certificateKeyHash = publicKeyHash(certificate.publicKey);
const privateKeyHash = publicKeyHash(crypto.createPublicKey(privateKey));
const hostnameMatch = Boolean(certificate.checkHost(hostname));

console.log("SSL verification");
console.log(`Certificate: ${certificatePath}`);
console.log(`Subject: ${certificate.subject}`);
console.log(`Issuer: ${certificate.issuer}`);
console.log(`Valid until: ${certificate.validTo}`);
console.log(`Hostname ${hostname}: ${hostnameMatch ? "covered" : "NOT COVERED"}`);
console.log(`Intermediate chain: ${chain.subject}`);
console.log(`Certificate/private-key match: ${certificateKeyHash === privateKeyHash ? "match" : "MISMATCH"}`);

if (!hostnameMatch || certificateKeyHash !== privateKeyHash) process.exit(1);
