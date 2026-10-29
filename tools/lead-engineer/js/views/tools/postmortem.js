/*
 * views/tools/postmortem.js - the postmortem builder (#/tools/postmortem).
 *
 * A blameless postmortem in the shape of Google's SRE template: the title, date, severity and
 * authors, then the sections in data/docs.js. The timeline is rows of a time, what happened and an
 * optional mark (it started, we knew, the impact stopped, resolved); the marks give the time to
 * detect, the time to mitigate and how long the impact lasted. Times are HH:MM in order, and a time
 * earlier than the one before it counts as the next day, so an incident can cross midnight.
 * Actions are rows of what changes, an owner, a date and a kind (prevent, detect, mitigate, process).
 *
 * Checks (data/tool-checks.js): a missing section, blaming words (the "blame" wording rules in
 * data/lint-rules.js), a timeline line with no time, an unmarked start, detection or mitigation, an
 * action with no owner or date, a vague action (the "raid" rules), customers or support finding it
 * first with no action to detect it next time, and an impact with no number.
 * Kept in "lelt.tool.postmortem".
 */
(function (U) {
  'use strict';
  var h = U.h, K = U.toolKit, P = U.plan;

  var EMPTY = { title: '', date: '', severity: 'sev2', authors: '', summary: '', impact: '', timeline: [], causes: '', detection: '',
    wentWell: '', wentWrong: '', lucky: '', actions: [] };
  var RULES = ['post-missing', 'post-blame', 'post-no-time', 'post-no-marks', 'post-action-owner', 'post-vague-action', 'post-detect', 'post-impact-number'];
  var MARKS = [['', '·'], ['start', 'Started'], ['detected', 'We knew'], ['mitigated', 'Mitigated'], ['resolved', 'Resolved']];
  var MARK_NOTE = { start: 'it started', detected: 'we knew', mitigated: 'the impact stopped', resolved: 'resolved' };
  var KINDS = [['prevent', 'Prevent'], ['detect', 'Detect'], ['mitigate', 'Mitigate'], ['process', 'Process']];
  var MEASURES = [['detect', 'Time to detect'], ['mitigate', 'Time to mitigate'], ['impact', 'Impact lasted'], ['resolve', 'Resolved after']];
  // who found it, when it was not an alert
  var OUTSIDE = /\b(?:customers?|users?|clients?|support|complain(?:ed|ts?)?|tweet(?:ed|s)?|twitter|social media|merchants?|sellers?|call cent(?:re|er))\b/i;
  var TIME = /^(\d{1,2})[:.](\d{2})$/;
  // the sections the blame rules read
  var READ = ['summary', 'impact', 'causes', 'detection', 'wentWrong', 'lucky'];

  function str(v) { return String(v === undefined || v === null ? '' : v).trim(); }
  function lines(t) { return str(t).split('\n').map(function (x) { return x.trim(); }).filter(Boolean); }
  function bullets(t) { return lines(t).map(function (x) { return '- ' + x; }).join('\n'); }
  function label(list, v) { var x = list.filter(function (o) { return o[0] === v; })[0]; return x ? x[1] : v; }
  function stop(t) { t = str(t); return !t || /[.!?]$/.test(t) ? t : t + '.'; }
  function severities() {
    var p = U.find('playbooks', 'incident');
    return p && p.severities ? p.severities.map(function (x) { return [x.id, x.title]; }) : [['sev1', 'SEV1'], ['sev2', 'SEV2'], ['sev3', 'SEV3']];
  }
  function rowsOf(s) { return (s.timeline || []).filter(function (r) { return str(r.time) || str(r.what); }); }
  function actionsOf(s) { return (s.actions || []).filter(function (a) { return str(a.what); }); }
  function sectionTitle(key) { var x = ((U.data.docSections || {}).postmortem || []).filter(function (y) { return y.key === key; })[0]; return x ? x.title : key; }

  /** 88 -> "1 hour 28 minutes", 41 -> "41 minutes". */
  function duration(m) {
    var hrs = Math.floor(m / 60), rest = m % 60;
    if (!hrs) return U.plural(rest, 'minute');
    return U.plural(hrs, 'hour') + (rest ? ' ' + U.plural(rest, 'minute') : '');
  }

  /** Each timeline row's minute (a time earlier than the one before is the next day), and the measures. */
  function compute(s) {
    var day = 0, prev = null, marks = {};
    var rows = rowsOf(s).map(function (r) {
      var m = TIME.exec(str(r.time)), at = null;
      if (m && +m[1] < 24 && +m[2] < 60) {
        at = +m[1] * 60 + +m[2] + day;
        if (prev !== null && at < prev) { day += 1440; at += 1440; }
        prev = at;
      }
      if (at !== null && r.mark && marks[r.mark] === undefined) marks[r.mark] = at;
      return { time: str(r.time), what: str(r.what), mark: r.mark || '', at: at };
    });
    function gap(a, b) { return marks[a] !== undefined && marks[b] !== undefined && marks[b] >= marks[a] ? marks[b] - marks[a] : null; }
    return { rows: rows, marks: marks, detect: gap('start', 'detected'), mitigate: gap('detected', 'mitigated'), impact: gap('start', 'mitigated'), resolve: gap('start', 'resolved') };
  }

  function measuresLine(r) {
    return MEASURES.filter(function (x) { return r[x[0]] !== null; }).map(function (x) { return x[1] + ': ' + duration(r[x[0]]); }).join(' · ');
  }

  function bodies(s) {
    var r = compute(s), m = measuresLine(r);
    return {
      summary: str(s.summary), impact: str(s.impact) ? str(s.impact) + (m ? '\n' + m : '') : '',
      timeline: r.rows.map(function (x) { return '- ' + (x.time || '??:??') + ' ' + stop(x.what) + (x.mark ? ' (' + MARK_NOTE[x.mark] + ')' : ''); }).join('\n'),
      causes: str(s.causes), detection: str(s.detection), wentWell: bullets(s.wentWell), wentWrong: bullets(s.wentWrong), lucky: bullets(s.lucky),
      actions: actionsOf(s).map(function (a) {
        var due = P.parseDay(a.due);
        return '- ' + label(KINDS, a.kind || 'prevent') + ': ' + stop(a.what) + ' Owner: ' + (str(a.owner) || '[Who]') + '. Due: ' + (due ? P.day(due) : '[A day]') + '.';
      }).join('\n')
    };
  }

  function check(s) {
    var out = [], r = compute(s), blame = (U.data.lintRules || {}).blame || [], vague = (U.data.lintRules || {}).raid || [];
    if (!str(s.title)) out.push({ rule: 'post-missing', where: 'Title', key: 'title' });
    if (!P.parseDay(s.date)) out.push({ rule: 'post-missing', where: 'Date', key: 'date' });
    var filled = bodies(s);
    filled.impact = str(s.impact);
    out = out.concat(K.docMissing('postmortem', filled, 'post-missing'));
    function blaming(text, where, key) {
      U.lint.find(text, blame).forEach(function (x) { out.push({ rule: 'post-blame', where: where, key: key, detail: x.text, msg: x.rule.msg, fix: x.rule.fix }); });
    }
    READ.forEach(function (k) { blaming(s[k], sectionTitle(k), k); });
    r.rows.forEach(function (x) { blaming(x.what, 'Timeline ' + (x.time || ''), 'timeline'); });
    actionsOf(s).forEach(function (a) { blaming(a.what, 'Action', 'actions'); });
    r.rows.forEach(function (x) { if (x.at === null) out.push({ rule: 'post-no-time', where: 'Timeline', key: 'timeline', detail: x.time || 'no time' }); });
    if (r.rows.length) {
      var gone = ['start', 'detected', 'mitigated'].filter(function (k) { return r.marks[k] === undefined; });
      if (gone.length) out.push({ rule: 'post-no-marks', where: 'Not marked: ' + gone.map(function (k) { return label(MARKS, k).toLowerCase(); }).join(', '), key: 'timeline' });
    }
    actionsOf(s).forEach(function (a) {
      if (!str(a.owner) || !P.parseDay(a.due)) out.push({ rule: 'post-action-owner', where: str(a.what).slice(0, 48), key: 'actions' });
      U.lint.find(a.what, vague).forEach(function (x) { out.push({ rule: 'post-vague-action', where: 'Action', key: 'actions', detail: x.text }); });
    });
    if (OUTSIDE.test(str(s.detection)) && !actionsOf(s).some(function (a) { return a.kind === 'detect'; })) out.push({ rule: 'post-detect', where: 'How we found out', key: 'detection' });
    if (str(s.impact) && !/\d/.test(s.impact)) out.push({ rule: 'post-impact-number', where: 'Impact', key: 'impact' });
    return out;
  }

  /** The postmortem, in Markdown. */
  function compose(s) {
    var d = P.parseDay(s.date);
    var head = ['Date: ' + (d ? P.day(d) + ' ' + d.getFullYear() : '[Date]'), 'Severity: ' + label(severities(), s.severity || 'sev2'), 'Authors: ' + (str(s.authors) || '[Who wrote it]')];
    return ['# Postmortem: ' + (str(s.title) || '[What happened, in a few words]'), '', head.join(' · '), '',
      'This postmortem is blameless: it looks at how our systems and our ways of working let this happen, not at who.', '',
      K.docText('postmortem', bodies(s))].join('\n');
  }

  /** The short version for stakeholders: what happened, the impact, that it is fixed, what changes. */
  function brief(s) {
    var r = compute(s), d = P.parseDay(s.date);
    var out = ['Subject: Incident summary: ' + (str(s.title) || '[what happened]') + (d ? ' (' + P.day(d) + ')' : ''), '',
      'What happened: ' + (str(s.summary) || '[two or three sentences]'), '', 'Impact: ' + (str(s.impact) || '[who, how many, how long]')];
    if (r.impact !== null) out.push('', 'It is fixed: the impact lasted ' + duration(r.impact) + (r.resolve !== null ? ', and everything was back to normal after ' + duration(r.resolve) : '') + '.');
    var acts = actionsOf(s);
    if (acts.length) {
      out.push('', 'What we are changing so it does not happen again:');
      acts.forEach(function (a) { var due = P.parseDay(a.due); out.push('- ' + stop(a.what) + ' (' + (str(a.owner) || 'owner to agree') + (due ? ', by ' + P.day(due) : '') + ')'); });
    }
    out.push('', 'The full postmortem, with the timeline and the causes: [link]. Questions are welcome.');
    return out.join('\n');
  }

  function sample() {
    var today = P.today();
    function wd(n) { return U.localDate(P.addWorkdays(today, n)); }
    return {
      title: 'Card payments failed for 41 minutes', date: wd(-3), severity: 'sev1', authors: 'You (lead engineer, Payments), Kiran (Platform)',
      summary: 'Release 4.18 renamed a column in the payments table while the previous version was still running on half the servers. For 41 minutes, about 30% of card payments failed. We rolled back, and every failed payment was retried within the next hour.',
      impact: '4,200 card payments failed between 10:02 and 10:43, about 30% of card payments in that time. 310 customers called or wrote to support. No money was lost: every payment was retried by 11:30.',
      timeline: [
        { time: '10:02', what: 'Release 4.18 starts rolling out; its migration renames payments.card_ref', mark: 'start' },
        { time: '10:09', what: 'The payment error rate rises from 0.5% to 30%; no alert fires, because the alerts watch the API, not the payments behind it', mark: '' },
        { time: '10:24', what: 'Support posts in the team channel that customers report failed payments', mark: 'detected' },
        { time: '10:31', what: 'SEV1 declared; Kiran is incident commander; first update to support and the business', mark: '' },
        { time: '10:36', what: 'The team links the errors to release 4.18 and decides to roll back', mark: '' },
        { time: '10:43', what: 'Rollback complete; the error rate is back to 0.5%', mark: 'mitigated' },
        { time: '11:30', what: 'Every failed payment retried; incident closed', mark: 'resolved' }
      ],
      causes: 'The migration renamed the column in one step. During a rolling deployment the old version and the new one run side by side for about 15 minutes, and the old version still read the old column name, so its payments failed.\n' +
        'Contributing factors: the pipeline does not test a migration against the version still running; the error-rate alert watches our API, which kept answering, not the payments failing behind it; and nothing rolls back automatically when errors jump after a release.',
      detection: 'Support told us 22 minutes after it started, after customers called. Our alerts stayed quiet: they watch the API response codes, and the API kept answering.',
      wentWell: 'The rollback took 7 minutes once we decided.\nSupport had an update every 30 minutes, so they could answer customers.\nThe retry job recovered every payment.',
      wentWrong: 'Customers told us before our alerts did.\nIt took 12 minutes to connect the errors to the release: releases are not posted in the incident channel.\nThere was no runbook for failed payments.',
      lucky: 'It happened at 10 am, not during the 8 pm sale peak, when the same failure rate would have hit about five times as many payments.',
      actions: [
        { what: 'Alert when card payment success drops below 95% for 5 minutes, paging on-call', owner: 'Kiran', due: wd(5), kind: 'detect' },
        { what: 'The pipeline runs each migration against the previous release before it deploys', owner: 'Anil', due: wd(10), kind: 'prevent' },
        { what: 'Schema changes use expand and contract: add the new column, move the data, remove the old one in a later release', owner: 'Divya', due: wd(7), kind: 'prevent' },
        { what: 'Roll back automatically when the payment error rate passes 5% in the 15 minutes after a release', owner: 'Kiran', due: wd(15), kind: 'mitigate' },
        { what: 'Every release is posted in the incident channel automatically', owner: 'You', due: wd(5), kind: 'process' }
      ]
    };
  }

  function kebab(k) { return k.replace(/[A-Z]/g, function (c) { return '-' + c.toLowerCase(); }); }
  function sec(key) { return ((U.data.docSections || {}).postmortem || []).filter(function (x) { return x.key === key; })[0] || { title: key, ph: '' }; }

  U.tools.postmortem = {
    EMPTY: EMPTY, rules: RULES, check: check, compute: compute, compose: compose, brief: brief, sample: sample, duration: duration,
    render: function (root) {
      var s = K.load('postmortem', EMPTY);
      ['timeline', 'actions'].forEach(function (k) { if (!Array.isArray(s[k])) s[k] = []; });
      var f = K.form(s, function () { refresh(); });
      function changed() { refresh(); }
      var timeline = K.rows({
        id: 'po-timeline', noun: 'moment', list: function () { return s.timeline; }, changed: changed,
        blank: function () { return { time: '', what: '', mark: '' }; },
        cols: [
          { key: 'time', label: 'Time', ph: '10:02', size: '.6fr' },
          { key: 'what', label: 'What happened', type: 'textarea', rows: 1, ph: 'Release 4.18 starts rolling out', size: '2.6fr' },
          { key: 'mark', label: 'Mark', type: 'select', options: MARKS, size: '1.25fr' }
        ]
      });
      var actions = K.rows({
        id: 'po-actions', noun: 'action', list: function () { return s.actions; }, changed: changed,
        blank: function () { return { what: '', owner: '', due: '', kind: 'prevent' }; },
        cols: [
          { key: 'what', label: 'What changes', type: 'textarea', rows: 1, full: 'top', ph: 'Alert when payment success drops below 95% for 5 minutes' },
          { key: 'owner', label: 'Owner', ph: 'Kiran', size: '1fr' },
          { key: 'due', label: 'Due', type: 'date', size: '1.3fr' },
          { key: 'kind', label: 'Kind', type: 'select', options: KINDS, size: '1fr' }
        ]
      });
      var times = h('div', { class: 'po-times', id: 'po-times' });
      var checks = K.checksCard('postmortem', 'Blameless, timed, measured, and every action owned and dated.', function (x) {
        if (x.key === 'timeline' || x.key === 'actions') K.focus(U.$('#po-' + x.key + ' input') || U.$('#po-' + x.key + '-add'));
        else K.focus(U.$('#po-' + kebab(x.key)));
      });
      var doc = K.outputCard({ id: 'po-output', title: 'The postmortem', note: 'Markdown: paste it into Confluence or the incident ticket, and review it with the team within five working days.',
        prompt: function (text) {
          return 'I am a lead engineer. Here is a postmortem I wrote after an incident. Check that it is blameless, that the causes go beyond the first trigger to the contributing factors, ' +
            'and that each action would really stop a repeat or catch it sooner. Point out anything a reader would ask about.\n\n' + text;
        } });
      var short = K.outputCard({ id: 'po-brief-output', title: 'For stakeholders', note: 'The short version for your manager, support and the business.' });
      function area(key, rows, hint) {
        var x = sec(key), id = 'po-' + kebab(key);
        return K.field(id, x.title, hint || null, f.textarea(key, { id: id, rows: rows || 3, placeholder: x.ph, grow: true }));
      }

      root.appendChild(h('div', { class: 'tool-layout' },
        h('div', { class: 'card st-form' },
          K.samples([['po-sample', 'Load the example', function () { K.replace(s, sample()); f.fill(); timeline.draw(); actions.draw(); refresh(); }]],
            'po-clear', function () { K.replace(s, EMPTY); f.fill(); timeline.draw(); actions.draw(); refresh(); }),
          K.field('po-title', 'Title', 'What happened, in a few words', f.input('title', { id: 'po-title', placeholder: 'Card payments failed for 41 minutes' })),
          h('div', { class: 'field-row' },
            K.field('po-date', 'Date of the incident', null, f.input('date', { id: 'po-date', type: 'date' })),
            K.field('po-severity', 'Severity', null, f.select('severity', severities(), { id: 'po-severity' }))),
          K.field('po-authors', 'Authors', null, f.input('authors', { id: 'po-authors', placeholder: 'You, Kiran' })),
          area('summary', 3), area('impact', 3, 'Numbers: how many, how long, what it cost'),
          h('div', { class: 'field' }, h('span', { class: 'field-label' }, sec('timeline').title), timeline.el,
            h('small', { class: 'faint' }, 'Times as HH:MM, in order; a time earlier than the one before counts as the next day. Mark when it started, when you knew, and when the impact stopped (mitigated).')),
          area('causes', 4, 'How, not who: the trigger, and the factors that let it reach customers'), area('detection', 2),
          area('wentWell', 3, 'One per line'), area('wentWrong', 3, 'One per line'), area('lucky', 2, 'Optional, one per line'),
          h('div', { class: 'field' }, h('span', { class: 'field-label' }, sec('actions').title), actions.el,
            h('small', { class: 'faint' }, 'Change the system, not people\'s carefulness. Each action needs an owner and a date; put them in the backlog.'))),
        h('div', { class: 'st-side' }, checks.el, h('div', { class: 'card' }, h('h2', null, 'The numbers'), times), doc.el, short.el)));
      root.appendChild(K.docParts('postmortem', 'po-parts'));
      root.appendChild(guide());

      function refresh() {
        U.store.set('tool.postmortem', s);
        var r = compute(s);
        times.innerHTML = '';
        MEASURES.forEach(function (m) {
          times.appendChild(h('div', { class: 'po-time', 'data-measure': m[0], 'data-minutes': r[m[0]] === null ? '' : String(r[m[0]]) },
            h('span', { class: 'faint' }, m[1]), h('b', null, r[m[0]] === null ? '-' : duration(r[m[0]]))));
        });
        checks.show(check(s));
        doc.set(compose(s));
        short.set(brief(s));
      }
      f.fill();
      refresh();
    }
  };

  function guide() {
    return U.section('How to run a blameless postmortem', h('div', { html: U.md([
      '1. **Write it within five working days**, while people remember, and review it together in 30 to 60 minutes.',
      '2. **Build the timeline first**, from the incident channel, the deploy log and the graphs. Facts first, then causes.',
      '3. **Ask "how", never "who".** A person\'s slip is where the investigation starts: what made it easy to make and hard to catch?',
      '4. **Look past the trigger** to the factors that let it reach customers: the missing check, the alert that watched the wrong thing.',
      '5. **Few actions, all owned and dated**, in the backlog with a priority. Track them at the next review; an action that never happens brings the incident back.',
      '',
      'More in [[lesson:incidents]] and [[playbook:incident]]; practise it in [[scenario:same-incident-twice]] and [[scenario:junior-broke-production]].'
    ].join('\n')) }), false);
  }
})(window.LELT);
