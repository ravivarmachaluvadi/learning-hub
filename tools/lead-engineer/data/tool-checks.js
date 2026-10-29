/*
 * tool-checks.js - what each tool checks (every tool except the status builder, whose checks are
 * older and built in), and how to fix it.
 *
 *   U.data.toolChecks[toolId] = [{id, msg: 'what is wrong', fix: 'what to do instead',
 *                                 example: {a state the check must flag}, good: {a state nothing flags}}]
 *
 * When a check fires is code (each tool's check() in js/views/tools/<id>.js); what it says is here.
 * The browser tests lay each example and good state over the tool's empty state, run its check(),
 * and prove the example is flagged and the good state is clean. They also prove that the checks the
 * code can raise and the checks described here are the same list.
 *
 * Dates in the examples are fixed, so the states carry their own "today".
 */
(function (U) {
  'use strict';

  /* ---------- estimation workbench ---------- */
  var TASKS = [
    { name: 'Refund API', kind: 'build', o: 2, m: 3, p: 5 },
    { name: 'Code review and rework', kind: 'review', o: 1, m: 1.5, p: 2 },
    { name: 'Testing', kind: 'test', o: 1, m: 2, p: 3 }
  ];
  var EST = { feature: 'Refund API', tasks: TASKS, assumptions: 'Two developers on it full-time' };
  function est(change) { return Object.assign({}, EST, change); }
  function withTask(t) { return est({ tasks: [t].concat(TASKS.slice(1)) }); }

  /* ---------- deadline negotiator ---------- */
  var PARTS = [
    { name: 'Agents refund orders under ₹5,000 from the admin screen', weeks: '1', must: true },
    { name: 'Self-service refunds', weeks: '3', must: false },
    { name: 'Finance report', weeks: '2', must: false }
  ];
  var ASK = { start: '2026-11-02', ask: '2026-11-13', likely: '6', safe: '8', parts: PARTS };
  function ask(change) { return Object.assign({}, ASK, change); }

  /* ---------- prioritisation ---------- */
  function ask3(a, b, c) {
    return [
      Object.assign({ name: 'Fix failed-refund retries', who: 'Anil', weeks: '1', cod: '8', urgent: true, important: true, moscow: 'must' }, a),
      Object.assign({ name: 'Marketplace partner API', who: 'Meera', weeks: '4', cod: '10', urgent: true, important: true, moscow: 'should' }, b),
      Object.assign({ name: 'Dark mode', who: 'Tanvi', weeks: '2', cod: '1', urgent: false, important: false, moscow: 'could' }, c)
    ];
  }
  var PRI = { decider: 'Priya', items: ask3() };

  /* ---------- dependencies ---------- */
  var DEP = { team: 'Platform', person: 'Kiran', need: 'the refund endpoint', by: '2026-11-20', status: 'agreed', impact: 'refunds miss the sale', goal: '' };
  var PEOPLE = [{ name: 'Neha', role: 'PM', power: 'high', interest: 'high', raci: 'A' }, { name: 'Payments team', role: 'Builds it', power: 'low', interest: 'high', raci: 'R' }];
  function deps(change, people) { return { today: '2026-11-02', deps: [Object.assign({}, DEP, change)], people: people || PEOPLE }; }
  function raci(a, b) { return deps({}, [Object.assign({}, PEOPLE[0], { raci: a }), Object.assign({}, PEOPLE[1], { raci: b })]); }

  /* ---------- RAID log ---------- */
  var RISK = { type: 'risk', text: 'The bank sandbox may be late', owner: 'Asha', date: '2026-11-09', likelihood: '4', impact: '4',
    action: 'Asha asks the bank for a date in writing and builds a stub of their API.', status: 'open' };
  function raid(change) { return { today: '2026-11-02', items: [Object.assign({}, RISK, change)] }; }

  /* ---------- sprint capacity ---------- */
  var TEAM = [{ name: 'Asha', leave: '1', oncall: '0', alloc: '100' }, { name: 'Rahul', leave: '0', oncall: '2', alloc: '100' }];
  function cap(change) { return Object.assign({ velocity: '30, 28, 33', people: TEAM }, change); }

  /* ---------- PRD question generator: only the structure; the vague words are the "prd" lint rules ---------- */
  var WHY = 'Problem: customers must call support to get a refund.';
  var MEASURE = 'Success: refund calls to support drop from 1,200 to 400 a week by 31 January.';
  var SCOPE = 'Out of scope for the first release: partial refunds.';
  function prd(change) { return Object.assign({ pm: 'Neha', replyBy: '2026-11-11', text: [WHY, MEASURE, SCOPE].join('\n') }, change); }

  /* ---------- stand-up facilitator ---------- */
  function standup(change) { return Object.assign({ team: 'Asha\nRahul\nDivya', minutes: '15', history: [] }, change); }
  function meeting(date, todays, parked) {
    return { date: date, entries: Object.keys(todays).map(function (n) { return { name: n, today: todays[n] }; }), parked: parked || [] };
  }
  var SAME = [meeting('2026-11-04', { Asha: 'Settlement report' }), meeting('2026-11-03', { Asha: 'settlement report.' }), meeting('2026-11-02', { Asha: 'Settlement report' })];
  var MOVING = [meeting('2026-11-04', { Asha: 'Settlement report: the CSV export' }), meeting('2026-11-03', { Asha: 'Settlement report: the query' }),
    meeting('2026-11-02', { Asha: 'Settlement report: tests for the totals' })];

  /* ---------- message templates: the escalation, filled in ---------- */
  var ESC = {
    to: 'Rohan and Priya',
    decision: 'Should Platform build the refund endpoint this sprint, ahead of the gateway migration?',
    by: 'Wed 11 Nov, 5 pm',
    impact: 'Refunds miss the festive sale on Fri 20 Nov.',
    background: 'Refunds need the refund endpoint on the payment gateway.\nKiran\'s team planned it for December, after the gateway migration.',
    options: 'Platform builds it this sprint; the gateway migration moves by one week.\nNothing changes; refunds ship in December, after the sale.',
    recommend: 'Option 1: one week on the migration costs less than refunds missing the sale.',
    together: 'Kiran (Platform lead)'
  };
  function tpl(change) { return { pick: 'escalation', values: { escalation: Object.assign({}, ESC, change) } }; }

  /* ---------- 1:1 planner: Asha, weekly, last 1:1 a week ago, a growth topic in one of the last four ---------- */
  function held(date, cat) { return { date: date, topics: [{ text: cat === 'growth' ? 'Where she wants to be in a year' : 'What slowed her down this week', from: 'me', cat: cat }], notes: '' }; }
  var ASHA = {
    name: 'Asha', role: 'Developer', rhythm: '7', goal: 'Lead a feature end to end by March', next: '',
    agenda: [{ text: 'What would make the refund work easier for you?', from: 'me', cat: 'blockers' }], notes: '',
    actions: [{ what: 'Share the system design course link', who: 'me', by: '2026-11-13', done: false }],
    log: [held('2026-11-05', 'blockers'), held('2026-10-29', 'growth'), held('2026-10-22', 'workload'), held('2026-10-15', 'open')]
  };
  function oo(change) { return { today: '2026-11-12', current: 0, people: [Object.assign({}, ASHA, change)] }; }

  /* ---------- feedback composer: asking Divya for dates in her updates ---------- */
  var FB = {
    today: '2026-11-12', kind: 'change', who: 'Divya', on: '2026-11-10', where: 'private',
    situation: 'In Tuesday\'s stand-up', behaviour: 'you said the payment work would be done soon',
    impact: 'Anil waited two days to start the integration, because he could not plan around it.',
    question: 'What makes it hard to give a date?',
    request: 'I would like each update to have a date or a range, and an early warning when it moves.',
    followup: '2026-11-24', log: []
  };
  function fb(change) { return Object.assign({}, FB, change); }
  function logged(kind) { return { who: 'Divya', date: '2026-11-10', kind: kind, text: 'Updates without a date' }; }

  /* ---------- delegation planner: Anil and the GST bug, Mon 2 Nov to Fri 13 Nov ---------- */
  var DL = {
    today: '2026-11-02', task: 'Fix the GST totals on multi-state invoices', who: 'Anil',
    why: 'You want to learn the invoice service, and this bug is a contained way in.',
    outcome: 'Multi-state invoices total correctly, with tests, deployed to staging.',
    start: '2026-11-02', deadline: '2026-11-13', experience: 'some', level: '5', cadence: 'auto', decisions: [],
    help: 'A 20-minute walkthrough of the invoice code on day one.', tripwires: 'The fix needs a change to the invoice format.'
  };
  function dl(change) { return Object.assign({}, DL, change); }

  /* ---------- design doc (RFC) builder ---------- */
  var ALTS = [{ name: 'Do nothing', good: 'No work.', bad: 'Drop-off stays at 12%.' },
    { name: 'Our own card vault', good: 'No fee per token.', bad: 'A PCI DSS audit and months of work, and RBI rules forbid storing card numbers.' }];
  var RFC = {
    title: 'Saved cards at checkout', author: 'You', reviewers: 'Kiran (Platform)\nDeepa (Security)', decider: 'Neha', decideBy: '2026-11-13', status: 'review',
    problem: 'Returning customers type their card details on every order; 12% of them abandon the payment step.',
    goals: 'Returning customers pay with a saved card in two taps.\nPayment-step drop-off falls from 12% to under 8% by 31 Jan.',
    nonGoals: 'Saving UPI IDs.', nfrs: [{ quality: 'latency', target: 'The saved-cards list loads in under 300 ms for 95% of requests at 200 a second.' }],
    proposal: 'Keep the payment provider\'s card tokens, never card numbers, in a saved_cards table owned by the checkout service.',
    alternatives: ALTS, risks: 'Some cards cannot be tokenised; those customers enter the card as today.',
    rollout: 'Behind a feature flag: staff, then 10% of returning customers, then everyone. Roll back by switching the flag off.', questions: ''
  };
  function rfc(change) { return Object.assign({}, RFC, change); }

  /* ---------- decision record (ADR) builder ---------- */
  var OPTS = [{ name: 'Kafka', good: 'Replay after an outage; the platform team runs it.', bad: 'New to our team.', chosen: true },
    { name: 'Keep polling the database', good: 'No new technology.', bad: 'Three teams depend on our table.', chosen: false }];
  var ADR = {
    number: '7', title: 'Publish order events through Kafka', date: '2026-11-02', status: 'accepted', deciders: 'Neha, Kiran, you', supersedes: '', supersededBy: '',
    context: 'Inventory, invoicing and notifications read our orders table every minute to find new orders.',
    drivers: 'No team reads another team\'s database.\nEvents survive a consumer being down for a day.', options: OPTS,
    decision: 'We will publish OrderPlaced, OrderPaid and OrderCancelled events to Kafka, keyed by order id.',
    good: 'Other teams stop reading our database.', bad: 'Consumers must cope with the same event arriving twice.', revisit: ''
  };
  function adr(change) { return Object.assign({}, ADR, change); }

  /* ---------- postmortem builder ---------- */
  var PM_TL = [{ time: '10:02', what: 'Release 4.18 goes out.', mark: 'start' }, { time: '10:24', what: 'Our payment-success alert fires.', mark: 'detected' },
    { time: '10:43', what: 'Rolled back to 4.17.', mark: 'mitigated' }];
  var PM_ACT = { what: 'CI runs every migration against the previous release before it can deploy.', owner: 'Anil', due: '2026-11-20', kind: 'prevent' };
  var POST = {
    title: 'Card payments failed for 41 minutes', date: '2026-11-03', severity: 'sev1', authors: 'You, Kiran',
    summary: 'A release renamed a database column while the old version still read it, so 30% of card payments failed until we rolled back.',
    impact: '4,200 card payments failed over 41 minutes.', timeline: PM_TL,
    causes: 'The migration renamed the column in one step, while the previous version was still serving traffic.',
    detection: 'Our payment-success alert fired 22 minutes after the release.',
    wentWell: 'The rollback took 12 minutes once we decided.', wentWrong: 'There was no runbook for failed payments.', lucky: '', actions: [PM_ACT]
  };
  function post(change) { return Object.assign({}, POST, change); }
  function act(change) { return [Object.assign({}, PM_ACT, change)]; }

  /* ---------- tech-debt business case ---------- */
  var DEBT_ITEMS = [{ what: 'Flaky tests in the payments suite', hours: '12', fix: '3', risk: 'high', include: true },
    { what: 'Manual steps in every deployment', hours: '10', fix: '5', risk: 'medium', include: true }];
  var DEBT = { items: DEBT_ITEMS, capacity: '40', share: '20', decider: 'Neha', why: 'Payment changes reach customers in days instead of weeks.', rate: '' };
  function debt(change) { return Object.assign({}, DEBT, change); }
  function item(change) { return [Object.assign({}, DEBT_ITEMS[0], change), DEBT_ITEMS[1]]; }

  /* ---------- reflection journal ---------- */
  var JR = { today: '2026-11-13', date: '2026-11-13', kind: 'lesson', expected: 'I expected the estimate to hold.',
    happened: 'The refund API took two weeks longer than I said.', why: 'I estimated only the coding, not the review and the testing.',
    next: 'Next time I will break the work into tasks before I give a date.', entries: [] };
  function jr(change) { return Object.assign({}, JR, change); }
  function entry(date, kind) { return { id: date + kind, date: date, kind: kind, happened: 'Sprint review overran.', next: 'I will send the agenda the day before.' }; }

  /* ---------- 30-60-90 day plan builder ---------- */
  var P9_LEARN = { what: 'Read the last five postmortems', kind: 'learn', measure: 'The repeating causes listed by day 15', done: false };
  var P9_PEOPLE = { what: 'A first 1:1 with everyone', kind: 'people', measure: 'Every person met by day 15, with notes', done: false };
  var P9_DELIVER = { what: 'Land the next release', kind: 'deliver', measure: 'Shipped on the date agreed at planning', done: false };
  var P9 = { start: '2026-11-02', role: 'Lead, Payments team', manager: 'Priya', p1: [P9_LEARN, P9_PEOPLE], p2: [P9_DELIVER], p3: [P9_DELIVER] };
  function p9(change) { return Object.assign({}, P9, change); }
  function many(n) { var out = []; for (var i = 0; i < n; i++) out.push(Object.assign({}, P9_DELIVER, { what: 'Item ' + (i + 1) })); return out; }

  U.data.toolChecks = {
    estimate: [
      { id: 'no-tasks', msg: 'No tasks yet.', fix: 'Break the work into tasks of a few days each. Estimating the parts is far more accurate than estimating the whole.',
        example: est({ tasks: [] }), good: EST },
      { id: 'task-no-numbers', msg: 'This task is missing a number.', fix: 'Give it all three: the best case, the most likely, and the worst case you can realistically imagine.',
        example: withTask({ name: 'Refund API', kind: 'build', o: '', m: 3, p: '' }), good: EST },
      { id: 'task-order', msg: 'The numbers are out of order.', fix: 'Best case, most likely, worst case: each at least as big as the one before.',
        example: withTask({ name: 'Refund API', kind: 'build', o: 5, m: 3, p: 8 }), good: EST },
      { id: 'single-point', msg: 'No range: the best and worst case are the same.', fix: 'Nobody knows a task of two days or more to the day. Ask: what would make it quicker, and what could go wrong? Put those in the best and worst case.',
        example: withTask({ name: 'Refund API', kind: 'build', o: 4, m: 4, p: 4 }), good: EST },
      { id: 'huge-task', msg: 'A task of more than two weeks is a guess, not an estimate.', fix: 'Break it into parts of a few days each. The breakdown usually finds work nobody had thought of.',
        example: withTask({ name: 'Whole backend', kind: 'build', o: 10, m: 15, p: 25 }), good: EST },
      { id: 'coding-only', msg: 'Only coding is listed.', fix: 'Add the work that always happens and is often forgotten: code reviews and rework, testing, release, meetings, and waiting on other teams. "Add the work people forget" adds them.',
        example: est({ tasks: [TASKS[0], { name: 'Refund screen', kind: 'build', o: 2, m: 3, p: 5 }] }), good: EST },
      { id: 'focus-high', msg: 'A focus factor above 80% is rare.', fix: 'Stand-ups, reviews for others, support questions and messages take a real share of every day. 60 to 70% is common; measure your own team\'s.',
        example: est({ focus: '0.9' }), good: EST },
      { id: 'no-assumptions', msg: 'No assumptions written down.', fix: 'Say what must stay true for these numbers: who works on it, what others deliver, what will not change. When an assumption breaks, everyone can see why the date moved.',
        example: est({ assumptions: '' }), good: EST }
    ],

    deadline: [
      { id: 'no-ask-date', msg: 'No date for the ask.', fix: 'Enter the date they asked for. If they said "next week", ask which day: "Do you mean by Friday the 13th?"',
        example: ask({ ask: '' }), good: ASK },
      { id: 'no-estimate', msg: 'No estimate yet.', fix: 'Enter a likely and a safe number of weeks, or use the estimation workbench and take its P50 and P85.',
        example: ask({ likely: '' }), good: ASK },
      { id: 'safe-below-likely', msg: 'The safe estimate is smaller than the likely one.', fix: 'The safe number (85% sure) is the later one: it has room for what goes wrong.',
        example: ask({ likely: '8', safe: '6' }), good: ASK },
      { id: 'no-parts', msg: 'No parts listed.', fix: 'List the parts of the work, most important first. Without them there is no smaller slice to offer, and the reply can only say "later".',
        example: ask({ parts: [] }), good: ASK },
      { id: 'parts-mismatch', msg: 'The parts don\'t add up to your estimate.', fix: 'Either a part is missing or the estimate is off. Check both before you send numbers: someone will add them up.',
        example: ask({ parts: [PARTS[0], { name: 'Self-service refunds', weeks: '1', must: false }] }), good: ASK },
      { id: 'must-not-fit', msg: 'A must-have does not fit by the date.', fix: 'Say so plainly in the reply. A slice without its must-have is not an option; ask which they would rather move: the date or the must-have.',
        example: ask({ parts: [{ name: 'Self-service refunds', weeks: '3', must: true }].concat(PARTS.slice(0, 1), PARTS.slice(2)) }), good: ASK }
    ],

    prioritise: [
      { id: 'all-urgent', msg: 'Everything is marked urgent.', fix: 'If everything is urgent, nothing is. Ask what happens, and to whom, if each one waits two weeks. Only a real date or a real cost makes it urgent.',
        example: { decider: 'Priya', items: ask3({}, {}, { urgent: true }) }, good: PRI },
      { id: 'too-many-musts', msg: 'Must-haves are more than 60% of the work.', fix: 'With no should or could items to drop, any surprise moves the date. Ask of each must: "If it were missing, would we still ship?"',
        example: { decider: 'Priya', items: ask3({}, { moscow: 'must' }, { moscow: 'must' }) }, good: PRI },
      { id: 'no-cost', msg: 'This ask has no cost of delay.', fix: 'Ask its requester: what does each week of waiting cost, in money, customers or risk? A rough number is fine, as long as you size every ask the same way.',
        example: { decider: 'Priya', items: ask3({ cod: '' }) }, good: PRI },
      { id: 'no-weeks', msg: 'This ask has no size.', fix: 'Give it a rough number of weeks of the team\'s time. Without it, there is no order and no dates.',
        example: { decider: 'Priya', items: ask3({}, { weeks: '' }) }, good: PRI },
      { id: 'no-decider', msg: 'Nobody named to decide.', fix: 'Your job is to make the trade-off visible; the person who owns both priorities decides. Name them, usually your manager or the Product Owner.',
        example: { decider: '', items: ask3() }, good: PRI }
    ],

    dependencies: [
      { id: 'dep-no-person', msg: 'No person named.', fix: '"The platform team" can ignore a request; Kiran can\'t. Find one person who can say yes.',
        example: deps({ person: '' }), good: deps({}) },
      { id: 'dep-no-date', msg: 'No "needed by" date.', fix: 'Give the last day it can arrive without moving your date. The date is what makes it urgent for them.',
        example: deps({ by: '' }), good: deps({}) },
      { id: 'dep-not-written', msg: 'Asked, but not agreed in writing.', fix: 'A "yes" in a corridor is easy to forget. Send a short summary: what, by when, who. Ask them to reply "agreed".',
        example: deps({ status: 'asked' }), good: deps({}) },
      { id: 'dep-due-soon', msg: 'Needed within a week, and not agreed yet.', fix: 'Talk to the person today. If they can\'t commit, raise it jointly with their lead now, while there is still time to choose an option.',
        example: deps({ by: '2026-11-04', status: 'not-asked' }), good: deps({}) },
      { id: 'dep-overdue', msg: 'The needed-by date has passed.', fix: 'Your plan is already late by this much. Update your status (Amber or Red), agree a new date with them, and say what moves.',
        example: deps({ by: '2026-10-28' }), good: deps({}) },
      { id: 'dep-no-impact', msg: 'No impact written.', fix: 'Say what slips, for whom, if it is late. "Refunds miss the festive sale" gets a request prioritised; "we are blocked" does not.',
        example: deps({ impact: '' }), good: deps({}) },
      { id: 'raci-no-a', msg: 'Nobody is Accountable.', fix: 'Exactly one person owns each decision. Without one, decisions wait, or several people make different ones.',
        example: raci('C', 'R'), good: deps({}) },
      { id: 'raci-many-a', msg: 'More than one person is Accountable.', fix: 'Two owners means no owner: pick one. The others can be Consulted.',
        example: raci('A', 'A'), good: deps({}) },
      { id: 'raci-no-r', msg: 'Nobody is Responsible.', fix: 'Someone has to do the work. Mark the person or team who will.',
        example: raci('A', 'I'), good: deps({}) }
    ],

    raid: [
      { id: 'raid-no-owner', msg: 'No owner.', fix: 'A risk with no owner is a risk nobody manages. Name one person, who agrees to own it.',
        example: raid({ owner: '' }), good: raid({}) },
      { id: 'raid-no-date', msg: 'No date.', fix: 'Give each item a date to review it or to finish its action by. Without one, it sits in the log for months.',
        example: raid({ date: '' }), good: raid({}) },
      { id: 'risk-no-score', msg: 'This risk has no likelihood or impact.', fix: 'Score both from 1 to 5. A rough score lets you compare risks and spend effort on the biggest.',
        example: raid({ likelihood: '' }), good: raid({}) },
      { id: 'no-action', msg: 'No next action.', fix: 'Say what will be done about it, by whom, by when: reduce the chance, reduce the impact, or accept it on purpose. For an assumption, how you will check it.',
        example: raid({ action: '' }), good: raid({}) },
      { id: 'raid-overdue', msg: 'Its date has passed and it is still open.', fix: 'Review it now: close it, update the score and the date, or move it to Issue if it happened.',
        example: raid({ date: '2026-10-26' }), good: raid({}) },
      { id: 'raid-vague-action', msg: 'The action is vague.', fix: 'Write a step someone can do and you can check: "Asha builds a stub of the bank API by Fri 13 Nov", not "monitor closely".',
        example: raid({ action: 'Monitor the situation closely.' }), good: raid({}) }
    ],

    capacity: [
      { id: 'cap-no-people', msg: 'No people listed.', fix: 'Add everyone who works on the sprint, with their days off and on-call days.',
        example: cap({ people: [] }), good: cap({}) },
      { id: 'cap-few-sprints', msg: 'Fewer than three sprints of velocity.', fix: 'One sprint is noise. Use the last three (points done, not planned); with less history, say the forecast is rough.',
        example: cap({ velocity: '30' }), good: cap({}) },
      { id: 'cap-spread', msg: 'Your recent velocity varies a lot.', fix: 'Plan nearer the low end of the range, and ask in the retro what made the difference.',
        example: cap({ velocity: '18, 30, 33' }), good: cap({}) },
      { id: 'cap-low', msg: 'This sprint has under 80% of normal capacity.', fix: 'Tell the Product Owner before planning, with the reason (leave, holidays, on-call), and plan a smaller forecast. A smaller plan you meet beats a normal plan you miss.',
        example: cap({ people: [{ name: 'Asha', leave: '5', oncall: '0', alloc: '100' }, TEAM[1]] }), good: cap({}) },
      { id: 'cap-focus-high', msg: 'A focus factor above 85% is rare.', fix: 'Meetings, reviews and support take a share of every day. Use your team\'s measured number, or about 70%.',
        example: cap({ focus: '0.95' }), good: cap({}) },
      { id: 'cap-leave-over', msg: 'Days off and holidays add up to more than the sprint.', fix: 'Check the numbers for this person: days off should count only working days inside this sprint.',
        example: cap({ holidays: '2', people: [{ name: 'Asha', leave: '9', oncall: '0', alloc: '100' }, TEAM[1]] }), good: cap({}) }
    ],

    prd: [
      { id: 'prd-no-text', msg: 'No PRD text yet.', fix: 'Paste the PRD, the ticket or the message that describes the work. Even one paragraph has questions in it.',
        example: prd({ text: '' }), good: prd({}) },
      { id: 'prd-no-pm', msg: 'Nobody named to send the questions to.', fix: 'Name the person who can answer: usually the Product Manager or Product Owner. A question with no owner gets no answer.',
        example: prd({ pm: '' }), good: prd({}) },
      { id: 'prd-no-reply-by', msg: 'No date for the answers.', fix: 'Say when you need them, and why: "by Wed 11 Nov, so the estimate can go out on Thu 12 Nov." A date makes questions urgent without making them pushy.',
        example: prd({ replyBy: '' }), good: prd({}) },
      { id: 'prd-no-problem', msg: 'The PRD never says why: no problem, no "so that", no "because".', fix: 'Ask what problem it solves and for whom. Knowing the problem often shows a smaller solution, and it settles half the other questions.',
        example: prd({ text: [MEASURE, SCOPE].join('\n') }), good: prd({}) },
      { id: 'prd-no-measure', msg: 'No success measure: nothing says how anyone will know it worked.', fix: 'Ask which number should move, from what to what, by when: "refund calls drop from 1,200 to 400 a week."',
        example: prd({ text: [WHY, SCOPE].join('\n') }), good: prd({}) },
      { id: 'prd-no-scope', msg: 'Nothing is out of scope.', fix: 'Ask what the first release leaves out. A PRD with no "not in this release" grows until the date slips.',
        example: prd({ text: [WHY, MEASURE].join('\n') }), good: prd({}) }
    ],

    standup: [
      { id: 'su-no-team', msg: 'No team yet.', fix: 'Add one name per line: everyone who comes to the stand-up.',
        example: standup({ team: '' }), good: standup({}) },
      { id: 'su-duplicate', msg: 'The same name is in the team twice.', fix: 'Each name once: the notes and yesterday\'s promises are kept by name.',
        example: standup({ team: 'Asha\nRahul\nasha' }), good: standup({}) },
      { id: 'su-timebox', msg: 'Longer than 15 minutes.', fix: 'The Daily Scrum is 15 minutes, whatever the team size. If it needs longer, the extra is a meeting of its own: park it.',
        example: standup({ minutes: '30' }), good: standup({}) },
      { id: 'su-big-team', msg: 'More than 10 people.', fix: 'Each person gets about a minute. The Scrum Guide puts a Scrum Team at 10 people or fewer; walk the board instead of the people, or split the team.',
        example: standup({ team: 'A1\nA2\nA3\nA4\nA5\nA6\nA7\nA8\nA9\nA10\nA11' }), good: standup({}) },
      { id: 'su-stuck', msg: 'The same promise three stand-ups running.', fix: 'Talk to them after the stand-up, privately and curiously: what is left, what is in the way, what would help? Three days of the same words usually means stuck, not slow.',
        example: standup({ history: SAME }), good: standup({ history: MOVING }) },
      { id: 'su-park-no-who', msg: 'A parked topic with nobody named.', fix: 'A parking-lot topic happens only when it has its people and a time: "Divya, Sameer and I, right after stand-up."',
        example: standup({ history: [meeting('2026-11-04', { Asha: 'Refund tests' }, [{ topic: 'Retry limits', who: '' }])] }), good: standup({}) }
    ],

    templates: [
      { id: 'tpl-missing', msg: 'A required part is empty.', fix: 'Fill it in, or say plainly that you don\'t know yet and when you will. An empty part shows in the text as [its name].',
        example: tpl({ decision: '' }), good: tpl({}) },
      { id: 'tpl-no-date', msg: 'This part needs a date.', fix: 'Give a day the reader can plan on: "Wed 11 Nov, 5 pm", not "before the sale".',
        example: tpl({ by: 'before the sale' }), good: tpl({}) },
      { id: 'tpl-vague', msg: 'Vague wording.', fix: 'The same words the status checker flags: name the thing, the number or the day instead.',
        example: tpl({ impact: 'There will be some issues with the release.' }), good: tpl({}) }
    ],

    oneonone: [
      { id: 'oo-no-people', msg: 'No people yet.', fix: 'Add each person who reports to you, with how often you meet: weekly is the usual rhythm, fortnightly at the least.',
        example: { today: '2026-11-12', people: [] }, good: oo({}) },
      { id: 'oo-overdue', msg: 'No 1:1 for longer than your rhythm allows.', fix: 'Book it today, even for 15 minutes. A 1:1 that slips once becomes a 1:1 that stops, and people notice which meetings you protect.',
        example: oo({ log: [held('2026-10-22', 'growth'), held('2026-10-15', 'open')] }), good: oo({}) },
      { id: 'oo-status-topic', msg: 'A status topic on the agenda.', fix: 'Status belongs in the stand-up or on the board. Ask about them instead: what is hard, what would help, what they want to grow into.',
        example: oo({ agenda: [{ text: 'Status of the refund API', from: 'me', cat: '' }] }), good: oo({}) },
      { id: 'oo-action-no-date', msg: 'An action with no date.', fix: 'Give each action a day. Your own actions matter most: a promise from a 1:1 that you forget teaches people that 1:1s change nothing.',
        example: oo({ actions: [{ what: 'Share the system design course link', who: 'me', by: '', done: false }] }), good: oo({}) },
      { id: 'oo-action-overdue', msg: 'An open action is past its date.', fix: 'Raise it first in the next 1:1: done, dropped, or a new date. Say so plainly when it was yours.',
        example: oo({ actions: [{ what: 'Share the system design course link', who: 'me', by: '2026-11-09', done: false }] }), good: oo({}) },
      { id: 'oo-no-growth', msg: 'No growth topic in the last four 1:1s.', fix: 'Add a question from "Growth and career". People rarely raise their career themselves; when nobody asks, the first you hear of it is a resignation.',
        example: oo({ log: [held('2026-11-05', 'blockers'), held('2026-10-29', 'open'), held('2026-10-22', 'workload'), held('2026-10-15', 'open')] }), good: oo({}) }
    ],

    feedback: [
      { id: 'fb-missing', msg: 'A part is missing.', fix: 'Feedback needs all of it: who, the situation, the behaviour, the impact, and (to ask for a change) what you would like instead.',
        example: fb({ behaviour: '' }), good: fb({}) },
      { id: 'fb-no-when', msg: 'The situation does not say when.', fix: 'Name the moment: "In Tuesday\'s stand-up", "On PR #412", "Yesterday afternoon". A specific moment can\'t be argued with; "in meetings" can.',
        example: fb({ situation: 'In the stand-up' }), good: fb({}) },
      { id: 'fb-judging', msg: 'A judging word.', fix: 'Describe what they did, not who they are.',
        example: fb({ behaviour: 'you were careless with your updates' }), good: fb({}) },
      { id: 'fb-public', msg: 'Asking for a change in front of others.', fix: 'Ask for a change in private: a 1:1 or a quiet chat. In front of others, people defend their standing instead of listening. Praise can be public.',
        example: fb({ where: 'public' }), good: fb({}) },
      { id: 'fb-no-question', msg: 'No question to hear their side.', fix: 'Ask before you tell: "What makes it hard to give a date?" The reason is often not what you think, and it changes the help they need.',
        example: fb({ question: '' }), good: fb({}) },
      { id: 'fb-stale', msg: 'This happened more than two weeks ago.', fix: 'Give feedback within days, while both of you remember the moment. Saved-up feedback, at the appraisal, feels like an ambush.',
        example: fb({ on: '2026-10-20' }), good: fb({}) },
      { id: 'fb-one-thing', msg: 'More than one behaviour.', fix: 'One thing per conversation. Two or three at once feels like a case being built, and none of them gets the attention it needs.',
        example: fb({ behaviour: 'you said the payment work would be done soon\nyou came late to the review' }), good: fb({}) },
      { id: 'fb-log-balance', msg: 'Your log has only changes for this person, no praise.', fix: 'Notice what goes well too, and say it specifically. Someone who only hears what to fix stops listening, and it may not be the whole picture.',
        example: fb({ log: [logged('change'), logged('change')] }), good: fb({ log: [logged('change'), logged('change'), logged('praise')] }) }
    ],

    delegate: [
      { id: 'dl-missing', msg: 'A part of the brief is missing.', fix: 'A delegation needs the task, the person, what "done" means and the deadline. Without them it is a hope, not a handover.',
        example: dl({ outcome: '' }), good: dl({}) },
      { id: 'dl-vague-outcome', msg: 'The outcome is an activity, not a result.', fix: 'Say what is true when it is finished, so both of you can tell: "Multi-state invoices total correctly, with tests, deployed to staging."',
        example: dl({ outcome: 'Look into the GST issue.' }), good: dl({}) },
      { id: 'dl-deadline-past', msg: 'The deadline is before the start.', fix: 'Check the dates. If the work is already late, say so in the brief and agree a new date together.',
        example: dl({ deadline: '2026-10-30' }), good: dl({}) },
      { id: 'dl-no-checkin', msg: 'No check-in before a deadline more than three working days away.', fix: 'Agree at least one check-in halfway. Without one, the first time you see the work is when it is too late to change it, and that is when leads take work back.',
        example: dl({ cadence: 'end' }), good: dl({}) },
      { id: 'dl-level-high', msg: 'They are new to this work, and they decide alone.', fix: 'That is sink or swim. Start at Consult, Agree or Advise (levels 3 to 5) and raise the level as they show they can.',
        example: dl({ experience: 'new', level: '7' }), good: dl({}) },
      { id: 'dl-level-low', msg: 'They have done this before, and you still make the decisions.', fix: 'That is telling, not delegating. Let them decide, and ask them to tell you what they chose (Inquire, level 6).',
        example: dl({ experience: 'done', level: '1' }), good: dl({}) },
      { id: 'dl-no-why', msg: 'No reason why them.', fix: 'Say why you chose them: what they will learn, or why they are the right person. "Why me?" otherwise gets the answer "because nobody else wanted it".',
        example: dl({ why: '' }), good: dl({}) }
    ],

    rfc: [
      { id: 'rfc-missing', msg: 'A section of the design doc is empty.', fix: 'Reviewers need every part to judge the design: the problem, goals, non-goals, quality targets, the design, alternatives, risks and how it rolls out.',
        example: rfc({ problem: '' }), good: rfc({}) },
      { id: 'rfc-no-decider', msg: 'Nobody decides, or there is no date to decide by.', fix: 'Name one person who decides and the day they decide. Without both, a design doc collects comments for weeks and nothing gets built.',
        example: rfc({ decider: '' }), good: rfc({}) },
      { id: 'rfc-alternatives', msg: 'Fewer than two alternatives.', fix: 'Compare the design with at least two others, one of them doing nothing. A design compared with nothing cannot be judged.',
        example: rfc({ alternatives: [ALTS[0]] }), good: rfc({}) },
      { id: 'rfc-alt-downside', msg: 'An alternative has no downside, so it is not clear why you turned it down.', fix: 'Say what is bad about it, or why it loses to the design: reviewers will ask, and the next person will propose it again.',
        example: rfc({ alternatives: [Object.assign({}, ALTS[0], { bad: '' }), ALTS[1]] }), good: rfc({}) },
      { id: 'rfc-nfr-number', msg: 'A quality target has no number.', fix: 'Give the number and how it is measured: "under 300 ms for 95% of requests at 200 a second", "99.9% of requests succeed each month".',
        example: rfc({ nfrs: [{ quality: 'latency', target: 'Quick enough for the sale.' }] }), good: rfc({}) },
      { id: 'rfc-vague', msg: 'A goal or target uses a word each reader will read differently.', fix: 'Replace it with a number or a test that someone can check.',
        example: rfc({ goals: 'Checkout is fast and seamless.' }), good: rfc({}) },
      { id: 'rfc-no-rollback', msg: 'The rollout says nothing about undoing it.', fix: 'Say how to undo it in minutes: a feature flag to switch off, a rollback, the old path kept for a while. Most outages start with a change.',
        example: rfc({ rollout: 'Release to everyone on Monday morning.' }), good: rfc({}) }
    ],

    adr: [
      { id: 'adr-missing', msg: 'A part of the record is empty.', fix: 'A decision record needs its context, the criteria, the options, the decision and its consequences, so that someone who was not there can judge it.',
        example: adr({ context: '' }), good: adr({}) },
      { id: 'adr-not-active', msg: 'The decision is not written as "We will…".', fix: 'Write it in the active voice: "We will publish order events through Kafka." "It was decided" hides who decided, and reads like a suggestion.',
        example: adr({ decision: 'It was decided that Kafka is the best option.' }), good: adr({}) },
      { id: 'adr-one-option', msg: 'Only one option.', fix: 'Write down at least one option you turned down, and why. It is the first thing a newcomer will suggest.',
        example: adr({ options: [OPTS[0]] }), good: adr({}) },
      { id: 'adr-chosen', msg: 'No option is marked as chosen, or more than one is.', fix: 'Tick the one option the decision chose.',
        example: adr({ options: [Object.assign({}, OPTS[0], { chosen: false }), OPTS[1]] }), good: adr({}) },
      { id: 'adr-no-downside', msg: 'No bad consequences.', fix: 'Every decision has a cost. Write down what becomes harder or costs more, so the next person knows what you accepted on purpose.',
        example: adr({ bad: '' }), good: adr({}) },
      { id: 'adr-superseded', msg: 'Superseded, but by what?', fix: 'Name the record that replaces this one ("ADR-019"), so a reader can follow the decision to where it stands now.',
        example: adr({ status: 'superseded' }), good: adr({}) }
    ],

    postmortem: [
      { id: 'post-missing', msg: 'A section of the postmortem is empty.', fix: 'Every section answers a question readers will ask: what happened, how bad, when, why, how you found out, what went well and wrong, and what changes.',
        example: post({ summary: '' }), good: post({}) },
      { id: 'post-blame', msg: 'This blames a person.', fix: 'Describe what in the system made it possible. Blame teaches people to hide what they saw, and the next incident takes longer to understand.',
        example: post({ causes: 'Human error during the deployment.' }), good: post({}) },
      { id: 'post-no-time', msg: 'A line of the timeline has no time.', fix: 'Give each line a time, as HH:MM in your time zone. The times show where the minutes went.',
        example: post({ timeline: [Object.assign({}, PM_TL[0], { time: 'later' })].concat(PM_TL.slice(1)) }), good: post({}) },
      { id: 'post-no-marks', msg: 'The timeline does not mark when it started, when you knew, or when the impact stopped.', fix: 'Mark those three lines, so the postmortem can give the time to detect and the time to mitigate: the two numbers worth improving.',
        example: post({ timeline: [Object.assign({}, PM_TL[0], { mark: '' })].concat(PM_TL.slice(1)) }), good: post({}) },
      { id: 'post-action-owner', msg: 'An action has no owner or no date.', fix: 'Give each action one owner and a date, and put it in the backlog. An action without both is a wish, and the same outage comes back.',
        example: post({ actions: act({ owner: '' }) }), good: post({}) },
      { id: 'post-vague-action', msg: 'An action cannot be checked.', fix: 'Say what changes and how you will know it is done: "Alert when payment success is below 95% for 5 minutes", not "monitor closely".',
        example: post({ actions: act({ what: 'Monitor the payment job closely.' }) }), good: post({}) },
      { id: 'post-detect', msg: 'Customers or support found it first, and no action would detect it sooner.', fix: 'Add an action of the kind "detect": an alert on what customers felt, so next time you hear it from a graph, not from a customer.',
        example: post({ detection: 'A customer complained on Twitter 22 minutes after the release.' }), good: post({}) },
      { id: 'post-impact-number', msg: 'The impact has no number.', fix: 'Count it: how many customers, orders or payments, for how long, and what it cost. The size of the impact decides how much the actions deserve.',
        example: post({ impact: 'Many customers could not pay.' }), good: post({}) }
    ],

    techdebt: [
      { id: 'debt-no-items', msg: 'No items yet.', fix: 'Add the problems that slow the team down, each with the hours it loses a sprint and the days to fix it.',
        example: debt({ items: [] }), good: debt({}) },
      { id: 'debt-no-cost', msg: 'An item has no cost.', fix: 'Estimate the hours it loses a sprint: re-runs, workarounds, manual steps, time spent on the incidents it causes. A rough number is far better than none.',
        example: debt({ items: item({ hours: '' }) }), good: debt({}) },
      { id: 'debt-no-fix', msg: 'An item has no estimate to fix it.', fix: 'Estimate the days to fix it, so the payback can be worked out. Think in a range; put the likely number here.',
        example: debt({ items: item({ fix: '' }) }), good: debt({}) },
      { id: 'debt-slow-payback', msg: 'This item takes more than 13 sprints (about six months) to pay back, and its risk is not high.', fix: 'Leave it out of this plan, or make the case on risk instead of time saved. Fixing it first delays the items that pay back fast.',
        example: debt({ items: DEBT_ITEMS.concat([{ what: 'The old PDF library for invoices', hours: '2', fix: '10', risk: 'low', include: true }]) }), good: debt({}) },
      { id: 'debt-jargon', msg: 'Engineering words the person deciding cannot weigh.', fix: 'Say what it means for them: time, money, risk or speed, with a number.',
        example: debt({ why: 'Cleaner code and modern best practices.' }), good: debt({}) },
      { id: 'debt-no-ask', msg: 'No clear ask: who decides, or what share of the sprint you want.', fix: 'Name the person who decides, and ask for a share of each sprint (20% is common) rather than a sprint someday.',
        example: debt({ decider: '' }), good: debt({}) }
    ],

    journal: [
      { id: 'jr-missing', msg: 'Nothing under "What happened".', fix: 'Start with the facts: one moment from your week, as a camera would have seen it.',
        example: jr({ happened: '' }), good: jr({}) },
      { id: 'jr-no-next', msg: 'Nothing to do next time.', fix: 'A reflection that changes nothing is a diary. Write one action you could check: what, when, with whom.',
        example: jr({ next: '' }), good: jr({}) },
      { id: 'jr-no-why', msg: 'No "why it was different".', fix: 'The gap between what you expected and what happened is where the lesson is. One sentence is enough.',
        example: jr({ why: '' }), good: jr({}) },
      { id: 'jr-vague', msg: 'A "next time" you could not check.', fix: 'Write a specific action you control: what you will do, and when.',
        example: jr({ next: 'Next time I will try harder.' }), good: jr({}) },
      { id: 'jr-gap', msg: 'No entry for more than two weeks.', fix: 'Ten minutes on a Friday is enough. Pick one moment from this week and answer the four questions.',
        example: jr({ entries: [entry('2026-10-20', 'win')] }), good: jr({}) },
      { id: 'jr-no-wins', msg: 'Your last five entries are all lessons, with no win.', fix: 'Write down what went well too, and why: it is what you want to repeat on purpose, and a journal of only mistakes wears you down.',
        example: jr({ entries: ['2026-11-12', '2026-11-11', '2026-11-10', '2026-11-09', '2026-11-06'].map(function (d) { return entry(d, 'lesson'); }) }), good: jr({}) }
    ],

    plan90: [
      { id: 'p9-no-start', msg: 'No start date.', fix: 'Enter the day you started as lead (or will start): every phase and review date is worked out from it.',
        example: p9({ start: '' }), good: p9({}) },
      { id: 'p9-no-manager', msg: 'No manager named.', fix: 'A 30-60-90 plan is an agreement with your manager. Name them, and agree the plan in your next 1:1.',
        example: p9({ manager: '' }), good: p9({}) },
      { id: 'p9-empty-phase', msg: 'A phase has nothing in it.', fix: 'Give every phase at least one item, even a small one: an empty phase is usually where the plan slips.',
        example: p9({ p2: [] }), good: p9({}) },
      { id: 'p9-too-many', msg: 'More than six items in one phase.', fix: 'Keep the three to five that matter most. A plan with ten items a month is a list of wishes, and you will be judged on what you leave undone.',
        example: p9({ p3: many(7) }), good: p9({}) },
      { id: 'p9-no-measure', msg: 'An item has no "done means".', fix: 'Say how you and your manager will know it is done, with a number or a date: "every person met by day 15".',
        example: p9({ p2: [Object.assign({}, P9_DELIVER, { measure: '' })] }), good: p9({}) },
      { id: 'p9-vague', msg: 'A "done means" that describes activity, not a result.', fix: 'Write what will be true when it is done, not what you will be doing.',
        example: p9({ p2: [Object.assign({}, P9_DELIVER, { measure: 'Look into the flaky tests' })] }), good: p9({}) },
      { id: 'p9-learn-first', msg: 'Days 1 to 30 have nothing to learn.', fix: 'Start by understanding the system and the work: the architecture, the last incidents, what has been promised. Changes made before you understand them break what mattered.',
        example: p9({ p1: [P9_PEOPLE] }), good: p9({}) },
      { id: 'p9-people-first', msg: 'Days 1 to 30 have nothing about the people.', fix: 'Add a first 1:1 with everyone on the team, and a conversation with your manager about what success at day 90 looks like.',
        example: p9({ p1: [P9_LEARN] }), good: p9({}) }
    ]
  };
})(window.LELT);
