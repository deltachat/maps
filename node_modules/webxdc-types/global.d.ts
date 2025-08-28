import { Webxdc } from "./webxdc";
declare global {
  interface Window {
    webxdc: Webxdc<any>;
  }
}
