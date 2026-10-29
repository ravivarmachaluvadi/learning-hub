/*
 * quizzes-leadership.js - the questions at the end of each Leadership lesson, keyed by lesson id
 * (same format as quizzes.js: {q, choices, answer: index of the right choice, why}).
 */
(function (U) {
  'use strict';
  U.data.quizzes = U.data.quizzes || {};
  Object.assign(U.data.quizzes, {

    'engineer-to-lead': [
      { q: 'In Andy Grove\'s definition, what is a lead\'s output?',
        choices: ['The output of their team, plus the teams they influence', 'The code they write themselves', 'The number of meetings they run', 'Their own tickets closed each sprint'], answer: 0,
        why: 'Grove: a manager\'s output is the output of the organisation under them and the ones they influence. Unblocking three people can beat a day of your own code.' },
      { q: 'Which belief does Linda Hill find new managers start with, and have to unlearn?',
        choices: ['That their title gives them authority', 'That they should listen to their team', 'That trust takes time to build', 'That they should build a team, not only relationships'], answer: 0,
        why: 'Authority comes from trust in your judgement and character, earned person by person, not from the title.' },
      { q: 'Goleman found which two styles did the most harm to a team\'s climate?',
        choices: ['Pacesetting and coercive', 'Coaching and democratic', 'Affiliative and authoritative', 'Democratic and affiliative'], answer: 0,
        why: '"Keep up with me" and "do it because I say so" work briefly; over months people stop thinking and wait for the leader.' },
      { q: 'Where should a new lead\'s own coding usually sit?',
        choices: ['Off the critical path: tooling, spikes, small fixes, reviews', 'On the hardest ticket in every sprint', 'On whatever is most urgent that day', 'Nowhere: leads must stop coding completely'], answer: 0,
        why: 'If your code is what everyone waits for, your meetings block the team twice. Keep coding, but not where it makes you the bottleneck.' }
    ],

    'first-90-days': [
      { q: 'What should most of your first 30 days as a new lead be spent on?',
        choices: ['Learning the people, the system and the work, starting with a 1:1 with everyone', 'Announcing the changes you have planned', 'Taking the team\'s hardest tickets to prove yourself', 'Rewriting the team\'s processes'], answer: 0,
        why: 'Changing things before you understand them is the most common way to fail in a new role. Listen first, and write down the patterns.' },
      { q: 'Which of Watkins\' five conversations with your manager do new leads most often skip, and need most?',
        choices: ['Expectations: what would make day 90 a success', 'The situation as each of you sees it', 'Small talk about the weekend', 'Which tools the team uses'], answer: 0,
        why: 'Most new leads only discuss the situation. "What would make you say at day 90 that this went well?" tells you what you will be judged on.' },
      { q: 'What makes a good early win?',
        choices: ['A visible improvement the team asked for, finishable in a few weeks', 'The biggest change you can think of', 'A change only you care about', 'A new process announced on day one'], answer: 0,
        why: 'An early win builds credibility for bigger changes. Choosing one the team named makes it their win too.' },
      { q: 'In Watkins\' STARS model, what does "sustaining success" ask of a new lead?',
        choices: ['Learn what makes the team work before changing anything', 'Make fast, bold changes', 'Replace the senior people', 'Treat it as a turnaround'], answer: 0,
        why: 'A strong team is easy to break. A turnaround needs fast decisions; sustaining success needs care.' }
    ],

    'managing-up': [
      { q: 'The rule most managers name first is…',
        choices: ['No surprises: they hear bad news about your team from you, first', 'Always agree in meetings', 'Only bring good news', 'Send a status report every hour'], answer: 0,
        why: 'Hearing about a slip from a stakeholder first damages trust far more than the slip itself.' },
      { q: 'Your API is late. Which message does most for your manager?',
        choices: ['"The API is late. We can cut export or move the date a week; I recommend cutting export."', '"The API is late."', '"The API is late, but it\'s not our fault."', '"We\'re working on it."'], answer: 0,
        why: 'Options with a recommendation turn a problem into a decision, which is what your manager is there for.' },
      { q: 'After a missed date, your manager asks for updates four times a day. What usually works best?',
        choices: ['Agree a rhythm and format (a note at 5 pm, a call when something changes) and keep it perfectly', 'Tell them you feel micromanaged', 'Ask the team for status each time they ask', 'Answer less often so they get the message'], answer: 0,
        why: 'Constant requests usually mean lost confidence. A predictable rhythm restores it; complaining about it rarely does.' }
    ],

    'influence-without-authority': [
      { q: 'Cohen and Bradford describe influence without authority as mostly…',
        choices: ['Exchange: trading things each side values ("currencies")', 'Escalating to the other person\'s manager', 'Being the most senior person in the room', 'Repeating the request until they agree'], answer: 0,
        why: 'People help those who help them. Find what they value and are measured on, and make your ask move their goal too.' },
      { q: 'In the trusted advisor\'s trust equation, what lowers trust the most?',
        choices: ['High self-orientation: seeming to care only about your own goal', 'Asking questions', 'Admitting what you do not know', 'Keeping small promises'], answer: 0,
        why: 'Trust is credibility plus reliability plus intimacy, divided by self-orientation. Self-orientation divides everything else.' },
      { q: 'Why talk to the key people one by one before a big decision meeting?',
        choices: ['Surprised people attack proposals; shaped together, they support them', 'To avoid writing anything down', 'To make the meeting longer', 'So the director decides for you'], answer: 0,
        why: '"Pre-wiring" hears the concerns early, improves the proposal, and turns the meeting into a confirmation.' },
      { q: 'Which way of winning a yes usually costs you the relationship?',
        choices: ['Saying "everyone else has already agreed" when they have not', 'Offering to do some of the work yourself', 'Fitting the change to their release dates', 'Asking what they would need to support it'], answer: 0,
        why: 'False consensus or urgency works once. People remember being manipulated far longer than they remember the request.' }
    ],

    'visible-impact': [
      { q: 'Which of these describes impact, not effort?',
        choices: ['"Incidents went from 6 a month to 2"', '"I was online till midnight most days"', '"I attended every meeting"', '"I reviewed lots of pull requests"'], answer: 0,
        why: 'Impact is what changed, with a number. Effort is how hard it felt.' },
      { q: 'What is a brag document, in Julia Evans\' sense?',
        choices: ['A running list of what you did, why it mattered and what you learned', 'A boastful message to the whole company', 'Your CV', 'A list of other people\'s mistakes'], answer: 0,
        why: 'Updated every week or two, it means you have facts, not memories, when the review comes.' },
      { q: 'Your team shipped a big release. How do you credit them?',
        choices: ['Publicly and specifically: who did what, and its effect', '"The team did it", with no details', 'Mention only your own part', 'Say nothing; good work speaks for itself'], answer: 0,
        why: 'Specific credit is generous and gives your manager something to repeat. "The team did it" gives them nothing.' }
    ],

    'owning-mistakes': [
      { q: 'You approved a release that broke checkout. What comes first?',
        choices: ['Say it plainly and early: what happened, the effect, what you are doing and changing', 'Fix it quietly, then decide whether to mention it', 'Explain how busy the week was', 'Find out who wrote the bug'], answer: 0,
        why: 'Say it first, fast, and with the change. A mistake someone else discovers costs far more trust.' },
      { q: 'A stakeholder asks who caused the outage. What do you say?',
        choices: ['"My team missed it; here\'s what we\'re changing."', 'The developer\'s name', '"QA should have caught it."', '"It was nobody\'s fault, really."'], answer: 0,
        why: 'Own it to the outside, and look at the system inside the team, without blame.' },
      { q: 'Edmondson found the better-led hospital teams reported more errors. Why?',
        choices: ['They felt safer saying so, not that they made more', 'They were less skilled', 'They had more patients', 'Their managers punished every mistake'], answer: 0,
        why: 'Safety to speak up shows problems early. A lead who admits mistakes makes that normal.' },
      { q: 'Which ending to an apology is strongest?',
        choices: ['"I\'ve added the load test to the release checklist."', '"It will never happen again."', '"I feel terrible about this."', '"These things happen."'], answer: 0,
        why: 'A promise is not a change. A checklist step, a test or an alert is.' }
    ],

    'shielding-the-team': [
      { q: 'A director calls, angry about a date. What do you pass on to the team?',
        choices: ['The information: what changed, what it means for us, what we will do', 'The anger, so they understand how serious it is', 'Nothing at all, ever', 'A request to work the weekend'], answer: 0,
        why: 'Absorb the emotion, pass on the information. Panic without context makes people think worse.' },
      { q: 'Why is "the team will work the weekend" a poor answer to a date that moved?',
        choices: ['It is a loan against next month, paid back in bugs and tiredness', 'Weekends are illegal', 'It always works too well', 'The director will not notice'], answer: 0,
        why: 'Offer scope and date options instead. Overtime hides the trade-off and costs more later.' },
      { q: 'A reorganisation may affect your team, and you do not know the details yet. What do you say?',
        choices: ['"I don\'t know yet. I\'ll tell you by Friday, whatever the answer."', 'Nothing until it is final', '"Don\'t worry, nothing will change."', 'Pass on every rumour you hear'], answer: 0,
        why: 'People handle bad news better than uncertainty. Say what you know, what you don\'t, and when you will know.' }
    ],

    'making-decisions': [
      { q: 'In Bezos\'s terms, which is a two-way door?',
        choices: ['Choosing an HTTP client behind one interface', 'Choosing the primary database for every service', 'Signing a three-year vendor contract', 'Deleting customer data'], answer: 0,
        why: 'If it is cheap to undo, decide quickly and review. Save the long analysis for decisions you cannot walk back.' },
      { q: 'About how much of the information you wish you had did Bezos suggest is enough for most decisions?',
        choices: ['About 70%', 'About 30%', '100%', 'About 95%'], answer: 0,
        why: 'Waiting for 90% usually means deciding too slowly. Be more careful on one-way doors.' },
      { q: 'In RAPID, how many people hold the D?',
        choices: ['One', 'Everyone in the room', 'Two, to be safe', 'Whoever argues best'], answer: 0,
        why: 'Many arguments are really about who decides. Name the one decider, and the date, at the start.' },
      { q: 'What makes "disagree and commit" work?',
        choices: ['People were heard first, and their objection was written down', 'Nobody is allowed to object', 'The decision can be reopened any time', 'The most senior person always decides'], answer: 0,
        why: 'Commitment follows being heard. Then reopen a decision only when the facts change, not when someone keeps arguing.' }
    ],

    'your-calendar': [
      { q: 'Paul Graham\'s "maker\'s schedule" means…',
        choices: ['Makers need long blocks; one meeting can wreck an afternoon', 'Makers should attend every meeting', 'Managers need half-days for deep work', 'Meetings should be one hour long'], answer: 0,
        why: 'A manager\'s day is cut into hours; a maker\'s into half-days. A lead lives in both and has to protect both.' },
      { q: 'A meeting needs someone from your team, but not you. What do you do?',
        choices: ['Send someone, and ask for two lines afterwards', 'Go anyway, to stay informed', 'Decline and send nobody', 'Cancel the meeting'], answer: 0,
        why: 'It frees your time and is a growth chance for them. Agree it with the organiser first.' },
      { q: 'The week is overloaded. What should you cut last?',
        choices: ['Your 1:1s', 'Meetings where you only listen', 'Status calls a note could replace', 'Recurring meetings nobody remembers starting'], answer: 0,
        why: 'The 1:1 is where you hear about problems while they are small, and the meeting busy leads cancel first.' }
    ],

    'reflection-and-growth': [
      { q: 'What are the After Action Review\'s four questions?',
        choices: ['What did we expect, what happened, why the difference, what will we do next time', 'Who, what, when, where', 'What went well, what went badly, who is to blame, what next', 'Start, stop, continue, celebrate'], answer: 0,
        why: 'Expected, actual, why, next time: they work for one person as well as for a team.' },
      { q: 'Which "next time" is most useful?',
        choices: ['"I\'ll send the PM the open questions by Thursday, before planning."', '"I need to communicate better."', '"The PM should send requirements earlier."', '"I\'ll try harder."'], answer: 0,
        why: 'A good next time is a specific action you control and could check: what, when, with whom.' },
      { q: 'Kim Scott suggests asking for criticism how?',
        choices: ['With a specific question, then waiting through the silence', '"Any feedback for me?" at the end of a meeting', 'Only in the annual review', 'Through an anonymous survey only'], answer: 0,
        why: '"What\'s one thing I could do, or stop doing, that would make it easier to work with me?" gets real answers; "any feedback?" gets "all good".' }
    ]
  });
})(window.LELT);
