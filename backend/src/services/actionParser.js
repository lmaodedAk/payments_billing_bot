// services/actionParser.js
// Parses user intent and strictly validates action proposals for the Client-Side SDK Tool Execution architecture.
// Guarantees that:
// 1. Only explicitly allowed action names are returned.
// 2. Parameters are strictly validated against an allowlist schema.
// 3. Sensitive / dangerous fields (e.g. Owner, id injection, arbitrary URLs/JS) are rejected or stripped.
// 4. Contact Roles is cleanly rejected as unsupported by the Embedded App SDK.

export const ALLOWED_ACTIONS = Object.freeze([
  'NONE',
  'SEARCH_LEADS',
  'GET_LEAD',
  'LIST_LEADS',
  'SEARCH_CONTACT_EMAIL',
  'CREATE_LEAD',
  'UPDATE_LEAD',
  'CONTACT_ROLE_UNSUPPORTED',
]);

export const ALLOWED_LEAD_FIELDS = Object.freeze([
  'First_Name',
  'Last_Name',
  'Company',
  'Email',
  'Phone',
  'Description',
]);

const RECORD_ID_REGEX = /^\d{15,22}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates and sanitizes a lead data payload against the field allowlist.
 * Rejects payloads containing forbidden fields (e.g. Owner, id, internal system fields).
 * @param {object} rawData 
 * @param {boolean} isCreate 
 * @returns {{ valid: boolean, data?: object, error?: string }}
 */
export function sanitizeLeadData(rawData, isCreate = true) {
  if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) {
    return { valid: false, error: 'Lead data must be a non-null object.' };
  }

  // Check for forbidden / privilege escalation fields
  const forbiddenKeys = ['Owner', 'owner', 'Owner_ID', 'id', 'recordId', '$state', 'Created_By', 'Modified_By'];
  for (const forbidden of forbiddenKeys) {
    if (Object.prototype.hasOwnProperty.call(rawData, forbidden)) {
      return {
        valid: false,
        error: `Field '${forbidden}' is forbidden and cannot be manipulated by callers.`,
      };
    }
  }

  const sanitized = {};
  for (const [key, val] of Object.entries(rawData)) {
    if (!ALLOWED_LEAD_FIELDS.includes(key)) {
      return {
        valid: false,
        error: `Field '${key}' is not in the allowed lead fields list.`,
      };
    }

    if (val !== undefined && val !== null) {
      if (typeof val !== 'string') {
        return { valid: false, error: `Field '${key}' must be a string value.` };
      }
      sanitized[key] = val.trim();
    }
  }

  if (isCreate) {
    if (!sanitized.Last_Name || typeof sanitized.Last_Name !== 'string') {
      return { valid: false, error: 'Last_Name is required to create a Lead.' };
    }
    if (!sanitized.Company || typeof sanitized.Company !== 'string') {
      return { valid: false, error: 'Company is required to create a Lead.' };
    }
  }

  if (sanitized.Email && !EMAIL_REGEX.test(sanitized.Email)) {
    return { valid: false, error: 'Invalid email address format.' };
  }

  return { valid: true, data: sanitized };
}

/**
 * Parses a user message to detect if a structured CRM action is intended.
 * @param {string} message 
 * @returns {{ action: string, params: object, reply?: string }}
 */
