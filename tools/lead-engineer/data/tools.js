/*
 * tools.js - the working tools for the real job. Each entry here has a screen in
 * js/views/tools/<id>.js that registers itself as LELT.tools[id].
 *
 *   {id, title, track, summary, why: why a lead needs it (Markdown), keywords}
 */
(function (U) {
  'use strict';
  U.data.tools = [
    {
      id: 'status',
      title: 'Status update builder',
      track: 'pm',
      summary: 'Write a status update that answers "when?" before anyone asks. A checker flags "in progress", "almost done", "soon", a Green status with a blocker, and next steps without a date.',
      why: 'A status update exists so that someone else can make a decision without calling you. "In progress" gives them nothing to decide with. ' +
        'A good update says what is done, what comes next and by when, how sure you are, what blocks you, and what you need from whom. ' +
        'See [[scenario:status-in-progress]] and [[scenario:bad-news-early]].',
      keywords: ['status', 'update', 'report', 'rag', 'red amber green', 'in progress', 'weekly report', 'progress', 'bluf']
    },
    {
      id: 'estimate',
      title: 'Estimation workbench',
      track: 'pm',
      summary: 'Break the work into tasks with best, likely and worst cases, add the work people forget, and get P50 and P85 dates from a simulation, with a message ready to send.',
      why: 'A single number from your gut becomes a commitment the moment someone writes it down. A range from a breakdown, with its assumptions and a plan to narrow it, is something people can plan with. ' +
        'The workbench does the arithmetic (PERT and a Monte Carlo simulation) so you can spend your time on the breakdown, which matters more. ' +
        'See [[scenario:estimate-from-one-line]] and [[explainer:monte-carlo]].',
      keywords: ['estimate', 'estimation', 'monte carlo', 'pert', 'three-point', 'p50', 'p85', 'range', 'forecast', 'how long', 'focus factor']
    },
    {
      id: 'deadline',
      title: 'Deadline negotiator',
      track: 'pm',
      summary: 'Someone wants it by a date. See where the ask sits against your estimate, lay out the options (a smaller slice, a later date, more people, pausing other work) and write the reply.',
      why: 'When a manager asks for a date your estimate can\'t meet, "yes" burns the team and "impossible" burns trust. The answer that works is options: what fits by the date, what the full scope needs, and what more people would and would not change. ' +
        'The person who owns the priority then chooses. See [[scenario:one-week-ask]] and [[explainer:iron-triangle]].',
      keywords: ['deadline', 'negotiate', 'push back', 'one week', 'options', 'scope', 'date', 'more people', 'brooks', 'say no']
    },
    {
      id: 'prioritise',
      title: 'Prioritisation tool',
      track: 'pm',
      summary: 'Sort competing asks three ways (Eisenhower, MoSCoW, cost of delay) and write "If A goes first, B moves to…" for the person who decides.',
      why: 'When everything is urgent, your job is not to choose behind closed doors or to do everything at once. It is to make the trade-off visible, with dates and costs, and let the person who owns both priorities decide. ' +
        'See [[scenario:two-urgent-asks]] and [[lesson:interruptions]].',
      keywords: ['prioritise', 'prioritize', 'priority', 'urgent', 'important', 'eisenhower', 'moscow', 'must have', 'cost of delay', 'cd3', 'wsjf', 'everything urgent']
    },
    {
      id: 'dependencies',
      title: 'Dependency and stakeholder map',
      track: 'pm',
      summary: 'What you need from other teams, from whom and by when; who your stakeholders are on a power and interest grid; RACI; the request and the joint escalation, written for you.',
      why: 'Most late projects are late waiting for someone else. A dependency with a named person, a date and a written "yes" rarely surprises you; one that says "the platform team" usually does. ' +
        'And the stakeholder you forgot is the one who blocks the release. See [[scenario:team-never-replies]] and [[lesson:managing-dependencies]].',
      keywords: ['dependency', 'dependencies', 'other team', 'stakeholder', 'stakeholders', 'raci', 'power interest', 'escalation', 'escalate', 'cross-team']
    },
    {
      id: 'raid',
      title: 'Risk register (RAID log)',
      track: 'pm',
      summary: 'Risks, assumptions, issues and dependencies, each with an owner, a date and a next action; scores, a heat map, and the top risks for your status update.',
      why: 'A risk you write down early, with an owner and an action, is cheap. The same risk discovered when it happens is an incident and a missed date. ' +
        'A RAID log reviewed every week is how a lead raises bad news early without it sounding like panic. See [[lesson:risks-raid]] and [[scenario:key-person-resigns]].',
      keywords: ['risk', 'risks', 'raid', 'raid log', 'risk register', 'assumption', 'issue', 'mitigation', 'heat map', 'likelihood', 'impact']
    },
    {
      id: 'capacity',
      title: 'Sprint capacity calculator',
      track: 'pm',
      summary: 'Leave, holidays, on-call and part-time people against your recent velocity: this sprint\'s capacity, a forecast range, and a note for Sprint Planning.',
      why: 'Planning the usual number of points in a sprint with three people on leave is how teams miss sprints they could have predicted. ' +
        'Capacity is arithmetic; the hard part is saying it before planning, not after. See [[scenario:festive-sprint]] and [[lesson:sprint-planning]].',
      keywords: ['capacity', 'sprint capacity', 'velocity', 'leave', 'holiday', 'on-call', 'focus factor', 'sprint planning', 'availability']
    },

    /* ---------- batch 3: communication and requirements ---------- */
    {
      id: 'prd',
      title: 'PRD question generator',
      track: 'comms',
      summary: 'Paste a PRD. Vague words such as "fast", "all", "etc." and "intuitive" are marked, each becomes a clear question, and you get one grouped message for the Product Manager.',
      why: 'Every vague word in a PRD is a decision someone will make later, usually the developer at 11 pm. Asking early is part of the job, not a cost to the PM, and grouped questions with a proposal get answered faster than a trickle of "one more question". ' +
        'The words it flags come from requirements-engineering practice. See [[scenario:vague-prd]] and [[lesson:requirements-prd]].',
      keywords: ['prd', 'prd questions', 'requirements', 'vague requirements', 'clarifying questions', 'product requirements', 'spec', 'ambiguity', 'questions for pm', 'acceptance criteria']
    },
    {
      id: 'standup',
      title: 'Stand-up facilitator',
      track: 'scrum',
      summary: 'Run the Daily Scrum: random order, a 15-minute clock with a share per person, yesterday\'s promise next to today\'s, prompts when an update says nothing, a parking lot, and notes to send.',
      why: 'A stand-up that is "update, next, update, next" misses the work that is stuck. Seeing yesterday\'s promise next to today\'s makes "same as yesterday" visible without anyone having to accuse anyone, and the prompts give you the follow-up question to ask. ' +
        'See [[lesson:daily-scrum]] and [[scenario:standup-move-on]].',
      keywords: ['stand-up', 'standup', 'daily scrum', 'daily standup', 'stand-up timer', 'timer', 'parking lot', 'meeting notes', 'random order', 'facilitate']
    },
    {
      id: 'templates',
      title: 'Message templates',
      track: 'comms',
      summary: 'Fill-in templates for the messages a lead sends most: a project kickoff, an escalation, a request to another team and a weekly status. Each part says why it is there.',
      why: 'The hard messages are hard because they have to carry a lot in a few lines: the decision, the date, the options, the ask. A template that already has the parts lets you spend your attention on the facts. ' +
        'See [[scenario:skip-the-kickoff]] and [[lesson:bluf-writing]].',
      keywords: ['template', 'templates', 'kickoff', 'kick-off', 'escalation', 'escalate', 'dependency request', 'weekly status', 'weekly report', 'email template', 'message']
    },

    /* ---------- batch 4: people ---------- */
    {
      id: 'oneonone',
      title: '1:1 planner',
      track: 'people',
      summary: 'Keep regular 1:1s with each person: their topics first, questions that go beyond status, actions that carry over until they are done, private notes, and a history. Flags 1:1s that have slipped.',
      why: 'A 1:1 is the one meeting that belongs to the other person. It is where you hear about the blocker they would not mention in a stand-up, the stress before it becomes a resignation, and the career goal before it becomes an offer from another company. ' +
        'It is also the first meeting a busy lead cancels. The planner keeps the rhythm visible and the agenda theirs. See [[lesson:one-on-ones]] and [[scenario:cancelled-one-on-ones]].',
      keywords: ['1:1', '1:1s', 'one on one', 'one-on-one', 'one to one', '1-on-1', 'check-in', 'agenda', '1:1 questions', 'career', 'actions', 'notes']
    },
    {
      id: 'feedback',
      title: 'Feedback composer',
      track: 'people',
      summary: 'Write feedback as Situation, Behaviour and Impact, with the question you ask first. A checker flags judging words such as "lazy", "always" and "attitude", feedback given in public, and feedback weeks too late.',
      why: 'Feedback changes behaviour when it describes what someone did and its effect, in private, soon after, with a real question about their side. It fails when it judges who they are: "careless", "unprofessional", "you always". ' +
        'Most of the skill is in the words, and the words are easier to get right before the conversation than during it. See [[lesson:feedback-sbi]] and [[scenario:harsh-reviewer]].',
      keywords: ['feedback', 'sbi', 'situation behaviour impact', 'situation behavior impact', 'praise', 'criticism', 'give feedback', 'judging words', 'difficult conversation', 'recognition', 'feedback log']
    },
    {
      id: 'delegate',
      title: 'Delegation planner',
      track: 'people',
      summary: 'Hand over work with a clear outcome, a deadline, how much they decide (one of seven levels) and check-in dates that fit their experience. Writes the brief, and flags "look into it" and sink-or-swim delegation.',
      why: 'Delegating is not "can you look into this?" and it is not watching over someone\'s shoulder. It is a clear result, the authority to get there, help when it is needed, and check-ins agreed up front, so you never have to hover or rescue. ' +
        'The seven levels are Jurgen Appelo\'s, from Management 3.0. See [[lesson:delegation-levels]] and [[scenario:doing-it-myself]].',
      keywords: ['delegate', 'delegation', 'delegation levels', 'delegation poker', 'hand over', 'handover', 'ownership', 'check-ins', 'brief', 'empower', 'micromanage', 'micromanaging']
    },

    /* ---------- batch 5: engineering and architecture ---------- */
    {
      id: 'rfc',
      title: 'Design doc (RFC) builder',
      track: 'arch',
      summary: 'Write a design doc reviewers can decide on: the problem, goals and non-goals, quality targets with numbers, alternatives with their downsides, risks, rollout and rollback. Writes the review request with a decider and a date.',
      why: 'A design argued out on a call is decided by whoever talks best, and forgotten by the next quarter. A short written design, sent before the review, lets people find the problems while they are still cheap to fix, and a named decider with a date stops it sitting in review for six weeks. ' +
        'See [[lesson:rfcs-and-adrs]], [[lesson:design-reviews]] and [[scenario:rfc-stuck-in-review]].',
      keywords: ['rfc', 'design doc', 'design document', 'technical design', 'tdd', 'proposal', 'design review', 'alternatives', 'non-goals', 'rollback', 'architecture document']
    },
    {
      id: 'adr',
      title: 'Decision record (ADR) builder',
      track: 'arch',
      summary: 'Record an architecture decision in Michael Nygard\'s format: the context, the criteria, the options with their good and bad points, the decision ("We will…") and its consequences, including the costs you accepted.',
      why: 'Six months after a decision, the people who made it have moved on and the reasons have gone with them. A one-page record of what was decided, what was turned down and why stops the same debate from happening again, and tells a newcomer when the decision should be reopened. ' +
        'See [[lesson:rfcs-and-adrs]] and [[scenario:why-did-we-choose-kafka]].',
      keywords: ['adr', 'adrs', 'architecture decision record', 'decision record', 'decision log', 'nygard', 'madr', 'why did we choose', 'consequences', 'trade-off']
    },
    {
      id: 'postmortem',
      title: 'Postmortem builder',
      track: 'eng',
      summary: 'Write a blameless postmortem: impact with numbers, a timeline that gives the time to detect and to mitigate, causes in the system rather than in a person, and actions with an owner and a date. Flags "human error", "should have" and "be more careful".',
      why: 'An incident costs you once. A postmortem that blames someone costs you again: the next time, people hide what they saw. A blameless one, with actions that change the system and an owner and a date for each, is how the same outage does not happen twice. ' +
        'See [[lesson:incidents]], [[playbook:incident]] and [[scenario:same-incident-twice]].',
      keywords: ['postmortem', 'post-mortem', 'blameless', 'incident review', 'rca', 'root cause', 'root cause analysis', 'incident report', 'action items', 'time to detect', 'mttr', 'outage']
    },
    {
      id: 'techdebt',
      title: 'Tech-debt business case',
      track: 'eng',
      summary: 'Turn "we need to refactor" into numbers a Product Owner can decide on: the hours each problem loses a sprint, the days to fix it, when it pays back, and a plan for a share of each sprint. Writes the ask, and flags engineering jargon.',
      why: '"We need a sprint for tech debt" loses to every feature, because it names the work, not the gain. "Three days on the flaky tests saves twelve hours a sprint, so it pays back in two sprints" is a business decision someone can say yes to. ' +
        'See [[lesson:tech-debt]] and [[scenario:no-time-for-tech-debt]].',
      keywords: ['tech debt', 'technical debt', 'debt', 'business case', 'refactor', 'refactoring', 'payback', 'roi', '20%', 'twenty percent', 'legacy', 'clean up']
    },

    /* ---------- batch 6: practice and growth ---------- */
    {
      id: 'journal',
      title: 'Reflection journal',
      track: 'leadership',
      summary: 'Ten minutes a week with the After Action Review\'s four questions: what you expected, what happened, why it was different, and what you will do next time. Flags "try harder" and "they should", and keeps your entries.',
      why: 'Experience teaches only when you stop to look at it. Two leads with the same five years can have learned very different amounts, and the difference is usually a habit of reflecting, with a "next time" specific enough to check. ' +
        'Your entries stay in this browser. See [[lesson:reflection-and-growth]].',
      keywords: ['journal', 'reflection', 'reflect', 'diary', 'after action review', 'aar', 'lessons learned', 'what went well', 'weekly review', 'self-improvement', 'learning log']
    },
    {
      id: 'plan90',
      title: '30-60-90 day plan builder',
      track: 'leadership',
      summary: 'Plan your first 90 days as a lead: learn and meet people in the first 30, contribute by 60, lead by 90. Suggestions for each phase, a "done means" for each item, review dates, and the message to agree it with your manager.',
      why: 'You are judged long before you have done much, and the most common way to fail in a new role is changing things before you understand them. A short written plan, agreed with your manager, turns their expectations into something you can both check. ' +
        'See [[lesson:first-90-days]] and [[scenario:first-week-as-lead]].',
      keywords: ['30-60-90', '30 60 90', '90 day plan', 'first 90 days', '90 days', 'new lead', 'new role', 'onboarding plan', 'first month', 'plan', 'early win', 'watkins']
    }
  ];
})(window.LELT);
