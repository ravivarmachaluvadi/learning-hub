/*
 * scenarios-pm.js - project management scenarios: deadlines, estimates, priorities, status,
 * bad news and dependencies on other teams.
 *
 * The entry format (all scenario files share it; js/views/scenarios.js plays them):
 *   {id, track, title, summary, keywords, role, setting, stakes, start: 'step id',
 *    steps: {stepId: {lines: [{who, say} | {narrate}], prompt,
 *                     options: [{text, grade: 'best'|'ok'|'poor', meters: {trust, delivery, team},
 *                                result, next: 'step id' (omit to end)}]}},
 *    debrief: {points: [...], script, analogy}, links: ['phrase:id', 'tool:id', ...]}
 * Each decision has 3 or 4 options and exactly one "best". Meters move from -2 to +2 per choice.
 * Text is Markdown-lite (see LELT.md); it is written in backticks so quotes need no escaping.
 */
(function (U) {
  'use strict';
  U.data.scenarios = U.data.scenarios || [];
  U.data.scenarios.push(

    /* ------------------------------------------------------------------ */
    {
      id: 'one-week-ask',
      track: 'pm',
      title: `The one-week ask`,
      summary: `Your manager wants a big feature in one week, and wants the answer now. Practise not saying "yes" or "impossible" on the spot.`,
      keywords: ['deadline', 'one week', 'commitment', 'say yes', 'unrealistic', 'pressure', 'options', 'negotiate'],
      role: `You lead a team of five Java developers on the payments product. Two weeks ago you were a senior engineer on the same team.`,
      setting: `Thursday, 11 am. Priya, your engineering manager, comes to your desk straight from a meeting with the business.`,
      stakes: `Customer refunds touch the payment gateway, the ledger and the customer app. Your gut says six to eight weeks. Say yes and the team burns out and still misses; say a flat no and you look unhelpful in your first month.`,
      start: 'ask',
      steps: {
        ask: {
          lines: [{ who: 'Priya, your manager', say: `Leadership wants customer refunds live before the festive sale. Can your team finish it in one week? I've told them we're a strong team.` }],
          prompt: 'What do you say right now?',
          options: [
            { text: `"I want to give you an answer you can rely on. Let me break it down with the team and come back by 4 pm today with what fits in one week and what doesn't."`,
              grade: 'best', meters: { trust: 1, delivery: 1 }, next: 'present',
              result: `Priya hesitates (she wanted a yes) but agrees: "4 pm, then. They're asking me today." You bought five hours to turn a guess into a plan, and you named a specific time, which keeps her trust while you think.` },
            { text: `"Sure, we'll make it happen."`,
              grade: 'poor', meters: { trust: -1, delivery: -2, team: -2 }, next: 'yes-path',
              result: `Priya is relieved and tells leadership it's done. You've just committed your team to a date nobody estimated. Her trust in you right now is borrowed against a date that will slip.` },
            { text: `"One week is impossible. That's at least two months of work."`,
              grade: 'poor', meters: { trust: -2, team: 1 }, next: 'pushback',
              result: `You may well be right, but you gave a number without breaking anything down, and a flat "impossible" leaves Priya with nothing to take back to leadership.` },
            { text: `"Let me ask the team in tomorrow's stand-up and get back to you."`,
              grade: 'ok', meters: { trust: -1, delivery: 1 }, next: 'present',
              result: `Asking the team is right, but tomorrow is too slow when leadership wants an answer today, and "get back to you" has no time. Priya says, "I need something today." You agree to come back by 4 pm.` }
          ]
        },
        present: {
          lines: [
            { narrate: `You spend an hour with Sameer and Divya. The breakdown: refund API and ledger entries, 2 weeks; the bank's refund API, 2 to 3 weeks (their sandbox is slow); customer app screens, 1 week; a reconciliation report for Finance, 1 week; testing and the security review, 1 to 2 weeks. With five developers working in parallel, 5 to 8 weeks is realistic. In one week you could ship one useful slice: support agents issue refunds from an internal admin screen, for orders under ₹5,000.` },
            { who: 'Priya, at 4 pm', say: `So? Can we do it in a week?` }
          ],
          prompt: 'How do you present it?',
          options: [
            { text: `"Not all of it. Three options. One: in a week, support agents can refund orders under ₹5,000 from an admin screen, with a daily check by Finance. Two: the full self-service flow in 6 to 8 weeks. Three: about 5 weeks, if we pause the loyalty work and get the bank's sandbox by Monday. Which matters most for the sale?"`,
              grade: 'best', meters: { trust: 2, delivery: 2, team: 1 },
              result: `Priya can take a real choice to leadership. They pick option one for the sale and option two straight after. You turned "yes or no" into "which trade-off", and the decision now sits with the people who own the business priority.` },
            { text: `"The whole thing needs 6 to 8 weeks. Sorry, there's no way to do it in one."`,
              grade: 'ok', meters: { trust: 1, team: 1 },
              result: `Honest, and far better than a guess. But you brought only a "no". Priya now has to invent the alternatives herself, and the one-week slice you found stays in your head. Leaders remember who brought options.` },
            { text: `"We can try to do it in a week if the team works the weekend."`,
              grade: 'poor', meters: { trust: -1, delivery: -2, team: -2 },
              result: `Extra hours don't make the bank's sandbox faster or the security review shorter. The team burns a weekend for a date that still slips, and "try" tells Priya nothing she can plan on.` },
            { text: `"It's 5 to 8 weeks. I'll send you the breakdown."`,
              grade: 'ok', meters: { trust: 1, delivery: 1 },
              result: `The range is honest and the breakdown helps, but it leaves Priya to do the trade-off thinking alone. Add the options, including the one-week slice, and she can decide in the meeting.` }
          ]
        },
        'yes-path': {
          lines: [
            { narrate: `Monday. The team has broken the work down: it's 5 to 8 weeks. Priya has already told leadership "one week".` },
            { who: 'Sameer, senior developer', say: `Who promised one week? The bank's sandbox alone takes three days to get access to.` }
          ],
          prompt: 'What do you do now?',
          options: [
            { text: `"I did, and I was wrong to answer before we estimated. I'll go to Priya today with the real range and an option that ships something useful this week."`,
              grade: 'best', meters: { trust: 2, delivery: 1, team: 2 },
              result: `Uncomfortable, but correcting a bad commitment on day 2 costs far less than on day 7. Priya is annoyed, yet she can still reset expectations before the sale. Your team watches you own a mistake, which makes it safer for them to own theirs.` },
            { text: `"Let's just push hard. I'll cancel the leave requests for this week."`,
              grade: 'poor', meters: { trust: -1, delivery: -1, team: -2 },
              result: `The date still slips, now with a tired, resentful team and a manager who is surprised on day 7 instead of day 2.` },
            { text: `"Leadership wants it; it's not our call. Do what you can."`,
              grade: 'poor', meters: { trust: -1, team: -2 },
              result: `You passed the pressure straight down and the blame straight up. The team learns that your "yes" means their weekend.` }
          ]
        },
        pushback: {
          lines: [{ who: 'Priya', say: `Everything is impossible with you engineers. I need something I can take back to leadership today.` }],
          prompt: 'How do you recover?',
          options: [
            { text: `"You're right, 'impossible' doesn't help you. Give me until 4 pm: I'll come back with what we can ship in a week and what the full feature really takes."`,
              grade: 'best', meters: { trust: 2 }, next: 'present',
              result: `Recovering quickly matters more than the first sentence. Priya relaxes: she will get something useful today.` },
            { text: `"I'm just being realistic. You can't rush payments code."`,
              grade: 'poor', meters: { trust: -2, delivery: -1 },
              result: `True in principle, but you're defending your position instead of solving Priya's problem. She goes to leadership without your input, and the date gets decided without you.` },
            { text: `"Fine, tell them two months."`,
              grade: 'ok', meters: { trust: -1, delivery: 1 },
              result: `A number with no breakdown and no options sounds like padding. Leadership pushes back, and Priya has nothing to defend it with.` }
          ]
        }
      },
      debrief: {
        points: [
          `Never answer a deadline on the spot. Ask for a short, specific time to come back: *"by 4 pm today"*, not *"later"*.`,
          `Break the work down with the people who will do it. A range from a breakdown beats a single number from your gut.`,
          `Bring **options**, not a yes or a no: a smaller slice by the date, the full scope by a later date, or the full scope sooner if something else stops.`,
          `Let the person who owns the business priority choose the trade-off. Your job is to make the trade-off visible.`,
          `If you already said yes too fast, correct it the same day. A wrong commitment gets more expensive every day it stands.`
        ],
        script: `> "I want to give you a date you can rely on, so let me break it down with the team and come back by 4 pm."
>
> (At 4 pm) "Here is what fits. In one week, support agents can refund orders under ₹5,000 from an admin screen. The full self-service flow is 6 to 8 weeks, or about 5 if we pause the loyalty work. Which of these matters most for the sale?"`,
        analogy: `A deadline asked on the spot is a request with no timeout: you either block (say yes and suffer) or fail fast (say "impossible"). The better pattern is to answer *202 Accepted* with a time to check back: "I'll come back by 4 pm."`
      },
      links: ['phrase:deadline-come-back', 'phrase:deadline-options', 'scenario:estimate-from-one-line', 'scenario:ai-makes-it-faster', 'tool:status']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'estimate-from-one-line',
      track: 'pm',
      title: `Estimate this by EOD`,
      summary: `A one-line requirement and a request for "just a rough number". Practise giving an estimate people can plan with.`,
      keywords: ['estimate', 'estimation', 'rough number', 'range', 'assumptions', 'high level', 'planning', 'spike'],
      role: `You lead a five-person team.`,
      setting: `10 am. Neha, the Product Manager, messages you on Teams.`,
      stakes: `Your number goes into a quarterly plan shown to leadership. Whatever you say first becomes "the date" in people's heads.`,
      start: 'ask',
      steps: {
        ask: {
          lines: [
            { who: 'Neha, Product Manager', say: `Hi! Need a quick estimate for the new loyalty points module by EOD. Leadership is planning Q1. Just a rough number is fine 🙂` },
            { narrate: `The only written requirement is one line on a slide: "Customers earn and redeem loyalty points on every order."` }
          ],
          prompt: 'What do you reply?',
          options: [
            { text: `"Happy to. To make it useful for planning, I'll give you a range with my assumptions by 5 pm. Three quick questions first: can points be redeemed at checkout in phase 1, or only earned? Do they expire? Does Finance need them reported as a liability?"`,
              grade: 'best', meters: { trust: 2, delivery: 1 }, next: 'range',
              result: `You took "rough" seriously without refusing. The questions are specific, so Neha can answer them in minutes, and they matter: "redeem at checkout" alone can double the work.` },
            { text: `"Roughly 3 weeks."`,
              grade: 'poor', meters: { trust: -1, delivery: -2 }, next: 'anchored',
              result: `A single number from your gut. Neha writes "3 weeks" into the plan. Rough numbers don't stay rough: once written down, they become a commitment.` },
            { text: `"I can't estimate this without a proper PRD."`,
              grade: 'ok', meters: { trust: -1, delivery: 1 }, next: 'range',
              result: `True that one line isn't enough, but a flat refusal leaves Neha with nothing for today's planning. Asking the three questions that matter most would have got you most of the way. She answers them anyway when you push.` },
            { text: `"Let me get back to you."`,
              grade: 'ok', meters: { trust: -1 }, next: 'range',
              result: `No time and no questions, so Neha has to chase you at 6 pm. "Get back to you" without a time is a promise nobody can plan on.` }
          ]
        },
        range: {
          lines: [
            { narrate: `The answers: points are earned and redeemed at checkout in phase 1, they expire after 12 months, and Finance needs a monthly liability report. You and Sameer list the parts: a points ledger (high confidence), an earning rules engine (medium), redemption at checkout, which touches the payment flow (low confidence: you've never changed checkout), an expiry job, the Finance report, admin screens, and testing.` },
            { who: 'Neha', say: `So what's the number?` }
          ],
          prompt: 'How do you give the estimate?',
          options: [
            { text: `"8 to 14 weeks with the current team, most likely about 10. The wide part is redemption at checkout, which we've never changed. A 3-day spike would narrow it to within 2 weeks. Assumptions: 5 developers, no other big project, Finance's report format agreed by week 2."`,
              grade: 'best', meters: { trust: 2, delivery: 2 },
              result: `A range, why it's wide, how to narrow it, and what it rests on. If an assumption changes (someone moves to another team), everyone can see why the date moves.` },
            { text: `"10 weeks."`,
              grade: 'ok', meters: { trust: 1, delivery: -1 },
              result: `Probably your most likely number, but a single figure hides the uncertainty. When redemption turns out hard, 10 becomes 13 and you look late, even though your estimate was reasonable.` },
            { text: `"14 weeks, to be safe."`,
              grade: 'poor', meters: { trust: -1, delivery: 1 },
              result: `Quietly padding to the top protects you, but it hides that most of the risk sits in one part. The plan may drop the feature as too slow when a spike could have shown it's 9 weeks. And once people discover padding, they start cutting all your numbers.` },
            { text: `"Somewhere between 1 and 6 months; hard to say."`,
              grade: 'ok', meters: { trust: -2, delivery: -1 },
              result: `Honest about uncertainty, but a range that wide is useless for planning. Narrow it by naming where the uncertainty comes from and how you'll reduce it.` }
          ]
        },
        anchored: {
          lines: [{ narrate: `Two days later you look at it properly: redemption at checkout, expiry, a Finance report. It's more like 8 to 14 weeks. The Q1 plan, with "3 weeks" in it, goes to leadership on Monday.` }],
          prompt: 'What do you do?',
          options: [
            { text: `Message Neha today: "I gave you 3 weeks too fast, before I understood redemption and the Finance report. Broken down, it's 8 to 14 weeks; a 3-day spike will narrow it. Sorry for the churn; better now than after Monday."`,
              grade: 'best', meters: { trust: 1, delivery: 2 },
              result: `Before the plan is presented is the cheapest moment to correct it. Neha isn't happy, but she can fix the plan, and she learns that your corrections come early.` },
            { text: `Stay quiet and try to hit 3 weeks by cutting tests.`,
              grade: 'poor', meters: { trust: -2, delivery: -2, team: -1 },
              result: `You'll miss 3 weeks anyway, and ship untested payment code on the way. The correction you avoided now arrives as an incident.` },
            { text: `Wait for the planning meeting and raise it there.`,
              grade: 'poor', meters: { trust: -2, delivery: 1 },
              result: `The right information at the worst moment: Neha gets surprised in front of leadership. Always tell the person privately first.` }
          ]
        }
      },
      debrief: {
        points: [
          `An estimate is a **range plus its assumptions**, not one number. Say the most likely value, and what makes the range wide.`,
          `"Rough" numbers become commitments as soon as someone writes them down. Treat every number you give as one you'll be held to.`,
          `Before giving a number, ask the two or three questions that change the size most (here: redemption at checkout, the Finance report).`,
          `Name where the uncertainty is and how you'll reduce it: a short spike, a prototype, an answer from another team.`,
          `An estimate (what it takes), a target (what the business wants) and a commitment (what you promise after comparing the two) are three different things.`
        ],
        script: `> "8 to 14 weeks with the current team, most likely about 10. The uncertainty is redemption at checkout, which we've never changed; a 3-day spike will narrow it to within 2 weeks. This assumes 5 developers and no other big project. I'll send the breakdown so you can see what drives it."`,
        analogy: `Give an estimate the way you describe latency: a p50 and a p90, not one number. "Most likely 10 weeks, 14 at worst" tells a planner what "p50 120 ms, p90 400 ms" tells an SRE.`
      },
      links: ['phrase:estimate-range', 'phrase:estimate-assumptions', 'lesson:points-velocity', 'scenario:one-week-ask', 'term:cone-of-uncertainty']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'two-urgent-asks',
      track: 'pm',
      title: `Two managers, two urgent asks`,
      summary: `A sales director and a product manager both say their request is urgent, and you have room for one. Practise turning "urgent" into facts and a decision.`,
      keywords: ['urgent', 'priority', 'prioritise', 'prioritize', 'everything is urgent', 'two managers', 'conflict', 'trade-off'],
      role: `You lead the checkout team.`,
      setting: `Tuesday morning. Two messages arrive within ten minutes. Your team has room for one of them this week, on top of the current sprint.`,
      stakes: `Whoever you disappoint will remember it. Try to do both and you'll probably deliver neither well.`,
      start: 'ask',
      steps: {
        ask: {
          lines: [
            { who: 'Vikram, Sales Director', say: `Our biggest B2B client needs bulk order upload by Friday or they will walk. This is URGENT.` },
            { who: 'Neha, Product Manager', say: `The checkout bug that double-charges some UPI payments is getting customer complaints. Need a fix this week, top priority!` }
          ],
          prompt: 'What do you do first?',
          options: [
            { text: `Find the facts behind each "urgent" before deciding: how many customers are double-charged and how much money; what exactly the client needs on Friday, and what happens if it's Monday. Then take both to the person who owns your team's priorities.`,
              grade: 'best', meters: { trust: 1, delivery: 1 }, next: 'facts',
              result: `"Urgent" is a feeling; impact and deadline are facts. Ten minutes of questions turns two loud asks into two things you can compare.` },
            { text: `Say yes to both and ask the team to stretch.`,
              grade: 'poor', meters: { trust: -1, delivery: -2, team: -2 }, next: 'both',
              result: `Both people are happy, for now. You've promised two weeks of work in one.` },
            { text: `Pick the double-charge bug yourself, because customer money matters most, and tell Vikram no.`,
              grade: 'ok', meters: { trust: -1, delivery: 1 },
              result: `Your instinct may be right: taking money twice is serious. But you made a business trade-off alone and told a director "no" without your manager knowing. Even right decisions land badly when the other side isn't heard, and you never checked whether both could fit in smaller form.` },
            { text: `Do whichever was asked first.`,
              grade: 'poor', meters: { trust: -1, delivery: -1 },
              result: `The order of arrival isn't a priority. You may spend the week on the less important one, and you can't explain why to the other person.` }
          ]
        },
        facts: {
          lines: [
            { narrate: `The facts: the UPI double-charge hits about 40 customers a day; ₹2.1 lakh has been refunded by hand so far, and support is overloaded. A fix is about 2 days. The bulk upload: the client's renewal meeting is on Friday and they want a demo, not production use. A demo-only CSV upload of 500 rows is about 2 days; the full feature is 2 weeks.` }
          ],
          prompt: 'How do you bring it to Priya, your manager, who sets the team\'s priorities?',
          options: [
            { text: `"Two asks, room for one this week, but both fit if we keep them small. Double-charge: 40 customers a day, ₹2.1 lakh refunded so far, 2-day fix. Bulk upload: renewal demo on Friday; a demo-only CSV upload is 2 days, the full feature 2 weeks. I propose the fix Mon to Tue, the demo version Wed to Thu, the full upload next sprint. Agree?"`,
              grade: 'best', meters: { trust: 2, delivery: 2, team: 1 },
              result: `You did the thinking, proposed an order, and left the final call with the person who owns it. Often the answer is "both, smaller", and you only find it by asking what the deadline really needs.` },
            { text: `Ask Priya to choose between the two, with the facts but no recommendation.`,
              grade: 'ok', meters: { trust: 1, delivery: 1 },
              result: `The right person decides, with facts. But you added work to her day: "here's what I'd do, do you agree?" is faster to answer than "which one?", and you're closest to the detail.` },
            { text: `Forward both messages to Priya with "Please advise."`,
              grade: 'poor', meters: { trust: -1, delivery: -1 },
              result: `"Please advise" hands over the problem without the facts you found. Priya has to redo your investigation, and you look like a router rather than a lead.` }
          ]
        },
        both: {
          lines: [
            { narrate: `Thursday. The team has worked late two nights. The double-charge fix is half done, with a bug in the retry path. The bulk upload works for 50 rows but times out at 500.` },
            { who: 'Vikram', say: `Is the upload ready for tomorrow's demo?` }
          ],
          prompt: 'What now?',
          options: [
            { text: `Tell both people the truth today, with what you can still deliver: the demo with 50 rows, and the double-charge fix on Monday, with manual refunds daily until then. Then take the lesson: compare before accepting.`,
              grade: 'best', meters: { trust: 1, delivery: 1, team: 1 },
              result: `A late correction, but an honest and useful one. Both people can still plan, and the team stops working nights for a promise that couldn't be kept.` },
            { text: `Tell Vikram it's ready and hope nobody tests 500 rows.`,
              grade: 'poor', meters: { trust: -2, delivery: -1 },
              result: `If the demo fails in front of the client, Vikram loses the deal and you lose Vikram's trust for good.` },
            { text: `Pull an all-nighter to finish both.`,
              grade: 'poor', meters: { delivery: -1, team: -2 },
              result: `Tired people write the retry bugs that double-charge customers. You may finish one, and break something on the way.` }
          ]
        }
      },
      debrief: {
        points: [
          `"Urgent" is a feeling. Ask for the facts behind it: the impact, the real deadline, and what happens if it's late.`,
          `The deadline often needs much less than the full ask: a demo, a workaround, a manual process. Find the smallest thing that meets it.`,
          `When two asks compete, make the trade-off visible and **recommend** an order. Let the person who owns priorities confirm.`,
          `Saying yes to two things you can only do one of is saying no to both, later.`
        ],
        script: `> "I have room for one of these this week, so I want to get the order right. Double-charge: 40 customers a day, a 2-day fix. Bulk upload: a demo on Friday, which a 2-day CSV upload covers. I propose the fix first, then the demo version, and the full upload next sprint. Does that work, or should the demo go first?"`,
        analogy: `Two urgent asks are two threads wanting one lock. Without a fair scheduler you get contention, and both wait. The person who owns priorities is the scheduler; your job is to give them the facts to schedule well.`
      },
      links: ['phrase:priority-choose', 'phrase:priority-facts', 'phrase:priority-recommend', 'scenario:scope-creep-mid-sprint', 'scenario:saying-no-to-manager']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'status-in-progress',
      track: 'pm',
      title: `"What's the status?" in a public channel`,
      summary: `A director asks for status in front of 30 people, and you're about to type "in progress". Practise a status update that answers the real question.`,
      keywords: ['status', 'in progress', 'update', 'director', 'report', 'rag', 'amber', 'migration', 'public channel'],
      role: `You lead the team moving the order service out of the monolith into its own Spring Boot service.`,
      setting: `A director posts in the project's Teams channel, where 30 people can see.`,
      stakes: `The migration is a week behind: copying the data is slower than planned. Nobody outside your team knows yet.`,
      start: 'ask',
      steps: {
        ask: {
          lines: [
            { who: 'Rahul, Director of Engineering', say: `@you what's the status of the order service migration?` },
            { narrate: `You start typing: "In progress, will update soon".` }
          ],
          prompt: 'What do you post?',
          options: [
            { text: `"Order service migration: AMBER. Code and tests are done. The data copy is the problem: 40 million orders at 1 million an hour, so the cut-over moves from Sat 7 Nov to Sat 14 Nov, unless Platform gives us a bigger database instance (asked today, answer by Wed). Full update in Friday's report."`,
              grade: 'best', meters: { trust: 2, delivery: 1 }, next: 'followup',
              result: `In one message Rahul knows the status, the cause, the new date, and what could save the old one. Bad news delivered early, with numbers and a plan, builds more trust than good news delivered late.` },
            { text: `"In progress, will update soon."`,
              grade: 'poor', meters: { trust: -2 }, next: 'chased',
              result: `It answers nothing. Rahul has to ask again, and in a public channel it reads as "they don't know". Vague updates look like hiding, even when you aren't.` },
            { text: `"Mostly on track, a few issues with the data copy. Will share details."`,
              grade: 'ok', meters: { trust: -1 }, next: 'chased',
              result: `Better than nothing, but "mostly on track" and "a few issues" are exactly the words that make a director worry without knowing how much. And it isn't on track: the date has moved.` },
            { text: `"All good, on track!"`,
              grade: 'poor', meters: { trust: -2, delivery: -1 },
              result: `Saturday 7 Nov arrives and the copy is at 60%. The cut-over is cancelled at midnight, the marketing campaign has to move, and everyone remembers your "all good". That's a watermelon: green outside, red inside.` }
          ]
        },
        followup: {
          lines: [{ who: 'Rahul', say: `Thanks, that's clear. Why are we only hearing about the data copy now?` }],
          prompt: 'How do you answer?',
          options: [
            { text: `"Fair question. We found it in Monday's test copy; I should have flagged it then instead of waiting for the weekly report. From now on I'll post risks the day we find them."`,
              grade: 'best', meters: { trust: 2 },
              result: `Owning it plainly, with the change you'll make, ends the topic. Excuses would have kept it going.` },
            { text: `"We were still measuring the copy speed, to be sure before raising it."`,
              grade: 'ok', meters: { trust: -1, delivery: 1 },
              result: `Measuring was useful, but this sounds like a reason for waiting. Leaders prefer "early and uncertain" to "late and certain": "We may have a problem with the copy speed; I'll know by Wednesday."` },
            { text: `"Platform gave us a small database; it's not really our fault."`,
              grade: 'poor', meters: { trust: -2 },
              result: `Blaming another team in a public channel turns the people you need for the fix into opponents, and still doesn't answer the question.` }
          ]
        },
        chased: {
          lines: [{ who: 'Rahul, an hour later, in a private message', say: `I need to know if Sat 7 Nov is still the date. The marketing campaign depends on it.` }],
          prompt: 'What do you reply?',
          options: [
            { text: `"No, it isn't, and I should have said so in the channel. The data copy is slower than planned; the cut-over moves to Sat 14 Nov unless Platform gives us a bigger database instance, which I'll know by Wednesday. I'll post this in the channel now so everyone has it."`,
              grade: 'best', meters: { trust: 1, delivery: 1 },
              result: `A late recovery, but a complete one: a clear answer, the cause, the new date and what could change it. And you fix the public record too.` },
            { text: `"Probably, if the copy speeds up. I'll confirm later this week."`,
              grade: 'poor', meters: { trust: -2, delivery: -1 },
              result: `"Probably" plus "later this week" means marketing keeps planning for a date you already know is at risk.` },
            { text: `"Let me check with the team and get back to you this afternoon."`,
              grade: 'ok', meters: { trust: -1 },
              result: `Better than guessing, but you're the lead: you should already know the cut-over is at risk. Rahul notices that you had to go and find out.` }
          ]
        }
      },
      debrief: {
        points: [
          `A status update exists so someone else can decide without calling you. "In progress" gives them nothing to decide with.`,
          `In one message: the colour, what's done, the problem with numbers, the new date, and what could change it.`,
          `Bad news early, with a plan, builds trust. Bad news late destroys it, even when the delay wasn't your fault.`,
          `Answer where you were asked. A vague reply in a public channel reads as "they don't know".`,
          `"On track" without a date, and "a few issues" without names, make readers worry more, not less.`
        ],
        script: `> "Order service migration: **AMBER**. Code and tests are done. The data copy is slower than planned (1 million orders an hour, for 40 million), so the cut-over moves from Sat 7 Nov to Sat 14 Nov, unless Platform gives us a bigger database instance; I'll know by Wednesday. Next update Friday."`,
        analogy: `"In progress" is a health check that always returns 200: it tells the caller the process is alive, not whether it can serve the request. A good status is a readiness probe: it names the failing dependency and when it will recover.`
      },
      links: ['tool:status', 'phrase:status-bluf', 'phrase:status-in-progress', 'scenario:bad-news-early']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'bad-news-early',
      track: 'pm',
      title: `The release will slip, and nobody knows yet`,
      summary: `You find a problem on Tuesday that will probably break Friday's release. Practise telling your manager early, and well.`,
      keywords: ['bad news', 'delay', 'slip', 'risk', 'escalate early', 'release', 'watermelon', 'surprise'],
      role: `You lead the mobile checkout release.`,
      setting: `Tuesday evening. The release is planned for Friday. Your team has just found that the new address form fails for pincodes in 3 states with the courier partner's API. A fix needs the courier's help, and they usually reply in 2 to 3 days.`,
      stakes: `Marketing has a campaign booked for Friday. Priya, your manager, will be asked about the release in Thursday's leadership meeting.`,
      start: 'when',
      steps: {
        when: {
          lines: [{ narrate: `Priya hasn't asked about the release this week. You'd prefer to have a solution before raising it.` }],
          prompt: 'When do you tell Priya?',
          options: [
            { text: `Tonight or first thing tomorrow, with what you know and your options.`,
              grade: 'best', meters: { trust: 2, delivery: 1 }, next: 'how',
              result: `The earlier Priya knows, the more options she has: move the campaign, ship without those states, or push the courier through her contacts. Every day you wait removes one.` },
            { text: `On Thursday, after you hear from the courier, so you can bring the complete picture.`,
              grade: 'ok', meters: { trust: -1, delivery: -1 }, next: 'late',
              result: `A complete picture sounds responsible, but Thursday is the leadership meeting. Priya walks in without knowing, and the campaign is hard to move with a day's notice.` },
            { text: `On Friday morning, once you're sure the fix won't land.`,
              grade: 'poor', meters: { trust: -2, delivery: -2 }, next: 'late',
              result: `By Friday there are no options left, only the bad news.` },
            { text: `Not at all. Quietly ask the team to find a workaround in time.`,
              grade: 'poor', meters: { trust: -2, team: -1 }, next: 'late',
              result: `The team works late on a hidden problem, and Priya finds out last. Hiding a risk from your manager is the fastest way to lose their trust.` }
          ]
        },
        how: {
          lines: [{ narrate: `You decide to message Priya first thing tomorrow.` }],
          prompt: 'How do you tell her?',
          options: [
            { text: `"Heads-up on Friday's release: AMBER. The new address form fails for pincodes in 3 states with the courier's API, about 8% of orders. Options: 1) release Friday with the old form for those 3 states, which is safe; 2) move the release to Wednesday after the courier's fix; 3) you escalate with the courier for a fix by Thursday. I recommend option 1. Can we decide by noon?"`,
              grade: 'best', meters: { trust: 2, delivery: 2 },
              result: `Priya reads it in 30 seconds and picks option 1 by 10 am. Marketing keeps its date. She tells the leadership meeting about the risk herself, looking in control because she is.` },
            { text: `"We have a problem with the courier API; the release may slip. Will keep you posted."`,
              grade: 'ok', meters: { trust: 1, delivery: -1 },
              result: `Early is good, but "may slip" and "keep you posted" give her nothing to act on: no size, no options, no time for the next update.` },
            { text: `A long email explaining the technical root cause in detail, ending with "so the release is at risk".`,
              grade: 'poor', meters: { trust: -1, delivery: -1 },
              result: `The decision she needs is buried at the bottom. Put the bottom line first, then the options, then the detail for anyone who wants it.` }
          ]
        },
        late: {
          lines: [
            { narrate: `In Thursday's leadership meeting, the head of marketing mentions Friday's campaign. Priya says the release is on track; nobody told her otherwise. You tell her on Friday morning.` },
            { who: 'Priya', say: `Why am I hearing this now? I told the leadership team yesterday we were on track.` }
          ],
          prompt: 'What do you say?',
          options: [
            { text: `"You're right, and I'm sorry. I knew on Tuesday and waited to be sure. That was the wrong call; you needed the chance to decide. Here are the options now…" And from now on, tell her about risks the day you find them.`,
              grade: 'best', meters: { trust: 1, delivery: 1 },
              result: `It doesn't undo yesterday, but owning it without excuses, and moving straight to options, is the fastest way to rebuild.` },
            { text: `"The courier only confirmed this morning; I couldn't have known for sure."`,
              grade: 'poor', meters: { trust: -2 },
              result: `It's true and beside the point. You knew enough on Tuesday to warn her. The excuse tells her you'd do it again.` },
            { text: `"The team found it late; I only heard yesterday."`,
              grade: 'poor', meters: { trust: -2, team: -2 },
              result: `It isn't true, and it blames your team for your timing. If Priya ever checks, you lose her trust and your team's.` }
          ]
        }
      },
      debrief: {
        points: [
          `Tell your manager about a risk the day you find it, while there's still time to choose. "Early and uncertain" beats "late and certain".`,
          `Bring the bad news with its size (8% of orders), options, your recommendation, and when you need a decision.`,
          `Bottom line first; detail after, for anyone who wants it.`,
          `Never let your manager be surprised in front of their own leadership. That's the fastest way to lose their trust.`
        ],
        script: `> "Heads-up on Friday's release: it's AMBER. The new address form fails for 3 states with the courier's API, about 8% of orders. Options: release Friday with the old form for those states, move to Wednesday, or you escalate with the courier. I recommend the first. Can we decide by noon?"`,
        analogy: `Raising a risk late is like catching an exception and only logging it. The caller (your manager) carries on with bad state and fails later, further from the cause, where it costs much more to fix. Propagate it now, with context.`
      },
      links: ['phrase:status-bad-news', 'phrase:status-bluf', 'tool:status', 'scenario:status-in-progress']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'team-never-replies',
      track: 'pm',
      title: `The team that never replies`,
      summary: `Your release needs work from another team, and they haven't answered in 8 days. Practise getting help from people who don't report to you.`,
      keywords: ['dependency', 'other team', 'cross-team', 'not supportive', 'unhelpful', 'escalation', 'escalate', 'blocked', 'platform team'],
      role: `You lead the payments team.`,
      setting: `Your refund feature needs a new endpoint from the Platform team, who own the shared customer service. You messaged their lead, Kiran, on Teams 8 days ago. No reply. Your release is in 3 weeks, and the endpoint needs about a week of their work.`,
      stakes: `If the endpoint isn't ready within 2 weeks, your release slips. Platform serves 12 teams, and your request isn't on their board.`,
      start: 'first',
      steps: {
        first: {
          lines: [{ narrate: `Still no reply from Kiran.` }],
          prompt: 'What do you do next?',
          options: [
            { text: `Ask Kiran for a short call: understand their priorities, explain your impact and the date you need, and agree something specific. Then follow up in writing.`,
              grade: 'best', meters: { trust: 1, delivery: 1 }, next: 'call',
              result: `Kiran accepts a 15-minute call for the next morning. A conversation gets you context that ten chat messages never would.` },
            { text: `Escalate to your manager and Kiran's manager straight away: "Platform is blocking us."`,
              grade: 'poor', meters: { trust: -1, delivery: 1 }, next: 'escalated',
              result: `Escalating before a direct conversation makes Kiran look bad to their manager for something they may not know is urgent.` },
            { text: `Send another message: "Gentle reminder!!"`,
              grade: 'poor', meters: { delivery: -1 }, next: 'call',
              result: `Another reminder in the same channel gets the same silence. Two more days pass before you finally set up a call.` },
            { text: `Build the endpoint yourselves in Platform's code, without asking.`,
              grade: 'ok', meters: { trust: -2, delivery: 1 },
              result: `You might get it faster, but Platform owns that service and would have to support code it never reviewed. Expect it to be blocked in review or reverted, and expect Kiran to remember.` }
          ]
        },
        call: {
          lines: [
            { narrate: `On the call, Kiran explains: Platform has 12 teams' requests and only works from its board. Your chat message got lost. The board is full for 2 sprints.` },
            { who: 'Kiran, Platform lead', say: `Honestly, I can't promise anything before December. Everyone says their thing is urgent.` }
          ],
          prompt: 'What do you say?',
          options: [
            { text: `"Understood: you're getting this from everyone. Let me make it easy to say yes. Refunds release on 20 Nov and needs the endpoint by 11 Nov. Could we: put it on your board so your manager can rank it against the others; or have my developer write it with your team reviewing; or agree a simpler read-only version that fits this sprint?"`,
              grade: 'best', meters: { trust: 2, delivery: 2 }, next: 'agreed',
              result: `You acknowledged Kiran's reality, gave the impact and the date, and offered options that cost Platform less. Kiran picks the second one: "If Divya writes it, we can review it this sprint."` },
            { text: `"This is blocking a company priority. I'll have to escalate."`,
              grade: 'poor', meters: { trust: -2, delivery: 1 }, next: 'escalated',
              result: `A threat on the first call. Kiran stops problem-solving and starts defending.` },
            { text: `"OK, December then." Then tell your manager the release will slip.`,
              grade: 'ok', meters: { trust: 1, delivery: -2 },
              result: `You respected Platform's process, but accepted the first answer without exploring a single option. Most teams can't do your work for you, yet many will review it.` }
          ]
        },
        agreed: {
          lines: [{ narrate: `Kiran agrees: Divya, from your team, writes the endpoint; Platform reviews it; Kiran adds it to their board.` }],
          prompt: 'What do you do straight after the call?',
          options: [
            { text: `Send Kiran a short written summary, copying both managers: what was agreed, who does what, and the dates (Divya starts Mon 2 Nov, Platform review by Fri 6 Nov, merged by Wed 11 Nov). Ask Kiran to correct anything you got wrong.`,
              grade: 'best', meters: { trust: 1, delivery: 2 },
              result: `A spoken agreement is a memory; a written one is a commitment. Copying both managers isn't a threat: it makes the agreement visible to the people who set both teams' priorities.` },
            { text: `Nothing. You have a verbal agreement, and writing it down might look distrustful.`,
              grade: 'ok', meters: { delivery: -1 },
              result: `Verbal agreements fade and people change sprints. When the review takes two weeks, there's nothing to point to.` },
            { text: `Tell your team that Platform will build it, so there's nothing to plan.`,
              grade: 'poor', meters: { delivery: -2 },
              result: `That isn't what was agreed. Divya doesn't start on Monday, and the endpoint isn't ready on the 11th.` }
          ]
        },
        escalated: {
          lines: [{ narrate: `Kiran's manager asks Kiran why Platform is "blocking payments". Kiran had never seen a ticket or a date. The endpoint gets built, but late, and Kiran has been cold with you since.` }],
          prompt: 'What do you do now?',
          options: [
            { text: `Apologise to Kiran directly: you escalated before talking to them, which wasn't fair. Ask how they'd like requests raised in future (their board, their intake meeting), and follow it.`,
              grade: 'best', meters: { trust: 2, delivery: 1 },
              result: `It costs you some pride and earns back a partner you'll need ten more times this year.` },
            { text: `Nothing. You got what you needed.`,
              grade: 'poor', meters: { trust: -2 },
              result: `You won once and lost a partner. Your next request goes to the bottom of their board, politely.` },
            { text: `Send Kiran's manager a thank-you note, copying Kiran.`,
              grade: 'ok', meters: { trust: 1 },
              result: `Thanking is good, but it doesn't repair the real problem: you went over Kiran's head without talking to Kiran.` }
          ]
        }
      },
      debrief: {
        points: [
          `A chat message isn't a request. Use the other team's intake: their board, their ticket, their planning meeting.`,
          `Talk before you escalate. Most "unhelpful" teams are overloaded, not hostile; they need the impact, the date, and an easy way to say yes.`,
          `Offer options that cost them less: your team does the work and they review, a smaller version, or their manager ranks it against other requests.`,
          `Put every agreement in writing, with dates and owners, and ask them to correct it.`,
          `Escalate when an agreed date passes, not before, and as a joint question for both managers ("we can't both fit this; please decide"), not a complaint.`
        ],
        script: `> "I know you're getting this from every team, so let me make it easy to say yes. Refunds release on 20 Nov and needs this endpoint by 11 Nov. Could my developer write it, with your team reviewing? If not, can we put it on your board so your manager can rank it?"`,
        analogy: `Another team is a remote service with no agreed response time. Retrying harder ("gentle reminder!!") doesn't help. Add a contract (a written agreement with a date), a timeout (the needed-by date), a fallback (a simpler version, or your team writes it for their review), and only then a circuit breaker (escalation).`
      },
      links: ['phrase:dep-written-ask', 'phrase:dep-easy-yes', 'phrase:dep-summary', 'phrase:dep-escalate', 'tool:status']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'scope-creep-mid-sprint',
      track: 'pm',
      title: `"Just one small thing" mid-sprint`,
      summary: `The Product Owner wants to add "a small thing" to a full sprint. Practise protecting the sprint goal without saying a flat no.`,
      keywords: ['scope creep', 'mid sprint', 'small change', 'add to sprint', 'sprint goal', 'swap', 'priority'],
      role: `You lead a Scrum team in a two-week sprint.`,
      setting: `Wednesday of the first week. Neha, the Product Owner, comes to your desk.`,
      stakes: `The sprint goal is "Customers can save cards for faster checkout", and it's on track. Neha's request is reasonable, but the team is at full capacity.`,
      start: 'ask',
      steps: {
        ask: {
          lines: [{ who: 'Neha, Product Owner', say: `Small thing: can we also add Apple Pay to checkout this sprint? It's just one more payment option. Shouldn't take long.` }],
          prompt: 'What do you say?',
          options: [
            { text: `"It's not small for us: a new wallet means a gateway integration, device testing and a security review, about 5 to 8 days. The sprint is full with the saved-cards goal. If Apple Pay matters more, which saved-card stories should come out? Or it goes first next sprint."`,
              grade: 'best', meters: { trust: 1, delivery: 2, team: 1 }, next: 'swap',
              result: `You corrected the size claim with facts and offered the real choice: swap, or wait. Neha has to think about value, which is her job, instead of arguing with you about effort.` },
            { text: `"Sure, we'll squeeze it in."`,
              grade: 'poor', meters: { trust: -1, delivery: -2, team: -2 }, next: 'squeezed',
              result: `Neha is pleased. The team now has a 5-to-8-day item in a sprint with no room.` },
            { text: `"No. The sprint is locked; those are the Scrum rules."`,
              grade: 'ok', meters: { trust: -2, delivery: 1 },
              result: `Protecting the sprint is right, but "Scrum rules" isn't the reason, and it isn't even true: the 2020 Scrum Guide lets scope be renegotiated with the Product Owner during the sprint, as long as the Sprint Goal isn't put at risk. The real reasons are capacity and the goal. Say those, and offer a swap.` },
            { text: `"Let me ask the team and get back to you."`,
              grade: 'ok', meters: { delivery: 1 }, next: 'swap',
              result: `Involving the people who'll do the work is right: they size it. But come back with the trade-off, not just "the team says no". They estimate it at about a week.` }
          ]
        },
        swap: {
          lines: [{ who: 'Neha', say: `Hmm. Saved cards is the goal, and leadership is watching it. But a big client asked for Apple Pay.` }],
          prompt: 'What do you suggest?',
          options: [
            { text: `"Then let's keep the sprint goal and make Apple Pay the first story next sprint. I'll ask Divya for a 1-day spike this sprint on the gateway's Apple Pay API, so we start next sprint with no surprises. Can you give the client a date of about Fri 27 Nov?"`,
              grade: 'best', meters: { trust: 2, delivery: 2 },
              result: `The goal is safe, the client gets a believable date, and the spike shrinks next sprint's risk. Neha leaves with something to tell the client, not just a "no".` },
            { text: `"Your call. We'll do whatever you decide."`,
              grade: 'ok', meters: { delivery: 1 },
              result: `True that the Product Owner decides priority, but you added nothing. A lead offers a proposal (and ideas like the spike), not just compliance.` },
            { text: `"Let's do both; the team can work a bit extra."`,
              grade: 'poor', meters: { delivery: -1, team: -2 },
              result: `You've just undone the trade-off you made visible. Overtime is a plan to fail slowly.` }
          ]
        },
        squeezed: {
          lines: [{ narrate: `Second Wednesday. Apple Pay needs a device test lab the team doesn't have. Saved cards is two stories behind. The sprint review is in two days.` }],
          prompt: 'What do you do?',
          options: [
            { text: `Tell Neha today: the sprint goal is at risk because Apple Pay was added. Propose stopping Apple Pay now, finishing saved cards, and carrying Apple Pay over with a proper estimate.`,
              grade: 'best', meters: { trust: 1, delivery: 1, team: 1 },
              result: `Raising it two days before the review, with a proposal, saves the goal. Next time, the trade-off comes before the yes.` },
            { text: `Show both as "almost done" in the review and carry everything over.`,
              grade: 'poor', meters: { trust: -2, delivery: -1 },
              result: `Nothing ships, and "almost done" twice in one review tells stakeholders your sprints don't mean much.` },
            { text: `Ask the team to work the weekend.`,
              grade: 'poor', meters: { team: -2 },
              result: `The test lab still doesn't exist on Saturday. The team gives up a weekend and the goal still slips.` }
          ]
        }
      },
      debrief: {
        points: [
          `"Small" is a size claim. Check it with the people who'll do the work before accepting it.`,
          `Don't answer yes or no: answer with the trade-off. "We can add it if something the same size comes out. Which one?"`,
          `The Product Owner decides priority; the Developers size the work; you make the trade-off visible.`,
          `Protect the Sprint Goal, not the list. The 2020 Scrum Guide allows scope to be renegotiated during the sprint, as long as the goal isn't put at risk.`,
          `If you already said yes, raise the risk as soon as you see it, not at the review.`
        ],
        script: `> "It's bigger than it looks: a new wallet means a gateway integration, device testing and a security review, about a week. The sprint is full with the saved-cards goal. If Apple Pay matters more, which saved-card story should come out? Otherwise it goes first next sprint, and we'll do a 1-day spike now so we start clean."`,
        analogy: `A sprint is a bounded queue. Pushing into a full bounded queue doesn't make it process faster; something else gets dropped, silently. Make the drop explicit: one in, one out.`
      },
      links: ['phrase:priority-swap', 'lesson:sprint-planning', 'scenario:two-urgent-asks', 'term:sprint-goal']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'ai-makes-it-faster',
      track: 'pm',
      title: `"With AI, it should take half the time"`,
      summary: `Your manager wants to halve an estimate because the team uses AI coding assistants. Practise explaining what AI speeds up, and what it doesn't.`,
      keywords: ['ai', 'copilot', 'claude', 'chatgpt', 'half the time', 'estimate', 'faster', 'productivity'],
      role: `You lead a five-person team that uses AI coding assistants every day.`,
      setting: `Preparing for quarterly planning with Priya, your manager.`,
      stakes: `Your estimate for the new notification service is 5 to 6 weeks, and it already counts the time AI saves. Priya wants to commit to 3.`,
      start: 'ask',
      steps: {
        ask: {
          lines: [{ who: 'Priya, your manager', say: `With Copilot and Claude, this should take half the time now, right? Let's say 3 weeks.` }],
          prompt: 'What do you say?',
          options: [
            { text: `"AI does speed up part of it, and I've already counted that. Writing code is about a third of this work, and that part is faster. The rest isn't: agreeing message formats with 3 teams, the SMS vendor's sandbox, load testing for the sale, the security review and the rollout. Let me show you the breakdown: with AI it's 5 to 6 weeks instead of 7 to 8."`,
              grade: 'best', meters: { trust: 2, delivery: 1 }, next: 'levers',
              result: `You agreed with the true part, showed where the time really goes, and put a number on what AI saves. That's very hard to argue with.` },
            { text: `"Sure, 3 weeks. AI is amazing."`,
              grade: 'poor', meters: { trust: -1, delivery: -2, team: -1 },
              result: `The team now has half the time for work AI doesn't touch: meetings with three teams, a vendor's sandbox, a security review. Week 3 ends with a missed date and a team that feels it failed.` },
            { text: `"AI doesn't really help on real projects."`,
              grade: 'ok', meters: { trust: -2 },
              result: `That isn't true either: your team uses it daily and you've counted the gain. Dismissing it makes Priya trust your judgment less on everything else.` },
            { text: `"Maybe 4 weeks, then."`,
              grade: 'ok', meters: { trust: -1, delivery: -1 },
              result: `Splitting the difference is negotiating, not estimating. Nothing about the work changed, so the new number has nothing behind it.` }
          ]
        },
        levers: {
          lines: [{ who: 'Priya', say: `OK, I see coding isn't the whole thing. But leadership will ask why AI didn't cut it in half.` }],
          prompt: 'What do you offer?',
          options: [
            { text: `"Two things would really shorten it: if the 3 teams agree the message formats in one meeting this week instead of over email, and if we get the SMS vendor's sandbox by Monday, we save about a week. Can you help with those? I'll also track how much time AI saves us, so next quarter we'll have real numbers."`,
              grade: 'best', meters: { trust: 2, delivery: 2 },
              result: `You gave Priya real levers she can pull, and a plan to replace opinions with data. She leaves with something to say to leadership: "AI saves us about two weeks here; faster decisions could save another."` },
            { text: `"I can write you a short note on what AI does and doesn't speed up."`,
              grade: 'ok', meters: { trust: 1 },
              result: `Useful, but it only explains the date; it doesn't help shorten it. Pair the explanation with what would actually make it faster.` },
            { text: `"Just tell them AI is overhyped."`,
              grade: 'poor', meters: { trust: -2 },
              result: `That puts Priya in a fight with leadership on your behalf, using a claim she can't defend.` }
          ]
        }
      },
      debrief: {
        points: [
          `AI coding assistants speed up writing code. Most of a project's calendar time is elsewhere: agreeing requirements, waiting on other teams and vendors, reviews, testing, rollout.`,
          `Show the breakdown: which parts AI shortens and which it doesn't. Numbers end the argument faster than opinions.`,
          `Don't dismiss AI either. That's as wrong as overselling it, and it costs you credibility.`,
          `Offer the real levers that would shorten the date (faster decisions, earlier access, fewer handoffs) and ask for help with them.`,
          `Measure what AI actually saves your team, so the next estimate rests on data.`
        ],
        script: `> "AI helps, and I've counted it: coding is about a third of this, and that part is faster. The rest is agreeing formats with 3 teams, the vendor's sandbox, load testing and the security review. So 5 to 6 weeks instead of 7 to 8. If you can get the 3 teams into one meeting this week, we save another week."`,
        analogy: `Amdahl's law: making one part of a job N times faster only helps in proportion to that part's share. If coding is a third of the work, making it twice as fast saves about a sixth of the total, not half.`
      },
      links: ['phrase:ai-estimate', 'phrase:estimate-range', 'scenario:one-week-ask', 'scenario:estimate-from-one-line']
    }
  );
})(window.LELT);
