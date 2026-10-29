/*
 * scenarios-arch.js - software architecture scenarios: a proposal for twelve microservices, "it must
 * be scalable", changing a shared API, a weekend cutover, a decision nobody remembers, a design doc
 * stuck in review, and a client asking for four nines. Format: see scenarios-pm.js.
 */
(function (U) {
  'use strict';
  U.data.scenarios = U.data.scenarios || [];
  U.data.scenarios.push(

    /* ------------------------------------------------------------------ */
    {
      id: 'split-into-microservices',
      track: 'arch',
      title: `"Let's split it into twelve microservices"`,
      summary: `A respected senior proposes rewriting your monolith as twelve microservices. Practise weighing the cost, and finding the smallest split that solves the real problem.`,
      keywords: ['microservices', 'monolith', 'split', 'architecture', 'rewrite', 'modular monolith', 'senior engineer', 'proposal'],
      role: `You lead a team of six that owns the order management system, a Spring Boot monolith.`,
      setting: `Vikram, your most senior engineer, has written a proposal: split the monolith into 12 microservices over two quarters, "so we can scale and move faster". The real pain this year: refund changes wait for the monthly release, and the catalogue pages slow to a crawl at the sale peak.`,
      stakes: `Done well, the team gets faster where it hurts. Done badly, six people run twelve services and ship less for a year.`,
      start: 'proposal',
      steps: {
        proposal: {
          lines: [{ who: 'Vikram', say: `Every serious company runs microservices. Our monolith is holding us back.` }],
          prompt: 'How do you respond?',
          options: [
            { text: `"Let's start from the problems: refunds wait for the monthly release, and the catalogue struggles at the peak. For each split, what does it solve that a cleaner module boundary or a cache wouldn't? Could you add that, and the cost of running each service, to the doc for Thursday's review?"`,
              grade: 'best', meters: { trust: 1, delivery: 2, team: 1 }, next: 'review',
              result: `Vikram is a little deflated, then interested: the question is now which splits pay, not whether he is right.` },
            { text: `"Great idea. Let's start next sprint."`,
              grade: 'poor', meters: { delivery: -2, team: -1 }, next: 'review',
              result: `Two sprints later there are three services sharing one database, and a release now needs three deployments in the right order. You call a review to rethink.` },
            { text: `"We don't have time for this. Maybe next year."`,
              grade: 'ok', meters: { team: -1 }, next: 'review',
              result: `The real problems remain, and Vikram feels dismissed. He takes the proposal to your manager, who asks for a review.` }
          ]
        },
        review: {
          lines: [{ narrate: `In the review the numbers are clear: refunds changes every week and has its own tables; the catalogue mostly needs a cache; the other ten proposed services always change together.` }],
          prompt: 'What do you decide?',
          options: [
            { text: `Split out only refunds, owned end to end by one team with its own database, moved piece by piece; put a cache in front of the catalogue; enforce module boundaries inside the monolith for the rest; and write a decision record saying what would trigger the next split.`,
              grade: 'best', meters: { delivery: 2, team: 2, trust: 1 },
              result: `Refunds ships weekly within two months, the sale peak passes without an incident, and Vikram leads the refunds split.` },
            { text: `Approve six services instead of twelve, as a compromise.`,
              grade: 'ok', meters: { delivery: -1 },
              result: `Half the cost of the plan is still a cost: four of the six still change together, so releases are as coupled as before.` },
            { text: `Approve all twelve, so that Vikram stays motivated.`,
              grade: 'poor', meters: { delivery: -2, trust: -1 },
              result: `Motivation is the wrong reason for an architecture. A year later the team spends most of its time operating services.` }
          ]
        }
      },
      debrief: {
        points: [
          `Start from the problem, not the pattern: what does each split solve that something cheaper would not?`,
          `Microservices buy team independence and pay for it in network failures, operations and data consistency.`,
          `Split where there is a clear boundary, its own data, one owning team and a real need; keep the rest as a modular monolith.`,
          `Write down what would trigger the next split, so the decision can be reopened for a reason.`
        ],
        script: `> "Let's start from our two problems, refund releases and the sale peak. Which split solves each one, that a cleaner module or a cache wouldn't? Let's split out refunds, cache the catalogue, and write down what would trigger the next split."`,
        analogy: `Splitting a monolith because it is fashionable is like sharding a database that isn't full: every query becomes a distributed query, and you pay the cost of scale without needing the scale.`
      },
      links: ['lesson:monolith-microservices', 'lesson:conways-law', 'explainer:conways-law', 'tool:adr', 'phrase:arch-microservices', 'scenario:architect-disagree']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'make-it-scalable',
      track: 'arch',
      title: `"It must be scalable"`,
      summary: `The PRD for the festive sale says "fast, scalable and highly available". Practise turning adjectives into numbers before anyone starts designing.`,
      keywords: ['scalable', 'nfr', 'non-functional requirements', 'performance', 'capacity', 'load', 'sale', 'diwali', 'p95', 'availability'],
      role: `You lead the checkout team.`,
      setting: `The PRD for the Diwali sale checkout says: "The system must be fast, scalable and highly available." Kiran from Platform needs to know how much capacity to reserve. Your team is keen to start designing a queue-based architecture "to be safe".`,
      stakes: `Design for the wrong numbers and you either overspend for months or fall over on the biggest day of the year.`,
      start: 'start',
      steps: {
        start: {
          lines: [{ who: 'Kiran', say: `I need a number by Friday: how much capacity do you need for the sale?` }],
          prompt: 'What do you do first?',
          options: [
            { text: `Propose numbers to the PM and ask her to confirm or change them: "A peak of 3,000 orders a minute (last year's 1,800 plus the 60% growth marketing expects), 95% of checkout pages under 1 second at that peak, and 99.95% of checkout requests succeeding during sale week."`,
              grade: 'best', meters: { trust: 2, delivery: 2 }, next: 'pm',
              result: `A proposal is easy to answer. The PM replies within the hour.` },
            { text: `Tell Kiran to reserve ten times last year's peak, to be safe.`,
              grade: 'poor', meters: { delivery: 1, trust: -2 },
              result: `The cloud bill for the month triples, Finance asks why, and nobody can explain the number.` },
            { text: `Ask the PM: "What do you mean by scalable?"`,
              grade: 'ok', meters: { trust: 1 }, next: 'pm',
              result: `A fair question, and a hard one to answer. Two days later she replies "able to handle the sale traffic", and you propose numbers after all.` }
          ]
        },
        pm: {
          lines: [{ who: 'Meera (PM)', say: `3,000 a minute sounds right. But do we really need all of checkout under a second? The payment step depends on the bank.` }],
          prompt: 'How do you settle it?',
          options: [
            { text: `Split the target by step: your own pages under 1 second for 95% of requests; the payment step measured separately, with the bank's limit written down as a dependency risk. Then share the numbers with Kiran, and put them in the design doc as the targets the design must meet.`,
              grade: 'best', meters: { delivery: 2, trust: 1 },
              result: `The team designs for numbers it can test. A load test at 3,500 a minute two weeks before the sale finds one slow query, fixed in a day.` },
            { text: `Keep one target for everything, to keep it simple.`,
              grade: 'ok', meters: { delivery: -1 },
              result: `The payment step can never meet it, so the target is quietly ignored, and the rest of it with it.` },
            { text: `Drop the speed target: the bank decides anyway.`,
              grade: 'poor', meters: { delivery: -2 },
              result: `Without a target, nobody load-tests the pages you do control. One of them is the slow one on the day.` }
          ]
        }
      },
      debrief: {
        points: [
          `"Fast", "scalable" and "highly available" cannot be designed or tested. Get numbers before designing.`,
          `Propose numbers instead of asking open questions: a proposal is easier to confirm or change.`,
          `Use percentiles for speed, the peak load with its growth, and availability as a share of requests over a period.`,
          `Separate what you control from what a dependency controls, and write the dependency down as a risk.`
        ],
        script: `> "Can I propose numbers for you to confirm? A peak of 3,000 orders a minute, our pages under 1 second for 95% of requests at that peak, and 99.95% of checkout requests succeeding in sale week. The bank's payment step we measure separately."`,
        analogy: `Designing for "scalable" is like sizing a thread pool for "a lot of requests": every number you pick is either wasteful or wrong, and the real number takes five minutes to ask for.`
      },
      links: ['lesson:nfrs-tradeoffs', 'tool:prd', 'tool:rfc', 'phrase:arch-scalable-number', 'phrase:ask-propose-number', 'scenario:vague-prd']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'breaking-api-change',
      track: 'arch',
      title: `Three teams use the API you need to change`,
      summary: `Your refund API sends amounts as rupees with decimals, and you need whole paise to stop rounding errors. Practise changing a shared interface without breaking anyone.`,
      keywords: ['api', 'breaking change', 'versioning', 'deprecation', 'backward compatibility', 'consumers', 'other teams', 'migration'],
      role: `You lead the payments team.`,
      setting: `Rounding errors in refund amounts have caused two escalations from Finance. The fix is to send amounts as whole paise instead of rupees with decimals. Three teams call the refund API: the app, the support tools and the finance reports. Your developer Divya suggests just changing the field: "It's a small change."`,
      stakes: `Change it carelessly and three teams break on the same day, one of them Finance. Wait too long and the rounding errors go on.`,
      start: 'plan',
      steps: {
        plan: {
          lines: [{ who: 'Divya', say: `We could ship it on Monday. They'll just have to update.` }],
          prompt: 'What do you do?',
          options: [
            { text: `Add a new field, amount_paise, next to the old one and keep both working; check the logs for every caller; and tell each team's lead in writing: the new field is live now, the old one works until 31 March, here is a migration guide, and your team will help with the change.`,
              grade: 'best', meters: { trust: 2, delivery: 1 }, next: 'laggard',
              result: `Nobody breaks. The app team moves in a week, the support tools in a month.` },
            { text: `Ship the change on Monday and post a note in the engineering channel.`,
              grade: 'poor', meters: { trust: -2, delivery: -2 },
              result: `On Monday afternoon the finance reports show refunds 100 times too large. The month-end close is delayed, and three teams are angry with yours.` },
            { text: `Publish /v2/refunds with the new format, and ask everyone to move by next Friday.`,
              grade: 'ok', meters: { trust: -1, delivery: 1 }, next: 'laggard',
              result: `A new version is right; ten days is not. Two teams protest that it is not in their sprint, and you move the date to 31 March.` }
          ]
        },
        laggard: {
          lines: [{ narrate: `It is 20 March. The logs show the finance reports still read the old field every night.` }],
          prompt: 'What do you do?',
          options: [
            { text: `Talk to the finance-reports lead directly, find out what is blocking them, offer a developer from your team for two days, and agree a new date in writing; keep the old field working until they have moved, and tell your manager the new date.`,
              grade: 'best', meters: { trust: 2, team: 1 },
              result: `Their blocker was a report nobody owned. With your developer's help they move by 4 April, and you remove the old field in the next release.` },
            { text: `Extend the deadline by a month and send a reminder.`,
              grade: 'ok', meters: { trust: 1 },
              result: `It avoids the break, but without finding out what blocks them, April ends the same way.` },
            { text: `Switch the old field off on 31 March as announced: a deadline is a deadline.`,
              grade: 'poor', meters: { trust: -2, delivery: -1 },
              result: `The finance reports break on the day of the month-end close, the worst possible day. The deadline was kept and the relationship lost.` }
          ]
        }
      },
      debrief: {
        points: [
          `Any behaviour other teams can see becomes a promise (Hyrum's law). Find every caller before changing it.`,
          `Prefer additive changes: add the new field, keep the old one working, move the callers, remove it later.`,
          `Deprecate in writing, with a sunset date that fits other teams' planning, a migration guide and your help.`,
          `When a team lags, find out why and help, rather than breaking them on the deadline.`
        ],
        script: `> "amount_paise is live today, next to the old field, which keeps working until 31 March. Here's the migration guide, and I can lend you a developer for a day if that helps."`,
        analogy: `It is expand and contract for an interface: add the new column, move the readers, and only then drop the old one. Dropping it first is a migration that runs while the old code is still reading.`
      },
      links: ['lesson:api-versioning', 'lesson:migrations', 'lesson:managing-dependencies', 'phrase:arch-deprecate', 'phrase:dep-written-ask', 'term:hyrums-law']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'big-bang-migration',
      track: 'arch',
      title: `The weekend cutover`,
      summary: `Your manager wants the move to a new payment gateway done "in one weekend, like ripping off a plaster". Practise proposing a migration in small, reversible steps.`,
      keywords: ['migration', 'cutover', 'big bang', 'weekend', 'payment gateway', 'strangler', 'canary', 'rollback', 'parallel run'],
      role: `You lead the payments team.`,
      setting: `The company is moving from an old payment gateway to a new, cheaper one. The contract with the old one ends in three months. Priya, your manager, proposes: "Freeze on Friday, switch everything over the weekend, done by Monday." The old integration has eight years of special cases nobody fully remembers.`,
      stakes: `A failed weekend cutover means customers unable to pay on Monday morning, with no easy way back. A plan that takes too long risks the contract date.`,
      start: 'plan',
      steps: {
        plan: {
          lines: [{ who: 'Priya', say: `Why drag it out? One weekend and it's over.` }],
          prompt: 'What do you propose?',
          options: [
            { text: `"I want it done before the contract ends too, with less risk. From week 2 we send 1% of card payments to the new gateway and compare the results, then 10%, 50% and 100%, with a switch to route back in seconds. UPI moves after cards. We finish by week 10, two weeks before the contract ends."`,
              grade: 'best', meters: { trust: 2, delivery: 2 }, next: 'surprise',
              result: `Priya likes having a date and a way back. She asks for the plan in writing.` },
            { text: `"Fine, we'll do the weekend."`,
              grade: 'poor', meters: { trust: -1, delivery: -2 }, next: 'weekend',
              result: `You plan a 48-hour cutover with the whole team on standby.` },
            { text: `"We need six months to do it properly."`,
              grade: 'ok', meters: { trust: -2 },
              result: `It misses the contract date by three months, and Priya stops listening. She asks another team to plan it.` }
          ]
        },
        surprise: {
          lines: [{ narrate: `At 10%, the comparison shows the new gateway declining about 2% of payments that the old one accepted: cards from two small banks, which the old integration handled with a special case from 2019.` }],
          prompt: 'What do you do?',
          options: [
            { text: `Route those two banks' cards to the old gateway for now, fix the special case with the new provider, add it to the comparison checks, and stay at 10% until the difference is zero.`,
              grade: 'best', meters: { delivery: 2, trust: 1 },
              result: `It costs a week. You reach 100% in week 10, and the special case is now written down and tested.` },
            { text: `Pause the whole migration until the cause is fully understood.`,
              grade: 'ok', meters: { delivery: -1 },
              result: `Safe, and it loses two weeks you did not need to lose: the rest of the traffic was fine.` },
            { text: `Push on to 50%: 2% is small.`,
              grade: 'poor', meters: { delivery: -2, trust: -1 },
              result: `2% of half your payments is thousands of failed payments a day, and those banks' customers call support.` }
          ]
        },
        weekend: {
          lines: [{ narrate: `Sunday, 11 pm. The new gateway declines about 2% of payments: cards from two small banks that the old integration handled with a forgotten special case. The old gateway was switched off at 6 pm.` }],
          prompt: 'What do you do?',
          options: [
            { text: `Stop, switch the old gateway back on if you can, and tell Priya plainly what happened and what the safer plan is.`,
              grade: 'best', meters: { trust: 1, delivery: 1 },
              result: `Switching back takes three hours and a call to the old provider's support. Monday starts on the old gateway, and the plan becomes the gradual one.` },
            { text: `Stay on the new gateway and fix the special case overnight.`,
              grade: 'ok', meters: { delivery: -1, team: -2 },
              result: `The team works until 5 am and fixes it. Those banks' customers had hours of failed payments, and the team is exhausted on Monday.` },
            { text: `Stay on the new gateway and deal with it on Monday.`,
              grade: 'poor', meters: { delivery: -2, trust: -2 },
              result: `By 10 am on Monday support has had 600 calls. You find the special case by reading the old code under pressure.` }
          ]
        }
      },
      debrief: {
        points: [
          `Big-bang cutovers fail at the worst moment, with no way back. Prefer small, live, reversible steps.`,
          `Old systems hold rules nobody wrote down; comparing old and new results on real traffic finds them safely.`,
          `A gradual plan can still meet a hard date. Say the date out loud with the plan.`,
          `When a step finds a problem, route around it and keep the rest moving.`
        ],
        script: `> "Let's move 1% of card payments next week and compare the results, then 10%, 50% and 100%, with a switch to route back in seconds. We finish two weeks before the contract ends."`,
        analogy: `It is a canary release for an integration: a small slice of traffic first, compared against the old path, with an instant way back. Nobody would deploy a risky release to every server at once; a gateway migration is the same bet.`
      },
      links: ['lesson:migrations', 'lesson:ci-cd', 'tool:rfc', 'phrase:arch-alternatives', 'term:strangler-fig', 'term:feature-flag']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'why-did-we-choose-kafka',
      track: 'arch',
      title: `"Why on earth did we choose Kafka?"`,
      summary: `A new architect wants to replace Kafka with something simpler, and nobody remembers why it was chosen. Practise reconstructing a decision and making sure the next one is written down.`,
      keywords: ['adr', 'decision record', 'kafka', 'architecture decision', 'why', 'documentation', 'architect', 'legacy decision'],
      role: `You lead the order platform team.`,
      setting: `Rohit, a new principal architect, says in the architecture forum: "Kafka is overkill for us. Let's move to a simple queue." Kafka was chosen three years ago, before you joined. The two people who chose it have left, and nothing was written down. Your team half-agrees with Rohit.`,
      stakes: `If Kafka was chosen for a reason that still holds, removing it could quietly break something. If not, you may be paying for complexity you do not need.`,
      start: 'forum',
      steps: {
        forum: {
          lines: [{ who: 'Rohit', say: `Does anyone know why we have Kafka? If not, I propose we replace it next quarter.` }],
          prompt: 'What do you say?',
          options: [
            { text: `"Good question, and I don't know either. Before we decide, can I spend two days finding out what depends on it today: who reads the topics, whether anyone replays events, what ordering we rely on? I'll bring it to next week's forum, so we decide on facts."`,
              grade: 'best', meters: { trust: 2, delivery: 1 }, next: 'facts',
              result: `Rohit agrees. A week of finding out is cheaper than a migration in the wrong direction.` },
            { text: `"It was the old architects' decision. We should respect it."`,
              grade: 'poor', meters: { trust: -1 }, next: 'facts',
              result: `Respecting a decision nobody can explain is not a reason. Rohit raises it again the next month, with less patience, and you go looking for the facts.` },
            { text: `"Agreed, it's overkill. Let's replace it."`,
              grade: 'ok', meters: { delivery: -1 }, next: 'facts',
              result: `You agreed before knowing what depends on it. Luckily someone in the forum asks what the invoicing team uses, and you go and find out.` }
          ]
        },
        facts: {
          lines: [{ narrate: `You find out: the invoicing team replays the last 3 days of order events after every outage, and the fraud team relies on events for one order arriving in order. A simple queue gives neither.` }],
          prompt: 'What do you do with this?',
          options: [
            { text: `Write a decision record now: the context, the drivers (replay, ordering per order), the options and their costs, and the decision to keep Kafka, with when to revisit it. Share it in the forum, and agree that every significant decision from now on gets one.`,
              grade: 'best', meters: { trust: 2, delivery: 1, team: 1 },
              result: `Rohit reads it and agrees: "That's a good reason. I wish it had been written down." The team starts a decision-record folder in the repository; there are seven records by the end of the quarter.` },
            { text: `Tell Rohit in the forum, and move on.`,
              grade: 'ok', meters: { trust: 1 },
              result: `The decision holds, for now. In a year someone new asks the same question, and the answer has to be found all over again.` },
            { text: `Keep quiet: if nobody pushes, Kafka stays anyway.`,
              grade: 'poor', meters: { trust: -2 },
              result: `Rohit's proposal goes into the next quarter's plan, and the invoicing team finds out in testing that replay is gone.` }
          ]
        }
      },
      debrief: {
        points: [
          `A decision nobody can explain will be reopened, and may be undone for the wrong reasons.`,
          `Before changing an old decision, find out what depends on it today.`,
          `Write the decision record when the decision is made: the context, the drivers, the options, the decision and its consequences.`,
          `"I don't know; let me find out" is a strong answer in an architecture forum.`
        ],
        script: `> "I don't know why it was chosen either. Let me spend two days finding out what depends on it, and bring the facts next week. Whatever we decide, I'll write it down this time."`,
        analogy: `An undocumented architecture decision is a magic number in the code: it works, nobody knows why, and the first person to tidy it up breaks something nobody tested.`
      },
      links: ['tool:adr', 'lesson:rfcs-and-adrs', 'phrase:arch-decision-record', 'scenario:decision-reversed', 'term:decision-record']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'rfc-stuck-in-review',
      track: 'arch',
      title: `The design doc in review for six weeks`,
      summary: `Your team's design doc has 140 comments, three rewrites and no decision, while the work waits. Practise getting a design decided.`,
      keywords: ['rfc', 'design doc', 'design review', 'decision', 'decider', 'comments', 'analysis paralysis', 'disagree and commit'],
      role: `You lead the notifications team.`,
      setting: `Six weeks ago Divya wrote a design doc for moving SMS and email notifications to a new provider. It now has 140 comments from nine people, three rewrites, and two reviewers who disagree about whether to put a queue in between. Nobody has said who decides. The team is building other things and waiting.`,
      stakes: `Every week of waiting delays the move, and Divya is losing heart. Forcing a decision badly could alienate the reviewers whose systems depend on it.`,
      start: 'stuck',
      steps: {
        stuck: {
          lines: [{ who: 'Divya', say: `Every time I answer the comments, there are new ones. I don't know when it's finished.` }],
          prompt: 'What do you do?',
          options: [
            { text: `Agree with your manager that the decider is Kiran, the platform lead, whose team will run it; tell the reviewers in writing that comments close on Wednesday and that a 45-minute review on Thursday settles the queue question, with a decision at the end.`,
              grade: 'best', meters: { trust: 1, delivery: 2, team: 2 }, next: 'review',
              result: `The comments slow to a few important ones. Divya has an end date.` },
            { text: `Tell Divya to keep answering comments until everyone is happy.`,
              grade: 'poor', meters: { delivery: -2, team: -2 },
              result: `Everyone is never happy. Three weeks later Divya asks to move to another team.` },
            { text: `Tell the team to start building and ignore the open comments.`,
              grade: 'ok', meters: { delivery: 1, trust: -2 }, next: 'review',
              result: `Work starts, and two reviewers tell your manager their concerns were ignored. You have to hold the review anyway.` }
          ]
        },
        review: {
          lines: [{ narrate: `In the review both options hold up: a queue is more resilient; direct calls are simpler, and fast enough at today's volume. The two reviewers still disagree.` }],
          prompt: 'How do you end the meeting?',
          options: [
            { text: `Ask Kiran to decide against the doc's goals, there and then; record the decision, the reasons and the dissent in a decision record, with what would change it ("above 50,000 messages an hour, we add the queue"); and ask everyone to commit to it.`,
              grade: 'best', meters: { delivery: 2, trust: 2 },
              result: `Kiran chooses direct calls for now, with the trigger written down. The reviewer who wanted the queue says, "Fine, as long as the trigger is in the record." Work starts on Monday.` },
            { text: `Ask the reviewers to go away and think about it for another week.`,
              grade: 'ok', meters: { delivery: -1 },
              result: `A week later, the same disagreement, with less goodwill.` },
            { text: `Take a vote of everyone in the room.`,
              grade: 'poor', meters: { trust: -1, delivery: 1 },
              result: `Direct calls win 5 to 4, and the four feel outvoted, not convinced. The debate carries on in the pull requests.` }
          ]
        }
      },
      debrief: {
        points: [
          `A design doc needs one decider and a date. Without them, the comments never end.`,
          `Close comments at a set time, and settle what is left in a short review.`,
          `When two options both hold up, decide, record why and what would change it, and commit.`,
          `Protect the author: endless review is exhausting, and ending it is the lead's job.`
        ],
        script: `> "Kiran decides, on Thursday. Comments close on Wednesday evening. In the review we settle the queue question against the goals, write the decision and its trigger in a decision record, and then we all commit to it."`,
        analogy: `A design doc with no decider is a cluster with no leader election: every node keeps proposing, nobody commits, and no write ever completes.`
      },
      links: ['tool:rfc', 'tool:adr', 'lesson:design-reviews', 'lesson:rfcs-and-adrs', 'phrase:disagree-commit', 'phrase:meeting-decider']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'four-nines-request',
      track: 'arch',
      title: `"The client wants 99.99%"`,
      summary: `A large client's contract asks for 99.99% uptime, and sales has already said yes. Practise translating nines into minutes, money and choices.`,
      keywords: ['sla', 'slo', 'uptime', '99.99', 'four nines', 'availability', 'contract', 'sales', 'error budget', 'reliability'],
      role: `You lead the team that runs the merchant API.`,
      setting: `Sales is closing a contract with a large retailer. The draft SLA says 99.99% monthly availability, with penalties. Your service has run at about 99.95% over the past year, in a single region, with one on-call engineer at a time. Sales has told the client "no problem".`,
      stakes: `Sign it as it is and you will miss it most months, and pay penalties. Give a flat no and you look like the team that blocks revenue.`,
      start: 'sales',
      steps: {
        sales: {
          lines: [{ who: 'Rahul (Sales)', say: `It's just one more nine. Can you confirm by tomorrow so we can sign?` }],
          prompt: 'What do you say?',
          options: [
            { text: `"I want this deal to work. 99.99% means about 4 minutes of downtime a month; we run at about 99.95% today, which is about 22. Getting there needs a second region and a bigger on-call rota: roughly a quarter of work, and extra cost every month. Can I give you two options with their costs by Thursday?"`,
              grade: 'best', meters: { trust: 2, delivery: 1 }, next: 'options',
              result: `Rahul had not known what a nine meant in minutes. He asks for the options.` },
            { text: `"Sure, we'll make it work."`,
              grade: 'poor', meters: { trust: -2, delivery: -2 },
              result: `The contract is signed. In the first three months you miss the SLA twice and the company pays penalties, and the client's trust drops with each incident.` },
            { text: `"That's impossible."`,
              grade: 'ok', meters: { trust: -2 }, next: 'options',
              result: `Rahul escalates to your manager, who asks you to explain. You end up preparing the options anyway, from a worse position.` }
          ]
        },
        options: {
          lines: [{ narrate: `You have worked out two options.` }],
          prompt: 'What do you put to Rahul and your manager?',
          options: [
            { text: `"Option A: an SLA of 99.9%, which we beat today, with service credits and a status page: no extra cost. Option B: 99.99%, after a second region and a larger rota, from next quarter, at this monthly cost. I recommend A; we keep an internal target of 99.95%, so we see trouble long before the SLA."`,
              grade: 'best', meters: { trust: 2, delivery: 2 },
              result: `The client accepts option A with the status page. Sales gets the deal, and the SLA is one you can keep.` },
            { text: `Offer 99.99%, but exclude "planned maintenance" and "third-party failures" in the small print.`,
              grade: 'ok', meters: { trust: -1, delivery: 1 },
              result: `Legally safer, and the client's lawyers spot it. The negotiation sours, and you still have no plan to improve.` },
            { text: `Offer 99.99% and plan to work out how later.`,
              grade: 'poor', meters: { trust: -2, delivery: -2 },
              result: `A promise without a plan is a penalty waiting to happen.` }
          ]
        }
      },
      debrief: {
        points: [
          `Translate nines into minutes: 99.9% allows about 43 minutes a month, 99.95% about 22, 99.99% about 4.`,
          `Each extra nine costs far more than the last: redundancy, automation, on-call. Put a cost on it.`,
          `Offer options with costs and a recommendation, rather than a yes you cannot keep or a flat no.`,
          `Set the SLA looser than what you really achieve, and keep a tighter internal SLO.`
        ],
        script: `> "99.99% means about 4 minutes of downtime a month, and that needs a second region and a bigger rota. Option A: 99.9%, which we beat today, with credits and a status page. Option B: 99.99% from next quarter, at this cost. I recommend A."`,
        analogy: `Promising 99.99% from a single region is like promising zero data loss from a database with no replica. The number is easy to write down; the architecture decides whether it is true.`
      },
      links: ['lesson:slos', 'lesson:nfrs-tradeoffs', 'phrase:arch-error-budget', 'scenario:sales-promised-feature', 'term:sla', 'term:error-budget']
    }
  );
})(window.LELT);
