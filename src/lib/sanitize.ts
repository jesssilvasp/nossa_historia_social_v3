// Simple sanitize - strips HTML tags and escapes special chars
const TAG_REGEX = /<[^>]*>/g;
const EVENT_HANDLER_REGEX = /\s*on\w+\s*=\s*[^>\s]+/gi;
const JAVASCRIPT_REGEX = /javascript:/gi;

const AMP = String.fromCharCode(38);
const LT = String.fromCharCode(60);
const GT = String.fromCharCode(62);
const QUOT = String.fromCharCode(34);
const APOST = String.fromCharCode(39);
const ENT_QUOT = "&" + "quot;";
const ENT_APOST = "&#" + "039;";

function stripTags(input: string): string {
  return input.replace(TAG_REGEX, "");
}

function escapeHtml(text: string): string {
  return text
    .replace(new RegExp(AMP, "g"), "&")
    .replace(new RegExp(LT, "g"), "<")
    .replace(new RegExp(GT, "g"), ">")
    .replace(new RegExp(QUOT, "g"), ENT_QUOT)
    .replace(new RegExp(APOST, "g"), ENT_APOST);
}

function removeEventHandlers(input: string): string {
  return input.replace(EVENT_HANDLER_REGEX, "");
}

function removeJavascriptUrls(input: string): string {
  return input.replace(JAVASCRIPT_REGEX, "");
}

export function sanitizeText(input: string, maxLength = 5000): string {
  if (!input) return "";
  const trimmed = input.trim().slice(0, maxLength);
  const noTags = stripTags(trimmed);
  const noEvents = removeEventHandlers(noTags);
  const noJs = removeJavascriptUrls(noEvents);
  return escapeHtml(noJs);
}

export function sanitizePlainText(input: string, maxLength = 200): string {
  if (!input) return "";
  const trimmed = input.trim().slice(0, maxLength);
  const noTags = stripTags(trimmed);
  const noEvents = removeEventHandlers(noTags);
  const noJs = removeJavascriptUrls(noEvents);
  return escapeHtml(noJs).replace(/[\r\n]+/g, " ");
}

export function sanitizeUsername(input: string): string {
  if (!input) return "";
  return input.trim().toLowerCase().replace(/[^a-z0-9_.]/g, "").slice(0, 24);
}