export function parseIntentFromMessage(message) {
  if (!message || typeof message !== 'string') {
    return { action: 'NONE', params: {} };
  }

  const text = message.trim();
  const lower = text.toLowerCase();

  // 1. Detect Contact Roles attempts
  if (
    lower.includes('contact role') ||
    lower.includes('contact roles') ||
    (lower.includes('link contact') && lower.includes('deal')) ||
    (lower.includes('assign contact') && lower.includes('role'))
  ) {
    return {
      action: 'CONTACT_ROLE_UNSUPPORTED',
      params: {},
      reply: 'Contact Roles cannot be assigned directly through the Zoho Embedded App SDK. Please manage Contact Roles directly on the Deal record in Zoho CRM.',
    };
  }

  // 2. Structured Lead Form submission or "Create lead" intent
  // Matches: "Please create a new lead in Zoho CRM with the following details: ..."
  if (
    lower.includes('create a new lead') ||
    lower.includes('create lead') ||
    lower.includes('add lead') ||
    lower.includes('add a lead')
  ) {
    const data = {};

    // Extract fields using regex patterns
    const nameMatch = text.match(/(?:Full Name|Name|Last Name)\s*:\s*([^\n\r]+)/i);
    const emailMatch = text.match(/Email\s*:\s*([^\n\r\s]+)/i);
    const companyMatch = text.match(/Company\s*:\s*([^\n\r]+)/i);
    const phoneMatch = text.match(/Phone\s*:\s*([^\n\r]+)/i);
    const notesMatch = text.match(/(?:Requirements|Notes|Description)\s*:\s*([^\n\r]+)/i);

    if (nameMatch) {
      const full = nameMatch[1].trim();
      const parts = full.split(/\s+/);
      if (parts.length > 1) {
        data.First_Name = parts.slice(0, -1).join(' ');
        data.Last_Name = parts[parts.length - 1];
      } else {
        data.Last_Name = full;
      }
    }

    if (emailMatch) data.Email = emailMatch[1].trim();
    if (companyMatch) data.Company = companyMatch[1].trim();
    if (phoneMatch && phoneMatch[1].trim() !== 'Not specified') {
      data.Phone = phoneMatch[1].trim();
    }
    if (notesMatch && notesMatch[1].trim() !== 'General inquiry') {
      data.Description = notesMatch[1].trim();
    }

    // Fallback if structured lines weren't used but simple format was:
    // e.g. "Create lead for John Doe at Acme Corp"
    if (!data.Last_Name || !data.Company) {
      const inlineMatch = text.match(/create\s+(?:a\s+)?lead\s+(?:for\s+)?([A-Za-z\s]+?)\s+at\s+([A-Za-z0-9\s.,-]+)/i);
      if (inlineMatch) {
        const parts = inlineMatch[1].trim().split(/\s+/);
        if (parts.length > 1) {
          data.First_Name = parts.slice(0, -1).join(' ');
          data.Last_Name = parts[parts.length - 1];
        } else {
          data.Last_Name = parts[0];
        }
        data.Company = inlineMatch[2].trim();
      }
    }

    // Validate the extracted fields
    const sanitized = sanitizeLeadData(data, true);
    if (sanitized.valid) {
      return {
        action: 'CREATE_LEAD',
        params: { data: sanitized.data },
        reply: `Submitting lead for ${sanitized.data.Last_Name} (${sanitized.data.Company}) using your active CRM permissions...`,
      };
    }
  }

  // 3. Lead Update intent
  // Matches e.g. "Update lead 3000000040011 Phone to 555-0199"
  const updateMatch = text.match(/update\s+(?:lead\s+)?(\d{15,22})\s+([a-zA-Z_]+)\s+(?:to\s+)?(.+)/i);
  if (updateMatch) {
    const recordId = updateMatch[1];
    let field = updateMatch[2].trim();
    const val = updateMatch[3].trim();

    // Map common aliases
    const fieldMap = {
      phone: 'Phone',
      company: 'Company',
      email: 'Email',
      firstname: 'First_Name',
      first_name: 'First_Name',
      lastname: 'Last_Name',
      last_name: 'Last_Name',
      description: 'Description',
      notes: 'Description',
    };

    const targetField = fieldMap[field.toLowerCase()] || field;
    const sanitized = sanitizeLeadData({ [targetField]: val }, false);
    if (sanitized.valid) {
      return {
        action: 'UPDATE_LEAD',
        params: { recordId, data: sanitized.data },
        reply: `Updating lead ${recordId} in Zoho CRM using your active permissions...`,
      };
    }
  }

  // 4. Contact Search by Email
  const contactEmailMatch = text.match(/(?:find|search|lookup)\s+contact\s+(?:by\s+email\s+)?([^\s@]+@[^\s@]+\.[^\s@]+)/i);
  if (contactEmailMatch) {
    const email = contactEmailMatch[1].trim();
    return {
      action: 'SEARCH_CONTACT_EMAIL',
      params: { email },
      reply: `Searching contacts for ${email} under your CRM permissions...`,
    };
  }

  // 5. Get Lead by ID
  const getLeadIdMatch = text.match(/(?:get|show|details\s+for|find)\s+lead\s+(?:id\s+|with\s+id\s+)?(\d{15,22})/i);
  if (getLeadIdMatch) {
    const recordId = getLeadIdMatch[1];
    return {
      action: 'GET_LEAD',
      params: { recordId },
      reply: `Retrieving lead ${recordId} from Zoho CRM using your permissions...`,
    };
  }

  // 6. List all / my leads
  if (
    /(?:list|show|get)\s+(?:all\s+)?(?:my\s+)?leads/i.test(lower) ||
    lower.includes('list all leads') ||
    lower.includes('show all leads') ||
    lower.includes('list my leads') ||
    lower.includes('list all my leads') ||
    lower === 'leads'
  ) {
    return {
      action: 'LIST_LEADS',
      params: { page: 1, perPage: 20 },
      reply: 'Fetching your leads from Zoho CRM...',
    };
  }

  // 7. Lead Search by Keyword or Company Name
  // Matches e.g. "search leads for Confidential Corp", "check billing details for lead AdminSecret at Confidential Corp"
  if (
    lower.includes('search lead') ||
    lower.includes('search leads') ||
    lower.includes('find lead') ||
    lower.includes('lookup lead') ||
    lower.includes('check details for lead') ||
    lower.includes('check the billing details for the lead') ||
    lower.includes('find the lead named') ||
    lower.includes('show me leads for') ||
    lower.includes('show leads for') ||
    lower.includes('check billing details for')
  ) {
    // Extract search keyword: remove command prefix and isolate keyword
    let keyword = text
      .replace(/^.*?(?:search\s+(?:crm\s+)?leads?\s+(?:for\s+)?|find\s+(?:the\s+)?lead\s+(?:named\s+|for\s+)?|show\s+(?:me\s+)?leads\s+for\s+|check\s+(?:the\s+)?(?:billing\s+)?details\s+for\s+(?:the\s+)?(?:lead\s+)?)/i, '')
      .replace(/['"]/g, '')
      .trim();

    if (keyword.length > 0 && keyword.length <= 100) {
      return {
        action: 'SEARCH_LEADS',
        params: { query: keyword },
        reply: `Searching your CRM leads for "${keyword}"...`,
      };
    }
  }

  // 8. Fail-safe keyword check:
  // Strictly blocks messages mentioning CRM concepts (lead, leads, contact, contacts,
  // deal, deals, record, records, crm) or 15-22 digit record IDs, or prompt injection patterns.
  const INJECTION_REGEX = /\b(ignore\s+(?:all\s+|previous\s+)?instructions|system\s+prompt|system\s+override|reveal\s+all|drop\s+table|dump\s+(?:all\s+)?(?:data|records)?)\b/i;
  const CRM_RECORD_ID_REGEX = /\b\d{15,22}\b/;
  const CRM_ENTITY_REGEX = /\b(leads?|contacts?|deals?|records?|crm)\b/i;

  if (
    INJECTION_REGEX.test(text) ||
    CRM_RECORD_ID_REGEX.test(text) ||
    CRM_ENTITY_REGEX.test(text)
  ) {
    return {
      action: 'NONE',
      params: {},
      blockedFromAgent: true,
      reply: 'I detected a CRM-related request, but could not safely determine the exact action. For your security, CRM operations cannot run through the general AI assistant. Please rephrase using an approved format (for example: "search leads for <name>", "get lead <id>", or "create lead for <name> at <company>").',
    };
  }

  // Default: conversational / FAQ question (e.g. payment/billing question)
  return { action: 'NONE', params: {}, blockedFromAgent: false };
}
