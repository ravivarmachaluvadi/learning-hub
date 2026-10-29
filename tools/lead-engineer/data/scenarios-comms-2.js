/*
 * scenarios-comms-2.js - communication scenarios added in batch 3: changes that reach one person,
 * a "yes" on a client call, a warning nobody read, silent refinement, a hijacked review, a question
 * you can't answer, disagreeing with a principal engineer, two PMs with two answers, a meeting that
 * never decides, public blame, skipping the kickoff, a promise from sales, a decision reversed,
 * "just build the mock-up", and explaining why a simple change takes three weeks.
 *
 * Same entry format as scenarios-pm.js (see the top of that file). Each decision has 3 or 4 options
 * and exactly one "best"; meters move from -2 to +2 per choice.
 */
(function (U) {
  'use strict';
  U.data.scenarios = U.data.scenarios || [];
  U.data.scenarios.push(

    /* ------------------------------------------------------------------ */
    {
      id: 'change-told-to-one-dev',
      track: 'comms',
      title: `The change only one developer heard`,
      summary: `The PM changed a rule on a call with one developer, and the story, the tests and the code now disagree. Practise finding out what was decided without blaming anyone, and making changes visible.`,
      keywords: ['requirement change', 'change', 'call', 'written', 'story', 'single source of truth', 'tester', 'pm', 'working agreement'],
      role: `You lead a five-person team building customer refunds.`,
      setting: `Thursday, two days before the Sprint Review. Kavya, the team's tester, comes to your desk.`,
      stakes: `Kavya's tests follow the story: refunds over ₹10,000 need an agent's approval. Arjun built them with no approval step, because Neha, the PM, told him on a call last week that Finance had dropped the rule. Nothing was written down.`,
      start: 'found',
      steps: {
        found: {
          lines: [{ who: 'Kavya, tester', say: `Large refunds go straight through with no approval. The story says they need one. Arjun says Neha changed it on a call. Which is right?` }],
          prompt: 'What do you do first?',
          options: [
            { text: `Ask Neha before deciding who is right: "Kavya found that large refunds skip approval, and Arjun says you changed the rule on a call. Can you confirm in writing which rule we ship, so the story, the tests and the code agree?"`,
              grade: 'best', meters: { trust: 1, delivery: 2, team: 1 }, next: 'confirmed',
              result: `Neha replies within the hour: "Yes, Finance dropped the approval step. Sorry, I told Arjun and forgot to update the story." You found the truth without accusing anyone.` },
            { text: `Tell Arjun to put the approval back. The story is the agreement.`,
              grade: 'poor', meters: { trust: -1, delivery: -2, team: -1 }, next: 'reverted',
              result: `The story is out of date. Arjun reverts working code to match a rule Finance already dropped, and he is annoyed that you didn't ask him why.` },
            { text: `Ask Arjun to show you his notes from the call.`,
              grade: 'ok', meters: { delivery: 1, team: -1 }, next: 'confirmed',
              result: `There are no notes; it was a call. Arjun feels checked up on. A few hours later you ask Neha anyway, and she confirms the change.` }
          ]
        },
        confirmed: {
          lines: [{ narrate: `The code is right; the story and Kavya's tests are out of date. It is the second time this month that a change has reached only one person.` }],
          prompt: 'How do you stop it happening again?',
          options: [
            { text: `Agree a simple rule with Neha and the team: a change is real when it is written on the story, with the date and who asked. Anyone told about a change on a call replies "please add it to the story" and posts it in the team channel. Bring it to the retro too.`,
              grade: 'best', meters: { trust: 1, delivery: 2, team: 2 },
              result: `Neha agrees: it protects her as much as the team. Within a sprint, changes arrive as story comments, and Kavya stops testing last week's requirements.` },
            { text: `Ask Neha to update the PRD whenever something changes.`,
              grade: 'ok', meters: { trust: 1, delivery: 1 },
              result: `Reasonable, but it puts the whole fix on one person, and the PRD is the last thing anyone updates. The team needs a habit too.` },
            { text: `Tell the team to take requirement changes from nobody but you.`,
              grade: 'poor', meters: { trust: -1, team: -2 },
              result: `You become the bottleneck for every change, and Neha feels you are putting a wall between her and the developers.` }
          ]
        },
        reverted: {
          lines: [
            { narrate: `Arjun puts the approval step back. The next day Neha sees the demo build.` },
            { who: 'Neha, PM', say: `Why is approval back? I told Arjun Finance dropped it.` }
          ],
          prompt: 'What do you say?',
          options: [
            { text: `"That's my mistake: I went by the story without asking you or Arjun. Arjun, sorry for the rework. Can we agree that changes go on the story with a date, so this can't happen again?"`,
              grade: 'best', meters: { trust: 1, delivery: 1, team: 1 },
              result: `Owning it quickly takes the heat out, and the fix to the process becomes everyone's idea.` },
            { text: `"The story said approval was needed."`,
              grade: 'ok', meters: { trust: -1 },
              result: `True, and it sounds like blaming Neha for the out-of-date story. She digs in.` },
            { text: `"Arjun should have told me about the change."`,
              grade: 'poor', meters: { trust: -1, team: -2 },
              result: `Arjun did what the PM asked. Blaming him in front of her teaches the team to keep changes from you.` }
          ]
        }
      },
      debrief: {
        points: [
          `When the story, the tests and the code disagree, find out what the person who owns the requirement decided before deciding who is wrong.`,
          `Ask with the facts, not an accusation: "Kavya found X; Arjun says you changed it. Can you confirm in writing?"`,
          `A change told to one person on a call isn't known to the team. Agree that a change is real when it is written on the story, with the date and who asked.`,
          `Give everyone a polite way to redirect: "Please add it to the story" is a reply anyone can give, even to a senior person.`
        ],
        script: `> "Kavya found that large refunds skip approval, and Arjun says you changed the rule on a call. Can you confirm in writing which rule we ship, so the story, the tests and the code agree? And can we agree that changes go on the story from now on?"`,
        analogy: `A requirement change told to one developer is a config change made by hand on one server. That server works; the others, the tests and the documentation disagree, and the next deploy may undo it. Changes go through the shared source of truth, or they drift.`
      },
      links: ['lesson:clarifying-questions', 'lesson:async-time-zones', 'phrase:decision-reply-by', 'term:working-agreement']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'client-yes-on-call',
      track: 'comms',
      title: `The "yes" on the client call`,
      summary: `On a late call with the onsite client, one of your developers agrees to a date the team can't make. Practise correcting the record quickly, without embarrassing anyone.`,
      keywords: ['client', 'onsite', 'offshore', 'yes', 'commitment', 'time zone', 'culture', 'correct the record', 'call'],
      role: `You lead an offshore team of six in Pune, building a returns portal for a retailer in London.`,
      setting: `7:30 pm in India: the weekly call with Tom, the client's product owner. Rohit, one of your developers, is presenting the export feature.`,
      stakes: `Rohit knows the export needs the client's data team to open a firewall rule, which takes them about a week. Tom asks if it can be live by Monday, and Rohit says, "Yes, Tom, sure." Tom will tell his boss tonight.`,
      start: 'call',
      steps: {
        call: {
          lines: [
            { who: 'Tom, client product owner', say: `Great, so the export is live on Monday. I'll tell our head of operations tonight.` },
            { narrate: `Rohit looks at his screen. The call has two minutes left.` }
          ],
          prompt: 'What do you do?',
          options: [
            { text: `Add to it on the call, gently: "Let me add one thing to Rohit's answer. The export code will be ready by Monday; it can go live once your data team opens the firewall rule, which usually takes them a week. Can we ask them today? I'll confirm both dates in writing tonight."`,
              grade: 'best', meters: { trust: 2, delivery: 2, team: 1 }, next: 'after',
              result: `Tom pauses, then says: "Ah, the firewall. I'll raise it with them now." He hasn't told his boss anything wrong yet. You corrected the record without saying Rohit was wrong: you added the missing fact.` },
            { text: `Say nothing on the call, and sort it out with Tom by email tomorrow.`,
              grade: 'poor', meters: { trust: -2, delivery: -1 }, next: 'next-day',
              result: `Tom tells his head of operations "live on Monday" tonight. Tomorrow's email is now a correction to two people instead of one.` },
            { text: `"Actually, Rohit, that's not right. It can't be live on Monday."`,
              grade: 'ok', meters: { trust: 1, delivery: 1, team: -2 }, next: 'after',
              result: `The fact is now right, but Rohit has been contradicted in front of the client. He goes quiet for the rest of the call, and on the next one too.` },
            { text: `Let it stand. The team will work the weekend to try.`,
              grade: 'poor', meters: { trust: -1, delivery: -2, team: -2 }, next: 'next-day',
              result: `No amount of weekend work opens the client's firewall. You have spent the team's weekend on a date that depends on someone else.` }
          ]
        },
        after: {
          lines: [
            { narrate: `The call ends. Rohit messages you privately.` },
            { who: 'Rohit', say: `Sorry. I knew about the firewall, but Tom sounded so sure. I couldn't say no to him.` }
          ],
          prompt: 'What do you say to Rohit?',
          options: [
            { text: `"Thanks for telling me. Saying yes to a client feels polite, but here 'yes, once the firewall is open' is the polite answer, because Tom plans on it. Next time say what you know, and I'll back you. Shall we agree that on client calls, a date always comes with what it depends on?"`,
              grade: 'best', meters: { trust: 1, delivery: 1, team: 2 },
              result: `Rohit relaxes. A month later, on another call, you hear him say: "Yes, by Thursday, if your team sends the test data by Tuesday."` },
            { text: `"No problem, I handled it."`,
              grade: 'ok', meters: { delivery: -1, team: 1 },
              result: `Kind, but nothing changes. The next time a client sounds sure, Rohit will say yes again.` },
            { text: `"You can't promise dates to the client. From now on, only I talk about dates."`,
              grade: 'poor', meters: { delivery: -1, team: -2 },
              result: `It fixes this case and teaches the team to stay silent on calls. You become the only person the client can get a straight answer from.` }
          ]
        },
        'next-day': {
          lines: [
            { narrate: `The next morning, an email from Tom, copied to his head of operations.` },
            { who: 'Tom, by email', say: `Our operations team is planning the switch for Monday. Please confirm.` }
          ],
          prompt: 'What do you reply?',
          options: [
            { text: `Reply the same morning, plainly: "I should have said this on the call. The export code will be ready on Monday, and it can go live once your data team opens the firewall rule, usually a week. If they can do it by Wednesday, we go live on Thursday. I'm sorry for the confusion."`,
              grade: 'best', meters: { trust: 1, delivery: 1 },
              result: `It is uncomfortable, and Tom has to correct what he told his boss. But he has a real date the day after the call, not a missed one after the weekend.` },
            { text: `"We'll do our best for Monday."`,
              grade: 'ok', meters: { trust: -2, delivery: -1 },
              result: `A hedge that Tom reads as a yes. Monday comes, the firewall is still closed, and now the miss is yours.` },
            { text: `"Rohit confirmed Monday without checking with me."`,
              grade: 'poor', meters: { trust: -1, team: -2 },
              result: `It tells the client your team can't be trusted on dates, and Rohit will never speak on a call again.` }
          ]
        }
      },
      debrief: {
        points: [
          `In many offshore teams, "yes" to a client means "I heard you". To a client in London it means "it will happen". Close the gap on the call, not after it.`,
          `Correct the record by adding the missing fact, not by contradicting the person: "Let me add one thing to Rohit's answer…"`,
          `A date always comes with what it depends on: "live on Thursday, if your team opens the firewall by Wednesday."`,
          `Afterwards, make the true answer safe to say, and agree it as a team habit. Don't take dates away from the team.`
        ],
        script: `> "Let me add one thing to Rohit's answer. The export code will be ready by Monday, and it can go live once your data team opens the firewall rule, which usually takes a week. Can we ask them today? I'll confirm both dates in writing tonight."`,
        analogy: `An unqualified "yes" is an API that returns 200 OK before the work is done and without checking its dependencies. The caller builds on it. Return 202 Accepted with the condition instead: accepted, and complete once the firewall is open.`
      },
      links: ['lesson:async-time-zones', 'lesson:positive-no', 'phrase:client-date-condition', 'phrase:mistake-correct-early', 'term:high-context']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'email-nobody-read',
      track: 'comms',
      title: `The warning nobody read`,
      summary: `You warned about a risk in a long email two weeks ago. Now it has happened, and the director says nobody told him. Practise writing so the warning lands, and owning it when it didn't.`,
      keywords: ['email', 'risk', 'bluf', 'warning', 'writing', 'director', 'nobody told me', 'subject line', 'certificate'],
      role: `You lead the payments team.`,
      setting: `Monday morning. The bank changed its certificate over the weekend, and card payments failed for 40 minutes.`,
      stakes: `Two weeks ago you sent a long email about the bank's certificate change. The warning was in the fourth paragraph, under the subject "Payments update". Rahul, the director, says he never saw it.`,
      start: 'meeting',
      steps: {
        meeting: {
          lines: [{ who: 'Rahul, director', say: `Why did nobody tell me the bank was changing its certificate? We lost 40 minutes of payments.` }],
          prompt: 'What do you say?',
          options: [
            { text: `"I did write about it, but I buried it: the fourth paragraph of an update email, with no ask and no date. That's on me. The fix is in place now, and I'll send you a short summary today, with what we're changing so a warning like this can't get lost again."`,
              grade: 'best', meters: { trust: 2, delivery: 1 }, next: 'rewrite',
              result: `Rahul looks surprised, then nods. "Fine. Send it." Saying you wrote it badly is uncomfortable, but it moves the conversation to the fix.` },
            { text: `"I did tell you. It's in my email from the 2nd."`,
              grade: 'poor', meters: { trust: -2 }, next: 'defensive',
              result: `Technically true. Rahul opens the email, scrolls, and finds it in paragraph four. "This is not telling me."` },
            { text: `"The bank didn't give us enough notice."`,
              grade: 'ok', meters: { trust: -1, delivery: -1 }, next: 'rewrite',
              result: `The bank gave two weeks' notice, and you knew. Rahul asks to see the timeline, and you agree to send a summary.` }
          ]
        },
        rewrite: {
          lines: [{ narrate: `A month later, a second bank sends a similar notice: a certificate change in 10 days. This time you write it properly.` }],
          prompt: 'Which version do you send?',
          options: [
            { text: `Subject: "Action needed by Fri: approve the bank certificate update (card payments fail if not)". First line: "Bank B changes its certificate on Thu 21 Nov. If the new one isn't installed by then, card payments fail. Arjun can install it on Tue 19 Nov in a 10-minute window at 11 pm; I need your approval for that window by Friday." Details below.`,
              grade: 'best', meters: { trust: 2, delivery: 2 },
              result: `Rahul approves within an hour, from his phone. The ask, the date and the cost of doing nothing all fit on one screen.` },
            { text: `Subject: "Bank B certificate change". A clear paragraph explaining the change, then the risk, then the ask at the end.`,
              grade: 'ok', meters: { trust: 1, delivery: 1 },
              result: `Better than last time, and Rahul does read it, two days later. Putting the ask at the end cost you two days.` },
            { text: `Add it as item 6 in the weekly status report.`,
              grade: 'poor', meters: { trust: -1, delivery: -1 },
              result: `It is written down, and it is the same mistake again: a warning with a deadline, hidden in a list.` }
          ]
        },
        defensive: {
          lines: [{ who: 'Rahul', say: `An email with a hundred lines is not a warning. What do you want me to do with this now?` }],
          prompt: 'What do you say?',
          options: [
            { text: `"You're right. The warning was there, but I made it easy to miss. From now on, anything with a deadline gets its own message, with the action and the date in the subject. I'll send you a summary of today's incident and what we're changing, by 3 pm."`,
              grade: 'best', meters: { trust: 1, delivery: 1 },
              result: `Rahul accepts it. You lost some trust by arguing first, and won some back by owning it and fixing the habit.` },
            { text: `"I'll copy you on everything from now on."`,
              grade: 'ok', meters: { trust: -1 },
              result: `More email isn't better email. Rahul will now get even more messages he can't act on.` },
            { text: `"Maybe you could read the weekly emails more carefully."`,
              grade: 'poor', meters: { trust: -2 },
              result: `Now the problem is your attitude, not the certificate.` }
          ]
        }
      },
      debrief: {
        points: [
          `A warning the reader has to dig for has not been given. Put the action and the date in the subject, and the bottom line in the first line.`,
          `Anything with a deadline gets a message of its own: one message, one ask.`,
          `Say what happens if nobody acts: "if it isn't installed by Thursday, card payments fail."`,
          `When it goes wrong anyway, own the writing, fix the habit, and move to the solution.`
        ],
        script: `> Subject: "Action needed by Fri: approve the bank certificate update". First line: "Bank B changes its certificate on Thu 21 Nov. If the new one isn't installed by then, card payments fail. I need your approval for an install window on Tue 19 Nov, by Friday."`,
        analogy: `A warning in paragraph four is an error logged at DEBUG level inside a long stack trace. The information is there, but no alert fires and nobody is paged. Give important messages the right level: a message of their own, with the action in the subject.`
      },
      links: ['lesson:bluf-writing', 'tool:templates', 'phrase:write-subject-ask', 'phrase:write-bluf-email', 'term:bluf']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'silent-refinement',
      track: 'scrum',
      title: `Refinement where everyone nods`,
      summary: `The Product Owner reads stories aloud, the team nods, and the stories come back half-understood mid-sprint. Practise running refinement so people think out loud.`,
      keywords: ['refinement', 'grooming', 'backlog', 'silent', 'nod', 'questions', 'examples', 'acceptance criteria', 'sizing'],
      role: `You lead a team of six and run its weekly refinement.`,
      setting: `Refinement, 4 pm. Neha, the Product Owner, shares her screen.`,
      stakes: `Last sprint, three stories came back mid-sprint with "we didn't understand this". Today Neha reads the loyalty-points story aloud; nobody asks anything; Divya says, "Looks fine, 5 points."`,
      start: 'read',
      steps: {
        read: {
          lines: [{ who: 'Neha, Product Owner', say: `"As a customer, I want to earn points on every order, so that I come back." Any questions? No? Great, next story.` }],
          prompt: 'What do you do?',
          options: [
            { text: `"Before we move on, let's each give one example of an order and how many points it earns. Divya: a ₹999 order paid by card, with a ₹100 coupon?"`,
              grade: 'best', meters: { trust: 1, delivery: 2, team: 1 }, next: 'examples',
              result: `Divya says 9 points. Sameer says 10, because he assumed points come before the coupon. Neha says neither: points are on the amount after discounts, rounded down, and never on delivery charges. Three people had three different stories in their heads.` },
            { text: `Move on. The team can ask questions during the sprint.`,
              grade: 'poor', meters: { delivery: -2 }, next: 'midsprint',
              result: `Refinement finishes early. The questions arrive on day 4 of the sprint instead.` },
            { text: `Ask everyone to read the stories before the meeting from now on.`,
              grade: 'ok', meters: { delivery: 1, team: -1 }, next: 'midsprint',
              result: `Reading ahead helps a little. But people still nod in the meeting, because the format rewards silence.` }
          ]
        },
        examples: {
          lines: [
            { narrate: `Three different answers for one order. Neha looks at the story again.` },
            { who: 'Neha', say: `I thought this one was obvious.` }
          ],
          prompt: 'What do you do now?',
          options: [
            { text: `Turn the examples into acceptance criteria together, on screen: "Given a ₹999 order with a ₹100 coupon, when it is paid, then the customer earns 8 points." Then ask the developers to size it again.`,
              grade: 'best', meters: { trust: 1, delivery: 2, team: 1 }, next: 'gap',
              result: `Four criteria in ten minutes. When they size it again, the estimate goes from 5 to 8: the rounding and the refunds were the hidden work.` },
            { text: `Ask Neha to update the story after the meeting.`,
              grade: 'ok', meters: { delivery: 1 }, next: 'gap',
              result: `She will, but half of what the room just understood together is lost by the time it reaches the story.` },
            { text: `Keep the 5 points. The details are small.`,
              grade: 'poor', meters: { delivery: -2 }, next: 'gap',
              result: `The examples just showed that the details are the work.` }
          ]
        },
        gap: {
          lines: [{ narrate: `Twenty minutes left and four stories to go. The team is talking now. On the next story, Sameer says 3 points and Divya says 13.` }],
          prompt: 'How do you handle the big difference?',
          options: [
            { text: `"That's the most useful thing we've heard today. Sameer, what makes it 3 for you? Divya, what makes it 13?" Then size it again once both have explained.`,
              grade: 'best', meters: { delivery: 1, team: 2 },
              result: `Divya knows the old loyalty service has no API; Sameer didn't. They agree on 8 and a one-day spike. The gap between the estimates was knowledge, not opinion.` },
            { text: `Take the average: 8 points.`,
              grade: 'ok', meters: { delivery: -1 },
              result: `The number looks reasonable, and what Divya knows stays in her head until it bites.` },
            { text: `"I'll decide: 5."`,
              grade: 'poor', meters: { delivery: -1, team: -2 },
              result: `The people doing the work size it. Overrule them, and next time they won't argue: they'll just nod, like before.` }
          ]
        },
        midsprint: {
          lines: [
            { narrate: `Day 4 of the sprint. Divya and Sameer have built points two different ways, and Kavya, the tester, expected a third.` },
            { who: 'Divya', say: `We need Neha. Nobody knows how coupons affect points.` }
          ],
          prompt: 'What do you do?',
          options: [
            { text: `Get Neha and the three of them together for 20 minutes today, settle it with worked examples, write them on the story as acceptance criteria, and change the next refinement: an example from each person before any story is sized.`,
              grade: 'best', meters: { trust: 1, delivery: 1, team: 1 },
              result: `The story recovers, a few days late. The bigger win is the next refinement, where nobody can nod through a story without giving an example.` },
            { text: `Let Divya pick one way and move on.`,
              grade: 'ok', meters: { delivery: -1 },
              result: `Quick, and maybe wrong. The person who owns the points rules hasn't been asked.` },
            { text: `"Neha should write clearer stories."`,
              grade: 'poor', meters: { trust: -1, team: -1 },
              result: `Stories are refined together. Blaming the Product Owner fixes nothing and makes the next refinement tense.` }
          ]
        }
      },
      debrief: {
        points: [
          `Silence in refinement is not understanding. Ask each person for a concrete example; different examples expose different assumptions.`,
          `Turn the examples into acceptance criteria on screen, together, while everyone is in the room.`,
          `A big gap between two estimates is the most useful moment in refinement: ask both people to explain, then size again.`,
          `The people who will do the work size it. The lead runs the conversation; the lead doesn't overrule it.`
        ],
        script: `> "Before we move on, let's each give one example of an order and how many points it earns. Divya: a ₹999 order paid by card, with a ₹100 coupon?"`,
        analogy: `Nodding through a story is approving a pull request you didn't read. Asking for an example is running the code with a real input: it shows at once whether everyone's mental model gives the same output.`
      },
      links: ['playbook:refinement', 'lesson:refinement-stories', 'tool:prd', 'phrase:ask-play-back']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'review-hijacked',
      track: 'scrum',
      title: `The VP who redesigns it at the Sprint Review`,
      summary: `A senior stakeholder takes over the demo to redesign the feature and promise a date. Practise capturing the feedback without giving in or pushing back in public.`,
      keywords: ['sprint review', 'demo', 'stakeholder', 'vp', 'feedback', 'hijack', 'scope', 'promise', 'senior'],
      role: `You lead the team building the new checkout.`,
      setting: `The Sprint Review. Twelve people are on the call, including Suresh, the VP of Sales, who has joined for the first time.`,
      stakes: `Divya is demoing saved cards. Five minutes in, Suresh interrupts: he wants a one-click buy button "like the big e-commerce apps", and says the team can surely add it by next week. Neha, the Product Owner, is on the call.`,
      start: 'interrupt',
      steps: {
        interrupt: {
          lines: [{ who: 'Suresh, VP of Sales', say: `This is too many steps. We need one-click buy, like the big e-commerce apps. Your team can add that by next week, surely?` }],
          prompt: 'What do you do?',
          options: [
            { text: `"That's useful, thank you. One-click buy is a real change to checkout, so I want to get it right. Can I note it for Neha, who decides what we build next, and ask what problem you're seeing? Is it customers dropping out at checkout?" Then let Divya finish.`,
              grade: 'best', meters: { trust: 2, delivery: 1, team: 1 }, next: 'problem',
              result: `Suresh says sales keep hearing that paying on a phone takes too long. That is a problem the team can work with. You didn't argue, didn't promise, and the demo goes on.` },
            { text: `"Sure, we'll look at adding it next week."`,
              grade: 'poor', meters: { trust: -1, delivery: -2, team: -1 }, next: 'promised',
              result: `Suresh is pleased. Neha, who owns the backlog, has just watched you commit the team to an unsized feature in front of twelve people.` },
            { text: `"That's out of scope for this sprint."`,
              grade: 'ok', meters: { trust: -2, delivery: 1 }, next: 'problem',
              result: `Correct, and it lands as a door closed on a VP in front of the room. Neha steps in and asks Suresh what problem he is seeing.` },
            { text: `Let Suresh keep talking. It's his meeting now.`,
              grade: 'poor', meters: { delivery: -1, team: -1 }, next: 'promised',
              result: `Twenty minutes later, Divya never finished her demo, and the room left believing one-click buy is coming.` }
          ]
        },
        problem: {
          lines: [{ who: 'Suresh', say: `Customers tell sales that paying on a phone takes forever. We're losing orders.` }],
          prompt: 'How do you close it in the review?',
          options: [
            { text: `"That's exactly what this review is for. Neha, could we look at where customers drop out of checkout on phones and bring Suresh options next week: one-click buy, fewer steps, or both, each with an estimate? Divya, can you finish the saved-cards demo? It already cuts two steps."`,
              grade: 'best', meters: { trust: 2, delivery: 2, team: 1 },
              result: `Neha adds a backlog item, and Suresh sees that saved cards remove two steps, which is part of his answer already. The feedback is captured, the Product Owner still decides, and the demo is finished.` },
            { text: `"Let's take it offline."`,
              grade: 'ok', meters: { trust: -1 },
              result: `"Offline" with no owner and no date often means never. Suresh will raise it again, louder, next time.` },
            { text: `"We've already planned the next three sprints."`,
              grade: 'poor', meters: { trust: -2 },
              result: `It sounds as if the plan matters more than his customers. He goes over your head to Priya.` }
          ]
        },
        promised: {
          lines: [
            { narrate: `After the review, Suresh emails his sales team: "One-click buy is coming next week." Neha messages you.` },
            { who: 'Neha, Product Owner', say: `Did we just commit to one-click buy? Nobody has sized it, and it isn't in the backlog.` }
          ],
          prompt: 'What do you do?',
          options: [
            { text: `"That's on me. I should have noted it for you instead of answering. Let's size it today, and tomorrow the two of us talk to Suresh with what it costs and the options, before his team plans on it."`,
              grade: 'best', meters: { trust: 1, delivery: 1 },
              result: `Awkward, but early. Suresh accepts a corrected plan within a day far better than a missed date in a week.` },
            { text: `Ask the team to try to build it by next week.`,
              grade: 'ok', meters: { delivery: -2, team: -2 },
              result: `Unsized, untested work squeezed into a week, to protect a promise nobody should have made.` },
            { text: `"Suresh is a VP. We can't go back on it."`,
              grade: 'poor', meters: { trust: -1, delivery: -1 },
              result: `You can, and you have to. The longer you wait, the more people plan on it.` }
          ]
        }
      },
      debrief: {
        points: [
          `A Sprint Review is a working session, and feedback is the point. Capture it; don't argue with it, and don't promise anything on the spot.`,
          `Ask what problem the suggestion solves. "Paying on a phone takes too long" is something the team can work on; "one-click buy by next week" is not.`,
          `The Product Owner decides what changes in the backlog. Route requests to them, visibly, in the room.`,
          `If something was promised by mistake, correct it within a day, with options.`
        ],
        script: `> "That's useful, thank you. One-click buy is a real change to checkout, so I want to get it right. Can I note it for Neha, who decides what we build next, and ask what problem you're seeing? Is it customers dropping out at checkout?"`,
        analogy: `Feedback in a review is a bug report from a user. You thank them, ask for the steps to reproduce (the problem behind it) and triage it into the backlog. You don't promise a fix date in the bug thread before anyone has looked at it.`
      },
      links: ['playbook:sprint-review', 'lesson:review-and-retro', 'lesson:senior-audiences', 'phrase:review-feedback-capture', 'phrase:ask-problem']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'steering-unknown-answer',
      track: 'comms',
      title: `A question you can't answer at the steering committee`,
      summary: `In front of the leadership team, the CFO asks for a number you don't have. Practise "I don't know" said well, and the follow-up that builds trust.`,
      keywords: ['steering committee', 'senior leaders', 'cfo', "i don't know", 'bluff', 'number', 'presentation', 'executives'],
      role: `You lead the payments platform team.`,
      setting: `The monthly steering committee: Vikram (VP of Engineering), the CFO and two business heads. You have ten minutes for the refunds project.`,
      stakes: `You present the plan: live for the sale on the 20th, with one risk. The CFO asks what each refund costs to process today, and what it will cost after this. You don't know. Vikram is watching.`,
      start: 'asked',
      steps: {
        asked: {
          lines: [{ who: 'The CFO', say: `What does each refund cost us to process today, and what will it cost after this?` }],
          prompt: 'What do you say?',
          options: [
            { text: `"I don't have that number with me, and I don't want to guess. Support takes about 1,200 refund calls a week today. I'll work out the cost per refund with Finance and send it to you by 5 pm tomorrow."`,
              grade: 'best', meters: { trust: 2, delivery: 1 }, next: 'after',
              result: `The CFO nods and moves on. You gave the fact you did have, admitted the one you didn't, and promised a specific time.` },
            { text: `"Roughly ₹50 now, and about ₹5 after."`,
              grade: 'poor', meters: { trust: -2 }, next: 'wrong',
              result: `The CFO writes it down. You made both numbers up.` },
            { text: `"That's more of a Finance question."`,
              grade: 'ok', meters: { trust: -1 }, next: 'after',
              result: `Partly true, and it sounds like it isn't your problem. Vikram steps in and promises the CFO an answer from your team.` }
          ]
        },
        after: {
          lines: [{ narrate: `Back at your desk. Deepa in Finance can help, but she is busy with the month-end close until Thursday. You promised an answer by 5 pm tomorrow.` }],
          prompt: 'What do you do?',
          options: [
            { text: `Work out what you can today (the support time per call from the support lead, the bank's refund fees), ask Deepa for 15 minutes to check it, and send the CFO the number by 5 pm tomorrow, with how it was worked out and what Finance will confirm on Thursday.`,
              grade: 'best', meters: { trust: 2, delivery: 1 },
              result: `The CFO gets a number on time, honestly labelled: "about ₹140 today, about ₹12 after; Finance confirms on Thursday." Vikram forwards it to the business heads.` },
            { text: `Email the CFO that Finance is busy, so the number will come on Friday.`,
              grade: 'ok', meters: { trust: -1, delivery: 1 },
              result: `Honest, and it misses the time you promised. A partial answer on time beats a perfect one late.` },
            { text: `Wait for Deepa, and send it when she is free.`,
              grade: 'poor', meters: { trust: -2 },
              result: `Thursday comes and goes. The CFO has to chase you, which a precise "by 5 pm tomorrow" was meant to prevent.` }
          ]
        },
        wrong: {
          lines: [{ narrate: `Two days later, Finance works out the real cost: about ₹140 per refund today. The CFO has already put your ₹50 in a board pack.` }],
          prompt: 'What do you do?',
          options: [
            { text: `Tell the CFO yourself, today, before the board pack goes out: "The ₹50 I gave you was a guess, and it was wrong. Finance has worked it out at about ₹140 today, and about ₹12 after the project. I'm sorry. Next time I'll say I don't know."`,
              grade: 'best', meters: { trust: 1, delivery: 1 },
              result: `The CFO is not pleased, but the board pack is corrected in time. People forgive a corrected mistake far more easily than one they find themselves.` },
            { text: `Ask Vikram to tell the CFO.`,
              grade: 'ok', meters: { trust: -1 },
              result: `Your manager now has to clean up your guess, and the CFO learns that you hide your mistakes behind him.` },
            { text: `Say nothing. It was only an estimate.`,
              grade: 'poor', meters: { trust: -2 },
              result: `The board decides on a made-up number. When it comes out, your credibility pays for it.` }
          ]
        }
      },
      debrief: {
        points: [
          `"I don't know; I'll find out and send it by 5 pm tomorrow" sounds more senior than any guess.`,
          `Give the related fact you do know: "Support takes about 1,200 refund calls a week."`,
          `Keep the time you promised, even with a partial answer, honestly labelled.`,
          `If you did guess and were wrong, correct it yourself, quickly, before anyone builds on it.`
        ],
        script: `> "I don't have that number with me, and I don't want to guess. Support takes about 1,200 refund calls a week today. I'll work out the cost per refund with Finance and send it to you by 5 pm tomorrow."`,
        analogy: `A guessed number in a leadership meeting is a cache that serves made-up values on a miss: fast, plausible and wrong, and everything downstream trusts it. On a miss, say so and fetch the real value. A little latency beats corrupted data.`
      },
      links: ['lesson:senior-audiences', 'phrase:ask-dont-know', 'phrase:mistake-correct-early', 'term:steering-committee']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'architect-disagree',
      track: 'comms',
      title: `Disagreeing with a principal engineer`,
      summary: `A respected principal engineer proposes a shared database that you think will tie two teams' releases together. Practise disagreeing with facts and options, in the right room, and committing to the outcome.`,
      keywords: ['disagree', 'architect', 'principal engineer', 'design', 'shared database', 'pushback', 'senior', 'options', 'design review'],
      role: `You lead the refunds team.`,
      setting: `A design discussion. Imran, a principal engineer whom everyone respects, presents the plan for refunds and orders.`,
      stakes: `Imran proposes that refunds read and write the orders team's database tables directly, "to save time". You believe it will tie the two teams' releases together: any change the orders team makes to its tables could break refunds.`,
      start: 'proposal',
      steps: {
        proposal: {
          lines: [{ who: 'Imran, principal engineer', say: `Simplest is for refunds to use the orders tables directly. No API to build, and we save three weeks. Any concerns?` }],
          prompt: 'What do you say?',
          options: [
            { text: `"One concern before we decide. If refunds writes to the orders tables, every orders migration has to be checked against refunds, and our releases depend on each other. Last quarter an orders table change broke reporting the same way. Could we compare two options next to yours: a small orders API, or reading from a replica and writing through an API? I can write a one-page comparison by Thursday."`,
              grade: 'best', meters: { trust: 2, delivery: 2 }, next: 'comparison',
              result: `Imran thinks for a moment. "Fair point about reporting. Send me the comparison." You disagreed with the design without challenging the person.` },
            { text: `Say nothing. He's a principal engineer, and probably right.`,
              grade: 'poor', meters: { delivery: -2, team: -1 }, next: 'coupled',
              result: `The design is approved. Your concern leaves the room with you, unspoken.` },
            { text: `"Shared databases are an anti-pattern. We shouldn't do it."`,
              grade: 'ok', meters: { trust: -1, delivery: 1 }, next: 'comparison',
              result: `A verdict from a book, without your specific reason, and it lands as a lecture. Imran bristles: "Everything is an anti-pattern to someone." It takes a while to get back to the facts, but he agrees to look at a comparison.` }
          ]
        },
        comparison: {
          lines: [
            { narrate: `Your one-pager shows that shared tables save three weeks now, while a small API costs two weeks and keeps the releases independent. Imran reads it.` },
            { who: 'Imran', say: `I still think the shared tables are fine if we're careful. Let's take it to the design review.` }
          ],
          prompt: 'What do you do at the design review?',
          options: [
            { text: `Present both options evenly, with their costs and risks, including what Imran's option does well, and let the review decide. Agree beforehand that whatever is chosen, both teams build it properly.`,
              grade: 'best', meters: { trust: 2, delivery: 1, team: 1 }, next: 'decided',
              result: `The review hears both options fairly. Afterwards Imran says: "Good comparison, and a fair one." Being fair to his option is what made yours believable.` },
            { text: `Ask your manager to overrule Imran.`,
              grade: 'poor', meters: { trust: -2 }, next: 'decided',
              result: `It makes Imran an opponent, and the design review goes ahead anyway. Design disagreements are settled with evidence in the open, not through managers.` },
            { text: `Present only the risks of Imran's option.`,
              grade: 'ok', meters: { trust: -1, delivery: 1 }, next: 'decided',
              result: `Your points are valid, but a one-sided case makes the room suspicious of it. The review spends its time on whether you are being fair.` }
          ]
        },
        decided: {
          lines: [
            { narrate: `The design review chooses the shared tables, with one condition taken from your comparison: the orders team announces table changes a sprint in advance.` },
            { who: 'Sameer, on your team', say: `So we lost. Should we quietly keep our own copy of the tables, just in case?` }
          ],
          prompt: 'What do you say to the team?',
          options: [
            { text: `"We made our case and it was heard. Now we build the chosen design properly. The change notice was our idea, so let's make it work: I'll set it up with the orders lead this week. If it causes problems, we bring the evidence back."`,
              grade: 'best', meters: { trust: 1, delivery: 2, team: 2 },
              result: `The team builds it well. Three months later the notice catches a breaking change in time, and Imran mentions it at the architecture forum.` },
            { text: `"Build it, but keep a list of every problem it causes."`,
              grade: 'ok', meters: { delivery: 1, team: -1 },
              result: `Collecting evidence is fine; collecting grievances isn't. The team builds it half-heartedly, waiting to be proved right.` },
            { text: `"Yes, keep a copy quietly."`,
              grade: 'poor', meters: { trust: -2, delivery: -1, team: -1 },
              result: `A hidden workaround against an agreed design. When it is found, nobody will trust your team's word in a design review again.` }
          ]
        },
        coupled: {
          lines: [
            { narrate: `Four months later, an orders migration renames a column on a Friday evening. Refunds fail for two hours.` },
            { who: 'Imran', say: `Why didn't anyone raise this risk at the design discussion?` }
          ],
          prompt: 'What do you say?',
          options: [
            { text: `"I saw the risk and didn't say it, which I should have. Let's fix tonight's problem, then look at a small API or a change notice between our teams. I'll bring a comparison on Monday."`,
              grade: 'best', meters: { trust: 1, delivery: 1 },
              result: `Late, but honest, and pointed at the fix. Next time you'll know that a fact that changes a decision belongs in the room where it's made.` },
            { text: `"It was your design."`,
              grade: 'ok', meters: { trust: -2 },
              result: `True, and useless now. It turns an incident into a feud with someone whose support you need.` },
            { text: `"Nobody asked."`,
              grade: 'poor', meters: { trust: -1, team: -1 },
              result: `Imran did ask: "Any concerns?" That was the moment.` }
          ]
        }
      },
      debrief: {
        points: [
          `Disagree with the design, not the person: the specific risk, the evidence ("last quarter's reporting break"), and options.`,
          `Offer to do the work: "I can write a one-page comparison by Thursday."`,
          `Present the other option fairly. Fairness is what makes your recommendation believable.`,
          `Settle it in the right room, the design review, not through managers.`,
          `If the decision goes against you, commit fully and make the safeguards work. Bring evidence back if problems appear; never build a hidden workaround.`
        ],
        script: `> "One concern before we decide. If refunds writes to the orders tables, every orders migration has to be checked against refunds, and our releases depend on each other. Could we compare two options next to yours? I can write a one-page comparison by Thursday."`,
        analogy: `Disagreeing with a senior engineer is reviewing a senior colleague's pull request. Comment on the code with evidence, suggest an alternative, and once the owner decides, approve it and help make it work. You never merge a hidden fork.`
      },
      links: ['lesson:difficult-conversations', 'phrase:disagree-options', 'phrase:disagree-commit', 'term:disagree-and-commit']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'conflicting-pms',
      track: 'comms',
      title: `Two PMs, one page, two answers`,
      summary: `Two product managers give your team conflicting requirements for the same page. Practise making the conflict visible and getting it decided, instead of quietly picking a side.`,
      keywords: ['conflict', 'two pms', 'product managers', 'conflicting requirements', 'stakeholders', 'decision', 'priorities'],
      role: `You lead the team that owns the order-details page.`,
      setting: `Tuesday. Two messages arrive an hour apart. Your sprint starts on Thursday.`,
      stakes: `Meera, the PM for returns, wants a big "Return this item" button at the top of the order page. Karthik, the PM for growth, wants the top of the same page for "Buy it again", with returns less prominent. Both say their request is agreed with leadership.`,
      start: 'messages',
      steps: {
        messages: {
          lines: [
            { who: 'Meera, PM for returns', say: `Please put "Return this item" at the top of the order page this sprint. It's agreed with leadership.` },
            { who: 'Karthik, PM for growth', say: `The top of the order page is for "Buy it again" this sprint. Returns should be less prominent. Leadership agreed.` }
          ],
          prompt: 'What do you do?',
          options: [
            { text: `Reply to both, in one message: "Meera, Karthik: your requests for the order page conflict, because both want the top of the page this sprint. Can the three of us take 20 minutes before Thursday's planning? I'll bring sketches of two layouts. If you can't agree, who decides between your goals?"`,
              grade: 'best', meters: { trust: 2, delivery: 2 }, next: 'meeting',
              result: `Both accept. Neither knew the other had asked. Putting the conflict in one message, to both, made it theirs to settle, not yours to guess.` },
            { text: `Build Meera's version. She asked first.`,
              grade: 'poor', meters: { trust: -2, delivery: -1 }, next: 'fallout',
              result: `First come is not a priority. Karthik will find out at the review.` },
            { text: `Ask your manager which one to do.`,
              grade: 'ok', meters: { trust: -1, delivery: 1 }, next: 'meeting',
              result: `Priya asks: "Have you talked to them both together?" You set up the meeting she suggests.` },
            { text: `Do both: a returns button and "Buy it again", both at the top.`,
              grade: 'poor', meters: { trust: -1, delivery: -1, team: -1 }, next: 'fallout',
              result: `Two big buttons fight for the same space, and neither PM gets a clear page with their goal at the top.` }
          ]
        },
        meeting: {
          lines: [{ narrate: `In the meeting, Meera and Karthik both have good data: return calls cost Support money, and repeat orders bring in revenue. They don't agree.` }],
          prompt: 'How do you help?',
          options: [
            { text: `Show the two layouts side by side with what each should do to their numbers, propose a test (half the customers see each layout for two weeks), and ask who owns the decision between their goals: "If it's Rohan, the product head, shall we send him one page together today?"`,
              grade: 'best', meters: { trust: 2, delivery: 1 }, next: 'close',
              result: `They agree to the test, with Rohan's approval by email that afternoon. You never had to choose between them.` },
            { text: `Suggest a compromise: the returns button at the top for orders from the last 30 days, "Buy it again" for older ones.`,
              grade: 'ok', meters: { trust: 1, delivery: 1 }, next: 'close',
              result: `A sensible idea, and it may be right. But you designed product policy in the room. Check that both PMs, and whoever owns their goals, really agree.` },
            { text: `"I'll decide: returns, because support costs are real money."`,
              grade: 'poor', meters: { trust: -2 }, next: 'close',
              result: `Whoever loses now sees you as the other PM's ally. Choosing between product goals isn't the engineering lead's call.` }
          ]
        },
        close: {
          lines: [{ narrate: `The meeting ends with a direction.` }],
          prompt: 'What do you do next?',
          options: [
            { text: `Send a short summary to both PMs and Rohan: what was decided, who decided, what goes into this sprint, and "reply by Wednesday noon if this is wrong".`,
              grade: 'best', meters: { trust: 1, delivery: 2 },
              result: `Nobody replies, which now means agreement. Thursday's planning starts from one answer instead of two.` },
            { text: `Tell your team the outcome at stand-up.`,
              grade: 'ok', meters: { delivery: 1 },
              result: `The team knows; the PMs and Rohan have nothing in writing. In two weeks, someone remembers it differently.` },
            { text: `Nothing. Everyone was in the room.`,
              grade: 'poor', meters: { delivery: -1 },
              result: `Everyone was in the room, and everyone will remember the part that suited them.` }
          ]
        },
        fallout: {
          lines: [
            { narrate: `At the Sprint Review, Karthik sees the page.` },
            { who: 'Karthik', say: `Where is "Buy it again"? I told you it was agreed with leadership.` }
          ],
          prompt: 'What do you say?',
          options: [
            { text: `"You're right to ask. I had two conflicting requests and picked one instead of bringing you and Meera together. Let's get the three of us and Rohan in a room this week and decide the layout properly."`,
              grade: 'best', meters: { trust: 1, delivery: 1 },
              result: `It costs a sprint of rework, and it stops you being the referee between PMs from now on.` },
            { text: `"Meera asked first."`,
              grade: 'ok', meters: { trust: -2 },
              result: `It sounds as if you took sides. Karthik goes to Rohan, and now the escalation is about you.` },
            { text: `"Take it up with Meera."`,
              grade: 'poor', meters: { trust: -2 },
              result: `You built it, so you made the call. Pushing it back makes the conflict worse.` }
          ]
        }
      },
      debrief: {
        points: [
          `When two people give you conflicting requirements, don't pick one quietly. Tell both, in one message.`,
          `Bring them the conflict and the options; ask who owns the decision between their goals.`,
          `Data and a test can turn a fight about opinions into a decision about evidence.`,
          `Write the decision down and send it to everyone involved, with a date for objections.`
        ],
        script: `> "Meera, Karthik: your requests for the order page conflict, because both want the top of the page this sprint. Can the three of us take 20 minutes before Thursday's planning? I'll bring sketches of two layouts. If you can't agree, who decides between your goals?"`,
        analogy: `Two PMs writing to the same field is a write conflict. Last-writer-wins silently loses someone's data. Detect the conflict, show it to both writers, and resolve it explicitly, with a record of the resolution.`
      },
      links: ['lesson:difficult-conversations', 'scenario:two-urgent-asks', 'tool:prioritise', 'phrase:decision-reply-by']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'sync-meeting-no-decisions',
      track: 'comms',
      title: `The weekly sync that never decides anything`,
      summary: `You inherit a weekly cross-team meeting: twelve people, an hour, a status read-out, and no decisions. Practise turning it into something worth people's time, or ending it.`,
      keywords: ['meeting', 'meetings', 'sync', 'weekly meeting', 'recurring meeting', 'decisions', 'agenda', 'status meeting', 'waste'],
      role: `You have just become the lead for the payments area.`,
      setting: `Your manager hands you the "Payments weekly sync": Monday, 11 am, one hour, twelve people from four teams.`,
      stakes: `You sit in on it once. Each team reads its status for five minutes; two people are clearly working on their laptops; one real question (who owns the refund fraud rules?) comes up and is "taken offline", as it was last week.`,
      start: 'first',
      steps: {
        first: {
          lines: [{ narrate: `After the meeting, three people message you. One writes: "Can I drop this meeting? I learn nothing I couldn't read."` }],
          prompt: 'What do you do?',
          options: [
            { text: `Change the format and tell everyone why: status moves to a short written update in the channel by Friday; the Monday slot shrinks to 30 minutes for the decisions those updates raise, each with a named decider; people come only for their items. Try it for four weeks, then ask whether to keep it.`,
              grade: 'best', meters: { trust: 2, delivery: 2, team: 1 }, next: 'decision',
              result: `Attendance drops to six. The written updates get read, and the first 30-minute meeting settles two questions that had been "offline" for a month.` },
            { text: `Keep the meeting, but send an agenda in advance.`,
              grade: 'ok', meters: { delivery: 1 }, next: 'decision',
              result: `An agenda helps, but an agenda of status items is still a read-out. The meeting gets a little shorter and no more useful.` },
            { text: `Keep it as it is. It was your manager's meeting.`,
              grade: 'poor', meters: { delivery: -1, team: -1 }, next: 'decision',
              result: `Twelve people keep losing an hour a week, and you have inherited a meeting nobody values.` },
            { text: `Cancel it without telling anyone why.`,
              grade: 'poor', meters: { trust: -1, delivery: -1 }, next: 'decision',
              result: `Some people are relieved; others lose the one place they heard about other teams' changes. Next month, an incident traces back to that.` }
          ]
        },
        decision: {
          lines: [{ narrate: `The question of who owns the refund fraud rules comes up again. Risk thinks Payments owns them; Payments thinks Risk does. Both look at you.` }],
          prompt: 'What do you do?',
          options: [
            { text: `"Let's decide it instead of taking it offline again. The question is who owns the refund fraud rules. Ravi, the head of Risk, and Priya can decide between them. I'll send them a one-page summary of both options today, and we'll record their decision here next Monday."`,
              grade: 'best', meters: { trust: 2, delivery: 2 }, next: 'record',
              result: `Ravi and Priya decide by Wednesday: Risk owns the rules, and Payments owns the code that runs them. A month-old question is closed in two days.` },
            { text: `Ask both teams to write up their view and bring it next week.`,
              grade: 'ok', meters: { delivery: 1 }, next: 'record',
              result: `Progress, but slow: another week, and still nobody named to decide.` },
            { text: `Take it offline again.`,
              grade: 'poor', meters: { delivery: -2 }, next: 'record',
              result: `Third week in a row. "Offline" without an owner and a date is where questions go to die.` }
          ]
        },
        record: {
          lines: [{ narrate: `The meeting ends.` }],
          prompt: 'What do you send afterwards?',
          options: [
            { text: `A short note in the channel, the same day: the decisions made (with who decided), the open questions with an owner and a date, and nothing else. Start a running decision log pinned at the top of the channel.`,
              grade: 'best', meters: { trust: 1, delivery: 2 },
              result: `Within a month, people search the decision log instead of asking "what did we decide about…?" in the meeting.` },
            { text: `Full minutes of everything that was said.`,
              grade: 'ok', meters: { delivery: 1, team: -1 },
              result: `Nobody reads two pages of minutes. The decisions are in there somewhere, between the status read-outs.` },
            { text: `Nothing. People were there.`,
              grade: 'poor', meters: { delivery: -1 },
              result: `The six people who weren't there learn about the decisions by surprise.` }
          ]
        }
      },
      debrief: {
        points: [
          `A recurring meeting needs a reason to exist. Status can be written; meetings are for decisions, disagreements and sensitive topics.`,
          `Change a meeting openly: say what changes, why, and for how long you'll try it.`,
          `For every open question: the decision, the decider and a date. "Take it offline" is not an action.`,
          `Write decisions where people look: a decision log in the channel beats minutes.`
        ],
        script: `> "From next week, status goes in the channel by Friday, and Monday becomes 30 minutes for the decisions those updates raise, each with a named decider. Come only for your items. Let's try it for four weeks, then decide whether to keep it."`,
        analogy: `A status meeting is polling: everyone stops every Monday to ask "anything new?". Written updates are an event stream people read when they need to; the meeting becomes the handler for the few events that need a decision.`
      },
      links: ['lesson:meetings-decisions', 'phrase:meeting-no-decision-cancel', 'phrase:meeting-decider', 'phrase:meeting-close', 'term:decision-record']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'public-blame-channel',
      track: 'comms',
      title: `Blamed in a public channel`,
      summary: `During an outage, another team's lead posts in a public channel that your service broke checkout. Practise answering calmly, fixing first, and settling the facts afterwards, without a public fight.`,
      keywords: ['blame', 'public channel', 'outage', 'incident', 'other team', 'slack', 'conflict', 'calm', 'cross-team'],
      role: `You lead the payments service team.`,
      setting: `8:40 pm. Checkout is failing for some customers, and you are already looking at it.`,
      stakes: `Farhan, the checkout team's lead, posts in the engineering channel (400 people): "Payments service is down AGAIN and breaking checkout. Third time this month. Payments team, fix your service." You don't yet know whose change caused it.`,
      start: 'post',
      steps: {
        post: {
          lines: [{ who: 'Farhan, in the engineering channel', say: `Payments service is down AGAIN and breaking checkout. Third time this month. Payments team, fix your service.` }],
          prompt: 'What do you post?',
          options: [
            { text: `"Thanks for flagging, Farhan. We're on it, together with your team. Updates in the incident channel every 20 minutes; the next one by 9 pm." Then move the work to the incident channel and a call.`,
              grade: 'best', meters: { trust: 2, delivery: 2 }, next: 'cause',
              result: `The temperature drops. Anyone can follow the incident channel, and nobody is arguing in front of 400 people while customers can't pay.` },
            { text: `"It's not our service. Check your own deploy first."`,
              grade: 'poor', meters: { trust: -2, delivery: -1 }, next: 'thread',
              result: `Now two leads are arguing in public, during an outage, and neither of you knows the cause yet.` },
            { text: `Ignore the post and work on the fix.`,
              grade: 'ok', meters: { trust: -1, delivery: 1 }, next: 'cause',
              result: `The fix moves, but 400 people read "Payments is down AGAIN" with no reply, and that becomes the story.` }
          ]
        },
        cause: {
          lines: [{ narrate: `By 9:20 pm it is fixed. The cause: checkout deployed a new client library at 8:30 that sends a header your service rejects. Payments wasn't down; it was refusing malformed requests. And of the "three times this month", only one was a real payments outage.` }],
          prompt: 'What do you do now?',
          options: [
            { text: `Post the facts in the incident channel, neutrally: what happened, the cause, the fix, and what both teams will do next (a contract test between checkout and payments). Then message Farhan privately to agree a short joint review this week.`,
              grade: 'best', meters: { trust: 2, delivery: 1, team: 1 }, next: 'farhan',
              result: `The facts speak for themselves; you don't need to say "I told you so". Farhan replies privately: "My bad on the post. Joint review on Thursday?"` },
            { text: `Post in the engineering channel: "For the record, it was checkout's deploy, not payments."`,
              grade: 'ok', meters: { trust: -1, team: 1 }, next: 'farhan',
              result: `True, and it reads as scoring a point. The 400 people who saw the first post now see a fight.` },
            { text: `Say nothing more. It's fixed.`,
              grade: 'poor', meters: { trust: -1 }, next: 'farhan',
              result: `The only public record says payments was down again. Your team's reputation takes the hit for someone else's change.` }
          ]
        },
        farhan: {
          lines: [{ narrate: `Thursday. You meet Farhan.` }],
          prompt: 'How do you open?',
          options: [
            { text: `"Let's look at what made this easy to get wrong, not whose fault it was. A library change on your side broke the contract with our service, and neither of us had a test for it. Could we add a contract test between our services, and agree that incidents go to the incident channel first?"`,
              grade: 'best', meters: { trust: 1, delivery: 2, team: 1 },
              result: `Farhan agrees to both, and adds one of his own: he will correct his post in the engineering channel himself. You got a better system and a better relationship.` },
            { text: `"Please don't blame my team in public again."`,
              grade: 'ok', meters: { trust: -1, team: 1 },
              result: `A fair request, but on its own it puts Farhan on the defensive. Start with the shared problem; the request lands better after it.` },
            { text: `Ask your manager to raise the post with Farhan's manager.`,
              grade: 'poor', meters: { trust: -2 },
              result: `It turns one bad post into a feud between departments. Talk to Farhan first.` }
          ]
        },
        thread: {
          lines: [
            { narrate: `Farhan replies, and others pile in with their own outage stories. Twenty minutes later the thread has 40 replies, and checkout is still failing.` },
            { who: 'Priya, your manager, privately', say: `Please take this out of the engineering channel and fix it.` }
          ],
          prompt: 'What do you do?',
          options: [
            { text: `Post once more: "Let's take this to the incident channel and a call: customers first, causes after." Then join the call with Farhan's team and work the problem.`,
              grade: 'best', meters: { trust: 1, delivery: 1 },
              result: `The public argument stops. It would have been cheaper to start here.` },
            { text: `Reply to each wrong claim in the thread.`,
              grade: 'ok', meters: { trust: -2, delivery: -1 },
              result: `You may be right on every point, and checkout is still down while you type.` },
            { text: `Leave the thread, and the incident, to Farhan.`,
              grade: 'poor', meters: { trust: -1, delivery: -2 },
              result: `If it is your service, nobody is fixing it. If it isn't, nobody is showing that.` }
          ]
        }
      },
      debrief: {
        points: [
          `In public, during an incident: thank, acknowledge, move the work to the incident channel, and give the time of the next update. Never argue in front of 400 people.`,
          `Customers first, causes after.`,
          `Afterwards, post the facts neutrally and let them speak. Don't score points.`,
          `Talk to the other lead privately, about the system that made the mistake easy, not about the post.`
        ],
        script: `> "Thanks for flagging, Farhan. We're on it, together with your team. Updates in the incident channel every 20 minutes; the next one by 9 pm."`,
        analogy: `Answering blame in a public channel during an outage is debugging production by arguing in the logs. Move to the right channel, stabilise the system, then hold the blameless postmortem. The root cause is almost never "that team is bad".`
      },
      links: ['lesson:difficult-conversations', 'lesson:async-time-zones', 'phrase:public-blame-reply', 'term:postmortem']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'skip-the-kickoff',
      track: 'comms',
      title: `"We don't need a kickoff"`,
      summary: `A new project starts on Monday and the PM wants to skip the kickoff. Practise making the case for one hour that saves weeks: goals, non-goals, who decides, and the risks everyone already knows about.`,
      keywords: ['kickoff', 'kick-off', 'project start', 'new project', 'non-goals', 'roles', 'raci', 'alignment', 'template'],
      role: `You lead the team that will build the new loyalty programme.`,
      setting: `Thursday. The project starts on Monday. Four teams are involved: yours, Platform, Finance and Customer Support.`,
      stakes: `Neha, the PM, says everyone knows what to do and a kickoff is just another meeting. You know that Finance hasn't seen the points rules, Support doesn't know the project exists, and nobody has said who decides scope.`,
      start: 'skip',
      steps: {
        skip: {
          lines: [{ who: 'Neha, PM', say: `We all know what to do. Let's skip the kickoff and start coding on Monday.` }],
          prompt: 'What do you say?',
          options: [
            { text: `"I'd like one hour: not for slides, but to settle three things that will cost us weeks if we don't. What's out of the first release, who decides scope, and whether Finance agrees with the points rules. I'll send a one-page brief beforehand so the hour is for decisions. If those three are already clear, we cancel it."`,
              grade: 'best', meters: { trust: 2, delivery: 2 }, next: 'brief',
              result: `Neha laughs: "If you're writing the brief, fine." Offering to do the work, and to cancel if it isn't needed, removed her objection.` },
            { text: `"Every project should have a kickoff. It's best practice."`,
              grade: 'ok', meters: { trust: -1, delivery: 1 }, next: 'brief',
              result: `"Best practice" isn't a reason Neha cares about. She agrees reluctantly, and expects to be bored.` },
            { text: `Agree, and start on Monday.`,
              grade: 'poor', meters: { delivery: -2 }, next: 'week3',
              result: `You start fast, and four teams start with four different ideas of the project.` }
          ]
        },
        brief: {
          lines: [{ narrate: `You write the brief from the kickoff template. Writing it shows two gaps: nobody knows whether points expire, and Support has never been told about the project.` }],
          prompt: 'What do you do before the meeting?',
          options: [
            { text: `Send the brief two days ahead to everyone, Support and Finance included, with the two open questions listed as "decisions we need in the meeting", each naming the person who should come ready to decide.`,
              grade: 'best', meters: { trust: 1, delivery: 2 }, next: 'meeting',
              result: `Finance replies before the meeting: points must expire after 12 months, for accounting reasons. A rule that would have surfaced in acceptance testing is settled by email.` },
            { text: `Bring the two questions to the meeting as a surprise.`,
              grade: 'ok', meters: { trust: -1, delivery: 1 }, next: 'meeting',
              result: `The right questions, but nobody came ready to decide, so both become actions for next week.` },
            { text: `Leave Support out. They only need to know at launch.`,
              grade: 'poor', meters: { trust: -1, delivery: -1 }, next: 'meeting',
              result: `Support will learn about the programme from the first confused customer.` }
          ]
        },
        meeting: {
          lines: [{ narrate: `The kickoff takes 55 minutes. Two decisions are made. One risk, migrating the old points data, has no owner yet.` }],
          prompt: 'How do you close?',
          options: [
            { text: `Read back the decisions, name an owner and a date for the open risk, and send the summary to everyone the same day, including those who couldn't come.`,
              grade: 'best', meters: { trust: 1, delivery: 2 },
              result: `The summary becomes the reference everyone uses for the first month. When someone asks "did we agree points expire?", the answer is a link.` },
            { text: `Thank everyone and end on time.`,
              grade: 'ok', meters: { delivery: -1 },
              result: `On time, and the open risk leaves the room with nobody holding it.` },
            { text: `Ask everyone to keep their own notes.`,
              grade: 'poor', meters: { delivery: -1, team: -1 },
              result: `Four teams, four sets of notes, four versions of what was decided.` }
          ]
        },
        week3: {
          lines: [{ narrate: `Week three. Finance sees a demo and says points must expire after 12 months; your design keeps them forever. Support asks why nobody told them about a programme launching in six weeks.` }],
          prompt: 'What do you do now?',
          options: [
            { text: `Call a short late kickoff: the four teams, one hour, using the kickoff template (goals, non-goals, who decides, the points rules, what changes in the plan). Tell Neha plainly what the missing hour has cost.`,
              grade: 'best', meters: { trust: 1, delivery: 1 },
              result: `You lose about a week of rework, not the project. For the next project, Neha suggests the kickoff herself.` },
            { text: `Change the expiry rule and carry on.`,
              grade: 'ok', meters: { trust: -1, delivery: 1 },
              result: `One gap fixed. The next ones (Support, the data migration) will surface the same way.` },
            { text: `"Finance should have spoken up earlier."`,
              grade: 'poor', meters: { trust: -2 },
              result: `Nobody asked them. Blame now makes them slower to help when you need their sign-off.` }
          ]
        }
      },
      debrief: {
        points: [
          `A kickoff isn't a ceremony. It settles goals, non-goals, who decides, and the known risks before they cost weeks.`,
          `Make it cheap to say yes: offer to write the brief, keep it to an hour, and offer to cancel if it isn't needed.`,
          `Send the brief beforehand to every team involved, with the decisions you need and the people who should come ready to make them.`,
          `Close with decisions, owners and dates, and send the summary the same day.`
        ],
        script: `> "I'd like one hour: not for slides, but to settle three things that will cost us weeks if we don't. What's out of the first release, who decides scope, and whether Finance agrees with the points rules. I'll send a one-page brief beforehand. If those are already clear, we cancel it."`,
        analogy: `Skipping the kickoff is starting four services with no shared configuration: each boots with its own defaults, and the mismatch shows up as errors weeks later. The kickoff loads one configuration that everyone reads.`
      },
      links: ['template:kickoff', 'lesson:meetings-decisions', 'scenario:forgotten-stakeholder', 'term:kickoff', 'term:non-goals']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'sales-promised-feature',
      track: 'comms',
      title: `Sales promised it to a client`,
      summary: `A salesperson messages you directly: they promised a big client a feature by the end of the month. Practise being helpful without committing your team behind the Product Manager's back.`,
      keywords: ['sales', 'promise', 'client', 'commitment', 'bypass', 'product manager', 'say no', 'deadline', 'customer'],
      role: `You lead the team that builds the merchant dashboard.`,
      setting: `Friday afternoon. Ankit from sales messages you on chat.`,
      stakes: `Ankit promised a large merchant, worth ₹2 crore a year, a "bulk download of invoices" by the 30th, three weeks away. It isn't on the roadmap. He has come to you directly because "the PM takes forever".`,
      start: 'dm',
      steps: {
        dm: {
          lines: [{ who: 'Ankit, sales', say: `Bulk invoice download for MegaMart by the 30th. I promised. Your team can do it, right? The PM takes forever.` }],
          prompt: 'What do you reply?',
          options: [
            { text: `"I want to help you keep MegaMart. I can't commit the team without Meera, our PM, because it would move something she has already promised. Let me find out how big it is by Tuesday and get the three of us together. What exactly does MegaMart need: all invoices for a month, as PDF or CSV?"`,
              grade: 'best', meters: { trust: 2, delivery: 1 }, next: 'facts',
              result: `Ankit is a little frustrated, then relieved that you took it seriously. And he tells you what MegaMart actually asked for: a monthly CSV for their accountant.` },
            { text: `"Sure, we'll do it."`,
              grade: 'poor', meters: { trust: -1, delivery: -2, team: -1 }, next: 'committed',
              result: `Ankit tells MegaMart it's confirmed. Meera has no idea, and your sprint is already full.` },
            { text: `"Please go through the PM."`,
              grade: 'ok', meters: { trust: -1 }, next: 'facts',
              result: `Correct, and cold. Ankit feels brushed off and complains that engineering never helps sales. He does message Meera, who asks you to look into it.` },
            { text: `"Sales shouldn't promise features."`,
              grade: 'poor', meters: { trust: -2 }, next: 'facts',
              result: `True in principle, useless today, and it makes an enemy of someone who brings in revenue. Meera asks you to look into it anyway.` }
          ]
        },
        facts: {
          lines: [{ narrate: `What MegaMart needs is smaller than a "bulk download": a monthly CSV of all invoices, emailed to their accountant. Divya sizes it at 4 days. Meera says the sprint has room only if the merchant-filters story moves.` }],
          prompt: 'What do you bring to Ankit and Meera?',
          options: [
            { text: `Options with their costs: "One: a monthly CSV by email, 4 days, live by the 30th if merchant filters move to next sprint. Two: Support sends MegaMart a manual export this month, and the CSV comes next sprint. Meera decides. Ankit, which would MegaMart accept?"`,
              grade: 'best', meters: { trust: 2, delivery: 2 }, next: 'route',
              result: `Ankit checks with MegaMart: option two is fine this month. Meera keeps her plan, MegaMart gets its invoices, and nobody works a weekend.` },
            { text: `Squeeze the 4 days in without moving anything.`,
              grade: 'ok', meters: { delivery: -1, team: -1 }, next: 'route',
              result: `You just made a full sprint 4 days fuller. Something will slip quietly.` },
            { text: `Tell Ankit it can't be done by the 30th.`,
              grade: 'poor', meters: { trust: -1 }, next: 'route',
              result: `There were two ways to give MegaMart what it needed by the 30th, and you offered neither.` }
          ]
        },
        route: {
          lines: [{ narrate: `It worked this time. Ankit asks: "Next client, what do I do?"` }],
          prompt: 'What do you suggest?',
          options: [
            { text: `Agree a simple route with Meera and Ankit: before promising a date, sales asks the PM, who comes back within two working days with the size and the options. Ankit gets speed; Meera keeps the roadmap.`,
              grade: 'best', meters: { trust: 1, delivery: 2 },
              result: `The next request arrives as "please size this by Wednesday" instead of "I promised". Sales and product start talking before the client does.` },
            { text: `"Just ask me directly next time."`,
              grade: 'ok', meters: { trust: 1, delivery: -1 },
              result: `Friendly, and it makes you the side door around the PM. Your next conflict with Meera is already booked.` },
            { text: `"Don't promise clients anything."`,
              grade: 'poor', meters: { trust: -1 },
              result: `Sales will promise anyway. They just won't tell you first.` }
          ]
        },
        committed: {
          lines: [
            { narrate: `Monday. Meera hears about it from MegaMart's account manager.` },
            { who: 'Meera, PM', say: `You committed to a feature for MegaMart without talking to me? What comes out of the sprint?` }
          ],
          prompt: 'What do you say?',
          options: [
            { text: `"You're right; I shouldn't have. Let me fix it: I'll find out exactly what MegaMart needs today, size it, and bring you options this afternoon, including a manual stopgap for this month. And from now on I'll send sales to you first."`,
              grade: 'best', meters: { trust: 1, delivery: 1 },
              result: `Meera is annoyed but works with you. MegaMart gets a manual export this month and the feature next sprint.` },
            { text: `"Ankit pressured me."`,
              grade: 'ok', meters: { trust: -2 },
              result: `It may be true; it sounds like you can't hold a line. Meera now wonders what else you've agreed to.` },
            { text: `"It's ₹2 crore of revenue. It had to be done."`,
              grade: 'poor', meters: { trust: -1, delivery: -1 },
              result: `Maybe, and it was still Meera's call to make, with the trade-off in front of her.` }
          ]
        }
      },
      debrief: {
        points: [
          `Be helpful, and keep the decision with the PM: "I want to help you keep MegaMart; I can't commit the team without Meera."`,
          `Find out what the client actually needs. "Bulk download" became a monthly CSV, a fraction of the size.`,
          `Bring options with their costs, including a stopgap, and let the person who owns the roadmap decide.`,
          `Fix the route for next time: sales asks the PM, who answers within a set time.`
        ],
        script: `> "I want to help you keep MegaMart. I can't commit the team without Meera, because it would move something she has already promised. Let me size it by Tuesday and get the three of us together. What exactly does MegaMart need: all invoices for a month, as PDF or CSV?"`,
        analogy: `A salesperson going straight to an engineer is a client calling a microservice directly, past the API gateway. It works until it doesn't: no rate limit, no authentication, no record. Route the request through the gateway, and make the gateway fast.`
      },
      links: ['lesson:positive-no', 'scenario:ceo-corridor-ask', 'tool:deadline', 'phrase:no-positive']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'decision-reversed',
      track: 'comms',
      title: `"Nobody asked me": a decision reversed`,
      summary: `A week after a design decision, a senior engineer who wasn't consulted objects, and the team is told to stop. Practise rescuing the decision and fixing how decisions get made.`,
      keywords: ['decision', 'reversed', 'nobody asked me', 'decision record', 'adr', 'consulted', 'raci', 'daci', 'meeting', 'reopen'],
      role: `You lead the search team.`,
      setting: `Monday. Last Tuesday your team and Neha, the PM, decided to use Elasticsearch for product search. Two developers have started.`,
      stakes: `Vinod, a senior engineer in the platform team that runs the shared infrastructure, wasn't asked. He messages Priya, your manager: "Nobody asked me. We don't support Elasticsearch, and Postgres full-text search would do." Priya tells your team to pause.`,
      start: 'paused',
      steps: {
        paused: {
          lines: [{ who: 'Priya, your manager', say: `Vinod says nobody asked him, and platform doesn't support Elasticsearch. Pause until this is sorted.` }],
          prompt: 'What do you do?',
          options: [
            { text: `Talk to Vinod today, first to understand: "You're right that we didn't ask you, and we should have; you run the infrastructure. What would supporting Elasticsearch cost your team? Can we look at our numbers together and settle it by Wednesday?"`,
              grade: 'best', meters: { trust: 2, delivery: 1 }, next: 'numbers',
              result: `Vinod softens. His real worry is being on call for something his team has never run. That is a solvable problem, and a different one from "Postgres would do".` },
            { text: `Tell Priya the decision was made properly, and the team should carry on.`,
              grade: 'poor', meters: { trust: -2, delivery: -1 }, next: 'standoff',
              result: `Priya backs Vinod for now: "Properly would have included platform." The pause goes on, and now it's a standoff.` },
            { text: `Switch to Postgres full-text search to avoid a fight.`,
              grade: 'ok', meters: { delivery: -1, team: -1 },
              result: `Peace, perhaps, but you don't know whether Postgres meets the search requirements. You have swapped one unexamined decision for another.` }
          ]
        },
        numbers: {
          lines: [{ narrate: `You and Vinod check the requirements together: 2 million products, typo tolerance, 95% of searches under 300 ms. Postgres full-text search struggles with typos at that size; Elasticsearch handles them, but someone has to run it.` }],
          prompt: 'How do you settle it?',
          options: [
            { text: `Write a one-page decision record with both options, the numbers, and the cost of running each, including who is on call. Agree with Vinod that he is consulted and that Priya and the platform manager decide. Send it to both of them together.`,
              grade: 'best', meters: { trust: 2, delivery: 2 }, next: 'agreement',
              result: `They choose Elasticsearch as a managed service, with your team on call for the first three months. Vinod signs off, because his concern is in the record and answered.` },
            { text: `Ask Vinod to agree to Elasticsearch as a favour.`,
              grade: 'ok', meters: { trust: -1, delivery: 1 }, next: 'agreement',
              result: `He might agree, and his on-call worry stays unanswered. It will come back at 3 am.` },
            { text: `Let the managers decide, without the details.`,
              grade: 'poor', meters: { delivery: -1 }, next: 'agreement',
              result: `They decide on whoever argues best in the corridor, not on the numbers.` }
          ]
        },
        agreement: {
          lines: [{ narrate: `Work restarts on Thursday. You lost three days.` }],
          prompt: 'What changes so it doesn\'t happen again?',
          options: [
            { text: `For any decision that affects another team, list who must be consulted before deciding (platform for infrastructure, security for data, Finance for money), write the decision down with its reason, and post it with "reply by Friday if you see a problem".`,
              grade: 'best', meters: { trust: 1, delivery: 2, team: 1 },
              result: `The next infrastructure decision takes a day longer to make, and isn't reopened. Three days lost once is cheaper than three days lost every time.` },
            { text: `Invite Vinod to every design meeting.`,
              grade: 'ok', meters: { trust: 1, delivery: -1 },
              result: `Vinod now sits through meetings that don't need him. Consult people on the decisions that affect them, not on everything.` },
            { text: `Decide faster, so there's less time for objections.`,
              grade: 'poor', meters: { trust: -2 },
              result: `Decisions made faster without the right people get reversed faster.` }
          ]
        },
        standoff: {
          lines: [
            { narrate: `Two days of messages between managers. Nobody is building.` },
            { who: 'Priya', say: `I need this resolved. What do you propose?` }
          ],
          prompt: 'What do you propose?',
          options: [
            { text: `"We should have consulted platform; that's on me. I'll sit with Vinod today, put both options and their running costs in a one-page record, and you and the platform manager decide by Wednesday."`,
              grade: 'best', meters: { trust: 1, delivery: 1 },
              result: `The standoff ends the moment you stop defending the process and start fixing the decision.` },
            { text: `"Let's just do what Vinod wants."`,
              grade: 'ok', meters: { delivery: -1 },
              result: `It ends the standoff, and you still don't know whether it meets the search requirements.` },
            { text: `"The decision stands. Platform can adapt."`,
              grade: 'poor', meters: { trust: -2, delivery: -1 },
              result: `Now the platform manager is involved, and you are the obstacle.` }
          ]
        }
      },
      debrief: {
        points: [
          `Decisions that affect another team need that team consulted before, not told after. Ask: "Who runs this, pays for this, or is on call for this?"`,
          `When someone objects, start by understanding the real concern. "Nobody asked me" often hides a solvable one: here, being on call.`,
          `Write the decision down with the options, the numbers and who decided. A decision record survives "nobody asked me".`,
          `Post decisions with a date for objections, so that silence means agreement.`
        ],
        script: `> "You're right that we didn't ask you, and we should have; you run the infrastructure. What would supporting Elasticsearch cost your team? Can we look at our numbers together and settle it by Wednesday?"`,
        analogy: `A decision made without the people it affects is a schema migration run without telling the other services that read the table. It succeeds locally and fails in their next deploy. Tell the consumers before the change, not after the breakage.`
      },
      links: ['lesson:meetings-decisions', 'scenario:forgotten-stakeholder', 'phrase:decision-reply-by', 'term:decision-record', 'term:daci']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'just-build-the-mockup',
      track: 'comms',
      title: `"Stop overthinking, just build the mock-up"`,
      summary: `The PM says your questions are overthinking it and the mock-up is all you need. Practise keeping the work moving with written defaults, without a fight and without building on guesses.`,
      keywords: ['pm', 'mock-up', 'mockup', 'questions', 'overthinking', 'defaults', 'assumptions', 'requirements', 'design'],
      role: `You lead the team building the new returns screen.`,
      setting: `Tuesday. Yesterday you sent Meera, the PM, eight questions about the returns screen.`,
      stakes: `Meera replies that you are overthinking it and should build what's in the mock-up. The mock-up shows only the happy path: one item, returned within 7 days, refunded to a card. Real orders have several items, UPI payments, and returns after 7 days.`,
      start: 'reply',
      steps: {
        reply: {
          lines: [{ who: 'Meera, PM', say: `You're overthinking this. Just build what's in the mock-up.` }],
          prompt: 'What do you do?',
          options: [
            { text: `Cut the list to the three questions that change the build, and propose a default for each, in writing: "Understood. Three things the mock-up doesn't show, and what we'll do unless you say otherwise by Thursday 5 pm. Several items: the customer picks which. UPI: refund to the same UPI handle. After 7 days: the button is hidden. Everything else follows the mock-up."`,
              grade: 'best', meters: { trust: 2, delivery: 2 }, next: 'midbuild',
              result: `Meera replies with one correction ("30 days, not 7") and a thumbs-up for the rest. Defaults turned eight open questions into one answer.` },
            { text: `Build exactly what's in the mock-up, and nothing else.`,
              grade: 'poor', meters: { delivery: -2 }, next: 'demo',
              result: `The team builds a screen that works for one item, refunded to a card, within 7 days. Most real returns are not like that.` },
            { text: `Send the eight questions again, marked "urgent".`,
              grade: 'ok', meters: { trust: -1, delivery: 1 }, next: 'midbuild',
              result: `Meera, already annoyed, feels chased. She answers two of them, and the team starts building on the rest of the mock-up.` }
          ]
        },
        midbuild: {
          lines: [
            { narrate: `The team is building. On Friday, Arjun finds a case nobody covered: a customer returns a second item from an order that was already partly refunded.` },
            { who: 'Arjun', say: `Do we refund the delivery charge again? The mock-up doesn't say, and Meera is in workshops all day.` }
          ],
          prompt: 'What do you do?',
          options: [
            { text: `Decide a sensible default with Arjun that is easy to change (no second delivery refund), note it on the story, and send Meera one line: "Decided while you were out: no second delivery refund on partial returns. Easy to change if you disagree." Keep building.`,
              grade: 'best', meters: { trust: 1, delivery: 2, team: 1 },
              result: `Meera agrees on Monday. The team didn't lose a day waiting, and the PM kept the final say on a decision that could be changed in an hour.` },
            { text: `Stop work on that story until Meera is back.`,
              grade: 'ok', meters: { delivery: -1 },
              result: `Safe, and slow: a day lost on a decision that could have been made, and changed, in an hour.` },
            { text: `Let Arjun decide, and say nothing to Meera.`,
              grade: 'poor', meters: { trust: -1, delivery: 1 },
              result: `Probably the right call, and nobody knows it was made. When a customer complains, Meera finds a rule she never saw.` }
          ]
        },
        demo: {
          lines: [
            { narrate: `At the Sprint Review, Support tries a real order: two items, paid by UPI, returned on day 12.` },
            { who: 'Anil, Support lead', say: `This doesn't work for most of our returns.` }
          ],
          prompt: 'What do you say?',
          options: [
            { text: `"You're right: we built the happy path in the mock-up. Meera, here are the three cases it doesn't cover, with a proposed rule for each. Can we agree them this week? They're about four days of work."`,
              grade: 'best', meters: { trust: 1, delivery: 1 },
              result: `It costs a sprint. Next time you'll send defaults with your questions instead of building to the picture.` },
            { text: `"We built what was in the mock-up."`,
              grade: 'ok', meters: { trust: -2 },
              result: `True, and it sounds like an excuse. You knew the cases existed; that's why you asked.` },
            { text: `"Meera said we were overthinking it."`,
              grade: 'poor', meters: { trust: -2, team: -1 },
              result: `Blaming the PM in front of Support damages the relationship you need to fix it.` }
          ]
        }
      },
      debrief: {
        points: [
          `When a PM pushes back on your questions, cut them to the few that change the build, and propose a default for each.`,
          `Defaults with a deadline keep work moving: "unless you say otherwise by Thursday 5 pm, we'll do X." Silence becomes a decision you can both see.`,
          `Small calls that are easy to change: make them, write them down, tell the PM. Big ones, or ones hard to undo: ask first.`,
          `Never build to a mock-up you know is incomplete without saying what it leaves out.`
        ],
        script: `> "Understood. Three things the mock-up doesn't show, and what we'll do unless you say otherwise by Thursday 5 pm. Several items: the customer picks which. UPI: refund to the same handle. After 7 days: the button is hidden. Everything else follows the mock-up."`,
        analogy: `A default with a deadline is a configuration default with an override. The system runs with sensible values from day one, and anyone who cares can override them. Refusing to start until someone fills in every setting is how nothing ships.`
      },
      links: ['lesson:clarifying-questions', 'lesson:requirements-prd', 'tool:prd', 'phrase:ask-default-proposal']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'simple-change-three-weeks',
      track: 'comms',
      title: `"Why does a simple change take three weeks?"`,
      summary: `A business head asks why adding one field to an invoice takes three weeks. Practise explaining engineering work in business terms, without jargon and without sounding defensive.`,
      keywords: ['explain', 'business', 'stakeholder', 'jargon', 'tech debt', 'plain language', 'estimate', 'why so long', 'non-technical'],
      role: `You lead the billing team.`,
      setting: `A monthly review with Shalini, the head of the business-to-business unit. She is sharp, busy and not technical.`,
      stakes: `Shalini asked for the customer's tax number (GSTIN) on every invoice. You estimated three weeks: the invoice code is old, has no automatic tests, and is shared by three products. In front of her team, she asks why adding one field takes three weeks.`,
      start: 'asked',
      steps: {
        asked: {
          lines: [{ who: 'Shalini, head of B2B', say: `It's one field on an invoice. Why does that take three weeks?` }],
          prompt: 'How do you answer?',
          options: [
            { text: `"Fair question. The field itself takes a day. The rest is safety: the invoice code is shared by three products and has no automatic tests, so any change risks wrong invoices for all three. Two weeks go into adding those tests first. After that, changes like this take days, not weeks."`,
              grade: 'best', meters: { trust: 2, delivery: 1 }, next: 'deadline',
              result: `Shalini nods slowly. "So the next change is faster?" You answered in her terms: the risk to invoices, and the speed of future changes.` },
            { text: `"The invoice module is a legacy monolith with tight coupling and no test coverage, so we need to refactor first."`,
              grade: 'poor', meters: { trust: -1 }, next: 'deadline',
              result: `Every word is accurate, and Shalini understood none of it. "So it's three weeks because of… technical things?"` },
            { text: `"That's what the team estimated."`,
              grade: 'ok', meters: { trust: -2 }, next: 'deadline',
              result: `It sounds as if you don't know why yourself. Shalini starts to doubt the estimate, and you.` }
          ]
        },
        deadline: {
          lines: [{ who: 'Shalini', say: `Our biggest client needs the tax number on their invoices by the 15th, for their audit. That's ten days.` }],
          prompt: 'What do you offer?',
          options: [
            { text: `"Two options. One: for that client only, we add the tax number to their invoices by the 15th through the manual override Finance already uses, and make the safe change for everyone in three weeks. Two: the full change by the 15th without the tests, with a real risk of wrong invoices for all three products. I recommend option one."`,
              grade: 'best', meters: { trust: 2, delivery: 2 }, next: 'followup',
              result: `Shalini picks option one in a minute. The client's audit is covered, and the safe change goes ahead.` },
            { text: `"We'll try to do it in ten days."`,
              grade: 'ok', meters: { trust: -1, delivery: -2 }, next: 'followup',
              result: `"Try" means skipping the tests. If the invoices go wrong, it will be in the month of an audit.` },
            { text: `"It can't be done by the 15th."`,
              grade: 'poor', meters: { trust: -1 }, next: 'followup',
              result: `There was a way to cover the client by the 15th, and you didn't look for it.` }
          ]
        },
        followup: {
          lines: [{ narrate: `After the meeting, Shalini's chief of staff asks for "something we can share about why billing changes are slow".` }],
          prompt: 'What do you send?',
          options: [
            { text: `Half a page in plain language: what makes billing changes slow today (shared code, no tests), what the three weeks buy (future changes in days, fewer invoice errors), and one number: last quarter, four of six billing changes needed an urgent fix after release.`,
              grade: 'best', meters: { trust: 2, delivery: 1 },
              result: `It is forwarded to the CFO, who asks whether the same is true elsewhere. A plain explanation with one number is how tech debt gets funded.` },
            { text: `The architecture diagram, with a few notes.`,
              grade: 'ok', meters: { trust: -1, delivery: 1 },
              result: `Engineers will like it; Shalini's team won't read it. A diagram is not an explanation for a business reader.` },
            { text: `Nothing. The meeting covered it.`,
              grade: 'poor', meters: { trust: -1 },
              result: `A request from a business head's office was a chance to be understood more widely, and it goes unanswered.` }
          ]
        }
      },
      debrief: {
        points: [
          `Answer "why so long?" in the asker's terms: the risk to customers or money, and the speed of future changes. Leave the jargon out.`,
          `Separate the change from the safety work: "the field takes a day; the rest makes it safe".`,
          `When there is a deadline, bring options: a targeted stopgap, the safe change, and the risky shortcut, with your recommendation.`,
          `One concrete number ("four of six changes needed an urgent fix") is worth a page of explanation.`
        ],
        script: `> "Fair question. The field itself takes a day. The rest is safety: the invoice code is shared by three products and has no automatic tests, so any change risks wrong invoices for all three. Two weeks go into adding those tests. After that, changes like this take days, not weeks."`,
        analogy: `Explaining tech debt to a business leader is like explaining latency to a user: they don't care about the call graph, only that the page is slow and what it costs them. Translate the internals into the effect they feel.`
      },
      links: ['lesson:senior-audiences', 'phrase:write-plain-business', 'term:tech-debt', 'scenario:steering-unknown-answer']
    }
  );
})(window.LELT);
