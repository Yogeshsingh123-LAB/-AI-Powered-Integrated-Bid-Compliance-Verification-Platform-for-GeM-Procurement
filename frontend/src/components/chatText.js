import { regionalTranslations } from './chatRegional.js';
export const languageOptions = [
  { code: 'auto', label: 'Auto' }, { code: 'en', label: 'English' }, { code: 'hi', label: 'हिन्दी' },
  { code: 'hinglish', label: 'Hinglish' }, { code: 'bn', label: 'বাংলা' }, { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' }, { code: 'mr', label: 'मराठी' }, { code: 'gu', label: 'ગુજરાતી' },
  { code: 'kn', label: 'ಕನ್ನಡ' }, { code: 'ml', label: 'മലയാളം' }, { code: 'pa', label: 'ਪੰਜਾਬੀ' },
];
export const translations = {
  en: {
    minimize: 'Minimize', expand: 'Expand', restore: 'Restore size', resetLayout: 'Reset layout', move: 'Drag to move, or use arrow keys', resize: 'Drag to resize, or use arrow keys',
    applicantName: "Applicant", replyApplicant: "Write a reply to the applicant…",
    chat: "FAQs", track: "Track application", create: "Raise ticket", ticket: "Track ticket", live: "Live support", staff: "Support inbox",
    welcome: "Hello! I’m MyGeM. Ask a portal question, track your application by reference, or contact support using the menu.",
    language: "Language", auto: "Auto", question: "Type your question…", send: "Send", reset: "New conversation", close: "Close", about: "About MyGeM",
    aboutText: "MyGeM is this platform’s assistant, not the official GeM helpdesk. Tracking is limited to your signed-in account. Support messages go to platform administrators. Do not share passwords or identity documents here.",
    loading: "Please wait…", error: "This service is unavailable. Please try again.", unauthorized: "Your session has expired. Please sign in again.", missing: "No accessible record found. Check the full reference and signed-in account.", limited: "Too many requests. Please wait a minute.", invalid: "Check your input. A full reference number is required.", conflict: "This ticket is resolved. Create a new ticket if you still need help.",
    reference: "Full application reference", referenceHelp: "Copy the full application ID from My Bids. Only your own applications can be tracked.", lookup: "Check status", submitted: "Submitted", reviewed: "Reviewed", status: "Status", next: "Next action", noReview: "Not yet recorded",
    statuses: { submitted: "Submitted", under_review: "Under review", clarification_needed: "Clarification needed", approved: "Approved", rejected: "Rejected", approved_with_deviation: "Approved with deviation", unknown: "Status unavailable", open: "Open", in_progress: "In progress", resolved: "Resolved" },
    actions: { check_documents: "Check My Bids and Documents for any outstanding requirements.", respond_to_clarification: "Open My Bids and Documents to review the clarification request.", check_decision: "Open My Bids to review the recorded decision.", contact_support: "Contact support for help with this application." },
    subject: "Subject", issue: "Describe your issue", optionalReference: "Application reference (optional)", createTicket: "Create ticket", ticketReference: "Full ticket reference", updated: "Last updated", escalate: "Request escalation", escalated: "Escalation requested", reply: "Write a message to support…", applicant: "You", agent: "Support agent", saved: "Keep this ticket reference for future tracking.", conversation: "Latest 100 support messages", online: "A support administrator is online. Create a ticket or open an existing one to start chatting.", offline: "Support is offline. Leave a ticket and check back here for replies.", inbox: "Support inbox", refresh: "Refresh", back: "Back", more: "Next page", previous: "Previous page", noTickets: "No tickets on this page.", resolve: "Mark resolved", reopen: "Reopen", consent: "Send only information needed to explain your issue. Messages are visible to platform support administrators.",
    disclaimer: "AI guidance may contain errors. Verify tender-specific rules in the tender documents.", kb: "Portal guidance", web: "Web-assisted answer", suggestions: ["How do I apply for a tender?", "How do I upload documents?", "How is the score calculated?"],
  },
  hi: {
    minimize: 'छोटा करें', expand: 'बड़ा करें', restore: 'पिछला आकार', resetLayout: 'लेआउट रीसेट करें', move: 'खींचकर या तीर कुंजियों से स्थान बदलें', resize: 'खींचकर या तीर कुंजियों से आकार बदलें',
    applicantName: "आवेदक", replyApplicant: "आवेदक को जवाब लिखें…",
    chat: "सामान्य सवाल", track: "आवेदन ट्रैक करें", create: "टिकट बनाएँ", ticket: "टिकट ट्रैक करें", live: "सहायता एजेंट", staff: "सहायता इनबॉक्स",
    welcome: "नमस्ते! मैं MyGeM हूँ। पोर्टल के बारे में पूछें, संदर्भ नंबर से आवेदन ट्रैक करें या मेनू से सहायता लें।",
    language: "भाषा", auto: "स्वतः", question: "अपना सवाल लिखें…", send: "भेजें", reset: "नई बातचीत", close: "बंद करें", about: "MyGeM के बारे में",
    aboutText: "MyGeM इस प्लेटफ़ॉर्म का सहायक है, आधिकारिक GeM हेल्पडेस्क नहीं। आप केवल अपने खाते के आवेदन ट्रैक कर सकते हैं। सहायता संदेश प्लेटफ़ॉर्म प्रशासकों को मिलते हैं। पासवर्ड या पहचान दस्तावेज़ साझा न करें।",
    loading: "कृपया प्रतीक्षा करें…", error: "सेवा उपलब्ध नहीं है। फिर कोशिश करें।", unauthorized: "सत्र समाप्त हो गया है। फिर साइन इन करें।", missing: "रिकॉर्ड उपलब्ध नहीं है। पूरा संदर्भ और साइन इन किया हुआ खाता जाँचें।", limited: "बहुत अधिक अनुरोध हैं। एक मिनट प्रतीक्षा करें।", invalid: "जानकारी जाँचें। पूरा संदर्भ नंबर आवश्यक है।", conflict: "यह टिकट हल हो चुका है। मदद चाहिए तो नया टिकट बनाएँ।",
    reference: "पूरा आवेदन संदर्भ", referenceHelp: "My Bids से पूरा आवेदन ID कॉपी करें। केवल अपने आवेदन ट्रैक कर सकते हैं।", lookup: "स्थिति देखें", submitted: "जमा करने की तारीख", reviewed: "समीक्षा की तारीख", status: "स्थिति", next: "अगला कदम", noReview: "अभी दर्ज नहीं है",
    statuses: { submitted: "जमा हो गया", under_review: "समीक्षा जारी", clarification_needed: "स्पष्टीकरण आवश्यक", approved: "स्वीकृत", rejected: "अस्वीकृत", approved_with_deviation: "विचलन सहित स्वीकृत", unknown: "स्थिति उपलब्ध नहीं", open: "खुला", in_progress: "कार्य जारी", resolved: "हल हो गया" },
    actions: { check_documents: "बाकी आवश्यकताओं के लिए My Bids और Documents देखें।", respond_to_clarification: "स्पष्टीकरण अनुरोध देखने के लिए My Bids और Documents खोलें।", check_decision: "दर्ज निर्णय देखने के लिए My Bids खोलें।", contact_support: "इस आवेदन के लिए सहायता टीम से संपर्क करें।" },
    subject: "विषय", issue: "समस्या बताएँ", optionalReference: "आवेदन संदर्भ (वैकल्पिक)", createTicket: "टिकट बनाएँ", ticketReference: "पूरा टिकट संदर्भ", updated: "पिछला अपडेट", escalate: "उच्च स्तर की सहायता माँगें", escalated: "उच्च स्तर की सहायता माँगी गई", reply: "सहायता टीम को संदेश लिखें…", applicant: "आप", agent: "सहायता एजेंट", saved: "आगे ट्रैक करने के लिए यह टिकट संदर्भ सुरक्षित रखें।", conversation: "पिछले 100 सहायता संदेश", online: "सहायता प्रशासक ऑनलाइन हैं। बातचीत के लिए टिकट बनाएँ या मौजूदा टिकट खोलें।", offline: "सहायता टीम ऑफ़लाइन है। टिकट भेजें और जवाब यहाँ देखें।", inbox: "सहायता इनबॉक्स", refresh: "रीफ़्रेश", back: "वापस", more: "अगला पृष्ठ", previous: "पिछला पृष्ठ", noTickets: "इस पृष्ठ पर कोई टिकट नहीं है।", resolve: "हल हो गया चिह्नित करें", reopen: "फिर खोलें", consent: "केवल समस्या से संबंधित जानकारी भेजें। संदेश प्लेटफ़ॉर्म सहायता प्रशासकों को दिखेंगे।",
    disclaimer: "AI मार्गदर्शन में त्रुटियाँ हो सकती हैं। विशिष्ट नियम निविदा दस्तावेज़ में जाँचें।", kb: "पोर्टल मार्गदर्शन", web: "वेब आधारित उत्तर", suggestions: ["आवेदन कैसे करें?", "दस्तावेज़ कैसे अपलोड करें?", "आवेदन की स्थिति कैसे देखें?"],
  },
  hinglish: {
    minimize: 'Chhota kare', expand: 'Bada kare', restore: 'Pichhla size', resetLayout: 'Layout reset kare', move: 'Drag ya arrow keys se jagah badle', resize: 'Drag ya arrow keys se size badle',
    applicantName: "Applicant", replyApplicant: "Applicant ko reply likhe…",
    chat: "FAQs", track: "Application track kare", create: "Ticket banaye", ticket: "Ticket track kare", live: "Live support", staff: "Support inbox",
    welcome: "Namaste! Main MyGeM hoon. Portal ke baare mein puche, reference se application track kare ya menu se support le.",
    language: "Bhasha", auto: "Auto", question: "Apna sawal likhe…", send: "Bheje", reset: "Nayi baatcheet", close: "Band kare", about: "MyGeM ke baare mein",
    aboutText: "MyGeM is platform ka assistant hai, official GeM helpdesk nahi. Sirf apne account ki application track kar sakte hain. Support messages platform administrators ko milte hain. Password ya identity documents share na kare.",
    loading: "Kripya ruke…", error: "Service available nahi hai. Phir try kare.", unauthorized: "Session expire ho gaya. Phir sign in kare.", missing: "Record available nahi hai. Poora reference aur signed-in account check kare.", limited: "Bahut requests hain. Ek minute ruke.", invalid: "Input check kare. Poora reference number zaroori hai.", conflict: "Yeh ticket resolve ho gaya. Madad chahiye to naya ticket banaye.",
    reference: "Poora application reference", referenceHelp: "My Bids se poora application ID copy kare. Sirf apni applications track kar sakte hain.", lookup: "Status dekhe", submitted: "Submit kiya", reviewed: "Review hua", status: "Status", next: "Agla kadam", noReview: "Abhi record nahi hua",
    statuses: { submitted: "Submit ho gaya", under_review: "Review chal raha hai", clarification_needed: "Clarification chahiye", approved: "Approve ho gaya", rejected: "Reject ho gaya", approved_with_deviation: "Deviation ke saath approved", unknown: "Status available nahi", open: "Khula hai", in_progress: "Kaam chal raha hai", resolved: "Resolve ho gaya" },
    actions: { check_documents: "Baaki requirements ke liye My Bids aur Documents dekhe.", respond_to_clarification: "Clarification request ke liye My Bids aur Documents khole.", check_decision: "Recorded decision ke liye My Bids khole.", contact_support: "Is application ke liye support team se madad le." },
    subject: "Vishay", issue: "Apni problem bataye", optionalReference: "Application reference (optional)", createTicket: "Ticket banaye", ticketReference: "Poora ticket reference", updated: "Aakhri update", escalate: "Escalation mange", escalated: "Escalation request bhej di", reply: "Support ko message likhe…", applicant: "Aap", agent: "Support agent", saved: "Tracking ke liye yeh ticket reference sambhal kar rakhe.", conversation: "Pichhle 100 support messages", online: "Support administrator online hai. Chat ke liye ticket banaye ya existing ticket khole.", offline: "Support offline hai. Ticket bheje aur reply yahan check kare.", inbox: "Support inbox", refresh: "Refresh", back: "Wapas", more: "Agla page", previous: "Pichhla page", noTickets: "Is page par tickets nahi hain.", resolve: "Resolved mark kare", reopen: "Phir khole", consent: "Sirf problem se judi information bheje. Messages platform support administrators ko dikhenge.",
    disclaimer: "AI guidance mein galti ho sakti hai. Specific rules tender documents mein check kare.", kb: "Portal guidance", web: "Web se jawab", suggestions: ["Apply kaise kare?", "Documents upload kaise kare?", "Application status kaise dekhe?"],
  },
};

Object.assign(translations, regionalTranslations);

export function detectLanguage(text) {
  for (const [code, pattern] of [['bn', /[\u0980-\u09ff]/], ['ta', /[\u0b80-\u0bff]/], ['te', /[\u0c00-\u0c7f]/], ['gu', /[\u0a80-\u0aff]/], ['kn', /[\u0c80-\u0cff]/], ['ml', /[\u0d00-\u0d7f]/], ['pa', /[\u0a00-\u0a7f]/]]) {
    if (pattern.test(text)) return code;
  }
  // Hindi and Marathi share Devanagari. Prefer explicit selection for ambiguous text.
  if (/(मराठी|माझ|मला|कसे|कशी|आहे|आहेत|करावा|पाहावी)/.test(text)) return 'mr';
  if (/[\u0900-\u097f]/.test(text)) return "hi";
  if (/\b(kaise|kya|mera|meri|mujhe|hai|hain|kahan|chahiye|kare|karu)\b/i.test(text)) return "hinglish";
  return "en";
}

export function formatDate(value, language) {
  if (!value) return translations[language].noReview;
  // Existing database timestamps are UTC, including legacy values without an offset.
  const date = new Date(/(?:Z|[+-]\d\d:\d\d)$/.test(value) ? value : `${value}Z`);
  if (Number.isNaN(date.getTime())) return translations[language].noReview;
  return new Intl.DateTimeFormat(language === "hinglish" ? "en-IN" : `${language}-IN`, {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata",
  }).format(date) + " IST";
}

export function errorText(status, t) {
  return ({ 401: t.unauthorized, 403: t.missing, 404: t.missing, 409: t.conflict, 422: t.invalid, 429: t.limited })[status] || t.error;
}
