/*
 * scenarios-leadership.js - leadership scenarios: doing it yourself instead of delegating, work
 * nobody sees, and saying no to your manager. Format: see scenarios-pm.js.
 */
(function (U) {
  'use strict';
  U.data.scenarios = U.data.scenarios || [];
  U.data.scenarios.push(

    /* ------------------------------------------------------------------ */
    {
      id: 'doing-it-myself',
      track: 'leadership',
      title: `"It's faster if I do it myself"`,
      summary: `A tricky bug you could fix in 3 hours, and a team member who has never seen that code. Practise delegating instead of becoming the bottleneck.`,
      keywords: ['delegate', 'delegation', 'do it myself', 'bottleneck', 'hero', 'from engineer to lead', 'grow team'],
      role: `You lead the team. Until last month you were its strongest Java developer.`,
      setting: `Wednesday, 4 pm. A bug in the invoice service gives wrong GST totals for some multi-state orders, and it must be fixed by Friday. You know that code well and could fix it in 3 hours. Anil, a mid-level developer, has never touched the invoice service.`,
      stakes: `Next quarter's plan is due Friday, and you have two 1:1s tomorrow. If you take every hard bug, the team never learns the invoice service and you become the bottleneck.`,
      start: 'decide',
      steps: {
        decide: {
          lines: [{ narrate: `Your fingers itch to open the invoice code.` }],
          prompt: 'What do you do?',
          options: [
            { text: `Give it to Anil with a clear brief (the bug, what "fixed" means, the deadline, where to look) and offer a 20-minute walkthrough of the invoice code now, plus a check-in tomorrow at noon.`,
              grade: 'best', meters: { delivery: 1, team: 2 }, next: 'checkin',
              result: `Anil looks a little nervous and a lot more interested. The walkthrough costs you 20 minutes; the next invoice bug will cost you none.` },
            { text: `Fix it yourself tonight; it's faster.`,
              grade: 'poor', meters: { delivery: 1, team: -2 }, next: 'again',
              result: `Fixed by 11 pm. Faster this time.` },
            { text: `Give it to Anil with "let me know if you need anything".`,
              grade: 'ok', meters: { delivery: -1, team: 1 }, next: 'checkin',
              result: `Delegating is right, but with no walkthrough and no check-in, Anil struggles quietly in code he's never seen. He gets there, half a day later than he needed to.` },
            { text: `Give it to Sameer, who knows the invoice service a little.`,
              grade: 'ok', meters: { delivery: 1, team: -1 },
              result: `Safer for Friday, but you're spreading knowledge only to the person who already has the most. The bus factor on the invoice service stays at two.` }
          ]
        },
        checkin: {
          lines: [{ narrate: `Thursday noon. Anil has found the cause (tax rounded per line instead of per invoice), but his fix uses a different rounding approach from the one you'd choose. It's correct, and the tests pass.` }],
          prompt: 'What do you do?',
          options: [
            { text: `Accept his approach, since it's correct and tested. Mention the alternative as a learning point, not a requirement. Thank him in the team channel for the fix.`,
              grade: 'best', meters: { delivery: 1, team: 2 },
              result: `Anil now owns the invoice rounding logic, and he knows it. The public thanks tells the whole team that hard bugs are a chance, not a trap.` },
            { text: `Rewrite it your way before merging.`,
              grade: 'poor', meters: { team: -2 },
              result: `Anil learns that delegated work isn't really his, and that you'll redo it anyway. Next time he'll wait for you.` },
            { text: `Ask him to change it to your approach.`,
              grade: 'ok', meters: { team: -1 },
              result: `If your approach is clearly better (a real bug, or a maintenance problem), explain why. If it's only your preference, insisting teaches him to wait for your answer instead of thinking.` }
          ]
        },
        again: {
          lines: [{ narrate: `It's the third time this month you've fixed something yourself late at night. Your planning document is late, you skipped a 1:1, and in the retro two developers ask why they never get the interesting bugs.` }],
          prompt: 'What do you change?',
          options: [
            { text: `List the areas only you know. Over the next month, delegate one task in each, with a walkthrough and a check-in. Block time in your calendar for planning and 1:1s, and protect it.`,
              grade: 'best', meters: { trust: 1, delivery: 1, team: 2 },
              result: `The first month is slower. By the third, three people can fix the invoice service, and you have time to lead.` },
            { text: `Work longer hours so you can do both.`,
              grade: 'poor', meters: { delivery: -1, team: -1 },
              result: `You become the single point of failure for the team, and eventually for yourself.` },
            { text: `Delegate the next easy bug.`,
              grade: 'ok', meters: { team: 1 },
              result: `A start, but easy bugs don't give the team what they asked for: the interesting work.` }
          ]
        }
      },
      debrief: {
        points: [
          `As a lead, your output is the team's output. A bug you fix is one bug; a developer who can fix the next ten is worth far more.`,
          `"It's faster if I do it" is true once and false over a quarter. It also makes you the bottleneck and the single point of failure.`,
          `Delegate the outcome, not the steps: the problem, what "fixed" means, the deadline, where to look, and when you'll check in.`,
          `Accept solutions that are correct even when they're not how you'd do it. Correct only real problems, and explain why.`,
          `Credit people in public for what they fixed.`
        ],
        script: `> "Anil, can you own the GST bug? Multi-state invoices total wrong; it needs to be fixed and tested by Friday. Let me walk you through the invoice code for 20 minutes now, and we'll check in tomorrow at noon. It's yours; I'm here if you get stuck."`,
        analogy: `Delegation is programming to an interface: you specify the contract (what "fixed" means, the deadline, the constraints), not the implementation. If you write every implementation yourself, you're a single-threaded monolith: correct, but it can't scale.`
      },
      links: ['phrase:delegate-outcome', 'phrase:visible-credit', 'scenario:invisible-work', 'scenario:quiet-junior']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'invisible-work',
      track: 'leadership',
      title: `"I don't see your impact"`,
      summary: `You've worked hard all half-year, and your manager can't see what changed. Practise turning effort into visible outcomes.`,
      keywords: ['impact', 'visibility', 'performance review', 'promotion', 'layoff', 'influence', 'leverage', 'managing up', 'replaceable'],
      role: `You've been a lead for eight months.`,
      setting: `Your mid-year review. You've worked hard: fixed production incidents at night, reviewed most of the team's PRs, unblocked people every day.`,
      stakes: `Priya's view of you affects your promotion, and in a layoff, whether you're seen as essential or easy to replace.`,
      start: 'review',
      steps: {
        review: {
          lines: [{ who: 'Priya, your manager', say: `You're clearly busy, but I don't see the impact. What changed because of your leadership this half?` }],
          prompt: 'What do you say?',
          options: [
            { text: `"That's fair; I haven't made it visible. Concretely: incidents went from 6 a month to 2 after I set up on-call and runbooks; PR review time dropped from 3 days to 1; Karthik went from his first PR to owning the search filters. I'll start sending you a short monthly note with outcomes like these."`,
              grade: 'best', meters: { trust: 2, team: 1 }, next: 'habit',
              result: `Priya writes the numbers down. She can now defend you in the calibration meeting, using your words.` },
            { text: `"I've worked really hard; I'm online till midnight most days."`,
              grade: 'poor', meters: { trust: -1 }, next: 'habit',
              result: `Effort isn't impact, and "online till midnight" can sound like a planning problem. Priya still has nothing to say about you in calibration.` },
            { text: `"I don't like talking about my own work; the team did it."`,
              grade: 'ok', meters: { trust: -1, team: 1 }, next: 'habit',
              result: `Modesty is good, but "the team did it", with no specifics, leaves Priya with nothing to defend you with. You can credit the team and still name what changed.` },
            { text: `"Nobody told me what you expected."`,
              grade: 'poor', meters: { trust: -2 },
              result: `Maybe true, but now the review is about blame. Asking for expectations is your job too; do it at the start of each half, not at the end.` }
          ]
        },
        habit: {
          lines: [{ narrate: `After the review, you think about how to avoid this conversation next time.` }],
          prompt: 'What habit will make your impact visible from now on?',
          options: [
            { text: `Keep a weekly list of outcomes (with numbers and names), send Priya a short monthly update, write important decisions down where others can see them, and credit the team publicly for wins.`,
              grade: 'best', meters: { trust: 2, team: 1 },
              result: `Twenty minutes a week. Next review, the conversation is about your next step, not about what you did.` },
            { text: `Mention your work in every meeting.`,
              grade: 'ok', meters: { trust: -1, team: -1 },
              result: `Visible, and irritating. Constant self-promotion makes people trust your claims less, and the team notices who gets mentioned.` },
            { text: `Work even harder, so it becomes obvious.`,
              grade: 'poor', meters: { trust: -1, team: -1 },
              result: `Hard work that nobody sees stays unseen, however hard it is.` }
          ]
        }
      },
      debrief: {
        points: [
          `Busy isn't impact. Impact is what changed: numbers, outcomes, people who grew.`,
          `Being visible is part of the job, not vanity. Your manager has to describe your work to people who never see it.`,
          `Keep a weekly list of outcomes. In review season you'll have facts instead of feelings.`,
          `Credit the team specifically and publicly: it's generous, and it shows the leadership that made it happen.`,
          `Leverage beats effort: work that makes the team better (on-call, runbooks, faster reviews, growing people) is what makes you hard to replace.`
        ],
        script: `> "Fair point; I haven't made it visible. This half, incidents went from 6 a month to 2 after we set up on-call and runbooks, PR reviews went from 3 days to 1, and Karthik now owns the search filters. I'll send you a short note each month with outcomes like these."`,
        analogy: `Work nobody can see is a service with no metrics: it may run perfectly, but nobody can tell, so when it's time to cut costs it looks like the safe thing to switch off.`
      },
      links: ['phrase:visible-outcomes', 'phrase:visible-monthly', 'phrase:visible-ask-manager', 'scenario:doing-it-myself', 'scenario:saying-no-to-manager']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'saying-no-to-manager',
      track: 'leadership',
      title: `Saying no to your manager`,
      summary: `Your manager asks your full team to take on "a small dashboard". Practise saying no respectfully, by showing the trade-off.`,
      keywords: ['say no', 'saying no', 'push back', 'manager', 'yes man', 'hierarchy', 'respect', 'trade-off', 'capacity'],
      role: `You lead a team at full capacity on the checkout redesign, due on 4 Dec.`,
      setting: `Priya calls you about a new internal dashboard for the sales team.`,
      stakes: `Taking it on moves checkout by about two weeks. Priya is your manager; you've never refused her anything, and saying no to a senior feels disrespectful to you.`,
      start: 'ask',
      steps: {
        ask: {
          lines: [{ who: 'Priya, your manager', say: `Can your team take the sales dashboard too? It's small, two weeks. You're the best fit.` }],
          prompt: 'What do you say?',
          options: [
            { text: `"I want to help. Here's the trade-off: we're full on checkout, due 4 Dec. If we take the dashboard, checkout moves to about 18 Dec. If the dashboard matters more, I'll do it. If checkout's date matters more, could it wait until January? I could give sales a simple report from existing data this week as a stopgap."`,
              grade: 'best', meters: { trust: 2, delivery: 2, team: 1 }, next: 'decide',
              result: `You said yes to Priya's problem and showed the cost of the solution. It doesn't sound like refusal; it sounds like a lead who knows the team's capacity.` },
            { text: `"Yes, of course."`,
              grade: 'poor', meters: { trust: -1, delivery: -2, team: -2 }, next: 'slip',
              result: `Priya is pleased, and she believes checkout is still on 4 Dec.` },
            { text: `"No, we're too busy."`,
              grade: 'ok', meters: { trust: -2, team: 1 },
              result: `True, but a bare "no" sounds as if you don't care about her problem. Priya will go elsewhere, and remember.` },
            { text: `"Let me think about it."`,
              grade: 'ok', meters: { trust: -1 },
              result: `It buys time, but with no time given, Priya doesn't know when to expect an answer or what you're weighing.` }
          ]
        },
        decide: {
          lines: [{ who: 'Priya', say: `Checkout's date matters more. But sales will be unhappy.` }],
          prompt: 'What do you offer?',
          options: [
            { text: `"Then I'll spend 2 hours this week giving them a simple report from the existing tables, and we'll plan the real dashboard for January. I'll talk to the sales lead myself so they hear the plan directly."`,
              grade: 'best', meters: { trust: 2, delivery: 1 },
              result: `Sales gets something this week, a date for the rest, and a conversation with the person who can explain it. Priya doesn't have to deliver the bad news alone.` },
            { text: `"That's for sales to deal with."`,
              grade: 'poor', meters: { trust: -2 },
              result: `You turned a good conversation into a problem for Priya. Sales' unhappiness will land on her desk.` },
            { text: `"Could you explain it to them?"`,
              grade: 'ok', meters: { trust: -1 },
              result: `Fine to ask, but you're the one who can explain the options and offer the stopgap. Don't leave her carrying your message.` }
          ]
        },
        slip: {
          lines: [
            { narrate: `Three weeks later, both projects are behind. The dashboard took 4 weeks, not 2, and checkout moves to late December.` },
            { who: 'Priya', say: `Why didn't you tell me checkout would slip?` }
          ],
          prompt: 'What do you say?',
          options: [
            { text: `"I should have shown you the trade-off when you asked, instead of just saying yes. Here's where both stand now, and two options for the next three weeks."`,
              grade: 'best', meters: { trust: 1, delivery: 1 },
              result: `Owning it and moving straight to options limits the damage. Next time, the trade-off comes before the yes.` },
            { text: `"You asked us to take it on."`,
              grade: 'poor', meters: { trust: -2 },
              result: `True, and it puts the blame on her for a cost you knew about and didn't mention.` },
            { text: `"We underestimated the dashboard."`,
              grade: 'ok', meters: { trust: -1 },
              result: `Also true, but it misses the real lesson: even at 2 weeks, it was always going to move checkout.` }
          ]
        }
      },
      debrief: {
        points: [
          `Saying no to a manager is rarely a "no". It's showing the trade-off and letting them choose: "If we take this, that moves to the 18th. Which matters more?"`,
          `Respect and disagreement go together. You can be polite and warm and still clear about the cost.`,
          `Offer something: a smaller version, a later date, a stopgap. A no with an option feels like help.`,
          `A yes you can't keep does more damage to the relationship than an honest trade-off.`,
          `Hierarchy makes "no" feel rude in many workplaces. Phrasing it as a question ("which matters more?") keeps the respect and gives the decision to the person who owns it.`
        ],
        script: `> "I want to help. Here's the trade-off: we're full on checkout, due 4 Dec. If we take the dashboard, checkout moves to about 18 Dec. Which matters more? If it's checkout, I can give sales a simple report this week and plan the real dashboard for January."`,
        analogy: `A yes you can't keep is an API that returns 200 OK and then drops the request. Callers much prefer a 429 with a Retry-After header: an honest "not now; here's when".`
      },
      links: ['phrase:no-tradeoff', 'phrase:no-stopgap', 'phrase:priority-choose', 'scenario:two-urgent-asks', 'scenario:one-week-ask']
    }
  );
})(window.LELT);
