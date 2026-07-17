/* ============================================================
   EcomXprt AI Assistant — js/chatbot/bot.js
   Layer 6 (public facade): the only class main.js talks to.
   Wires together knowledge-base → nlp → intent-engine →
   conversation-memory → response-composer, and adds the
   conversational behaviors the brief asked for on top:
   multi-question splitting, vague-intent clarifying questions,
   simple service comparisons, and lead qualification.
   ============================================================ */
(function (global) {
  'use strict';

  const LEAD_TRIGGER_WORDS = /\b(get started|sign me up|i want to start|book (a|an) (call|audit)|quote|lets talk|let's talk|i'm interested|im interested|work with you)\b/i;
  const VAGUE_HELP = /\b(don'?t know which|not sure what|i need help|help me choose|which service|not sure which)\b/i;

  class EcomXprtBot {
    constructor(basePath) {
      this.nlp = new global.EcxNLP.NLPProcessor();
      this.kb = new global.EcxKnowledgeBase(basePath);
      this.memory = new global.EcxConversationMemory(8);
      this.engine = null;
      this.composer = null;
      this._ready = false;
    }

    /** Must resolve before respond()/greeting() are called. */
    async init() {
      if (this._ready) return this;
      await this.kb.load();
      this.engine = new global.EcxIntentEngine(this.nlp, this.kb);
      this.composer = new global.EcxResponseComposer(this.kb, this.memory);
      this._ready = true;
      return this;
    }

    get isReady() { return this._ready; }

    greeting() {
      const hour = new Date().getHours();
      const timeGreet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
      const company = this.kb.getCompany();
      return {
        text: `${timeGreet}! 👋 I'm the EcomXprt AI assistant — think of me as a teammate who knows the agency inside out.\n\nAsk me anything about our services, pricing, results, team, or general eCommerce/tech questions. What's on your mind?`,
        suggestions: ['What services do you offer?', 'How does pricing work?', 'Free audit', `Meet ${company?.ceo?.name || 'the team'}`]
      };
    }

    /**
     * Main entry point. Handles: active lead-capture flow, vague
     * "help me choose" prompts, simple two-service comparisons, and
     * multi-question messages (answers each part in turn).
     */
    respond(userInput) {
      if (!this._ready) return { text: 'One moment — still loading…', suggestions: [] };
      const raw = String(userInput ?? '').trim();
      if (!raw) return { text: "Please type a question and I'll do my best to help!", suggestions: [] };

      /* Currently mid lead-capture — treat this message as the answer
         to the pending slot, regardless of what it scores against. */
      if (this.memory.inLead()) return this._advanceLead(raw);

      /* A short "yes"/"sure" right after we offered to collect their
         details starts the flow — LEAD_TRIGGER_WORDS alone wouldn't
         catch a bare "yes". */
      if (this.memory.lead.pendingOffer && /^(yes|yeah|yep|sure|ok(ay)?|please|go ahead)\.?!?$/i.test(raw)) {
        this.memory.lead.pendingOffer = false;
        return this._beginLead();
      }
      this.memory.lead.pendingOffer = false;

      /* Explicit "cancel"/"never mind" during a flow already handled
         above; here handle a fresh request to start one. */
      if (LEAD_TRIGGER_WORDS.test(raw)) return this._beginLead();

      if (VAGUE_HELP.test(raw.toLowerCase())) return this._clarify();

      const compare = this._tryCompare(raw);
      if (compare) return compare;

      const parts = this.nlp.splitMultiIntent(raw);
      if (parts.length > 1) return this._answerMultiple(parts, raw);

      return this._answerOne(raw);
    }

    _answerOne(text) {
      const { entry, entities } = this.engine.match(text, this.memory);
      this.memory.record(text, entry, entities);
      const composed = this.composer.compose(entry);
      return this._maybeOfferLead(composed, entry);
    }

    _answerMultiple(parts, originalText) {
      const blocks = [];
      const suggestionSet = new Set();
      parts.slice(0, 4).forEach((part, i) => {
        const { entry, entities } = this.engine.match(part, this.memory);
        this.memory.record(part, entry, entities);
        const composed = this.composer.compose(entry);
        blocks.push(`${i + 1}) ${composed.text}`);
        (composed.suggestions || []).forEach(s => suggestionSet.add(s));
      });
      return { text: blocks.join('\n\n'), suggestions: [...suggestionSet].slice(0, 5) };
    }

    /** Two known service/technology names mentioned together with a
     *  comparison word → build a short side-by-side instead of just
     *  answering about whichever scored higher. Uses token overlap
     *  (not literal substring) so "ppc vs listing optimization"
     *  still matches "Amazon PPC Management". */
    _tryCompare(text) {
      if (!/\b(vs|versus|or|compare|difference between|which is better)\b/i.test(text)) return null;
      const userTokens = new Set(this.nlp.meaningfulTokens(text));
      const services = this.kb.getServices();
      const scored = services.map(s => {
        const svcTokens = this.nlp.tokenize(s.name + ' ' + s.id.replace(/-/g, ' '));
        const overlap = svcTokens.filter(t => userTokens.has(t)).length;
        return { s, overlap };
      }).filter(x => x.overlap > 0).sort((a, b) => b.overlap - a.overlap);
      const distinct = [];
      scored.forEach(x => { if (!distinct.find(d => d.id === x.s.id)) distinct.push(x.s); });
      if (distinct.length < 2) return null;
      const [a, b] = distinct;
      const text2 = `Comparing **${a.name}** vs **${b.name}**:\n\n` +
        `${a.icon} ${a.name} — ${a.brief}\n\n${b.icon} ${b.name} — ${b.brief}\n\n` +
        `They're not mutually exclusive — most of our clients run both together for compounding results. Want the detail on either one?`;
      return { text: text2, suggestions: [a.name, b.name, 'Pricing'] };
    }

    _clarify() {
      const bt = this.memory.businessType;
      const hint = bt ? ` For a ${bt} brand, ` : ' ';
      return {
        text: `Totally fair — let's figure it out together.${hint}the most common starting points are:\n\n` +
          `📈 Amazon PPC — if you have traffic but sales feel inconsistent\n` +
          `✍️ Listing Optimization — if your listing isn't converting visitors\n` +
          `⚙️ Account Management — if you're overwhelmed running Seller Central day-to-day\n` +
          `🚀 Product Sourcing/Launch — if you're starting from scratch\n\n` +
          `Which of those sounds closest to where you're stuck?`,
        suggestions: ['Amazon PPC', 'Listing optimization', 'Account management', 'Free audit instead']
      };
    }

    _beginLead() {
      this.memory.startLead();
      return { text: this.memory.currentLeadPrompt(), suggestions: [] };
    }

    _advanceLead(text) {
      const status = this.memory.submitLeadAnswer(text);
      if (status === 'next') return { text: this.memory.currentLeadPrompt(), suggestions: [] };
      const summary = this.memory.leadSummary();
      const company = this.kb.getCompany();
      return {
        text: `Thanks — here's what I've got:\n\n${summary}\n\n` +
          `I can't submit this anywhere myself (this chat runs entirely in your browser), but send it straight to the team and mention you spoke with the AI assistant:\n\n` +
          `💬 WhatsApp: ${company.contact.whatsapp}\n📧 ${company.contact.email}\n📞 ${company.contact.phones[0]}\n\n` +
          `They typically reply on WhatsApp within an hour.`,
        suggestions: ['Free audit', 'Pricing', 'Back to services']
      };
    }

    /** After answering a pricing/audit/getting-started question,
     *  offer (don't force) the lead-capture flow once per session. */
    _maybeOfferLead(composed, entry) {
      const salesTopic = entry?.ref?.topic === 'pricing' || entry?.ref?.topic === 'cta';
      if (salesTopic && !this.memory.lead.offeredAt && this.memory.turnCount >= 1) {
        composed.text += `\n\nWant me to grab a few quick details so the team can follow up directly? Just say "yes" or "get started".`;
        this.memory.lead.offeredAt = this.memory.turnCount;
        this.memory.lead.pendingOffer = true;
      }
      return composed;
    }
  }

  global.EcomXprtBot = EcomXprtBot;
})(window);
