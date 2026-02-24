import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;

const genAI = new GoogleGenerativeAI(apiKey || 'placeholder');

const LANG_NAMES: Record<string, string> = {
    en: 'English',
    hi: 'Hindi (हिंदी)',
    mr: 'Marathi (मराठी)',
};

function buildSystemPrompt(language: string): string {
    const langName = LANG_NAMES[language] || 'English';
    const isEnglish = language === 'en';
    return `You are Senate Bot Administrator, an autonomous Indian government digital assistant.

🌐 LANGUAGE RULE (MANDATORY): You MUST respond ENTIRELY in ${langName}. Every word of the "response" field must be in ${langName}. Do NOT mix languages. Do NOT reply in English if the user selected ${isEnglish ? 'English' : langName}.

Your responsibilities:
- Help citizens apply for certificates (income, birth, residence, caste)
- Help file complaints about government services  
- Help track application status
- Provide Indian government scheme information
- Guide citizens through workflows step by step
- Always respond in ${langName} — this is non-negotiable

ALWAYS respond ONLY with valid JSON in this EXACT format:
{
  "intent": "one of: apply_certificate | file_complaint | track_status | scheme_info | switch_language | help | general_chat | collect_info",
  "response": "your response in ${langName} — ALL text must be in ${langName}",
  "scheme_name": "scheme name if relevant, otherwise null",
  "action_required": true or false
}

Intent detection:
- "apply_certificate" → user wants any certificate
- "file_complaint" → user wants to file a complaint/grievance
- "track_status" → user wants to check status
- "scheme_info" → user asks about a government scheme
- "help" → general guidance needed
- "general_chat" → anything else

Be helpful, professional, and compassionate. Always respond in ${langName}.`;
}

export interface GeminiResponse {
    intent: string;
    response: string;
    scheme_name: string | null;
    action_required: boolean;
}

export const geminiService = {
    getModel(language: string = 'en') {
        return genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: buildSystemPrompt(language),
        });
    },

    async sendMessage(
        history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
        userMessage: string,
        language: string = 'en'
    ): Promise<GeminiResponse> {
        const model = this.getModel(language);
        const chat = model.startChat({ history });
        // Also append a reminder in the message itself as a double-enforcement
        const langName = LANG_NAMES[language] || 'English';
        const msg = language !== 'en'
            ? `${userMessage}\n\n[MANDATORY: reply entirely in ${langName}]`
            : userMessage;

        const result = await chat.sendMessage(msg);
        const text = result.response.text();
        return this.parseResponse(text);
    },

    // Translate a hardcoded English string to the target language via Gemini
    async translateMessage(text: string, language: string): Promise<string> {
        if (language === 'en' || !text) return text;
        const langName = LANG_NAMES[language] || 'English';
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const prompt = `Translate the following government service chatbot message to ${langName}. Keep the meaning exactly the same. Return ONLY the translated text, no extra words.\n\n${text}`;
            const result = await model.generateContent(prompt);
            return result.response.text().trim() || text;
        } catch {
            return text; // fallback to English
        }
    },

    async getSchemeInfo(schemeName: string, language: string = 'en'): Promise<string> {
        const langNote = language === 'hi' ? 'Respond in Hindi.' : language === 'mr' ? 'Respond in Marathi.' : '';
        const model = this.getModel();
        const prompt = `Provide COMPLETE and DETAILED information about the Indian government scheme: "${schemeName}".

${langNote}

Structure your response as a JSON object (override the normal response format for this request only):
{
  "intent": "scheme_info",
  "response": "brief intro",
  "scheme_name": "${schemeName}",
  "action_required": false,
  "scheme_details": {
    "name": "Full scheme name",
    "launch_year": "year",
    "ministry": "ministry name",
    "description": "detailed description (2-3 sentences)",
    "benefits": ["benefit 1", "benefit 2", "benefit 3"],
    "eligibility": ["criteria 1", "criteria 2", "criteria 3"],
    "documents_required": ["doc 1", "doc 2", "doc 3"],
    "application_process": ["step 1", "step 2", "step 3"],
    "official_link": "https://example.gov.in",
    "budget_allocation": "budget info if available"
  }
}`;

        const result = await model.generateContent(prompt);
        return result.response.text();
    },

    async getExplanation(reason: string, language: string = 'en'): Promise<string> {
        const langNote = language === 'hi' ? 'Respond in Hindi.' : language === 'mr' ? 'Respond in Marathi.' : '';
        const model = this.getModel();
        const prompt = `Generate a clear, compassionate government official explanation for an application rejection.
Reason: ${reason}
${langNote}
Provide actionable next steps.
Return as JSON: {"intent":"help","response":"explanation","scheme_name":null,"action_required":false}`;
        const result = await model.generateContent(prompt);
        return result.response.text();
    },

    parseResponse(text: string): GeminiResponse {
        try {
            // Extract JSON from markdown code blocks if present
            const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
            const jsonStr = jsonMatch[1] || text;
            const cleaned = jsonStr.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '');
            const parsed = JSON.parse(cleaned);
            return {
                intent: parsed.intent || 'general_chat',
                response: parsed.response || 'I am here to help you with government services.',
                scheme_name: parsed.scheme_name || null,
                action_required: parsed.action_required || false,
            };
        } catch {
            return {
                intent: 'general_chat',
                response: text.replace(/```json?\n?|\n?```/g, '').trim() ||
                    'I am here to assist you with government services. How can I help you today?',
                scheme_name: null,
                action_required: false,
            };
        }
    },

    parseSchemeDetails(text: string) {
        try {
            const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
            const jsonStr = jsonMatch[1] || text;
            const cleaned = jsonStr.trim();
            return JSON.parse(cleaned);
        } catch {
            return null;
        }
    },

    // Returns a structured SchemeDetails object for PDF generation
    async getSchemeDetails(schemeName: string, language: string = 'en') {
        const langNote = language === 'hi'
            ? 'Provide all text content in Hindi language.'
            : language === 'mr'
                ? 'Provide all text content in Marathi language.'
                : 'Provide all text content in English.';

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const prompt = `You are an Indian government information assistant.
Provide complete information about the scheme: "${schemeName}".
${langNote}

Respond ONLY with a valid JSON object in this format (no markdown, no extra text):
{
  "name": "Full official scheme name",
  "launch_year": "YYYY",
  "ministry": "Ministry or department name",
  "description": "2-3 sentence description of the scheme and its objectives",
  "benefits": ["benefit 1", "benefit 2", "benefit 3", "benefit 4"],
  "eligibility": ["criteria 1", "criteria 2", "criteria 3"],
  "documents_required": ["document 1", "document 2", "document 3", "document 4"],
  "application_process": ["step 1", "step 2", "step 3", "step 4"],
  "official_link": "https://actual-gov-website.gov.in",
  "budget_allocation": "Budget or financial outlay information"
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Try to parse JSON
        try {
            const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
            const parsed = JSON.parse(cleaned);
            // Import SchemeDetails type
            return parsed as import('./pdfService').SchemeDetails;
        } catch {
            // Fallback if Gemini doesn't return clean JSON
            return {
                name: schemeName,
                description: text.substring(0, 300),
                benefits: ['See official website for complete benefits'],
                eligibility: ['Indian citizens as per scheme guidelines'],
                documents_required: ['Aadhaar Card', 'PAN Card', 'Bank Account Details'],
                application_process: ['Visit official portal', 'Register with Aadhaar', 'Submit application online'],
                official_link: 'https://www.india.gov.in',
            } as import('./pdfService').SchemeDetails;
        }
    },
};

