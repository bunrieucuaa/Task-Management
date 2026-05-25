import { AES, enc } from "crypto-js";
import { KEY_LOCAL } from "../../core/constants";

const encrypt = (txt: string): string => {
  return txt ? AES.encrypt(JSON.stringify(txt), KEY_LOCAL).toString() : "";
};

const decrypt = (txtToDecrypt: string | null) => {
  try {
    const decode =
      txtToDecrypt && AES.decrypt(txtToDecrypt, KEY_LOCAL).toString(enc.Utf8)
        ? JSON.parse(AES.decrypt(txtToDecrypt, KEY_LOCAL).toString(enc.Utf8))
        : "";
    return decode + "";
  } catch {
    return "";
  }
};

export { encrypt, decrypt };
