"""Text-only language fallback and a conservative guard against raw math markup."""
import re
from app.services.chat_languages import REGIONAL


def format_number(value):
    """Format a known numeric value only; never run this on arbitrary text or IDs."""
    negative = value.startswith("-")
    integer, _, fraction = value.lstrip("-").partition(".")
    fraction = fraction.rstrip("0")
    tail = integer[-3:]
    prefix = integer[:-3]
    groups = []
    while prefix:
        groups.insert(0, prefix[-2:])
        prefix = prefix[:-2]
    number = ",".join([*groups, tail])
    return ("-" if negative and any(c not in "0." for c in value[1:]) else "") + number + ("." + fraction if fraction else "")


def has_latex(text):
    return bool(re.search(r"\\(?:[A-Za-z]+|[()\[\]])|\$\$|\$[^$\n]+\$", text))


def detect_language(text):
    for code, pattern in (("bn", r"[\u0980-\u09ff]"), ("ta", r"[\u0b80-\u0bff]"),
                          ("te", r"[\u0c00-\u0c7f]"), ("gu", r"[\u0a80-\u0aff]"),
                          ("kn", r"[\u0c80-\u0cff]"), ("ml", r"[\u0d00-\u0d7f]"), ("pa", r"[\u0a00-\u0a7f]")):
        if re.search(pattern, text):
            return code
    if re.search(r"मराठी|माझ|मला|कसे|कशी|आहे|आहेत|करावा|पाहावी", text):
        return "mr"
    if re.search(r"[\u0900-\u097f]", text):
        return "hi"
    if re.search(r"\b(kaise|kya|mera|meri|mujhe|hai|hain|kahan|chahiye|kare|karu)\b", text, re.I):
        return "hinglish"
    return "en"


def localized_fallback(message, language):
    if language in REGIONAL:
        return REGIONAL[language][0], list(REGIONAL[language][1])
    hindi = language == "hi"
    text = message.lower()
    suggestions = (["आवेदन कैसे करें?", "दस्तावेज़ कैसे अपलोड करें?", "आवेदन की स्थिति कैसे देखें?"] if hindi else
                   ["Apply kaise kare?", "Documents upload kaise kare?", "Application status kaise dekhe?"])
    if any(word in text for word in ("status", "track", "स्थिति", "reference", "संदर्भ")):
        answer = ("आवेदन की स्थिति के लिए ‘आवेदन ट्रैक करें’ चुनें और पूरा संदर्भ नंबर डालें। केवल आपके खाते के आवेदन दिखेंगे। टिकट की स्थिति के लिए ‘टिकट ट्रैक करें’ चुनें।" if hindi else
                  "Application ki sthiti ke liye ‘Track application’ chune aur poora reference number dale. Sirf aapke account ki application dikhegi. Ticket ke liye ‘Track ticket’ chune.")
    elif any(word in text for word in ("ticket", "टिकट", "agent", "support", "सहायता")):
        answer = ("समस्या भेजने के लिए ‘टिकट बनाएँ’ चुनें। आपको एक टिकट नंबर मिलेगा। सहायता टीम से बात करने के लिए ‘सहायता एजेंट’ चुनें। टीम उपलब्ध न होने पर भी आप टिकट भेज सकते हैं।" if hindi else
                  "Issue bhejne ke liye ‘Raise ticket’ chune. Aapko ticket number milega. Support team se baat karne ke liye ‘Live support’ chune. Team offline ho tab bhi ticket bhej sakte hain.")
    elif any(word in text for word in ("upload", "document", "दस्तावेज", "अपलोड")):
        answer = ("Supplier खाते में Documents खोलें। संबंधित निविदा की आवश्यक दस्तावेज़ सूची में Upload Document चुनें। PDF, JPG/JPEG, PNG, TIFF और BMP स्वीकार हैं; हर फ़ाइल की सीमा 10 MB है। Buyer खाते में Verification से दस्तावेज़ देखें।" if hindi else
                  "Supplier account mein Documents khole. Tender ki required checklist mein Upload Document chune. PDF, JPG/JPEG, PNG, TIFF aur BMP allowed hain; har file ki limit 10 MB hai. Buyer account mein Verification se documents dekhe.")
    elif any(word in text for word in ("apply", "आवेदन", "tender", "निविदा")):
        answer = ("Supplier खाते से Tenders खोलें, सक्रिय निविदा चुनें और Apply दबाएँ। फिर Documents में आवश्यक फ़ाइलें जमा करें। My Bids में अपना पूरा आवेदन संदर्भ नंबर देखें।" if hindi else
                  "Supplier account se Tenders khole, active tender chune aur Apply dabaye. Phir Documents mein required files submit kare. My Bids mein apna poora application reference milega.")
    else:
        answer = ("मैं पोर्टल के सामान्य सवालों में मदद कर सकता हूँ। आवेदन की स्थिति, टिकट या सहायता टीम के लिए ऊपर का मेनू चुनें। निविदा के विशिष्ट नियम उसके दस्तावेज़ में जाँचें।" if hindi else
                  "Main portal ke general sawalon mein madad kar sakta hoon. Application status, ticket ya support team ke liye upar ka menu chune. Tender ke specific rules uske document mein check kare.")
    return answer, suggestions
