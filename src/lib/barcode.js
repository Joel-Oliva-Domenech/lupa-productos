const SUPPORTED_LENGTHS = new Set([8, 12, 13, 14]);

export function cleanBarcode(value = '') {
  return String(value).replace(/\D/g, '');
}

export function hasValidGtinChecksum(value) {
  const code = cleanBarcode(value);
  if (!SUPPORTED_LENGTHS.has(code.length)) return false;

  const digits = [...code].map(Number);
  const expected = digits.pop();
  const sum = digits
    .reverse()
    .reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === expected;
}

export function validateBarcode(value) {
  const code = cleanBarcode(value);
  if (!code) {
    return { valid: false, code, message: 'Escribe los números que aparecen bajo el código.' };
  }
  if (!SUPPORTED_LENGTHS.has(code.length)) {
    return { valid: false, code, message: 'Admite códigos GTIN de 8, 12, 13 o 14 cifras.' };
  }
  if (!hasValidGtinChecksum(code)) {
    return { valid: false, code, message: 'El código parece incompleto o contiene un número incorrecto.' };
  }
  return { valid: true, code, message: '' };
}
