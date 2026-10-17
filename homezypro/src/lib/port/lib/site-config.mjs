// HomezyPro: roster's site-config, now a shim over src/config/site.mjs (one config for the site URL
// and the indexing switch). Paths are root-relative; there is no /roster base.
import {SITE_URL, absUrl, INDEXABLE, robotsFor} from '../../../config/site.mjs';
export const SITE_ORIGIN = SITE_URL;
export const SITE_BASE = '';
export const LAUNCH = INDEXABLE;
export const origin = SITE_URL;
export {absUrl, robotsFor};
