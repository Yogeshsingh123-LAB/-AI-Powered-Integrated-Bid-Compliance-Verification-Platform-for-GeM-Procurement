import test from "node:test";
import assert from "node:assert/strict";
import { detectLanguage, formatDate, translations, errorText } from "../src/components/chatText.js";

test("language dictionaries cover every workflow and status", () => {
  for (const language of Object.keys(translations)) {
    assert.deepEqual(Object.keys(translations[language]).sort(), Object.keys(translations.en).sort());
    assert.deepEqual(Object.keys(translations[language].statuses).sort(), Object.keys(translations.en.statuses).sort());
    assert.deepEqual(Object.keys(translations[language].actions).sort(), Object.keys(translations.en.actions).sort());
  }
});
test('regional detection, dates and errors work for every added language', () => {
  const samples = { bn: 'আমার আবেদন', ta: 'எனது விண்ணப்பம்', te: 'నా దరఖాస్తు', mr: 'माझा अर्ज', gu: 'મારી અરજી', kn: 'ನನ್ನ ಅರ್ಜಿ', ml: 'എന്റെ അപേക്ഷ', pa: 'ਮੇਰੀ ਅਰਜ਼ੀ' };
  for (const [code, sample] of Object.entries(samples)) {
    assert.equal(detectLanguage(sample), code);
    assert.equal(errorText(404, translations[code]), translations[code].missing);
    assert.ok(formatDate('2026-09-10T10:30:00Z', code).endsWith(' IST'));
    assert.ok(translations[code].suggestions.every(s => typeof s === 'string' && s.length > 0));
  }
});
test("detect Hindi and Hinglish text", () => {
  assert.equal(detectLanguage("मेरा आवेदन कहाँ है?"), "hi");
  assert.equal(detectLanguage("Mera status kya hai?"), "hinglish");
  assert.equal(detectLanguage("Where is my application?"), "en");
});
test("timestamps are readable and legacy UTC timestamps are consistent", () => {
  assert.equal(formatDate("2026-09-10T10:30:00", "en"), formatDate("2026-09-10T10:30:00Z", "en"));
  assert.match(formatDate("2026-09-10T10:30:00Z", "en"), /10 September 2026/);
  assert.equal(formatDate(null, "hi"), translations.hi.noReview);
});
test("errors are localized and do not reveal backend details", () => {
  assert.equal(errorText(404, translations.hi), translations.hi.missing);
  assert.equal(errorText(500, translations.en), translations.en.error);
  assert.equal(errorText(429, translations.hinglish), translations.hinglish.limited);
});
