/* ============================================================
   EcomXprt AI Assistant — js/chatbot/response-composer.js
   Layer 5: turns a matched knowledge entry into the actual text the
   visitor sees. Keeps the "experienced employee" persona, rotates
   phrasing so it never feels like a static FAQ, and keeps general
   tech knowledge visibly separate from EcomXprt-specific facts.
   ============================================================ */
(function (global) {
  'use strict';

  const CONSULT_LEADIN = [
    "Good question.", "Happy to walk you through that.", "Here's the honest answer:",
    "Let me break that down.", "Sure — here's how that works."
  ];
  function pick(arr, seed) { return arr[seed % arr.length]; }

  class ResponseComposer {
    constructor(knowledgeBase, memory) {
      this.kb = knowledgeBase;
      this.memory = memory;
    }

    /** Picks a not-recently-used answer string from a rotation array. */
    _rotate(id, answers) {
      if (!answers || !answers.length) return null;
      const used = this.memory.getUsedAnswerIndices(id);
      let idx = answers.findIndex((_, i) => !used.has(i));
      if (idx === -1) { this.memory.usedAnswers.set(id, new Set()); idx = 0; }
      this.memory.markAnswerUsed(id, idx);
      return answers[idx];
    }

    compose(entry, context = {}) {
      if (!entry) return this._fallback();
      switch (entry.kind) {
        case 'meta': return this._meta(entry);
        case 'faq': return this._faq(entry);
        case 'service': return this._service(entry);
        case 'team': return this._team(entry);
        case 'ceo': return this._ceo(entry);
        case 'general': return this._general(entry);
        default: return this._fallback();
      }
    }

    _meta(entry) {
      const text = this._rotate(entry.id, entry.ref.answers);
      return { text, suggestions: entry.ref.suggestions || [] };
    }

    _faq(entry) {
      const text = this._rotate(entry.id, entry.ref.answers);
      return { text, suggestions: entry.ref.suggestions || [] };
    }

    _service(entry) {
      const s = entry.ref;
      const lead = pick(CONSULT_LEADIN, entry.id.length + this.memory.turnCount);
      const text = `${lead}\n\n${s.icon} **${s.name}**\n${s.detail}\n\n` +
        s.features.map(f => `✓ ${f}`).join('\n') +
        `\n\nWhy it matters: ${s.brief}`;
      const others = this.kb.getServices().filter(x => x.id !== s.id).slice(0, 3).map(x => x.name);
      return { text, suggestions: [...others.slice(0, 2), 'Pricing', 'Free audit'] };
    }

    _team(entry) {
      const m = entry.ref;
      /* Individually-written bios (extendedBio) already open with their
         own "👤 Name — Role" header — don't prepend a second one. */
      const text = m.extendedBio ? m.extendedBio : `👤 **${m.name}** — ${m.role}\n\n${m.shortBio}`;
      return { text, suggestions: ['Meet the full team', 'Free audit', 'Contact team'] };
    }

    _ceo(entry) {
      const c = entry.ref;
      return { text: c.bio, suggestions: ['Meet the full team', 'About EcomXprt', 'Book a free audit'] };
    }

    /** General tech knowledge — explicitly labeled as general (not an
     *  EcomXprt-specific claim), per the "separate general knowledge
     *  from company knowledge" requirement. */
    _general(entry) {
      const t = entry.ref;
      const text = `📘 In general terms: ${t.definition}`;
      return { text, suggestions: ['How does EcomXprt use this?', 'Our services', 'Free audit'] };
    }

    _fallback() {
      const conv = this.kb.getConversation();
      const fb = conv?.fallback;
      const text = this._rotate('fallback', fb?.answers) || "I don't have that specific detail — let me connect you with the team: admin@ecomxprt.com";
      return { text, suggestions: fb?.suggestions || ['Services', 'Pricing', 'Contact team'] };
    }

    /** "I honestly don't have that on file" — used when the bot is
     *  confident this is a company-specific question it has no
     *  knowledge entry for, rather than silently guessing. */
    unknownCompanyFact() {
      const company = this.kb.getCompany();
      return {
        text: `I don't have that specific detail documented on my end — rather than guess, let me point you to the team directly:\n\n📧 ${company.contact.email}\n💬 WhatsApp: ${company.contact.whatsapp}\n📞 ${company.contact.phones[0]}`,
        suggestions: ['Services', 'Pricing', 'Contact team']
      };
    }
  }

  global.EcxResponseComposer = ResponseComposer;
})(window);
