/*
 * quizzes-people.js - the questions at the end of each People management lesson, keyed by lesson id
 * (same format as quizzes.js: {q, choices, answer: index of the right choice, why}).
 */
(function (U) {
  'use strict';
  U.data.quizzes = U.data.quizzes || {};
  Object.assign(U.data.quizzes, {

    'one-on-ones': [
      { q: 'According to Andy Grove, whose meeting is a 1:1?',
        choices: ['The team member\'s: they set the agenda and tone', 'The lead\'s: it is for checking progress', 'HR\'s: it is a compliance step', 'Nobody\'s: it has no agenda'], answer: 0,
        why: 'Grove wrote in High Output Management that the 1:1 is the subordinate\'s meeting. Their topics come first.' },
      { q: 'A release is late and your week is packed. What do you do with this week\'s 1:1s?',
        choices: ['Move them to another slot this week', 'Cancel them: people will understand', 'Turn them into status checks on the release', 'Merge them into one team meeting'], answer: 0,
        why: 'Move, never cancel. Cancelled 1:1s tell people where they rank, and busy weeks are when problems hide.' },
      { q: 'A junior always answers "Any issues?" with "No issues". What works better?',
        choices: ['"What slowed you down this week that you didn\'t mention in stand-up?"', 'Asking "Any issues?" more firmly', 'Stopping their 1:1s, since there are no issues', 'Asking their buddy instead'], answer: 0,
        why: 'A specific, open question assumes there is something to say, which makes it easier to say it.' },
      { q: 'What should usually stay out of a 1:1?',
        choices: ['Ticket-by-ticket status', 'Their career goals', 'Feedback for you', 'Their workload and wellbeing'], answer: 0,
        why: 'Status belongs on the board and in the stand-up. A 1:1 is for what those cannot reach.' }
    ],

    'feedback-sbi': [
      { q: 'Which is an observation rather than a judgment?',
        choices: ['"You joined at 10:20 on Monday and Wednesday."', '"You\'re always late."', '"You don\'t respect the team\'s time."', '"You\'re unprofessional about meetings."'], answer: 0,
        why: 'An observation is what a camera would record. It can be discussed; a judgment can only be denied.' },
      { q: 'In SBI, what does the I stand for, and what goes there?',
        choices: ['Impact: the effect on the work or on people', 'Intent: why they did it', 'Improvement: what they must change', 'Issue: the label for the problem'], answer: 0,
        why: 'Situation, Behaviour, Impact. You know the effect; you do not know their intent, so you ask about it.' },
      { q: 'You have described the situation, behaviour and impact. What comes next?',
        choices: ['A real question about their side', 'The consequences if it happens again', 'Two more examples to prove the point', 'Praise, to soften it'], answer: 0,
        why: 'Ask before you tell. The reason is often not what you think, and it changes what you ask for.' },
      { q: 'Kim Scott calls staying quiet to keep the peace "ruinous empathy". Why ruinous?',
        choices: ['The person never learns, and finds out late, when it costs more', 'It makes the lead look weak', 'It breaks company policy', 'It is ruinous only for senior people'], answer: 0,
        why: 'Kindness that withholds the truth leaves the person to fail, usually discovering the problem at appraisal time.' }
    ],

    'praise-and-credit': [
      { q: 'Which praise is most useful?',
        choices: ['"Your rollback script let us undo the release in two minutes."', '"Great job, as always!"', '"Thanks for everything you do."', '"Good work this Sprint, team."'], answer: 0,
        why: 'Specific praise says what to repeat and why it mattered.' },
      { q: 'Your manager praises "your" successful release in the leadership channel. What do you reply?',
        choices: ['Thank them and name the people who built it', 'Thank them; it was your plan, after all', 'Say nothing, to stay modest', 'Point out what nearly went wrong'], answer: 0,
        why: 'Credit flows down, by name. The team always finds out who took the credit.' },
      { q: 'Why write praise down as well as saying it?',
        choices: ['At appraisal time, memory favours the last month and the loudest people', 'Because HR requires it', 'So you can repeat the same words later', 'It is not useful to write it down'], answer: 0,
        why: 'A written log keeps the quiet, early and offshore contributions from being forgotten.' }
    ],

    'receiving-feedback': [
      { q: 'Your team says nothing when you ask "Any feedback for me?". What does it most likely mean?',
        choices: ['They are not comfortable telling their lead, or the question is too vague', 'You are doing everything right', 'They do not care', 'They will tell your manager instead'], answer: 0,
        why: 'Feedback about the lead is scarce. Ask specific questions in 1:1s, and react well to the first answer.' },
      { q: 'Someone tells you that you cut people off in design reviews. What do you say first?',
        choices: ['"Thanks for telling me. Can you give me an example?"', '"That\'s because the reviews run long."', '"Who else thinks so?"', '"I don\'t think that\'s fair."'], answer: 0,
        why: 'Thank them, then understand. Explaining or defending ends the feedback, and the next feedback.' },
      { q: 'What makes people keep giving you feedback?',
        choices: ['Seeing that it changed something, and being told so', 'An anonymous form', 'Asking only once a year', 'Agreeing with everything they say'], answer: 0,
        why: 'Closing the loop ("you told me X; I changed Y") shows that feedback is worth the risk.' }
    ],

    'delegation-levels': [
      { q: 'Which is a delegated outcome rather than an activity?',
        choices: ['"Multi-state invoices total correctly, with tests, by Friday."', '"Look into the GST bug."', '"Help Divya with the invoices."', '"Work on the GST issue this week."'], answer: 0,
        why: 'An outcome says what is true when it is done, so both of you can tell when it is finished.' },
      { q: 'At Appelo\'s level 6, Inquire, who decides?',
        choices: ['They decide, then tell you what and why', 'You decide after hearing them', 'You decide together', 'They decide and you never hear about it'], answer: 0,
        why: 'Level 6: they decide and inform you. Level 3 is Consult, level 4 is Agree, level 7 is Delegate.' },
      { q: 'A senior developer has never worked on the invoice service. What level fits a task there?',
        choices: ['A lower level at first, raised as they show they can', 'Level 7: they are senior', 'Level 1: tell them exactly what to do', 'It does not matter'], answer: 0,
        why: 'Match the level to their experience of this task, not their title.' },
      { q: 'The delegated task is going badly two days before the deadline. What do you do?',
        choices: ['Ask what they would try next and what they need', 'Take it back and finish it yourself', 'Give it to someone faster', 'Wait and see on the deadline'], answer: 0,
        why: 'Taking work back teaches everyone that your delegation is temporary. Coach them through it.' }
    ],

    'psychological-safety': [
      { q: 'What did Amy Edmondson find about the better hospital teams she studied?',
        choices: ['They reported more errors, because it was safe to', 'They made no errors', 'They had stricter managers', 'They hid errors better'], answer: 0,
        why: 'Safe teams talk about mistakes, so they can learn from them. Fewer reported errors can mean more hidden ones.' },
      { q: 'Psychological safety plus low standards gives what, in Edmondson\'s 2 x 2?',
        choices: ['A comfort zone', 'A learning zone', 'An anxiety zone', 'A high-performing team'], answer: 0,
        why: 'Safety without standards is comfortable but not productive. You want high safety and high standards.' },
      { q: 'In a design discussion, when should the lead give their opinion?',
        choices: ['Last, after the others', 'First, to save time', 'Never', 'Only if asked by a senior'], answer: 0,
        why: 'Speaking last stops your view from anchoring everyone else\'s, especially in a hierarchical team.' },
      { q: 'A junior\'s change caused an incident. Which question makes the team safer?',
        choices: ['"What made this easy to get wrong?"', '"Who approved this pull request?"', '"Why didn\'t you test it?"', '"How do we make sure you don\'t do it again?"'], answer: 0,
        why: 'Blameless questions fix the system and keep people reporting problems.' }
    ],

    'growth-conversations': [
      { q: 'A developer asks when they will be promoted. You do not control the decision. What do you say?',
        choices: ['Show what the next level looks like, and offer to build a plan towards it', '"In April, for sure."', '"That\'s up to HR."', '"Focus on your work and it will come."'], answer: 0,
        why: 'Never promise what you do not control; make the path visible and help them walk it.' },
      { q: 'What are the three parts of Kim Scott\'s career conversation?',
        choices: ['Their story, their dreams, the next 18 months', 'Strengths, weaknesses, rating', 'Salary, title, team', 'Past, present, appraisal'], answer: 0,
        why: 'Understanding what drives someone comes before any plan.' },
      { q: 'A strong developer wants to stay a hands-on expert, not become a manager. What do you do?',
        choices: ['Support a growth path in depth: harder technical work and recognition', 'Push them towards management anyway', 'Treat it as a lack of ambition', 'Stop giving them growth goals'], answer: 0,
        why: 'Steady experts are as valuable as fast climbers. Growth does not have to mean management.' }
    ],

    'struggling-performer': [
      { q: 'Someone has missed three commitments. What do you do first?',
        choices: ['Ask privately what is getting in the way', 'Start a formal improvement plan', 'Give their work to someone else', 'Raise it at the appraisal'], answer: 0,
        why: 'Diagnose first: skill, will or circumstances each need a different response.' },
      { q: 'What is the "set-up-to-fail syndrome"?',
        choices: ['A manager\'s low expectations lead to closer watching and less room, which makes the person do worse', 'Giving people work that is too hard', 'A plan with impossible goals', 'A team set up without a lead'], answer: 0,
        why: 'Manzoni and Barsoux showed how a manager\'s judgment can become self-fulfilling. Check your own behaviour first.' },
      { q: 'What should an improvement plan always include besides expectations?',
        choices: ['The support you will give, and dates to review it together', 'The consequences of failure', 'A list of past mistakes', 'A comparison with better performers'], answer: 0,
        why: 'Expectations without support and dates are a warning, not a plan.' }
    ],

    'hard-conversations': [
      { q: 'You have to tell someone their rating is lower than they expect. When do you say it?',
        choices: ['In the first two sentences, then explain', 'After ten minutes of what went well', 'At the end, if there is time', 'In an email afterwards'], answer: 0,
        why: 'Long warm-ups make people anxious and blur the message. Say it plainly, then explain and listen.' },
      { q: 'Two developers are fighting about a design in pull request comments. What do you do?',
        choices: ['Talk to each separately, then together about the options and how to decide', 'Tell them to sort it out between themselves', 'Pick the senior developer\'s design', 'Ignore it; conflict is healthy'], answer: 0,
        why: 'Move it from personal to the problem: options, trade-offs, and an agreed way and date to decide.' },
      { q: 'Stone, Patton and Heen say every difficult conversation is really three. Which three?',
        choices: ['What happened, feelings, and identity', 'Facts, opinions, and decisions', 'Past, present, and future', 'Problem, solution, and action'], answer: 0,
        why: 'Most people argue only about what happened. Acknowledging feelings and identity is what moves it.' }
    ],

    'onboarding-offboarding': [
      { q: 'What should a new joiner ideally have done by the end of week one?',
        choices: ['Shipped one small, real change with their buddy', 'Read all the documentation', 'Finished their first feature', 'Watched the training videos'], answer: 0,
        why: 'A small real change builds confidence and tests every step of your setup.' },
      { q: 'Your best developer resigns. What do you do first?',
        choices: ['Thank them and ask what made them decide, without arguing', 'Make a counter-offer on the spot', 'Remove their access straight away', 'Tell the team before talking to HR'], answer: 0,
        why: 'Listen first. Counter-offers are not yours alone, and the team is watching how you treat people who leave.' },
      { q: 'Which knowledge transfer works best?',
        choices: ['The new owner does the work while the leaver watches, weeks before the last day', 'A handover document written in the last two days', 'Recording every meeting', 'Asking the leaver to answer questions after they go'], answer: 0,
        why: 'Hand over by doing: it finds the gaps while the person who knows is still there to fill them.' }
    ]
  });
})(window.LELT);
