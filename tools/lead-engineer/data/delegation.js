/*
 * delegation.js - the seven levels of delegation used by the delegation planner
 * (js/views/tools/delegate.js) and the situational leadership explainer.
 *
 *   {n: 1 to 7, name, means: what it means for the lead, say: how the brief says it to the person}
 *
 * The levels are Jurgen Appelo's, from Management 3.0 ("delegation poker" and the delegation
 * board): authority is not "I do it" or "you do it", but seven steps between the two, and it can be
 * a different step for each decision inside the same piece of work.
 */
(function (U) {
  'use strict';
  U.data.delegationLevels = [
    { n: 1, name: 'Tell', means: 'You decide and tell them.',
      say: 'I will make this decision and tell you what it is.' },
    { n: 2, name: 'Sell', means: 'You decide, and explain why so they can buy in.',
      say: 'I will decide this, and explain my reasons so we agree on them.' },
    { n: 3, name: 'Consult', means: 'You ask for their view first, then you decide.',
      say: 'I will decide this after I have heard your view, so tell me what you think.' },
    { n: 4, name: 'Agree', means: 'You decide together; both of you have to agree.',
      say: 'We decide this together, and we both have to agree.' },
    { n: 5, name: 'Advise', means: 'They decide; you give advice first if they want it.',
      say: 'You decide. I can give you my advice first, if you want it.' },
    { n: 6, name: 'Inquire', means: 'They decide, then tell you what they chose and why.',
      say: 'You decide, then tell me what you chose and why.' },
    { n: 7, name: 'Delegate', means: 'They decide; you do not need to know.',
      say: 'You decide. You do not need to check with me or tell me.' }
  ];
})(window.LELT);
