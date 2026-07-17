/* ============================================================
   EcomXprt AI Assistant — js/chatbot/nlp.js
   Layer 1: text normalization, tokenization, fuzzy matching.
   No knowledge, no UI — pure text utilities. Zero dependencies.
   ============================================================ */
(function (global) {
  'use strict';

  /* ── NLP PROCESSOR — normalize, tokenize, expand contractions ── */
  class NLPProcessor {
    constructor() {
      this.stopWords = new Set([
        'a','an','the','is','it','in','on','at','to','of','for','and','or','but',
        'do','does','did','be','am','are','was','were','been','have','has','had',
        'will','would','could','should','may','might','can','shall','with','from',
        'by','as','this','that','these','those','my','your','our','their','its',
        'i','you','we','they','he','she','me','him','her','us','them','what',
        'how','when','where','why','who','which','just','so','if','then','than',
        'too','very','quite','really','also','about','get','got','like','want'
      ]);
      this.contractions = {
        "don't":"do not","doesn't":"does not","didn't":"did not","can't":"cannot",
        "won't":"will not","isn't":"is not","aren't":"are not","wasn't":"was not",
        "weren't":"were not","i'm":"i am","i've":"i have","i'll":"i will",
        "i'd":"i would","you're":"you are","you've":"you have","you'll":"you will",
        "you'd":"you would","we're":"we are","we've":"we have","we'll":"we will",
        "it's":"it is","that's":"that is","there's":"there is","what's":"what is",
        "how's":"how is","he's":"he is","she's":"she is","they're":"they are",
        "they've":"they have","they'll":"they will","let's":"let us",
        "couldn't":"could not","wouldn't":"would not","shouldn't":"should not",
        "needn't":"need not","haven't":"have not","hasn't":"has not"
      };
      /* Common typo / shorthand corrections seen in real chat traffic —
         these run before scoring so "u", "wat", "pric" etc. still match. */
      this.spellFix = {
        'u':'you','ur':'your','r':'are','pls':'please','plz':'please',
        'wat':'what','wut':'what','wht':'what','hw':'how','wen':'when',
        'y':'why','bcz':'because','coz':'because','abt':'about','info':'information',
        'pric':'price','pricee':'price','prise':'price','pricce':'price',
        'servic':'service','servics':'services','servise':'service',
        'amazn':'amazon','amazom':'amazon','amaz0n':'amazon',
        'wesite':'website','websit':'website','wbsite':'website',
        'thnks':'thanks','thx':'thanks','ok':'okay'
      };
    }

    normalize(text) {
      let s = String(text ?? '').toLowerCase().trim();
      Object.entries(this.contractions).forEach(([k, v]) => {
        s = s.replace(new RegExp(k.replace(/'/g, "'?"), 'g'), v);
      });
      s = s.replace(/[''`]/g, '').replace(/[^a-z0-9\s+%×]/g, ' ');
      s = s.replace(/\s+/g, ' ').trim();
      /* word-level shorthand fix */
      s = s.split(' ').map(w => this.spellFix[w] || w).join(' ');
      return s;
    }

    tokenize(text) {
      return this.normalize(text).split(' ').filter(t => t.length > 1);
    }

    meaningfulTokens(text) {
      return this.tokenize(text).filter(t => !this.stopWords.has(t) && t.length > 1);
    }

    bigrams(text) {
      const tokens = this.tokenize(text);
      const bi = [];
      for (let i = 0; i < tokens.length - 1; i++) bi.push(tokens[i] + ' ' + tokens[i + 1]);
      return bi;
    }

    /** Splits a message that contains multiple questions/asks into parts.
     *  Handles "?" separators and " and "/" also " joins between clauses
     *  that each look like their own ask (has a verb-ish keyword). */
    splitMultiIntent(text) {
      const raw = String(text ?? '').trim();
      if (!raw) return [];
      let parts = raw.split(/\?+/).map(p => p.trim()).filter(Boolean);
      if (parts.length <= 1) {
        parts = raw.split(/\b(?:and also|and|,\s*also|;)\b/i).map(p => p.trim()).filter(Boolean);
      }
      return parts.length ? parts : [raw];
    }

    isShort(text) { return this.meaningfulTokens(text).length <= 2; }
  }

  /* ── FUZZY MATCHER — typo tolerance & similarity scoring ── */
  class FuzzyMatcher {
    static levenshtein(a, b) {
      if (a === b) return 0;
      if (a.length === 0) return b.length;
      if (b.length === 0) return a.length;
      const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
      for (let j = 0; j <= b.length; j++) dp[0][j] = j;
      for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
          dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1]
            : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
      return dp[a.length][b.length];
    }

    static jaroWinkler(s1, s2) {
      if (s1 === s2) return 1;
      const l1 = s1.length, l2 = s2.length;
      const matchDist = Math.max(Math.floor(Math.max(l1, l2) / 2) - 1, 0);
      const s1m = new Array(l1).fill(false), s2m = new Array(l2).fill(false);
      let matches = 0, transpositions = 0;
      for (let i = 0; i < l1; i++) {
        const start = Math.max(0, i - matchDist), end = Math.min(i + matchDist + 1, l2);
        for (let j = start; j < end; j++) {
          if (s2m[j] || s1[i] !== s2[j]) continue;
          s1m[i] = s2m[j] = true; matches++; break;
        }
      }
      if (!matches) return 0;
      let k = 0;
      for (let i = 0; i < l1; i++) {
        if (!s1m[i]) continue;
        while (!s2m[k]) k++;
        if (s1[i] !== s2[k]) transpositions++;
        k++;
      }
      const jaro = (matches / l1 + matches / l2 + (matches - transpositions / 2) / matches) / 3;
      const prefix = (() => { let p = 0; for (; p < Math.min(l1, l2, 4) && s1[p] === s2[p]; p++); return p; })();
      return jaro + prefix * 0.1 * (1 - jaro);
    }

    static matchScore(query, keyword) {
      if (query === keyword) return 1;
      if (keyword.includes(query) && query.length >= 3) return 0.85;
      if (query.includes(keyword) && keyword.length >= 3) return 0.75;
      if (query.length < 4 || keyword.length < 4) return 0;
      const dist = FuzzyMatcher.levenshtein(query, keyword);
      const maxLen = Math.max(query.length, keyword.length);
      if (dist <= 1) return 0.82;
      if (dist <= 2 && maxLen >= 6) return 0.65;
      const jw = FuzzyMatcher.jaroWinkler(query, keyword);
      if (jw >= 0.92) return 0.7;
      return 0;
    }
  }

  global.EcxNLP = { NLPProcessor, FuzzyMatcher };
})(window);
