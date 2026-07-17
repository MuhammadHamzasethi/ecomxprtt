/* ============================================================
   EcomXprt AI Assistant — js/chatbot/conversation-memory.js
   Layer 4: remembers what's been said this session so the bot can
   handle follow-ups ("how much would that cost?" after "I own a
   restaurant"), avoid repeating itself, and run a light-touch,
   conversational lead-qualification flow.

   Nothing here is sent anywhere — it lives only in this browser
   tab's memory for the current chat session (no backend exists on
   this static site), and the bot is explicit about that with the
   visitor rather than implying their details were "submitted".
   ============================================================ */
(function (global) {
  'use strict';

  /* Business-type words we can pick out of free text to personalize
     later answers ("I own a restaurant" → later "how much?" replies
     can reference restaurant-relevant services). Not exhaustive by
     design — anything not recognized is simply not personalized. */
  const BUSINESS_HINTS = [
    'restaurant','cafe','bakery','clothing','apparel','fashion','jewelry','jewellery',
    'skincare','beauty','cosmetics','electronics','furniture','toys','fitness',
    'supplements','pet','automotive','home decor','kitchenware','footwear','shoes',
    'accessories','handmade','craft','books','beverage','food','grocery'
  ];

  class ConversationMemory {
    constructor(maxTurns = 8) {
      this.maxTurns = maxTurns;
      this.turns = [];
      this.topic = null;
      this.lastEntry = null;
      this.usedAnswers = new Map();
      this.mentionedEntities = new Set();
      this.businessType = null;
      this.turnCount = 0;
      this.lead = { active: false, step: 0, collected: {}, offeredAt: 0, pendingOffer: false };
    }

    record(userInput, entry, entities = []) {
      this.turns.push({ user: userInput, id: entry?.id, ts: Date.now() });
      if (this.turns.length > this.maxTurns) this.turns.shift();
      this.lastEntry = entry || this.lastEntry;
      entities.forEach(e => this.mentionedEntities.add(e));
      this.turnCount++;
      if (entry?.ref?.topic) this.topic = entry.ref.topic;

      const normalized = userInput.toLowerCase();
      const hint = BUSINESS_HINTS.find(b => normalized.includes(b));
      if (hint) this.businessType = hint;
    }

    isFollowUp(text) {
      const phrases = ['tell me more','more about','explain','elaborate','what else','go on',
        'and what about','how about','anything else','what about','can you explain',
        'please elaborate','more details','more info','more information','that','it','this'];
      return phrases.some(p => text === p || text.includes(p));
    }

    isFirstMessage() { return this.turnCount === 0; }
    getPreviousTopic() { return this.topic; }

    getUsedAnswerIndices(id) {
      if (!this.usedAnswers.has(id)) this.usedAnswers.set(id, new Set());
      return this.usedAnswers.get(id);
    }
    markAnswerUsed(id, idx) { this.getUsedAnswerIndices(id).add(idx); }

    /* ── Lead capture state machine ──────────────────────────
       Steps are asked one at a time, conversationally. Budget and
       timeline are optional and can be skipped with "skip"/"n/a". */
    static LEAD_STEPS = [
      { key: 'name', prompt: "Happy to help you get this moving — what's your name?" },
      { key: 'business', prompt: 'Nice to meet you, {name}! What business or brand is this for?' },
      { key: 'projectGoal', prompt: "Got it. What's the main thing you're hoping to achieve — more sales, better rankings, launching a new product, something else?" },
      { key: 'timeline', prompt: 'Any timeline in mind? (Or just say "not sure" / "skip".)' },
      { key: 'contactMethod', prompt: "Last thing — what's the best way to reach you: WhatsApp, email, or phone? Just drop the contact info and I'll wrap this up for the team." }
    ];

    startLead() { this.lead = { active: true, step: 0, collected: {}, offeredAt: this.turnCount }; }
    cancelLead() { this.lead.active = false; }
    inLead() { return this.lead.active; }

    currentLeadPrompt() {
      const step = ConversationMemory.LEAD_STEPS[this.lead.step];
      if (!step) return null;
      return step.prompt.replace('{name}', this.lead.collected.name || 'there');
    }

    /** Records the answer to the current lead step and advances.
     *  @returns 'next' | 'done' */
    submitLeadAnswer(text) {
      const step = ConversationMemory.LEAD_STEPS[this.lead.step];
      if (!step) return 'done';
      const skip = /^(skip|n\/a|na|no|not sure|none)$/i.test(text.trim());
      this.lead.collected[step.key] = skip ? null : text.trim().slice(0, 200);
      this.lead.step++;
      if (this.lead.step >= ConversationMemory.LEAD_STEPS.length) {
        this.lead.active = false;
        return 'done';
      }
      return 'next';
    }

    leadSummary() {
      const c = this.lead.collected;
      const lines = [];
      if (c.name) lines.push(`Name: ${c.name}`);
      if (c.business) lines.push(`Business: ${c.business}`);
      if (this.businessType) lines.push(`Type: ${this.businessType}`);
      if (c.projectGoal) lines.push(`Goal: ${c.projectGoal}`);
      if (c.timeline) lines.push(`Timeline: ${c.timeline}`);
      if (c.contactMethod) lines.push(`Contact: ${c.contactMethod}`);
      return lines.join('\n');
    }
  }

  global.EcxConversationMemory = ConversationMemory;
})(window);
