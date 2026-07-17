/* ============================================================
   EcomXprt AI Assistant — js/chatbot/knowledge-base.js
   Layer 2: loads /knowledge/*.json (same-origin static files, no
   external API calls) and exposes typed lookups. This is the ONLY
   place that knows the shape of the knowledge files — everything
   else in the bot talks to this module, never to raw JSON.
   ============================================================ */
(function (global) {
  'use strict';

  const FILES = ['company', 'services', 'team', 'pricing', 'portfolio', 'testimonials', 'faq', 'conversation', 'technologies'];

  class KnowledgeBase {
    constructor(basePath) {
      this.basePath = basePath || 'knowledge/';
      this.data = {};
      this.ready = false;
      this._loadPromise = null;
    }

    /** Fetches every knowledge file once. Safe to call multiple times. */
    load() {
      if (this._loadPromise) return this._loadPromise;
      this._loadPromise = Promise.all(FILES.map(name =>
        fetch(this.basePath + name + '.json')
          .then(r => { if (!r.ok) throw new Error(name + ' ' + r.status); return r.json(); })
          .then(json => { this.data[name] = json; })
          .catch(err => { console.warn('[EcomXprt KB] failed to load', name, err); this.data[name] = null; })
      )).then(() => {
        this.ready = true;
        this._buildIndex();
        return this;
      });
      return this._loadPromise;
    }

    /** Builds a flat searchable list combining services, faq, team,
     *  pricing and technologies into one shape the intent engine can
     *  score against, without callers needing to know which file a
     *  fact originally came from. */
    _buildIndex() {
      const entries = [];

      (this.data.services || []).forEach(s => {
        entries.push({
          kind: 'service', id: s.id, ref: s,
          keywords: this._autoKeywords(s.name + ' ' + s.brief + ' ' + s.highlight),
          phrases: [s.name.toLowerCase()]
        });
      });

      (this.data.faq || []).forEach(f => {
        entries.push({ kind: 'faq', id: f.id, ref: f, keywords: f.keywords, phrases: f.phrases, entityKeywords: f.entityKeywords, topic: f.topic });
      });

      ((this.data.team || {}).members || []).forEach(m => {
        const first = m.name.split(' ')[0].toLowerCase();
        entries.push({
          kind: 'team', id: first, ref: m,
          keywords: [{ w: first, s: 6 }, { w: m.role.toLowerCase().split(' ')[0], s: 3 }],
          phrases: [{ p: m.name.toLowerCase(), s: 7 }]
        });
      });
      if (this.data.team && this.data.team.ceo) {
        entries.push({
          kind: 'ceo', id: 'ceo', ref: this.data.team.ceo,
          keywords: [{ w: 'saad', s: 6 }, { w: 'ceo', s: 5 }, { w: 'founder', s: 4 }, { w: 'owner', s: 3 }],
          phrases: [{ p: 'saad aqeel', s: 7 }, { p: 'the ceo', s: 5 }, { p: 'the founder', s: 5 }]
        });
      }

      (this.data.technologies || []).forEach(t => {
        const allTerms = [t.term.toLowerCase(), ...(t.aliases || [])];
        entries.push({
          kind: 'general', id: t.term, ref: t,
          keywords: allTerms.map(term => ({ w: term.split(' ')[0], s: 4 })),
          /* Only multi-word aliases get phrase-level (substring) matching —
             a single word like "ppc" as a "phrase" would trivially match
             as a substring of almost anything containing it and unfairly
             outweigh legitimate multi-word company-knowledge phrases. */
          phrases: allTerms.filter(term => term.includes(' ')).map(term => ({ p: term, s: 6 }))
        });
      });

      this.index = entries;
    }

    /** Derives lightweight keywords from a piece of prose (used for
     *  services, where phrase/keyword lists aren't hand-authored). */
    _autoKeywords(text) {
      const stop = new Set(['and','the','a','an','for','with','to','of','your','our','from']);
      const words = String(text).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
      const seen = new Map();
      words.forEach(w => {
        if (stop.has(w) || w.length < 3) return;
        seen.set(w, (seen.get(w) || 0) + (w.length > 6 ? 4 : 3));
      });
      return [...seen.entries()].map(([w, s]) => ({ w, s: Math.min(s, 6) }));
    }

    getCompany() { return this.data.company; }
    getServices() { return this.data.services || []; }
    getService(id) { return (this.data.services || []).find(s => s.id === id || s.name.toLowerCase().includes(id)); }
    getTeam() { return this.data.team; }
    getPricing() { return this.data.pricing; }
    getPortfolio() { return this.data.portfolio; }
    getTestimonials() { return this.data.testimonials || []; }
    getFaqById(id) { return (this.data.faq || []).find(f => f.id === id); }
    getConversation() { return this.data.conversation; }
    getTechnology(term) {
      const t = String(term).toLowerCase();
      return (this.data.technologies || []).find(x => x.term.toLowerCase() === t || (x.aliases || []).includes(t));
    }
  }

  global.EcxKnowledgeBase = KnowledgeBase;
})(window);
