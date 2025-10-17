import CryptoJS from "crypto-js";

const SECRET_KEY = import.meta.env.VITE_CRYPTO_KEY;

export function setSecureItem(key, value) {
  try {
    const data = typeof value === "string" ? value : JSON.stringify(value);
    const encrypted = CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
    localStorage.setItem(key, encrypted);
  } catch (err) {
    console.error("Error al guardar en secureStorage:", err);
  }
}

export function getSecureItem(key) {
  try {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;
    const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  } catch (err) {
    console.error("Error al leer de secureStorage:", err);
    return null;
  }
}

export function removeSecureItem(key) {
  localStorage.removeItem(key);
}
