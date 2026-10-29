/*
 * scenarios-comms.js - communication scenarios: asking questions about requirements with
 * confidence, and raising a concern in a room of senior people. Format: see scenarios-pm.js.
 */
(function (U) {
  'use strict';
  U.data.scenarios = U.data.scenarios || [];
  U.data.scenarios.push(

    /* ------------------------------------------------------------------ */
    {
      id: 'vague-prd',
      track: 'comms',
      title: `The vague PRD`,
      summary: `A PRD full of "fast", "all" and "etc." and an estimate due Friday. Practise asking clarifying questions without feeling you're wasting anyone's time.`,
      keywords: ['prd', 'requirements', 'clarifying questions', 'ask questions', 'hesitate', 'vague', 'ambiguous', 'product manager'],
      role: `You lead the search team.`,
      setting: `Neha, the Product Manager, has shared a PRD for "Improved product search". Kickoff is Monday, and she wants your estimate by Friday.`,
      stakes: `The PRD says: "Search should be fast and support all filters. It should be smart and handle typos etc. Results must be relevant." You can't estimate "fast", "all" or "smart". Build on your own guesses and you may build the wrong thing.`,
      start: 'ask',
      steps: {
        ask: {
          lines: [{ narrate: `You notice you're hesitating to send questions. Neha is busy, and you worry your questions will sound as if you didn't read the PRD.` }],
          prompt: 'What do you do?',
          options: [
            { text: `Group your questions and ask them in one go, framed around building what she needs: "To estimate this properly and build exactly what you need, I have 7 questions in 3 groups (speed, filters, typos). Can we take 20 minutes tomorrow, or shall I send them in writing?"`,
              grade: 'best', meters: { trust: 2, delivery: 2 }, next: 'meeting',
              result: `Neha replies within the hour: "Thank you, tomorrow 11 am." Grouped questions with a reason read as thoroughness, not confusion. Most PMs know their PRD has gaps and are relieved when someone finds them early.` },
            { text: `Don't ask. Make reasonable assumptions and estimate based on those.`,
              grade: 'poor', meters: { trust: -1, delivery: -2 }, next: 'assumed',
              result: `It feels considerate to Neha's time. It's actually a bet that your guesses match what the business wants.` },
            { text: `Send each question as it occurs to you, one message at a time.`,
              grade: 'ok', meters: { trust: -1, delivery: 1 }, next: 'meeting',
              result: `The questions are right, but seven separate pings over two days feel like interruptions, and Neha can't see the whole picture. She suggests a call to go through them together.` },
            { text: `Ask in the kickoff with an apology: "Sorry, this might be a stupid question, but what does fast mean?"`,
              grade: 'poor', meters: { trust: -1, delivery: 1 }, next: 'meeting',
              result: `The question is excellent; the apology undoes it. It tells the room your question is a cost. It isn't: an ambiguous PRD is a risk to everyone. Neha suggests a separate session to go through all the gaps.` }
          ]
        },
        meeting: {
          lines: [{ narrate: `You have 20 minutes with Neha.` }],
          prompt: 'Which question about "search should be fast" is most useful?',
          options: [
            { text: `"How fast, and measured how? For example: 95% of searches return in under 300 ms at 200 searches a second during the sale. Is that the target?"`,
              grade: 'best', meters: { trust: 1, delivery: 2 }, next: 'close',
              result: `A concrete proposal is easy to answer: Neha says "yes, but 500 ms is fine on mobile". Open questions make the other person invent a number on the spot; proposals let them react.` },
            { text: `"What do you mean by fast?"`,
              grade: 'ok', meters: { delivery: 1 }, next: 'close',
              result: `The right question, but open. Neha says "you know, fast, like Amazon", and you're no further on. Propose a number she can accept or change.` },
            { text: `"Is fast really needed?"`,
              grade: 'poor', meters: { trust: -1 }, next: 'close',
              result: `It sounds like pushback rather than clarification, and Neha gets defensive about her PRD. You can challenge a requirement, but do it after you understand it.` }
          ]
        },
        close: {
          lines: [{ narrate: `You get through the 7 questions in 20 minutes. Most answers are clear. Two ("all filters" and "smart ranking") Neha needs to check with the business.` }],
          prompt: 'How do you end the meeting?',
          options: [
            { text: `Summarise in writing the same day: the decisions (p95 under 300 ms, 500 ms on mobile; one wrong letter still matches; the 6 filters, listed), the 2 open questions with owner and date (Neha confirms "smart ranking" by Wed), and when you'll send the estimate (Thu, once those are answered).`,
              grade: 'best', meters: { trust: 2, delivery: 2 },
              result: `Neha corrects one detail (it's 7 filters) and forwards your summary to her manager as the agreed scope. The written summary just became the contract.` },
            { text: `Thank her and start working from your notes.`,
              grade: 'ok', meters: { delivery: -1 },
              result: `Your notes are your memory of her words. She can't correct a misunderstanding she never sees, and in three weeks you'll disagree about what was decided.` },
            { text: `Promise the estimate on Friday as planned, although two answers are still open.`,
              grade: 'poor', meters: { trust: -1, delivery: -1 },
              result: `You'll estimate around two unknowns and present it as firm. Either give a range with the open questions named, or give it after they're answered.` }
          ]
        },
        assumed: {
          lines: [
            { narrate: `You estimate 4 weeks, assuming 3 filters, basic typo handling and no speed target. In week 3, Neha reviews the demo.` },
            { who: 'Neha', say: `Where are the other filters? The PRD said all filters: brand, price, rating, seller, delivery time, discount. And it's slow on my phone.` }
          ],
          prompt: 'What do you say?',
          options: [
            { text: `"I assumed 3 filters and didn't check with you; that's on me. Let's list exactly what's needed now, and I'll give you a new estimate tomorrow. From now on, I'll send my assumptions with every estimate so you can catch these early."`,
              grade: 'best', meters: { trust: 1, delivery: 1 },
              result: `It doesn't recover the lost weeks, but it fixes the cause. Assumptions written next to an estimate are questions the other person can answer before you build.` },
            { text: `"The PRD didn't say which filters, so we did what made sense."`,
              grade: 'poor', meters: { trust: -2 },
              result: `True, and it makes things worse. The gap was visible on day one, and you were the one who chose not to ask.` },
            { text: `"We can add the other filters next sprint."`,
              grade: 'ok', meters: { trust: -1, delivery: -1 },
              result: `A fix for the symptom. The next PRD will have the same gaps, and you'll guess again.` }
          ]
        }
      },
      debrief: {
        points: [
          `Questions about a PRD aren't a cost to the PM; ambiguity is a cost to everyone. Asking early is part of doing the job well.`,
          `Group your questions (speed, scope, edge cases) and ask them in one sitting. Say why you're asking: to build exactly what they need.`,
          `Turn vague words into proposals with numbers they can accept or correct: "p95 under 300 ms at 200 searches a second?"`,
          `Never apologise for a good question. "Quick check so I build the right thing" beats "sorry, this might be silly".`,
          `Write down the answers, the open questions with owners and dates, and send them the same day.`,
          `If you must estimate before you have answers, list your assumptions with the estimate.`
        ],
        script: `> "To estimate this properly and build exactly what you need, I have 7 questions in 3 groups: speed, filters and typos. Can we take 20 minutes tomorrow? For example, on speed: is 95% of searches under 300 ms at 200 searches a second the target?"`,
        analogy: `An ambiguous PRD is an interface with no contract: "returns results, fast". You'd never code against an API without knowing its types and its SLA. Clarifying questions are you writing the contract before the implementation.`
      },
      links: ['phrase:ask-no-apology', 'phrase:ask-grouped', 'phrase:ask-propose-number', 'lesson:refinement-stories', 'scenario:apologetic-question']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'apologetic-question',
      track: 'comms',
      title: `A question in a room full of seniors`,
      summary: `You've spotted a flaw in a plan during a meeting with a director. Practise raising it clearly, without "sorry, this might be silly".`,
      keywords: ['question', 'meeting', 'senior', 'sorry', 'apologise', 'confidence', 'speak up', 'raise concern', 'tone'],
      role: `You lead the integrations team.`,
      setting: `A planning meeting with 8 people, including Rahul, the director, and two Product Managers. Neha is presenting the plan for a new shipping partner.`,
      stakes: `The plan assumes the partner sends webhooks, but their documentation only describes polling. If you're right, the plan's 2-week estimate is wrong.`,
      start: 'raise',
      steps: {
        raise: {
          lines: [{ narrate: `Neha finishes a slide. There's a pause. Your heart beats faster; everyone here is senior to you.` }],
          prompt: 'How do you raise it?',
          options: [
            { text: `"One check before we lock the dates: the plan assumes the partner sends webhooks, but their docs only describe polling. If it's polling, we need a scheduler and retry handling, about a week more. Neha, do you know if webhooks are available?"`,
              grade: 'best', meters: { trust: 2, delivery: 2 }, next: 'answer',
              result: `The room turns to the slide, not to you. You gave the fact, the evidence and the impact in three sentences, aimed at the plan rather than at Neha.` },
            { text: `"Sorry, sorry, this is probably a silly question and I might be wrong, but, um, do they have webhooks?"`,
              grade: 'poor', meters: { trust: -1, delivery: 1 }, next: 'answer',
              result: `The question is exactly right, but the wrapping tells the room to take it lightly, and someone almost moves on before Neha stops to think about it.` },
            { text: `Say nothing in the meeting. Message Neha privately afterwards.`,
              grade: 'poor', meters: { trust: -1, delivery: -1 }, next: 'later',
              result: `Sometimes private is right, when a point would embarrass someone. Here it's a fact that changes the plan everyone is agreeing to right now.` },
            { text: `"I don't think this plan will work."`,
              grade: 'ok', meters: { trust: -1, delivery: 1 }, next: 'answer',
              result: `Your concern is valid, but a sweeping verdict without the specific reason puts Neha on the defensive, and the room argues about your tone before anyone hears about the webhooks.` }
          ]
        },
        answer: {
          lines: [
            { who: 'Neha', say: `Good catch. I'm not sure; I assumed webhooks.` },
            { who: 'Rahul, director', say: `Can someone find out before we commit?` }
          ],
          prompt: 'What do you say?',
          options: [
            { text: `"I'll check with the partner's tech team today and post the answer in the project channel by noon tomorrow, with the estimate for both cases."`,
              grade: 'best', meters: { trust: 2, delivery: 1 },
              result: `You turned a concern into an owned action with a time. Rahul makes a note to come back to you tomorrow. That's what being seen as a lead looks like.` },
            { text: `"Someone from my team can look into it."`,
              grade: 'ok', meters: { trust: -1 },
              result: `"Someone" and "look into it" mean nobody and never. Take it yourself, or name the person, with a time.` },
            { text: `"It's the PM's job to check what the partner supports."`,
              grade: 'poor', meters: { trust: -2 },
              result: `Possibly true on paper, but it undoes the goodwill you just earned and leaves the risk unowned.` }
          ]
        },
        later: {
          lines: [{ narrate: `The plan is approved with a 2-week estimate. That evening you message Neha. She checks: the partner only supports polling. The plan has to be reopened, and Rahul asks why nobody raised it in the meeting.` }],
          prompt: 'What do you take from this?',
          options: [
            { text: `Next time, raise facts that change a plan in the meeting, briefly and with the evidence. Help Neha now by sending her the corrected estimate for the polling design.`,
              grade: 'best', meters: { trust: 1, delivery: 1 },
              result: `The plan is fixed within a day, and you've learnt where the moment to speak really was.` },
            { text: `Nothing. You were right, after all.`,
              grade: 'poor', meters: { trust: -1 },
              result: `Being right privately didn't help the plan. Influence comes from being right at the moment the decision is made.` },
            { text: `Tell Rahul that you'd noticed it during the meeting.`,
              grade: 'ok', meters: { trust: -1 },
              result: `True, but it makes things worse: now Rahul knows you saw it and stayed quiet. Put the effort into fixing the plan instead.` }
          ]
        }
      },
      debrief: {
        points: [
          `A good question doesn't need an apology. "One check before we lock the dates" tells people it's useful, not a nuisance.`,
          `Lead with the fact and its impact: "their docs only describe polling; that adds about a week". Specifics make you sound sure, even when you're asking.`,
          `Ask about the plan, not the person: "does the plan assume webhooks?" rather than "you missed something".`,
          `Volunteer the follow-up, with a time: "I'll check with them and post the answer by noon tomorrow."`,
          `Facts that change a decision belong in the meeting where the decision is made.`
        ],
        script: `> "One check before we lock the dates: the plan assumes the partner sends webhooks, but their docs only describe polling. If it's polling, we need a scheduler and retries, about a week more. I'll confirm with their tech team today and post both estimates by noon tomorrow."`,
        analogy: `An apology before a question is like logging a real error at DEBUG level. The information is there, but nobody treats it as important. Log it at the level it deserves.`
      },
      links: ['phrase:ask-no-apology', 'phrase:ask-check-before', 'scenario:vague-prd']
    }
  );
})(window.LELT);
