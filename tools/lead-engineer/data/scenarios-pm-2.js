/*
 * scenarios-pm-2.js - project management scenarios added in batch 2: estimates that turn into
 * promises, fixed dates, more people late, must-haves, the CEO's idea, a dependency that slips, a
 * forgotten stakeholder, a key person leaving, "keep it Green", forecasting a backlog, interruptions,
 * a holiday sprint and a flat burn-down.
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
      id: 'estimate-becomes-commitment',
      track: 'pm',
      title: `Your range became a promise`,
      summary: `You gave a range; the leadership deck shows your best case as a commitment. Practise correcting it early, and helping the PM rather than embarrassing her.`,
      keywords: ['estimate', 'commitment', 'range', 'roadmap', 'deck', 'best case', 'p85', 'correct'],
      role: `You lead a five-person team on the payments product.`,
      setting: `Monday morning. You open the quarterly roadmap deck that Neha, the Product Manager, will present to leadership on Wednesday.`,
      stakes: `Two weeks ago you told Neha the loyalty points feature would take "8 to 14 weeks, most likely 10". The deck says **"Loyalty points: committed, 8 weeks, ships 15 Jan"**. If it stands, your team is committed to its best case.`,
      start: 'found',
      steps: {
        found: {
          lines: [{ narrate: `Slide 6: "Loyalty points: committed, 8 weeks, ships 15 Jan." Nobody asked you before it went in.` }],
          prompt: 'What do you do?',
          options: [
            { text: `Message Neha privately today: "The deck shows 8 weeks committed. My estimate was 8 to 14, most likely 10. For a commitment I'd say 13 weeks, or a smaller first release by 15 Jan. Can we fix the slide before Wednesday? I can join for 10 minutes."`,
              grade: 'best', meters: { trust: 2, delivery: 1 }, next: 'neha',
              result: `Two days before the meeting is the cheapest moment to correct it, and private is the kindest place. You also arrived with a way to keep 15 Jan, so it reads as help, not as a complaint.` },
            { text: `Reply-all on the email that shared the deck: "Correction: the loyalty estimate was 8 to 14 weeks, not 8."`,
              grade: 'ok', meters: { trust: -1, delivery: 1 }, next: 'neha',
              result: `The fact is right, the channel is wrong: Neha's manager is on that thread, so you corrected her in front of him. She will still fix it, but she will remember how.` },
            { text: `Say nothing. Neha will work it out, and you can explain later if it slips.`,
              grade: 'poor', meters: { trust: -2, delivery: -1 }, next: 'later',
              result: `Silence makes the 8 weeks yours. Once leadership has seen "committed", every week after 15 Jan will look like your team missing a promise.` },
            { text: `Tell the team: "We're committed to 8 weeks now, so let's push."`,
              grade: 'poor', meters: { trust: -1, delivery: -2, team: -2 },
              result: `You turned a mistake on a slide into the team's problem. They know the work is 8 to 14 weeks; now they know their lead won't push back upwards either.` }
          ]
        },
        neha: {
          lines: [{ who: 'Neha, Product Manager', say: `Leadership liked 8 weeks. If I show 13 now, they'll say engineering always pads. Can't we say 8 and see how it goes?` }],
          prompt: 'How do you respond?',
          options: [
            { text: `"Let's give them a choice instead of a number. By 15 Jan: earning points at checkout, a real first release. Redemption follows by mid-March. I'll put the breakdown in the appendix, so the numbers come with their reasons, not as padding."`,
              grade: 'best', meters: { trust: 2, delivery: 2 },
              result: `Neha can present something good on 15 Jan and a date you can keep for the rest. The breakdown answers "why so long?" before anyone asks it.` },
            { text: `"OK, show 10 weeks: our most likely number."`,
              grade: 'ok', meters: { trust: 1, delivery: -1 },
              result: `Better than 8, but 10 is the middle of the range: a coin flip. Half the time you will be late, and it will still read as a commitment.` },
            { text: `"Fine, 8 weeks. We'll make it work."`,
              grade: 'poor', meters: { trust: -2, delivery: -2, team: -1 },
              result: `You agreed to the best case as a promise. The cost lands on the team in January.` },
            { text: `"I'll present the engineering numbers myself on Wednesday."`,
              grade: 'ok', meters: { trust: -1, delivery: 1 },
              result: `The numbers get said, but you took over Neha's meeting. It works better to equip her: give her the slice, the dates and the breakdown, and offer to answer questions.` }
          ]
        },
        later: {
          lines: [
            { narrate: `Three weeks later, at the Sprint Review. The team now knows it's at least 10 weeks.` },
            { who: 'Vikram, VP Engineering', say: `We're on track for 15 January, right?` }
          ],
          prompt: 'What do you say?',
          options: [
            { text: `"Not for all of it. The 8 weeks in the deck was my best case, and I should have corrected it before the meeting. Here's what ships by 15 Jan, and the full date at 85% confidence."`,
              grade: 'best', meters: { trust: 1, delivery: 1, team: 1 },
              result: `Late, but honest and with a plan. Correcting it now is still far cheaper than in January, and Vikram learns your corrections come with options.` },
            { text: `"We're working hard; it should be fine."`,
              grade: 'poor', meters: { trust: -2, delivery: -1 },
              result: `"Should be fine" from a lead who knows otherwise is a watermelon in the making. In January, Vikram will remember this answer.` },
            { text: `"There are some risks. I'll send an update."`,
              grade: 'ok', meters: { trust: -1, delivery: 1 },
              result: `Better than "fine", but "some risks" doesn't tell Vikram that the date is wrong. Say the new date and what it rests on.` }
          ]
        }
      },
      debrief: {
        points: [
          `Every number you say becomes a commitment unless you label it: *"estimate"*, *"most likely"*, *"commitment"*.`,
          `When your best case shows up as a promise, correct it **before** the meeting, **privately**, and **with an option** that keeps the date useful.`,
          `Help the PM present something good: a real first slice by the date, and the full scope with a date at the cautious end of your range.`,
          `Commit to around P85, not P50. A commitment at the most likely value is late half the time.`
        ],
        script: `> "Neha, the deck shows loyalty points as 8 weeks committed. My estimate was 8 to 14, most likely 10. Could we show it as two parts: earning points by 15 Jan, which we can commit to, and redemption by mid-March? I'll send the breakdown for the appendix today."`,
        analogy: `An estimate quoted as a commitment is like a load-test best case published as the SLA. The system did handle that load once, under ideal conditions; promising it every day is how SLAs get breached.`
      },
      links: ['lesson:estimate-target-commitment', 'tool:estimate', 'phrase:estimate-not-commitment', 'scenario:estimate-from-one-line']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'dev-refuses-estimates',
      track: 'pm',
      title: `"Estimates are waste"`,
      summary: `A senior developer wants to stop estimating; the PM needs a date for a partner. Practise finding the part of the argument that is right, and answering "when?" from data.`,
      keywords: ['noestimates', 'no estimates', 'estimate', 'forecast', 'throughput', 'refinement', 'pushback', 'senior developer'],
      role: `You lead a team of six.`,
      setting: `A refinement meeting. The team has started sizing the stories for a partner integration.`,
      stakes: `Your estimates have been off by about 50% lately, so the developer has a point. But Neha, the PM, needs a launch date to agree with a partner company.`,
      start: 'objection',
      steps: {
        objection: {
          lines: [{ who: 'Sameer, senior developer', say: `Honestly, estimates are always wrong. I've been reading about #NoEstimates. Let's stop wasting an hour on story points and just build.` }],
          prompt: 'How do you respond?',
          options: [
            { text: `"You're right that our estimates have been poor, and sizing every small story is waste. But Neha has a real decision: the partner's launch date. Let's try it your way where it fits: no points for small items; we forecast from how many we finish each week. For the partner integration, which is new to us, a quick breakdown with ranges. Deal?"`,
              grade: 'best', meters: { trust: 1, delivery: 1, team: 2 }, next: 'data',
              result: `You agreed with what is true, kept what the business needs, and gave Sameer's idea a real trial. He relaxes: being taken seriously matters more to him than winning.` },
            { text: `"The company needs estimates. That's not up for debate."`,
              grade: 'ok', meters: { trust: 1, team: -2 }, next: 'data',
              result: `Neha gets her estimate, but Sameer goes quiet, and so does the rest of the team. Shutting down a senior developer in front of everyone costs more than the hour of sizing.` },
            { text: `"Fair enough. No more estimates."`,
              grade: 'poor', meters: { trust: -1, delivery: -1, team: 1 }, next: 'no-date',
              result: `The team likes it. But you dropped the estimates without replacing them with anything, and Neha still needs a date.` },
            { text: `"Let's discuss it in the retro."`,
              grade: 'ok', meters: { delivery: -1, team: 1 }, next: 'data',
              result: `It's a fair topic for the retro, but the partner date can't wait two weeks. Neha asks again the same afternoon.` }
          ]
        },
        data: {
          lines: [
            { narrate: `You pull the numbers. Over the last eight weeks the team finished 5 to 8 small items a week. About 30 items are left for the partner launch, plus the integration itself, which nobody on the team has built before.` },
            { who: 'Neha', say: `So, when?` }
          ],
          prompt: 'What do you tell her?',
          options: [
            { text: `"The 30 small items: 4 to 6 weeks at our real pace. The integration is the unknown, so we'll do a 3-day spike this week. I'll give you a date range on Friday and commit to the cautious end."`,
              grade: 'best', meters: { trust: 2, delivery: 2, team: 1 },
              result: `A forecast from what actually happened, an honest unknown with a plan to shrink it, and a day for the answer. And nobody spent an hour sizing.` },
            { text: `"Six weeks."`,
              grade: 'ok', meters: { trust: 1, delivery: -1 },
              result: `It's inside the range, but a single number hides the unknown integration, which is exactly the part most likely to make it late.` },
            { text: `"Sameer says we don't estimate any more."`,
              grade: 'poor', meters: { trust: -2, team: -1 },
              result: `You hid behind a team member and left Neha with nothing. A lead owns the answer, whatever method the team uses.` }
          ]
        },
        'no-date': {
          lines: [{ who: 'Neha, two weeks later', say: `The partner wants a launch date by Friday, or they'll go with someone else. What do I tell them?` }],
          prompt: 'What do you say?',
          options: [
            { text: `"Let me get you a forecast by Thursday from what we've actually finished each week, plus a short spike on the integration. Not a guess, and no big sizing session."`,
              grade: 'best', meters: { trust: 2, delivery: 1 },
              result: `"No estimates" never meant "no answer". Forecasting from throughput gives Neha a number she can use, without going back to hours of story points.` },
            { text: `"We don't do estimates now. Tell them it'll be ready when it's ready."`,
              grade: 'poor', meters: { trust: -2, delivery: -1 },
              result: `The partner goes elsewhere, and Neha concludes that the team's process matters more to it than the business.` },
            { text: `"Tell them six weeks."`,
              grade: 'ok', meters: { trust: -1, delivery: -1 },
              result: `A number with nothing behind it, for a deal. If it's wrong, the partner relationship pays for it.` }
          ]
        }
      },
      debrief: {
        points: [
          `When someone challenges a practice, find the part that's true first. "Some of our estimating is waste" usually is.`,
          `Estimates exist for decisions. Keep them where a decision needs them (a partner date), drop them where nothing depends on them.`,
          `When work flows in small pieces, **forecast from throughput**: items finished per week, from your own history.`,
          `For work that is new to the team, a short spike buys the information an estimate needs.`
        ],
        script: `> "You're right that sizing every small story is waste, so let's stop that. For the partner date we'll forecast from what we've actually finished each week, and do a 3-day spike on the integration. Neha gets a range on Friday."`,
        analogy: `It is the difference between benchmarking every function and profiling the hot path. You don't measure what no decision depends on; you measure precisely where a decision rides on it.`
      },
      links: ['lesson:why-estimate', 'explainer:monte-carlo', 'tool:estimate', 'scenario:estimate-from-one-line']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'three-days-coding-only',
      track: 'pm',
      title: `"Three days, it's just the coding"`,
      summary: `A developer says three days; the PM wants to promise a merchant. Practise asking what the three days include before a date leaves the team.`,
      keywords: ['estimate', 'coding only', 'forgotten work', 'testing', 'review', 'security review', 'release', 'promise'],
      role: `You lead a five-person team that builds the merchant dashboard.`,
      setting: `Monday. A large merchant needs a CSV export of their settlements.`,
      stakes: `The export will contain bank account numbers. Your last export feature fell over on large files. Neha, the PM, wants to give the merchant a date today.`,
      start: 'ask',
      steps: {
        ask: {
          lines: [
            { who: 'Divya, developer', say: `It's 3 days, easy. Just a query and a CSV writer.` },
            { who: 'Neha, Product Manager', say: `Great, so I can tell the merchant Thursday, right?` }
          ],
          prompt: 'What do you say?',
          options: [
            { text: `"Let me check what's in the 3 days with Divya first. Ten minutes, then I'll give you a date."`,
              grade: 'best', meters: { trust: 1, delivery: 2 }, next: 'breakdown',
              result: `Ten minutes now can save a broken promise to a merchant. Neha waits, a little impatiently.` },
            { text: `"Yes, Thursday."`,
              grade: 'poor', meters: { trust: -1, delivery: -2 }, next: 'thursday',
              result: `A developer's coding estimate just became a promise to a customer, with nothing else in it.` },
            { text: `"Say next week, to be safe."`,
              grade: 'ok', meters: { trust: -1, delivery: 1 }, next: 'breakdown',
              result: `Vaguely padded, and "next week" isn't a date a merchant can plan on. You still need to know what the work really is.` }
          ]
        },
        breakdown: {
          lines: [{ narrate: `With Divya: the query and CSV writer are 3 days. Not in it: code review and fixes (about a day); testing with a 2-million-row file (1 to 2 days, because the last export failed on large files); a security review, because the file contains bank account numbers (a slot can take 2 to 5 days to get); and the Tuesday release window.` }],
          prompt: 'How do you answer Neha?',
          options: [
            { text: `"Coding is 3 days. The whole job, with review, large-file testing and the security review, is 7 to 10 working days. The security slot is the uncertain part. If we book it today, I'd say Tue 17 Nov, and I'll confirm by Wednesday."`,
              grade: 'best', meters: { trust: 2, delivery: 2, team: 1 },
              result: `Neha gets a real date with its reason, and Divya isn't made to look wrong: her 3 days were right for what she was asked about.` },
            { text: `"Two weeks."`,
              grade: 'ok', meters: { trust: 1, delivery: 1 },
              result: `Close enough, but with no reason given it sounds like padding, and Neha can't explain it to the merchant.` },
            { text: `"Thursday, if Divya skips the large-file testing."`,
              grade: 'poor', meters: { trust: -1, delivery: -2, team: -1 },
              result: `The test you cut is the one that failed last time. The merchant gets an export that breaks on their real data.` }
          ]
        },
        thursday: {
          lines: [
            { narrate: `Wednesday. The code is done, but the review found problems, and because the file has bank account numbers, the security team must review it. Their next slot is next Tuesday.` },
            { who: 'Neha', say: `The merchant is expecting it tomorrow. What's happening?` }
          ],
          prompt: 'What do you do?',
          options: [
            { text: `Tell Neha now: "My mistake. I confirmed Thursday without checking what the 3 days covered. It needs a security review, so the realistic date is Tue 17 Nov. I'll help you tell the merchant, and we can send them a one-off export by hand on Thursday as a stopgap."`,
              grade: 'best', meters: { trust: 1, delivery: 1, team: 1 },
              result: `A day's notice instead of none, an honest cause, and a stopgap that gives the merchant something on Thursday.` },
            { text: `Ask Divya to release it without the security review; it can be reviewed afterwards.`,
              grade: 'poor', meters: { trust: -1, delivery: -2, team: -1 },
              result: `Shipping bank account numbers without a security review to save a few days is the kind of decision that ends up in an incident report.` },
            { text: `Wait until Thursday morning, in case a security slot frees up.`,
              grade: 'poor', meters: { trust: -2 },
              result: `Hoping turns a day's notice into none. Neha learns about it at the same time as the merchant.` }
          ]
        }
      },
      debrief: {
        points: [
          `When someone gives you a number, ask **what it includes**. A developer's estimate is often the coding only, and that's an honest answer to the question they heard.`,
          `The work people forget: code review and rework, testing (especially with real-sized data), security or compliance reviews, release windows, and waiting on other teams.`,
          `No date leaves the team before it covers the whole job.`,
          `If a wrong date already went out, correct it the day you know, with a stopgap if there is one.`
        ],
        script: `> "Coding is 3 days. With review, testing on a full-size file and the security review, it's 7 to 10 working days. If we book the security slot today, Tue 17 Nov. I'll confirm on Wednesday."`,
        analogy: `A coding-only estimate is the time for the build step, quoted as the time for the whole pipeline. The build is fast; the integration tests, security scan and deploy window are what make the release take a week.`
      },
      links: ['tool:estimate', 'lesson:estimate-target-commitment', 'phrase:estimate-assumptions', 'scenario:estimate-from-one-line']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'fixed-regulatory-date',
      track: 'pm',
      title: `A date that can't move`,
      summary: `A regulator sets the deadline and the full scope doesn't fit. Practise making scope the lever, with a "will have, might have, won't have" line everyone can see.`,
      keywords: ['fixed date', 'regulation', 'compliance', 'scope', 'will have', 'might have', 'release planning', 'crunch'],
      role: `You lead a six-person payments team.`,
      setting: `A new rule from the regulator: stored card details must be replaced with tokens by 31 March. After that date, payments with stored cards will fail.`,
      stakes: `Your estimate for everything the team would like to build is 14 to 18 weeks. There are 12 weeks left. The date can't move.`,
      start: 'plan',
      steps: {
        plan: {
          lines: [{ who: 'Priya, engineering manager', say: `Compliance says 31 March is not negotiable. Can we do it?` }],
          prompt: 'What do you say?',
          options: [
            { text: `"The date can't move, so the scope has to. Let me split the work using our slowest and fastest recent pace: what will be done by 31 March, what might be, and what won't. I'll come back on Thursday with the must-haves checked against that line."`,
              grade: 'best', meters: { trust: 2, delivery: 2 }, next: 'cut',
              result: `With a fixed date, the honest question is "what will we have by then?", and you said so on day one.` },
            { text: `"We'll do everything. I'll ask the team to work weekends."`,
              grade: 'poor', meters: { trust: 1, delivery: -2, team: -2 }, next: 'crunch',
              result: `Priya is relieved for now. Twelve weeks of weekends is a plan to burn out the team in the middle of a compliance project.` },
            { text: `"We'll need more people."`,
              grade: 'ok', meters: { trust: -1, delivery: 1 }, next: 'cut',
              result: `With 12 weeks left and work that might split, more people could help. But first you need to know what is actually required, or you'll add people to the wrong work.` },
            { text: `"It's impossible."`,
              grade: 'poor', meters: { trust: -2 },
              result: `The date is set by the regulator; "impossible" isn't an answer anyone can use. Priya goes to Compliance without you.` }
          ]
        },
        cut: {
          lines: [{ narrate: `The split. **Will have** by 31 March, even at your slow pace: tokenising new cards, migrating stored cards, and the fallback when a token fails. **Might have**: the admin screen for viewing tokens. **Won't have**: the reporting dashboard. Everything the regulation requires is in "will have".` }],
          prompt: 'How do you take it to Priya and Compliance?',
          options: [
            { text: `"Everything the regulation requires is in 'will have', even at our slow pace. The admin screen is a 'might'; the dashboard comes in April. I'll show the line every sprint, so if we slow down you'll see it in week 3, not week 11."`,
              grade: 'best', meters: { trust: 2, delivery: 2, team: 1 },
              result: `Compliance can relax about the legal part, Priya can see the trade-off, and a slowdown will show up while there's still time to act.` },
            { text: `"We can do the legal part. The rest comes later."`,
              grade: 'ok', meters: { trust: 1, delivery: 1 },
              result: `True, but without the line and the "might have" group, nobody can see what's at risk, or notice when it changes.` },
            { text: `Show only the "will have" list, and quietly leave the admin screen out.`,
              grade: 'poor', meters: { trust: -2, delivery: 1 },
              result: `Someone was expecting that screen. Leaving it out quietly turns a reasonable trade-off into a broken promise when they notice.` }
          ]
        },
        crunch: {
          lines: [
            { narrate: `Week 6. The team has worked three weekends. Rahul has resigned. The card migration is behind.` },
            { who: 'Priya', say: `Where are we?` }
          ],
          prompt: 'What do you say?',
          options: [
            { text: `"We won't finish everything by 31 March. The legally required parts can make it if we drop the admin screen and the dashboard now, and stop the weekend work, which is costing us more in mistakes than it gains. I should have split the scope at the start."`,
              grade: 'best', meters: { trust: 1, delivery: 1, team: 2 },
              result: `Late, but there are still six weeks to protect what matters. Stopping the weekends is the first thing that has helped the team in a month.` },
            { text: `"On track."`,
              grade: 'poor', meters: { trust: -2, delivery: -2 },
              result: `A Green report on a project that is behind, with a team that is leaving. The truth will arrive in week 11, when no options are left.` },
            { text: `"We need more people now."`,
              grade: 'poor', meters: { trust: -1, delivery: -1 },
              result: `Six weeks before a migration deadline, new people would need weeks to learn the card systems, taught by the same exhausted seniors. Brooks's law.` }
          ]
        }
      },
      debrief: {
        points: [
          `When the date is fixed, **scope is the lever**. Ask "what will we have by then?", not "can we do everything?"`,
          `Use your slowest and fastest recent pace to split the ordered backlog: **will have, might have, won't have**. Check that every must-have is in "will have".`,
          `Show the line every sprint, so a slowdown is visible early.`,
          `Weekends are not a plan. Long overtime raises mistakes and resignations, both of which cost more time than they save.`
        ],
        script: `> "The date can't move, so the scope has to. Everything the regulation requires fits by 31 March even at our slow pace. The admin screen might make it; the dashboard comes in April. I'll show you the line every sprint."`,
        analogy: `A fixed deadline is a hard real-time constraint. You don't make a real-time system meet its deadline by running the CPU hotter; you shed the non-essential work so the essential work always finishes in time.`
      },
      links: ['lesson:release-planning', 'explainer:iron-triangle', 'tool:deadline', 'tool:prioritise']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'more-people-late',
      track: 'pm',
      title: `Three more developers, four weeks out`,
      summary: `Your manager offers three developers four weeks before launch. Practise accepting help where it helps, and saying where it would slow you down.`,
      keywords: ['more people', 'brooks', 'brooks law', 'add people', 'late project', 'onboarding', 'help', 'staffing'],
      role: `You lead a five-person team building customer refunds.`,
      setting: `Four weeks before launch. You are about a week behind.`,
      stakes: `The new developers don't know the payments code. Your two seniors, Sameer and Divya, would have to teach them in the busiest weeks. But turning down help looks ungrateful.`,
      start: 'offer',
      steps: {
        offer: {
          lines: [{ who: 'Priya, engineering manager', say: `Good news! I can move three developers from the loyalty team to you from Monday.` }],
          prompt: 'What do you say?',
          options: [
            { text: `"Thank you. Before we take them, let me check where they would actually help. New people on payments code take a couple of weeks to become productive, and Sameer and Divya would be teaching them in our last four weeks. Can I come back tomorrow with where they help and where they'd slow us down?"`,
              grade: 'best', meters: { trust: 2, delivery: 1 }, next: 'where',
              result: `You didn't refuse help, and you didn't accept it blindly. One day to look at the work is a small price for getting this right.` },
            { text: `"Great, send them on Monday!"`,
              grade: 'poor', meters: { trust: 1, delivery: -2, team: -1 }, next: 'onboarding',
              result: `It feels like progress. But you just added three people to a late project without knowing what they'll work on.` },
            { text: `"No thanks, we're fine."`,
              grade: 'ok', meters: { trust: -1, team: 1 },
              result: `You may be right that they'd slow the core work. But you are a week behind and turned down help without looking for the work it would fit. Priya won't offer again soon.` }
          ]
        },
        where: {
          lines: [{ narrate: `You look at what's left. The core refund flow is tangled with the ledger: a newcomer would need weeks. But two pieces stand apart: the Finance reconciliation report (a read-only batch job with clear inputs) and the automated regression tests for the admin screens.` }],
          prompt: 'What do you propose to Priya?',
          options: [
            { text: `"Two of them take the Finance report and the regression tests: separate work, about an hour of handover each. The third stays on loyalty, so loyalty keeps moving and we don't add a third person to the core code. That wins back most of our week."`,
              grade: 'best', meters: { trust: 2, delivery: 2, team: 1 },
              result: `The newcomers are useful from the first week, the seniors stay on the critical path, and the loyalty team isn't stripped bare.` },
            { text: `"We'll take all three on the core flow and accept two slow weeks."`,
              grade: 'ok', meters: { trust: 1, delivery: -1 },
              result: `It looks cooperative, but it puts the teaching load on the critical path in the last month. The model in the deadline negotiator shows how little that gains.` },
            { text: `"We'll take none, and the date slips a week."`,
              grade: 'poor', meters: { trust: -1, delivery: -1 },
              result: `You found the separable work and then didn't use it. Priya can't see why help was refused.` }
          ]
        },
        onboarding: {
          lines: [
            { narrate: `Two weeks later. Sameer spends half his day answering questions. One newcomer's change broke the ledger in staging. You are now two weeks behind.` },
            { who: 'Priya', say: `You have eight people now. Why is it slipping more?` }
          ],
          prompt: 'What do you say?',
          options: [
            { text: `"Because I put them on the core flow without a plan. That was my mistake: new people on tangled code cost us more than they add this late. I'd move two of them to the Finance report and the regression tests, which are separate, and send the third back to loyalty. We're two weeks late; here's the recovery plan."`,
              grade: 'best', meters: { trust: 1, delivery: 1, team: 1 },
              result: `Owning it and fixing the placement now still saves part of the loss. Sameer gets his days back.` },
            { text: `"The new people aren't good enough."`,
              grade: 'poor', meters: { trust: -2, team: -2 },
              result: `They are capable engineers put on the hardest code with no plan. Blaming them costs you their goodwill and Priya's confidence in your judgement.` },
            { text: `"We need two more weeks."`,
              grade: 'ok', meters: { trust: -1, delivery: 1 },
              result: `A new date without the cause or a change of plan. The same thing will happen in the next two weeks.` }
          ]
        }
      },
      debrief: {
        points: [
          `**Brooks's law**: adding people to a late project tends to make it later. Newcomers need time to ramp up, taught by the people you most need.`,
          `More people help early, and on **work that splits cleanly**: a separate component, a report, tests, with a clear interface.`,
          `Don't refuse help or accept it blindly. Ask for a day to find where it fits.`,
          `Every person added means more pairs to keep in sync: 5 people have 10 pairs, 8 people have 28.`
        ],
        script: `> "Thank you. Two of them can take the Finance report and the regression tests from Monday: they're separate and need an hour of handover each. Putting new people on the core refund flow this late would slow Sameer and Divya down, so I'd keep the third on loyalty."`,
        analogy: `Adding threads to a job that is bound by a single lock doesn't make it faster: they queue on the lock and add contention. Extra threads help on work that partitions cleanly. People are the same.`
      },
      links: ['explainer:brooks-law', 'tool:deadline', 'phrase:deadline-more-people', 'scenario:one-week-ask']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'all-must-haves',
      track: 'pm',
      title: `Everything is a must-have`,
      summary: `Fourteen features, all marked "must". Practise finding the real must-haves with one question, so the plan has room for surprises.`,
      keywords: ['must have', 'moscow', 'prioritise', 'scope', 'release planning', 'features', 'product manager', '60%'],
      role: `You lead a five-person team.`,
      setting: `Release planning for version 2 of the merchant dashboard, with Neha, the Product Manager.`,
      stakes: `Fourteen features, all marked "Must". At your slow pace, the team can build about 60% of the effort in the 8 weeks. If everything is a must, any surprise moves the date, or quietly cuts quality.`,
      start: 'list',
      steps: {
        list: {
          lines: [{ who: 'Neha, Product Manager', say: `These are all must-haves. The merchants asked for every one of them.` }],
          prompt: 'What do you say?',
          options: [
            { text: `"Let's test each one with a question: if it were missing on launch day, would we still launch? The ones where the answer is no are the real musts. A common guideline is to keep must-haves to about 60% of the effort, so the rest can absorb surprises."`,
              grade: 'best', meters: { trust: 2, delivery: 1 }, next: 'test',
              result: `One concrete question makes the conversation about launch, not about who wants what. Neha agrees to go through the list.` },
            { text: `"OK, we'll commit to all 14."`,
              grade: 'poor', meters: { trust: -1, delivery: -2, team: -1 },
              result: `There is now nothing that can give. The first surprise moves the date or cuts the testing.` },
            { text: `"We can't do them all. You choose 8."`,
              grade: 'ok', meters: { trust: -1, delivery: 1 }, next: 'test',
              result: `The choice is hers to make, but you handed it back with no way to make it. Offer the test and the numbers, then let her decide.` },
            { text: `Quietly plan the 8 you think matter most, without telling Neha.`,
              grade: 'poor', meters: { trust: -2, delivery: 1 },
              result: `You may pick well, but you took a product decision that isn't yours, and Neha will find out in the Sprint Review.` }
          ]
        },
        test: {
          lines: [
            { narrate: `Going through the list together, six features pass the "would we still launch?" test, about 50% of the effort. Neha hesitates over custom reports.` },
            { who: 'Neha', say: `Sales promised custom reports to one big merchant.` }
          ],
          prompt: 'What do you suggest?',
          options: [
            { text: `"Then let's find out what that merchant needs at launch. If it's one specific report, we make that report a must and the full report builder a should. Can you check with Sales by Wednesday?"`,
              grade: 'best', meters: { trust: 2, delivery: 2 },
              result: `The promise to the merchant is kept with a fraction of the work, and the musts stay near half the effort.` },
            { text: `"Make custom reports a must, then."`,
              grade: 'ok', meters: { trust: 1, delivery: -1 },
              result: `The musts rise to about 70% of the effort. It may still work, but there's less room for the surprises every release has.` },
            { text: `"Sales shouldn't promise features. That's not our problem."`,
              grade: 'poor', meters: { trust: -2 },
              result: `It is everyone's problem now, and being right about Sales doesn't help Neha with the merchant.` }
          ]
        }
      },
      debrief: {
        points: [
          `If everything is a must, nothing is. Ask of each item: **"If this were missing on launch day, would we still launch?"**`,
          `Keep must-haves to roughly **60% of the effort** (DSDM's guideline), so should and could items absorb the surprises.`,
          `A promise behind a "must" is often smaller than the feature: one report, not a report builder. Find out what was actually promised.`,
          `The PM decides the priorities; your job is to make the trade-off visible with numbers.`
        ],
        script: `> "Let's take each one and ask: if it were missing on launch day, would we still launch? Those are the musts. I'd like them to be about 60% of the work, so the rest can absorb surprises."`,
        analogy: `A must-have list at 100% of capacity is a server run at 100% CPU: it works until the first spike, and then everything queues. Headroom isn't waste; it's what lets the system survive a bad day.`
      },
      links: ['tool:prioritise', 'lesson:release-planning', 'phrase:priority-moscow', 'term:moscow']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'ceo-corridor-ask',
      track: 'pm',
      title: `The CEO's idea in the lift`,
      summary: `The CEO suggests a feature in passing. Practise neither dropping everything nor brushing it off: take it to the PM with its cost and what it would delay.`,
      keywords: ['ceo', 'hippo', 'senior leader', 'priority', 'cost of delay', 'product manager', 'corridor', 'request'],
      role: `You lead a team of six. Neha, the Product Manager, owns the team's priorities.`,
      setting: `In the lift. Arvind, the CEO, recognises you.`,
      stakes: `Your sprint is full with refunds work. Saying yes on the spot reorders the priorities without the PM. Saying no to the CEO feels impossible.`,
      start: 'lift',
      steps: {
        lift: {
          lines: [{ who: 'Arvind, CEO', say: `I saw a competitor's app has a spend-analytics screen. We should have that. Can your team look into it?` }],
          prompt: 'What do you say before the doors open?',
          options: [
            { text: `"Thanks, that's interesting. Can I take it to Neha, who owns our priorities, with a rough size and what it would delay? We'll come back to you by Friday."`,
              grade: 'best', meters: { trust: 2, delivery: 1 }, next: 'size',
              result: `Respectful, quick, with a date, and it keeps the decision with the person who owns it. Arvind nods: he wanted it looked at, not necessarily done tomorrow.` },
            { text: `"Sure, we'll start on it this sprint!"`,
              grade: 'poor', meters: { trust: -1, delivery: -2 }, next: 'chaos',
              result: `A 30-second conversation just changed your sprint, without the PM and without knowing what it costs.` },
            { text: `"That would need to go through the product process."`,
              grade: 'ok', meters: { trust: -1, delivery: 1 }, next: 'size',
              result: `Correct, but it sounds like a brush-off to the CEO. Say what you'll do and by when.` }
          ]
        },
        size: {
          lines: [{ narrate: `With Neha: spend analytics is about 4 weeks of the team's time. Doing it now would delay refunds, whose failures currently cost about ₹8 lakh a week in support costs and lost payments. Nobody has measured what analytics is worth yet.` }],
          prompt: 'What goes back to Arvind?',
          options: [
            { text: `Neha and you send it together: "Spend analytics is about 4 weeks. Doing it now delays refunds, which costs about ₹8 lakh a week. We suggest finishing refunds first (done 20 Nov), then a one-week prototype of analytics to test interest. Happy to change the order if analytics is tied to something we don't know about."`,
              grade: 'best', meters: { trust: 2, delivery: 2 },
              result: `A clear recommendation, the cost of each choice, and an open door in case the CEO knows something you don't. Arvind replies: "Makes sense. Do the prototype in December."` },
            { text: `"Tell him we'll do it next quarter."`,
              grade: 'ok', meters: { trust: -1, delivery: 1 },
              result: `Maybe the right answer, but without the reasoning it sounds like a delay tactic.` },
            { text: `Do both, with the team working extra hours.`,
              grade: 'poor', meters: { delivery: -1, team: -2 },
              result: `Nobody chose between them, so the team pays for both, and refunds slips anyway.` }
          ]
        },
        chaos: {
          lines: [
            { narrate: `Two days in, Neha hears from the team that half the sprint has switched to analytics. Refunds has stopped.` },
            { who: 'Neha', say: `Who decided this?` }
          ],
          prompt: 'What do you say?',
          options: [
            { text: `"I did, after a 30-second chat in the lift, and I shouldn't have without you. Let's size it, look at what it delays, and send Arvind the trade-off together. I'll tell him I jumped the gun."`,
              grade: 'best', meters: { trust: 1, delivery: 1, team: 1 },
              result: `Owning it quickly repairs most of the damage, and the trade-off goes to the CEO the way it should have the first time.` },
            { text: `"The CEO asked. We had no choice."`,
              grade: 'poor', meters: { trust: -2 },
              result: `There was a choice: to take it to Neha. Now she knows that anyone senior can reprioritise her team through you.` },
            { text: `"Let's keep doing both and see."`,
              grade: 'poor', meters: { delivery: -2, team: -1 },
              result: `Two half-done priorities instead of one done one, and still nobody has decided.` }
          ]
        }
      },
      debrief: {
        points: [
          `A senior person's idea is input, not an order. Thank them, and say what you'll do with it and by when.`,
          `Take it to the person who owns priorities, with a **rough size** and **what it would delay**.`,
          `Use **cost of delay** to compare: what each week of waiting costs for each option.`,
          `Leave room for what you don't know: the senior person may have a reason you haven't heard.`
        ],
        script: `> "Thanks, that's interesting. Let me take it to Neha with a rough size and what it would delay, and we'll come back to you by Friday."`,
        analogy: `It's a production change request from someone with admin rights. Even when they can push it straight to production, the change still goes through review, because the reviewer knows what else is running.`
      },
      links: ['tool:prioritise', 'lesson:stakeholders', 'phrase:priority-choose', 'term:hippo']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'dependency-slips',
      track: 'pm',
      title: `Their API moves two weeks`,
      summary: `Another team tells you their API will be two weeks late, the day before you needed it. Practise finding the smallest piece that still arrives, and turning it into options.`,
      keywords: ['dependency', 'late', 'other team', 'api', 'stub', 'critical path', 'blocked', 'options', 'platform'],
      role: `You lead a five-person team building customer refunds.`,
      setting: `Wednesday. Launch is in three weeks. You needed the refund endpoint from the Platform team by Friday.`,
      stakes: `The endpoint is on your critical path. You have an agreed API contract with Platform from two weeks ago.`,
      start: 'news',
      steps: {
        news: {
          lines: [{ who: 'Kiran, Platform lead (chat)', say: `Bad news: the refund endpoint will be two weeks late. Our database migration took priority. Sorry.` }],
          prompt: 'What is your first move?',
          options: [
            { text: `Call Kiran: what exactly is late, could a partial version (the refund call without the reporting fields) come sooner, and how sure is the new date?`,
              grade: 'best', meters: { trust: 1, delivery: 2 }, next: 'options',
              result: `"Two weeks late" is rarely all-or-nothing. Ten minutes on the phone gets you the detail the options will be built from.` },
            { text: `Post in the leadership channel: "Platform has blocked the refunds launch."`,
              grade: 'poor', meters: { trust: -2, delivery: -1 }, next: 'fallout',
              result: `Public, one-sided, and before you know the facts. Kiran will remember who put his team in that channel.` },
            { text: `Tell Priya "We're blocked by Platform" and wait for news.`,
              grade: 'ok', meters: { trust: -1, delivery: -1 }, next: 'options',
              result: `Priya should know, but "blocked" with no detail gives her nothing to act on, and waiting loses days. You call Kiran the next morning.` }
          ]
        },
        options: {
          lines: [{ narrate: `Kiran: the core refund call can be ready next Wednesday. The reporting fields need the full two weeks. Your team already builds against the agreed contract.` }],
          prompt: 'What do you take to Priya?',
          options: [
            { text: `"Platform's endpoint moves: the core call comes next Wednesday, the reporting fields in two weeks. Options: one, we test against a stub now and integrate on Wednesday, so launch holds and reporting follows a week after; two, we wait for everything and launch moves two weeks. I recommend one. Kiran agrees, and I've written it up for both teams."`,
              grade: 'best', meters: { trust: 2, delivery: 2, team: 1 },
              result: `The bad news arrives with two options, a recommendation, and agreement from the other team. Priya only has to say yes.` },
            { text: `"Launch moves two weeks because Platform is late."`,
              grade: 'ok', meters: { trust: 1, delivery: -1 },
              result: `Honest, but it leaves out the option that keeps the date. And "because Platform" sounds like blame.` },
            { text: `Ask your team to build the refund endpoint themselves, inside Platform's code.`,
              grade: 'poor', meters: { trust: -1, delivery: -1, team: -1 },
              result: `Without Platform's agreement, it's their code, their review and their migration you'd be colliding with. Offering help is good; taking over is not.` }
          ]
        },
        fallout: {
          lines: [
            { who: 'Rohan, Platform engineering manager (in the channel)', say: `We told your team about the migration two weeks ago.` },
            { narrate: `Kiran stops replying to your messages.` }
          ],
          prompt: 'What now?',
          options: [
            { text: `Message Kiran directly: "Sorry, I posted before I'd talked to you. Let's work out together what can arrive sooner." Then correct your message in the channel.`,
              grade: 'best', meters: { trust: 1, delivery: 1 },
              result: `Repairing the relationship is the fastest way back to the options. Kiran replies an hour later with the partial-delivery idea.` },
            { text: `Reply: "It still blocks our launch."`,
              grade: 'poor', meters: { trust: -2 },
              result: `True and useless. The thread turns into an argument with leadership watching.` },
            { text: `Ask Priya to handle Rohan.`,
              grade: 'ok', meters: { trust: -1, delivery: 1 },
              result: `It may unblock the launch, but your relationship with Kiran, which you will need again, stays broken.` }
          ]
        }
      },
      debrief: {
        points: [
          `When a dependency slips, first get the detail: what exactly is late, what could come sooner, how sure the new date is.`,
          `Look for the **smallest piece that unblocks you**, and keep working against the agreed contract with a stub.`,
          `Take the news upward with **options and a recommendation**, agreed with the other team where you can.`,
          `Never escalate publicly before talking to the person. It costs you the relationship you need to fix the problem.`
        ],
        script: `> "Platform's endpoint moves: the core refund call arrives next Wednesday, reporting in two weeks. If we test against a stub now and integrate on Wednesday, launch holds and reporting follows a week later. Kiran agrees. I recommend that."`,
        analogy: `A remote service degrades: you don't fail the whole request. You serve what you can from the healthy path, stub the missing part, and add it back when the service recovers.`
      },
      links: ['lesson:managing-dependencies', 'tool:dependencies', 'phrase:dep-slip-options', 'scenario:team-never-replies']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'forgotten-stakeholder',
      track: 'pm',
      title: `Finance sees it for the first time at UAT`,
      summary: `Two days before release, a stakeholder nobody consulted says it can't go live. Practise owning the gap, fixing it with them, and making sure it doesn't happen again.`,
      keywords: ['stakeholder', 'finance', 'uat', 'release', 'blocked', 'raci', 'consulted', 'forgotten'],
      role: `You lead a five-person team building customer refunds.`,
      setting: `User acceptance testing (UAT), two days before release.`,
      stakes: `Deepa, the Finance controller, is seeing the feature for the first time. Finance can stop the release. Nobody consulted Finance about how refunds reach the ledger.`,
      start: 'uat',
      steps: {
        uat: {
          lines: [{ who: 'Deepa, Finance controller', say: `Who decided refunds post to the ledger one by one, the same day? Our month-end close needs them batched. This can't go live.` }],
          prompt: 'What do you say?',
          options: [
            { text: `"You're right that we should have checked with you before building. Can we take 30 minutes today, so I understand exactly what month-end needs? Then I'll come back with what it takes and whether the date holds."`,
              grade: 'best', meters: { trust: 2, delivery: 1 }, next: 'fix',
              result: `You acknowledged the gap without grovelling, and moved straight to understanding. Deepa softens: she expected a fight.` },
            { text: `"Product signed off the requirements. This is what was agreed."`,
              grade: 'poor', meters: { trust: -2, delivery: -1 }, next: 'blocked',
              result: `Agreed by whom? Not by Finance. Defending the process to the person it left out makes her dig in.` },
            { text: `"We'll change it after the release."`,
              grade: 'ok', meters: { trust: -1, delivery: 1 }, next: 'fix',
              result: `Maybe possible, but you decided for Finance again. Deepa asks what "after" means.` }
          ]
        },
        fix: {
          lines: [{ narrate: `Deepa needs refunds batched into one daily ledger entry after 6 pm. The change is about 3 days with testing. The release was planned for Thursday 12 Nov.` }],
          prompt: 'What do you send to Neha and Priya?',
          options: [
            { text: `"Release moves from Thu 12 to Tue 17 Nov, to add the daily batching Finance needs for month-end. Deepa has agreed the design. I've added Finance as 'consulted' for anything that touches the ledger, so this doesn't happen again."`,
              grade: 'best', meters: { trust: 2, delivery: 1, team: 1 },
              result: `A short delay with a clear reason, the stakeholder on board, and a change that prevents the next surprise.` },
            { text: `"We ship Thursday; Finance can fix the ledger by hand until we add batching."`,
              grade: 'ok', meters: { trust: -1, delivery: 1 },
              result: `This might even be acceptable, but you decided it for Finance without asking. Ask Deepa whether a manual fix for a few days works for her.` },
            { text: `Ask the team to build it in two days by skipping the regression tests.`,
              grade: 'poor', meters: { delivery: -2, team: -1 },
              result: `A rushed change to the ledger without regression tests, two days before release, in a payments system.` }
          ]
        },
        blocked: {
          lines: [
            { narrate: `Deepa escalates to the CFO. The release is stopped.` },
            { who: 'Neha, Product Manager', say: `Why didn't anyone talk to Finance?` }
          ],
          prompt: 'What do you say?',
          options: [
            { text: `"That's on me as the lead: I listed the stakeholders we work with every day and missed Finance. Let's sit with Deepa today, agree the change and set a new date. From now on, Finance is consulted on anything that touches the ledger."`,
              grade: 'best', meters: { trust: 1, delivery: 1 },
              result: `It doesn't undo the escalation, but it ends the blame and starts the fix.` },
            { text: `"Finance should have read the PRD."`,
              grade: 'poor', meters: { trust: -2 },
              result: `Nobody sent it to them. Now the problem is your attitude as well as the ledger.` },
            { text: `"Let's ask the CFO for an exception."`,
              grade: 'ok', meters: { trust: -1, delivery: 1 },
              result: `It might get the release out, but it goes over Deepa's head a second time, and the month-end problem is still there.` }
          ]
        }
      },
      debrief: {
        points: [
          `Ask early: **"Who would be upset to hear about this on launch day?"** Finance, compliance, security and support are often missed.`,
          `When a forgotten stakeholder appears, acknowledge the gap, then move straight to understanding what they need.`,
          `Decide with them, not for them: even a reasonable workaround needs their agreement.`,
          `Fix the cause: add them to your stakeholder map and RACI as "consulted" for the work that affects them.`
        ],
        script: `> "You're right, we should have checked with you before building. Can we take 30 minutes today so I understand what month-end needs? Then I'll come back with what it takes and whether the date holds."`,
        analogy: `A forgotten stakeholder is an undocumented consumer of your API. You only find them when you change something and their system breaks. The fix is the same: find your consumers before you change the contract.`
      },
      links: ['lesson:stakeholders', 'tool:dependencies', 'phrase:stakeholder-early', 'term:raci']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'key-person-resigns',
      track: 'pm',
      title: `The one person who knows settlements`,
      summary: `The only engineer who understands a critical batch job resigns. Practise turning the risk into a handover plan, and defending its cost to your manager.`,
      keywords: ['risk', 'resignation', 'bus factor', 'key person', 'handover', 'knowledge transfer', 'notice period', 'raid'],
      role: `You lead a team of six.`,
      setting: `Your weekly 1:1 with Sameer.`,
      stakes: `Sameer is the only person who understands the nightly settlement job that pays merchants. If it fails after he leaves, merchants don't get paid. The risk was there before; nobody had written it down.`,
      start: 'news',
      steps: {
        news: {
          lines: [{ who: 'Sameer, senior developer', say: `I've accepted an offer. My last day is 4 December. I'm sorry, I know the settlement job is mostly me.` }],
          prompt: 'What do you do this week?',
          options: [
            { text: `Thank him, then within the week: log it as a high risk, agree a handover with Sameer (Divya and Arjun pair with him on the next four settlement runs, and he writes the runbook with them), and tell Priya the plan and its cost.`,
              grade: 'best', meters: { trust: 2, delivery: 2, team: 1 }, next: 'plan',
              result: `The notice period is the handover. Pairing on real runs moves the knowledge in a way a document alone can't.` },
            { text: `Try to keep him by promising a promotion.`,
              grade: 'poor', meters: { trust: -2, delivery: -1 }, next: 'counter',
              result: `A promotion isn't yours to promise, and it delays the handover while he thinks about it.` },
            { text: `Ask him to "document everything" before he leaves.`,
              grade: 'ok', meters: { delivery: 1, team: -1 }, next: 'plan',
              result: `Better than nothing, but a document written alone in the last week rarely covers what goes wrong at 2 am. Pairing on real runs does.` }
          ]
        },
        plan: {
          lines: [{ who: 'Priya, engineering manager', say: `Can't the handover wait until after the refunds release? We need everyone on refunds.` }],
          prompt: 'What do you say?',
          options: [
            { text: `"If we wait, Sameer has gone before the handover is done, and a failed settlement after 4 December means merchants don't get paid. It costs about three developer-days of refunds work over two sprints: refunds moves two days. I recommend we do it now."`,
              grade: 'best', meters: { trust: 2, delivery: 1, team: 1 },
              result: `The risk, its impact, the cost of acting and a recommendation, in four sentences. Priya agrees.` },
            { text: `"OK, after refunds."`,
              grade: 'poor', meters: { trust: -1, delivery: -2 },
              result: `Refunds finishes on 27 November. One week of handover remains, and the first settlement failure after Sameer leaves becomes an incident.` },
            { text: `"Then refunds has to slip a week."`,
              grade: 'ok', meters: { trust: -1, delivery: 1 },
              result: `The direction is right, but a week overstates it, and Priya pushes back on the number instead of the risk.` }
          ]
        },
        counter: {
          lines: [{ narrate: `Sameer takes two weeks to think, then leaves anyway. Priya is unhappy that you promised a promotion. Two weeks of handover time are gone.` }],
          prompt: 'What now?',
          options: [
            { text: `Tell Priya plainly what happened, start pairing on settlement runs the same day, write the runbook with Sameer, and ask the Platform team for a settlement expert to back you up during the first month.`,
              grade: 'best', meters: { trust: 1, delivery: 1 },
              result: `Half the time, but a real plan, and a safety net for the weeks when the knowledge is thinnest.` },
            { text: `Hope nothing breaks.`,
              grade: 'poor', meters: { delivery: -2 },
              result: `Settlement jobs break at month-end, under load, at 2 am. Hope is not a mitigation.` },
            { text: `Ask Sameer to be on call for the job after he leaves.`,
              grade: 'poor', meters: { trust: -1, delivery: -1 },
              result: `It's unfair to him and unreliable for you; his new employer may not allow it.` }
          ]
        }
      },
      debrief: {
        points: [
          `One person who knows a critical system is a risk long before they resign. Log it, with an owner and an action, while it is still cheap.`,
          `A notice period is a handover window. **Pairing on real work** transfers knowledge; a document written alone in the last week doesn't.`,
          `Defend a mitigation with its impact and its cost: "merchants don't get paid" against "refunds moves two days".`,
          `Don't promise what isn't yours to give.`
        ],
        script: `> "Sameer leaves on 4 December, and he's the only one who knows the settlement job. Divya and Arjun will pair with him on the next four runs and write the runbook with him. It costs about three developer-days; refunds moves two days. If we don't, a failed settlement after he leaves means merchants don't get paid."`,
        analogy: `A single person who knows a system is a single point of failure. You don't wait for the node to die before adding a replica; you replicate while the primary is healthy.`
      },
      links: ['tool:raid', 'lesson:risks-raid', 'phrase:risk-raise', 'term:bus-factor']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'keep-it-green',
      track: 'pm',
      title: `"Keep it Green for the steering committee"`,
      summary: `Your manager asks you to report Green while the date depends on another team. Practise keeping the colour honest without making your manager look bad.`,
      keywords: ['rag', 'green', 'amber', 'watermelon', 'status', 'steering committee', 'honest', 'manager pressure'],
      role: `You lead the refunds team.`,
      setting: `Monday. The steering committee meets on Wednesday.`,
      stakes: `The release depends on the Platform team delivering an endpoint by next Wednesday, and they haven't confirmed. Your honest status is Amber. Your manager wants it Green.`,
      start: 'ask',
      steps: {
        ask: {
          lines: [{ who: 'Priya, engineering manager', say: `Can we keep it Green for the steering committee? I don't want to create panic. We'll sort it out quietly.` }],
          prompt: 'What do you say?',
          options: [
            { text: `Privately: "I understand not wanting to alarm them. But if it slips, they'll ask why it was Green on Wednesday. Can we call it Amber, with the fix: it holds if Platform confirms by Tuesday, and Rohan is already on it? That shows we're in control, not in trouble."`,
              grade: 'best', meters: { trust: 2, delivery: 1 }, next: 'meeting',
              result: `You protected Priya from a worse conversation later, and gave her a way to present Amber as competence. She agrees.` },
            { text: `"OK, Green."`,
              grade: 'poor', meters: { trust: -1, delivery: -1 }, next: 'surprise',
              result: `A watermelon: green outside, and the risk inside is now hidden from the people who could have helped.` },
            { text: `Report Red, to be safe.`,
              grade: 'ok', meters: { trust: -1, delivery: 1 }, next: 'meeting',
              result: `Honest about the risk, but Red means "it will be missed unless someone acts", which isn't true yet. Overstating it is a different way of being wrong.` },
            { text: `Go around Priya to the committee chair.`,
              grade: 'poor', meters: { trust: -2, team: -1 },
              result: `You were right about the colour and wrong about the route. Priya will not trust you with a sensitive conversation again.` }
          ]
        },
        meeting: {
          lines: [{ who: 'Vikram, VP Engineering, chairing', say: `Why is refunds Amber?` }],
          prompt: 'What do you say?',
          options: [
            { text: `"It holds if Platform confirms the endpoint by Tuesday. Rohan has it in their sprint; we'll know on Tuesday. If they can't, we drop partial refunds and keep the date. No decision needed from you yet."`,
              grade: 'best', meters: { trust: 2, delivery: 1 },
              result: `A condition, a date to know by, a fallback, and a clear "nothing needed from you". That is what Amber should sound like.` },
            { text: `"Platform is late."`,
              grade: 'ok', meters: { trust: -1, delivery: 1 },
              result: `It sounds like blame, and it isn't even true yet: Platform hasn't missed anything.` },
            { text: `"It's nothing really, basically Green."`,
              grade: 'poor', meters: { trust: -2 },
              result: `You undid the honest colour in one sentence. If it slips now, it's worse than if you'd said Green.` }
          ]
        },
        surprise: {
          lines: [
            { narrate: `Platform can't deliver until the week after. The release misses its date.` },
            { who: 'Vikram', say: `This was Green two weeks ago. What happened?` }
          ],
          prompt: 'What do you say?',
          options: [
            { text: `"We knew it depended on Platform, and we reported Green. That was wrong; it should have been Amber. Here's the new date and what we're doing. From now on, the colour will show the conditions it depends on."`,
              grade: 'best', meters: { trust: 1, delivery: 1 },
              result: `"We", not "Priya": you owned the reporting without throwing your manager under the bus. That is what earns back trust from both of them.` },
            { text: `"Priya asked me to keep it Green."`,
              grade: 'poor', meters: { trust: -2 },
              result: `True, and it ends your working relationship with Priya. Raise it with her privately; in the meeting, own it as a team.` },
            { text: `"Platform slipped unexpectedly."`,
              grade: 'poor', meters: { trust: -2, delivery: -1 },
              result: `It wasn't unexpected: you knew. If Vikram later learns that, the question becomes your honesty, not the date.` }
          ]
        }
      },
      debrief: {
        points: [
          `Colours have meanings: Green holds without help; **Amber holds only if something specific happens**; Red will be missed unless someone acts.`,
          `When asked to report Green, disagree **privately**, show the risk to your manager, and offer Amber **with the fix**: that looks like control, not panic.`,
          `In the meeting, say the condition, the date you'll know by, the fallback, and what you need.`,
          `If a watermelon bursts, own it as "we", and fix the reporting.`
        ],
        script: `> "I can't call it Green while it depends on Platform delivering by Wednesday. Let's call it Amber with the fix: it holds if Platform confirms by Tuesday, and Rohan is already on it. That shows we're on top of it."`,
        analogy: `Reporting Green on a known dependency risk is a health check that returns 200 while the database is unreachable. Traffic keeps flowing to a node that is about to fail, and nobody reroutes until it does.`
      },
      links: ['lesson:rag-and-bad-news', 'tool:status', 'phrase:status-honest-amber', 'term:watermelon']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'when-will-it-be-done',
      track: 'pm',
      title: `"When will the backlog be done?"`,
      summary: `The PM divides the backlog by your average velocity and gets a date. Practise turning it into a range that includes your slow sprints and the backlog's growth.`,
      keywords: ['forecast', 'velocity', 'backlog', 'release date', 'burn-up', 'range', 'roadmap', 'when will it be done'],
      role: `You lead a team of six.`,
      setting: `Neha, the PM, needs a date for version 2 of the merchant dashboard for the leadership roadmap.`,
      stakes: `Your last three sprints: 20, 24 and 30 points. The backlog has 120 points and grew about 15% last quarter. Whatever date you give goes on the roadmap.`,
      start: 'maths',
      steps: {
        maths: {
          lines: [{ who: 'Neha, Product Manager', say: `120 points, and your velocity is 24, right? So 5 sprints: 10 weeks.` }],
          prompt: 'What do you say?',
          options: [
            { text: `"The arithmetic is right for an average sprint with nothing new added. Our last three sprints were 20 to 30, so 120 points is 4 to 6 sprints, and the backlog grew about 15% last quarter. I'd say 10 to 14 weeks and commit to 14. I'll show it on a burn-up every sprint."`,
              grade: 'best', meters: { trust: 2, delivery: 2 }, next: 'pushback',
              result: `You kept Neha's arithmetic and added the two things it was missing: the spread of your sprints, and the growth of the backlog.` },
            { text: `"Yes, 10 weeks."`,
              grade: 'poor', meters: { trust: -1, delivery: -2 }, next: 'later',
              result: `10 weeks assumes every sprint is average and nothing is ever added. Both assumptions are already false.` },
            { text: `"Let's re-estimate the whole backlog first."`,
              grade: 'ok', meters: { trust: -1, delivery: 1 }, next: 'pushback',
              result: `A week of sizing meetings, when your history already tells you most of the answer. You do the range in the end anyway.` }
          ]
        },
        pushback: {
          lines: [{ who: 'Neha', say: `14 weeks sounds like padding. Leadership will ask why not 10.` }],
          prompt: 'How do you answer?',
          options: [
            { text: `"10 is what happens if every sprint is our best and nothing is added. Here's the burn-up: at our slow pace, with the usual growth, it's 14. If they need 10, here's the slice that fits in 10 even at our slow pace."`,
              grade: 'best', meters: { trust: 2, delivery: 2 },
              result: `The chart turns "padding" into visible history, and the 10-week slice gives leadership something to choose.` },
            { text: `"Fine, say 12."`,
              grade: 'ok', meters: { trust: 1, delivery: -1 },
              result: `Splitting the difference is negotiation, not forecasting. 12 has no basis, so it can't be defended or updated.` },
            { text: `"Then they can ask someone else to estimate it."`,
              grade: 'poor', meters: { trust: -2 },
              result: `Defensive, and it leaves Neha alone in front of leadership.` }
          ]
        },
        later: {
          lines: [
            { narrate: `Sprint 4. 70 points done, 65 left: the backlog grew by 15.` },
            { who: 'Neha', say: `We're still on for week 10, right?` }
          ],
          prompt: 'What do you say?',
          options: [
            { text: `"No. The backlog grew by 15 points, and we've averaged 23. At this pace it's about three more sprints: week 14. I should have given you a range at the start. Here are the items we could cut to make week 12."`,
              grade: 'best', meters: { trust: 1, delivery: 1 },
              result: `Six weeks' notice instead of none, the cause, and an option. It still hurts, but far less than week 10 would.` },
            { text: `"Yes."`,
              grade: 'poor', meters: { trust: -2, delivery: -1 },
              result: `The numbers already say no. In week 10 the conversation will be much worse.` },
            { text: `"Probably a bit later."`,
              grade: 'ok', meters: { trust: -1, delivery: 1 },
              result: `True and useless: "a bit later" is not a date Neha can put on the roadmap.` }
          ]
        }
      },
      debrief: {
        points: [
          `Forecast with your **real range** of velocity (slowest to fastest recent sprints), not the average.`,
          `Backlogs grow as people learn. Include the growth you've seen.`,
          `Show it on a **burn-up chart**: work done and total scope as two lines, so a moving date has a visible cause.`,
          `When someone wants the early date, show what fits by it even at the slow pace.`
        ],
        script: `> "At our slowest recent pace, with the growth we usually see, it's 14 weeks; at our best, 10. I'd commit to 14. If leadership needs something in 10 weeks, here's the slice that fits even at our slow pace."`,
        analogy: `It's like forecasting disk usage from one week's average growth. Real growth is spiky and keeps rising; plan for the high-water mark and the trend, or the disk fills up "unexpectedly".`
      },
      links: ['lesson:release-planning', 'explainer:burn-down', 'tool:capacity', 'term:burn-up']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'interruptions-eat-sprint',
      track: 'pm',
      title: `Support ate the sprint again`,
      summary: `Third sprint in a row at 60% of the plan, and everyone says "support". Practise measuring it, protecting focus with a rotation, and fixing the sources.`,
      keywords: ['interruptions', 'support', 'unplanned work', 'sprint', 'focus', 'goalie', 'rotation', 'context switching'],
      role: `You lead a team of six that also handles production support for the merchant dashboard.`,
      setting: `The Sprint Review. For the third sprint in a row, the team finished about 60% of what it planned.`,
      stakes: `Neha, the PM, is losing patience. The team is frustrated: they feel busy all the time and still miss.`,
      start: 'review',
      steps: {
        review: {
          lines: [{ who: 'Neha, Product Manager', say: `Third sprint in a row we're at 60%. What's going on?` }],
          prompt: 'What do you say?',
          options: [
            { text: `"Support work is eating it, but I can't tell you how much yet. For the next two sprints we'll label every unplanned ticket and log the quick requests. Then I'll come back with the number and a plan."`,
              grade: 'best', meters: { trust: 2, delivery: 1, team: 1 }, next: 'measured',
              result: `You replaced a feeling with a measurement you'll have in two sprints. Neha can wait for data; she can't plan around "support".` },
            { text: `"The team needs to focus harder."`,
              grade: 'poor', meters: { trust: -1, team: -2 },
              result: `The team was interrupted all sprint; being told to focus harder, in front of the PM, is the opposite of help.` },
            { text: `"Let's plan less next sprint."`,
              grade: 'ok', meters: { trust: -1, delivery: 1 }, next: 'measured',
              result: `Probably right, but how much less? Without a number it's a guess, and Neha asks how you know. You agree to measure.` }
          ]
        },
        measured: {
          lines: [{ narrate: `Two sprints later: 35% of the team's time went to unplanned work. About 40% of that was the same five merchant questions, 30% was alerts from one noisy batch job, and the rest was real production bugs. Everyone was interrupted several times a day.` }],
          prompt: 'What do you propose?',
          options: [
            { text: `"Three things. One person per sprint on support duty, rotating, so the other five can focus. Plan sprints at 70% of capacity until the number drops. And this sprint, fix the noisy alert and write answers to the five common merchant questions. I'll report the unplanned share every sprint."`,
              grade: 'best', meters: { trust: 2, delivery: 2, team: 2 },
              result: `Protect focus now, plan honestly meanwhile, and remove the biggest sources. Two sprints later the unplanned share is down to 20%.` },
            { text: `"Let's plan at 65% from now on."`,
              grade: 'ok', meters: { trust: 1, delivery: 1 },
              result: `Honest planning, but it accepts the waste for ever. Most of it came from two fixable sources.` },
            { text: `"I'll take all the support myself, so the team can focus."`,
              grade: 'poor', meters: { delivery: -1, team: 1 },
              result: `Kind, and unsustainable: the lead becomes the bottleneck for decisions and reviews, and nobody else learns the support work.` }
          ]
        }
      },
      debrief: {
        points: [
          `**Measure unplanned work** before planning around it: label it for two sprints.`,
          `An **interrupt rotation** (one person per sprint takes the interrupts) protects everyone else's focus. Rotate it.`,
          `Plan at the honest capacity while you work on the sources. That's not padding.`,
          `**Fix the sources**: answers to repeated questions, noisy alerts fixed or removed.`
        ],
        script: `> "Over two sprints, 35% of our time went to unplanned work, most of it from five repeated questions and one noisy alert. From now on, one person per sprint takes support, we plan at 70%, and this sprint we fix the alert and write up the five answers."`,
        analogy: `It's interrupt handling on a CPU: if every core takes every interrupt, they all thrash their caches. Pin the interrupts to one core, and the rest keep their working set warm.`
      },
      links: ['lesson:interruptions', 'tool:capacity', 'phrase:interrupt-shield', 'explainer:burn-down']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'festive-sprint',
      track: 'pm',
      title: `The Diwali sprint`,
      summary: `A sprint with leave, a public holiday and on-call duty, and a request to plan the usual number. Practise bringing the capacity number to planning, before the sprint, not after.`,
      keywords: ['capacity', 'sprint planning', 'leave', 'holiday', 'diwali', 'velocity', 'on-call', 'overcommit'],
      role: `You lead a team of five.`,
      setting: `Sprint Planning for the two-week sprint that includes Diwali.`,
      stakes: `Asha is on leave for 3 days, Kiran for 2, Rahul is on call in the second week, Sameer is half-time on another project, and there is one public holiday. The team usually finishes about 31 points.`,
      start: 'plan',
      steps: {
        plan: {
          lines: [{ who: 'Neha, Product Manager', say: `Let's take our usual 31 points. There's a lot to deliver before the end of the year.` }],
          prompt: 'What do you say?',
          options: [
            { text: `"This sprint we have about 78% of a normal sprint: leave, the holiday, on-call and Sameer at half-time. At our usual pace that's about 24 points, somewhere between 22 and 27. I'd plan 24, with one stretch item ready."`,
              grade: 'best', meters: { trust: 2, delivery: 2, team: 1 }, next: 'push',
              result: `A number with its reasons, worked out before the sprint, and a stretch item in case it goes well.` },
            { text: `"Sure, 31."`,
              grade: 'poor', meters: { trust: -1, delivery: -2, team: -1 }, next: 'miss',
              result: `You planned a normal sprint in a sprint with three-quarters of the people.` },
            { text: `"Let's take 20, to be safe."`,
              grade: 'ok', meters: { trust: -1, delivery: 1 }, next: 'push',
              result: `Safer, but with no reason given it sounds like sandbagging, and Neha pushes back.` }
          ]
        },
        push: {
          lines: [{ who: 'Neha', say: `Can't people make up the leave days in the evenings?` }],
          prompt: 'What do you say?',
          options: [
            { text: `"Leave is leave, and Diwali is Diwali. If we plan on evenings, people burn out and quality drops just before year end. If something must land this sprint, tell me which 24 points matter most; we'll put those first and the stretch item after."`,
              grade: 'best', meters: { trust: 1, delivery: 2, team: 2 },
              result: `You protected the team without refusing the business: Neha chooses what matters most, and it gets done first.` },
            { text: `"OK, I'll ask the team to do some evenings."`,
              grade: 'poor', meters: { trust: 1, team: -2 },
              result: `The team hears that their leave is a planning problem. It costs you far more goodwill than 7 points are worth.` },
            { text: `"Fine, 28."`,
              grade: 'ok', meters: { trust: 1, delivery: -1 },
              result: `A compromise with nothing behind it. You'll probably miss by 4 points, and the next planning starts with "you missed again".` }
          ]
        },
        miss: {
          lines: [
            { narrate: `End of the sprint: 22 points done, 9 left over.` },
            { who: 'Neha', say: `We missed again. What happened?` }
          ],
          prompt: 'What do you say?',
          options: [
            { text: `"We planned a normal sprint in a sprint with 78% of the capacity. That was my mistake. From now on I'll bring the capacity number to every planning, with who's away and why."`,
              grade: 'best', meters: { trust: 1, delivery: 1 },
              result: `22 points was a normal result for that capacity; the plan was the problem. Owning it and changing the practice is what fixes the next one.` },
            { text: `"People were on leave."`,
              grade: 'poor', meters: { trust: -1 },
              result: `True, and known before the sprint. After the fact, it sounds like an excuse.` },
            { text: `"We'll carry the 9 points over."`,
              grade: 'ok', meters: { trust: -1, delivery: 1 },
              result: `Necessary, but it doesn't address why, so it will happen again at the next holiday.` }
          ]
        }
      },
      debrief: {
        points: [
          `Bring **capacity** to every Sprint Planning: leave, holidays, on-call, part-time people.`,
          `Scale your recent velocity by this sprint's capacity to get a forecast and a range.`,
          `Don't plan to make up leave in the evenings. Let the PM choose what matters most within the real capacity.`,
          `Saying the smaller number before the sprint is cheap; explaining a miss after it is expensive.`
        ],
        script: `> "This sprint we have about 78% of a normal sprint: Asha and Kiran on leave, the Diwali holiday, Rahul on call, Sameer at half-time. At our usual pace that's about 24 points. I'd plan 24 with one stretch item."`,
        analogy: `It's capacity planning for a cluster during maintenance: with two nodes drained, you don't promise the usual throughput. You scale the promise to the nodes that are actually up.`
      },
      links: ['tool:capacity', 'lesson:sprint-planning', 'phrase:capacity-planning', 'scenario:sprint-planning-overcommit']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'flat-burndown',
      track: 'scrum',
      title: `The flat burn-down`,
      summary: `Day 6 of 10, and the burn-down hasn't moved since day 2. Practise using the chart to ask a better question at the stand-up, while there are still options.`,
      keywords: ['burn-down', 'burndown', 'sprint', 'stand-up', 'flat', 'blocked', 'wip', 'environment'],
      role: `You lead a team of five and run the stand-up.`,
      setting: `Day 6 of a 10-day sprint. The burn-down has been flat since day 2: 38 of 40 points left.`,
      stakes: `Every stand-up has been "in progress, no blockers". If you find out on day 9, the Sprint Goal is lost with no options left.`,
      start: 'standup',
      steps: {
        standup: {
          lines: [{ narrate: `The stand-up is about to start. The burn-down is on the screen behind you.` }],
          prompt: 'What do you do in today\'s stand-up?',
          options: [
            { text: `Point at the chart: "We're on day 6 with 38 of 40 points left. Let's walk the board instead of the people: for each story, what's left, and what's in the way?"`,
              grade: 'best', meters: { trust: 1, delivery: 2, team: 1 }, next: 'cause',
              result: `Walking the board (story by story, not person by person) is how stuck work shows itself. It's not an accusation: the chart is the team's, not anyone's report card.` },
            { text: `"Let's all push hard to catch up."`,
              grade: 'poor', meters: { delivery: -1, team: -1 }, next: 'day9',
              result: `Pushing harder on work that is stuck for a reason doesn't unstick it. Nobody says what the reason is.` },
            { text: `Ask each person privately after the stand-up.`,
              grade: 'ok', meters: { delivery: 1, team: -1 }, next: 'cause',
              result: `You'll find out, more slowly. And the team doesn't see the whole picture together, which is when people notice the shared cause.` }
          ]
        },
        cause: {
          lines: [{ narrate: `Walking the board: five stories are "in progress", each about 80% coded. None is tested, because the only QA environment has been broken since Tuesday. Nobody mentioned it: everyone assumed someone else had reported it.` }],
          prompt: 'What do you do?',
          options: [
            { text: `"Two things today. Arjun, can you own getting the QA environment fixed with Platform, with an update by 2 pm? And let's finish stories one at a time: Divya and Rahul pair to get the refund screen tested first. I'll tell Neha the Sprint Goal is at risk and what we're doing."`,
              grade: 'best', meters: { trust: 2, delivery: 2, team: 1 },
              result: `One owner for the blocker, less work in progress, and the PM told early. The line starts moving on day 7.` },
            { text: `"While QA is down, let's start the next stories."`,
              grade: 'poor', meters: { delivery: -2 },
              result: `More work in progress, nothing finished. On day 9 you'll have eight stories at 80% instead of five.` },
            { text: `"I'll raise the environment with Platform myself."`,
              grade: 'ok', meters: { delivery: 1, team: -1 },
              result: `The blocker gets owned, by you. But the five half-finished stories stay half-finished, and the team learns the lead fixes everything.` }
          ]
        },
        day9: {
          lines: [{ narrate: `Day 9. The line is still flat at 35. The QA environment has been down since day 2. Neha learns that the Sprint Goal will be missed.` }],
          prompt: 'What do you do?',
          options: [
            { text: `Tell Neha now: the cause, what will be done by tomorrow, and what moves to the next sprint. In the retro, agree that environment problems are raised in the stand-up the same day.`,
              grade: 'best', meters: { trust: 1, delivery: 1, team: 1 },
              result: `It's late, but it's honest, and the retro action fixes the real cause: blockers nobody owned.` },
            { text: `Mark the stories done without testing, so the chart looks better.`,
              grade: 'poor', meters: { trust: -2, delivery: -2 },
              result: `The chart stops telling the truth, and untested work ships. Goodhart's law in one move.` },
            { text: `Extend the sprint by two days.`,
              grade: 'ok', meters: { trust: -1, delivery: 1 },
              result: `It feels practical, but Scrum's Sprints are a fixed length, and the fixed rhythm is what makes them predictable. Finish what you can, and replan.` }
          ]
        }
      },
      debrief: {
        points: [
          `A burn-down shows **that** something is wrong, not what. Use it to ask a better question.`,
          `**Walk the board, not the people**: story by story, what's left and what's in the way.`,
          `Shared blockers (an environment, a review queue) hide behind "someone else must have reported it". Give each one owner.`,
          `When work is stuck, **finish one thing at a time** rather than starting more.`
        ],
        script: `> "We're on day 6 with 38 of 40 points left. Let's walk the board: for each story, what's left, and what's in the way? ... Arjun, can you own the QA environment with Platform, update by 2 pm? Divya and Rahul, let's get the refund screen tested first."`,
        analogy: `A flat burn-down is a queue whose depth isn't dropping while every worker reports "busy". The workers are fine; something downstream (here, the test environment) has stopped consuming, and the backlog of 80%-done items is the back-pressure.`
      },
      links: ['explainer:burn-down', 'lesson:daily-scrum', 'phrase:standup-blocker', 'scenario:standup-move-on']
    }
  );
})(window.LELT);
