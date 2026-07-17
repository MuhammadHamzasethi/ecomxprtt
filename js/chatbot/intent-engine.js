/* ============================================================
   EcomXprt AI Assistant — js/chatbot/intent-engine.js
   Layer 3: scores a single user utterance against every entry in
   the knowledge index (services, faq, team, technologies) plus the
   small set of conversational meta-intents (greeting/farewell/
   capabilities), and returns the best match.
   ============================================================ */
(function (global) {
  'use strict';
  const { FuzzyMatcher } = global.EcxNLP;

  class IntentEngine {
    constructor(nlp, knowledgeBase) {
      this.nlp = nlp;
      this.kb = knowledgeBase;
      this._buildIndices();
    }

    _buildIndices() {
      const conv = this.kb.getConversation();
      this.metaEntries = (conv?.intents || []).map(i => ({
        kind: 'meta', id: i.id, ref: i,
        keywords: i.keywords, phrases: i.phrases,
        patterns: (i.patterns || []).map(src => new RegExp(src, 'i'))
      }));
      this.entries = [...this.metaEntries, ...(this.kb.index || [])];

      this.keywordIndex = new Map();
      this.phraseIndex = new Map();
      this.entries.forEach(entry => {
        (entry.keywords || []).forEach(({ w, s }) => {
          const key = String(w).toLowerCase();
          if (!this.keywordIndex.has(key)) this.keywordIndex.set(key, []);
          this.keywordIndex.get(key).push({ entry, w: s });
        });
        (entry.phrases || []).forEach(p => {
          const phrase = typeof p === 'string' ? p : p.p;
          const weight = typeof p === 'string' ? 6 : p.s;
          const key = String(phrase).toLowerCase();
          if (!this.phraseIndex.has(key)) this.phraseIndex.set(key, []);
          this.phraseIndex.get(key).push({ entry, w: weight });
        });
      });
    }

    /**
     * Matches one utterance (already split from any multi-question
     * input by the caller) to the best-scoring knowledge entry.
     * @returns {{entry, score, entities:string[]}}
     */
    match(rawInput, memory) {
      const normalized = this.nlp.normalize(rawInput);
      const tokens = this.nlp.meaningfulTokens(normalized);
      const bigrams = this.nlp.bigrams(normalized);
      const scores = new Map();
      const bump = (entry, amt) => scores.set(entry, (scores.get(entry) || 0) + amt);

      /* Phrase matching — highest priority */
      bigrams.forEach(bg => {
        if (this.phraseIndex.has(bg)) this.phraseIndex.get(bg).forEach(({ entry, w }) => bump(entry, w * 1.5));
      });
      this.phraseIndex.forEach((hits, phrase) => {
        if (normalized.includes(phrase)) hits.forEach(({ entry, w }) => bump(entry, w * 1.4));
      });

      /* Keyword matching — exact then fuzzy */
      tokens.forEach(token => {
        if (this.keywordIndex.has(token)) {
          this.keywordIndex.get(token).forEach(({ entry, w }) => bump(entry, w));
          return;
        }
        if (token.length >= 4) {
          this.keywordIndex.forEach((hits, keyword) => {
            if (Math.abs(token.length - keyword.length) > 3) return;
            const ms = FuzzyMatcher.matchScore(token, keyword);
            if (ms > 0) hits.forEach(({ entry, w }) => bump(entry, w * ms * 0.85));
          });
        }
      });

      /* Regex patterns (greetings/farewells) */
      this.metaEntries.forEach(entry => {
        (entry.patterns || []).forEach(re => { if (re.test(normalized)) bump(entry, 8); });
      });

      /* Context boost — same topic as previous turn gets +20% */
      const prevTopic = memory.getPreviousTopic();
      if (prevTopic) {
        scores.forEach((score, entry) => {
          if (entry.ref?.topic === prevTopic && score > 0) scores.set(entry, score * 1.2);
        });
      }

      /* Follow-up phrasing ("tell me more") re-boosts the last topic */
      if (memory.isFollowUp(normalized) && memory.lastEntry) {
        bump(memory.lastEntry, (scores.get(memory.lastEntry) || 0) + 5);
      }

      let best = null, bestScore = 0;
      scores.forEach((score, entry) => { if (score > bestScore) { bestScore = score; best = entry; } });

      const THRESHOLD = 2.5;
      const entities = [];
      this.entries.forEach(entry => {
        const eks = entry.ref?.entityKeywords;
        if (eks && eks.some(ek => normalized.includes(ek))) entities.push(entry.id);
      });

      return { entry: bestScore >= THRESHOLD ? best : null, score: bestScore, entities, normalized };
    }
  }

  global.EcxIntentEngine = IntentEngine;
})(window);
