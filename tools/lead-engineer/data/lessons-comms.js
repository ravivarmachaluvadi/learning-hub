/*
 * lessons-comms.js - the Communication track: writing for busy readers, asking questions with
 * confidence, reading a PRD, saying no, meetings that decide, working across teams, time zones and
 * cultures, disagreeing well, and talking to senior leaders.
 *
 * Same entry format as lessons-scrum.js:
 *   {id, track, title, summary, minutes, keywords, body (Markdown), analogy (Markdown),
 *    mistakes: [Markdown], say: [Markdown], sources: [Markdown], related: ['scenario:id', ...]}
 * The quiz for each lesson is in data/quizzes-comms.js under the lesson's id.
 */
(function (U) {
  'use strict';
  U.data.lessons = U.data.lessons || [];
  U.data.lessons.push(

    /* ------------------------------------------------------------------ */
    {
      id: 'bluf-writing', track: 'comms', minutes: 6,
      title: 'Bottom line first: writing for busy readers',
      summary: 'Most work messages are read in seconds, on a phone, between meetings. Put the answer and the ask first, make replying easy, and say why the reader should care.',
      keywords: ['bluf', 'bottom line', 'email', 'writing', 'message', 'pyramid principle', 'scqa', 'subject line', 'busy readers', 'slack', 'teams'],
      body: `## Readers are busy, not careless
Your manager gets a few hundred messages a day and reads most of them on a phone, between meetings. Todd Rogers and Jessica Lasky-Fink study how busy people read; in their experiments with real messages, shorter and easier-to-read versions got more responses. A message is not a record of your thinking. It is a tool for getting a decision or an action from someone who has no time.

## Bottom line first
The military habit is called BLUF: **bottom line up front**. Start with what you need the reader to know or do, then the reasons, then the background:
- *"Decision needed by Wed 5 pm: can Platform build the refund endpoint this sprint? If not, refunds miss the sale."*
- Not three paragraphs of history with the question in the last line.

Barbara Minto teaches the same idea as the **pyramid principle**: the answer at the top, the arguments under it, the facts under those. Her **SCQA** shape opens a longer message: the Situation, the Complication, the Question it raises, and your Answer, a sentence each, with the answer carrying the weight.

## One message, one thing
- **One ask per message.** Two unrelated asks in one email means the second gets forgotten. Send two.
- **A subject line that does work:** *"Decision needed by Wed: ship refunds without batching?"*, not *"Update"* or *"Quick question"*.
- **Make replying easy:** a yes-or-no question, or options numbered 1, 2, 3, so the reply can be "2".
- **Say why they should care**, in their terms: the sale, the customer, the audit, not the refactor.

## Formatting helps, up to a point
Short paragraphs, a list for items of the same kind, bold for the one thing that must not be missed. Not everything in bold, not five levels of bullets. If a message needs headings, it may need to be a document, with a two-line message pointing at it.

## Before you press send
Read only the first two lines. If the reader stopped there, would they know what you need and by when? If not, move it up.`,
      analogy: `A good message is a well-designed API response: the status code and the payload first, the debug details in a field nobody has to parse. Nobody wants to read a stack trace to find out whether the request worked. Put the 200 or the 409 in the first line.`,
      mistakes: [
        `Telling the story in the order it happened, so the ask arrives in the last line.`,
        `A subject line like "Update" or "Following up", which gives the reader no reason to open it now.`,
        `Two unrelated asks in one message; the second is forgotten.`,
        `Background before the bottom line "so they understand", when most readers stop before they reach the point.`,
        `A wall of text in chat. If it needs more than a screen, write a document and send a two-line message with the link.`
      ],
      say: [
        `"Bottom line: refunds slip to Tue 17 Nov unless Platform delivers the endpoint by Wednesday. Details below."`,
        `"Decision needed by Wed 5 pm: option 1 or 2? I recommend 1."`,
        `"One ask in this message: can you review the API contract by Thursday?"`
      ],
      sources: [
        `Barbara Minto, *The Pyramid Principle: Logic in Writing and Thinking* (first published 1987), on putting the answer first and on the SCQA opening`,
        `Todd Rogers and Jessica Lasky-Fink, *Writing for Busy Readers* (Dutton, 2023)`,
        `Kabir Sehgal, "How to Write Email with Military Precision", *Harvard Business Review*, November 2016, on BLUF and subject lines`
      ],
      related: ['scenario:email-nobody-read', 'tool:templates', 'tool:status', 'phrase:write-bluf-email', 'phrase:write-subject-ask', 'term:bluf']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'clarifying-questions', track: 'comms', minutes: 6,
      title: 'Asking questions with confidence',
      summary: 'Questions are part of the work, not a cost to the person you ask. How to ask early, in groups, with a proposal, and without the apology.',
      keywords: ['questions', 'clarifying questions', 'ask questions', 'confidence', 'sorry', 'hesitate', 'play back', 'humble inquiry', 'prd'],
      body: `## Why new leads hesitate
Two worries stop most people: *"they'll think I didn't read it"* and *"I'm wasting a busy person's time."* Both get the cost backwards. An unclear requirement costs everyone: the PM, the testers, the customer. A question asked on day one costs ten minutes; the same misunderstanding found in week three costs a rebuild. Asking is doing the job well.

In many Indian offices there is a second pull: questioning a senior person can feel disrespectful. Frame the question as protecting their goal, *"so we build exactly what you need"*, and it reads as respect.

## Ask early, and in one go
Collect your questions, group them (scope, behaviour, numbers, edge cases) and ask them together: *"I have 7 questions in 3 groups. Can we take 20 minutes tomorrow, or shall I send them in writing?"* Grouped questions show you have thought about the whole thing; a trickle of "one more question" over two days feels like interruptions. The [[tool:prd]] does the grouping for you.

## Propose instead of asking open questions
"What do you mean by fast?" makes the other person invent a number on the spot, and you get *"you know, fast"*. "Is 95% of searches under 300 ms at peak the target?" gets a yes or a different number in one reply. A proposal also shows you have thought about it.

## Drop the apology, keep the reason
"Sorry, this might be a silly question…" tells everyone to take it lightly. Replace the apology with a reason: *"Quick check so I build the right thing: …"* Same politeness, opposite effect.

## Play it back
After an answer, say it back in your own words: *"So: 7 filters for launch, the rest later, and Neha confirms the ranking rule by Wednesday. Right?"* It catches a misunderstanding in thirty seconds. Then write it down and send it the same day: the written summary becomes the agreement.

## Ask to learn, not to win
Edgar Schein calls it **humble inquiry**: asking because you want to know, and showing it. *"Help me understand the problem this solves"* invites an answer. *"Why would anyone want this?"* invites a defence.`,
      analogy: `A clarifying question is a failing test written before the code. It is cheap, it is early, and it turns a vague expectation into something precise. Nobody apologises for writing a test; it is how you find out what "correct" means before you build it.`,
      mistakes: [
        `Not asking, and guessing instead. It feels considerate; it is a bet that your guesses match what the business wants.`,
        `Apologising before a good question, so the room takes it lightly.`,
        `Open questions that make the other person do all the work: "What do you mean by fast?"`,
        `Seven separate messages over two days instead of one grouped list.`,
        `Getting answers on a call and never writing them down, so three weeks later two people remember two different decisions.`
      ],
      say: [
        `"To estimate this properly, I have 7 questions in 3 groups. Can we take 20 minutes tomorrow?"`,
        `"Quick check so I build the right thing: is 95% under 300 ms at peak the target?"`,
        `"Let me play that back: 7 filters for launch, the rest later. Right?"`
      ],
      sources: [
        `Edgar H. Schein, *Humble Inquiry: The Gentle Art of Asking Instead of Telling* (Berrett-Koehler, 2013)`,
        `Donald C. Gause and Gerald M. Weinberg, *Exploring Requirements: Quality Before Design* (Dorset House, 1989)`,
        `Amy C. Edmondson, *The Fearless Organization* (Wiley, 2018), on why people hold back questions at work`
      ],
      related: ['scenario:vague-prd', 'scenario:apologetic-question', 'scenario:just-build-the-mockup', 'tool:prd', 'phrase:ask-no-apology', 'phrase:ask-grouped', 'phrase:ask-propose-number', 'phrase:ask-play-back']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'requirements-prd', track: 'comms', minutes: 7,
      title: 'Reading a PRD: from vague words to testable requirements',
      summary: 'What a good PRD answers, the vague words that hide decisions, and how to turn "fast", "all" and "secure" into numbers and examples the team can build and test.',
      keywords: ['prd', 'requirements', 'vague requirements', 'nfr', 'non-functional', 'acceptance criteria', 'ambiguity', 'weak words', 'specification', 'out of scope'],
      body: `## What a PRD is for
A product requirements document (PRD) says what to build and why, so that a team can estimate it, build it and check it. It doesn't have to be long. It does have to answer a handful of questions. When it doesn't, someone answers them later, usually a developer at 11 pm, and usually differently from what the business wanted.

## What a good PRD answers
- **Why:** the problem, for whom, and what it costs today.
- **How we will know it worked:** a number that should move. *"Refund calls drop from 1,200 to 400 a week."*
- **Who uses it,** and roughly how many.
- **What is in the first release, and what is out.** The "out" list is the cheapest scope control there is.
- **The unhappy paths:** failures, timeouts, duplicate requests, missing data.
- **The non-functional requirements** (NFRs): speed, load, availability, security, as numbers.
- **Rollout, support and the date,** and why that date.

## The words that hide decisions
Requirements engineers keep lists of words to avoid, because each one leaves a decision unmade. Karl Wiegers and Joy Beatty's list and the ISO/IEC/IEEE 29148 standard share most of these:
- **Speed and load:** *fast, quick, real-time, scalable, high volume.* Which number?
- **Open lists:** *all, any, every, etc., such as, including but not limited to.* Which items exactly?
- **Opinions:** *intuitive, user-friendly, seamless, modern, simple.* Judged by whom, against what?
- **Hand-waving behaviour:** *smart, relevant, handle errors gracefully, as appropriate.* Which rule, which exact behaviour?
- **Unbounded amounts:** *minimal, maximum, reasonable, as soon as possible.* What limit?
- **Escape hatches:** *ideally, if possible, nice to have, TBD.* Does the release wait for it, and who decides?

## Turning a vague word into a requirement
Propose a concrete version the PM can accept or change:
- "Search should be fast" becomes *95% of searches return in under 300 ms at 200 searches a second.*
- "Support all payment methods" becomes *cards, UPI and wallets (3) in the first release; net banking later.*
- "Must be secure" becomes *only support agents see the phone number, masked except the last 4 digits; card numbers are never stored (PCI DSS).*
- "Handle failures gracefully" becomes *if the bank doesn't answer in 10 seconds, show "pending" and retry 3 times over 30 minutes.*

Each of these can be estimated and tested. None of the vague originals could.

## Then make it testable
Turn the agreed answers into acceptance criteria (Given, When, Then) in refinement: see [[lesson:refinement-stories]] and the [[playbook:refinement|refinement playbook]].`,
      analogy: `A PRD is an interface contract. "Returns results, fast" is like a method documented as "returns data, quickly": you can't code against it, you can't test it, and two teams implementing it will build two different things. NFRs written as numbers are the SLA on the contract.`,
      mistakes: [
        `Estimating a vague PRD as if it were clear, and presenting the number as firm.`,
        `Filling in vague words yourself, silently, with your best guess. You may guess well; you have still built what you chose, not what was agreed.`,
        `Treating NFRs as extras for later. "Fast" and "secure" decide the architecture.`,
        `No "out of scope" list, so every new idea in a review lands in the first release.`,
        `Asking "is this even needed?" before you understand the requirement. Clarify first; challenge after.`
      ],
      say: [
        `"By fast, do we mean 95% of searches under 300 ms at 200 a second?"`,
        `"Which payment methods does the first release need? I'd propose cards and UPI, with wallets in the second."`,
        `"What should the customer see if the bank doesn't answer?"`
      ],
      sources: [
        `Karl Wiegers and Joy Beatty, *Software Requirements*, 3rd edition (Microsoft Press, 2013), on ambiguous terms to avoid in requirements`,
        `ISO/IEC/IEEE 29148:2018, *Systems and software engineering: Life cycle processes: Requirements engineering*, on vague and unbounded terms`,
        `Daniel M. Berry, Erik Kamsties and Michael M. Krieger, *From Contract Drafting to Software Specification: Linguistic Sources of Ambiguity* (2003)`
      ],
      related: ['tool:prd', 'scenario:vague-prd', 'scenario:just-build-the-mockup', 'playbook:refinement', 'term:nfr', 'term:weak-words']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'positive-no', track: 'comms', minutes: 6,
      title: 'Saying no, or "not yet", without damage',
      summary: 'A good no protects something that matters and offers a way forward. William Ury\'s "Yes! No. Yes?", and how to say it to a manager, a PM or another team.',
      keywords: ['say no', 'saying no', 'push back', 'positive no', 'ury', 'yes habit', 'trade-off', 'not now', 'decline', 'boundaries'],
      body: `## Why yes is the easy answer
Saying yes ends the conversation pleasantly, today. The bill comes later: a late feature, a tired team, and a manager who learns that your yes doesn't mean much. In many Indian workplaces there is an extra pull: "yes" often means *I heard you* rather than *I will do it*, and the person asking can't always tell which. A clear "no, and here is what I can do" is more respectful than a yes you can't keep.

## Yes! No. Yes?
William Ury, who co-wrote *Getting to Yes*, describes a **positive no** in three parts:
1. **Yes!** to what you are protecting: *"I want this release to be safe."* Say the interest, not the refusal.
2. **No.** A plain, calm no that follows from that interest: *"So I won't add features after the code freeze."*
3. **Yes?** A proposal that keeps things moving: *"I can put it first in the next release, on the 24th. Would that work?"*

The first yes makes the no understandable; the last one makes it acceptable.

## Usually it's "not now" or "not all of it"
Most of a lead's no's are about timing or size, not the idea:
- *"Not this sprint, unless something else comes out. Which one?"* The trade-off made visible: see the [[tool:prioritise]].
- *"Not by Friday. By Friday I can do the admin screen; the full flow needs six weeks."* The slice that fits: see the [[tool:deadline]].
- *"Not from my team. Here is who owns it, and I've introduced you."*

## Don't over-explain
A long justification sounds like guilt and invites a negotiation on every point. Give the real reason in one sentence, then the alternative.

## Saying no to your own manager
Same shape, plus the data: *"We finished 36 points in each of the last three sprints. Taking 60 means something slips; here are the two I'd move."* You are not refusing. You are showing the cost, so the person who owns the priority can decide.

## When you are overruled
Say it clearly once, in writing if it matters, then commit fully: **disagree and commit**. Sulky compliance is the worst of both.`,
      analogy: `A positive no is a circuit breaker, not a crash. It protects the system when demand is more than capacity, fails fast with a clear status instead of timing out, and offers a fallback: "try again at 3 pm" or "here is the cached result". Accepting every request until you fall over helps nobody.`,
      mistakes: [
        `Saying yes to end an awkward moment, then hoping it works out.`,
        `A flat no with nothing after it, which leaves the other person stuck.`,
        `A long justification that sounds like guilt and invites an argument about each point.`,
        `Saying no for the team without asking them, or yes for them without the capacity.`,
        `Saying yes in the meeting and no in the corridor afterwards.`
      ],
      say: [
        `"I want this release to be safe, so I can't add features after the freeze. I can put it first in the next release, on the 24th. Would that work?"`,
        `"Not this sprint unless something else comes out. Which one would you move?"`,
        `"I'd recommend against it, for this reason. If you still want it, I'll make it work."`
      ],
      sources: [
        `William Ury, *The Power of a Positive No* (Bantam, 2007)`,
        `Roger Fisher, William Ury and Bruce Patton, *Getting to Yes: Negotiating Agreement Without Giving In*, 2nd edition (Penguin, 1991), on interests rather than positions`,
        `Erin Meyer, *The Culture Map* (PublicAffairs, 2014), on how "yes" and disagreement are read across cultures`
      ],
      related: ['scenario:saying-no-to-manager', 'scenario:sales-promised-feature', 'scenario:client-yes-on-call', 'tool:prioritise', 'phrase:no-positive', 'phrase:disagree-commit', 'term:positive-no']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'meetings-decisions', track: 'comms', minutes: 7,
      title: 'Meetings that end in decisions',
      summary: 'An hour of eight people is a working day. Give a meeting a decision to make, a decider, a pre-read and a written close, or make it a message instead.',
      keywords: ['meeting', 'meetings', 'agenda', 'decision', 'decider', 'pre-read', 'daci', 'action items', 'minutes', 'async', 'recurring meeting'],
      body: `## What a meeting costs
Eight people for an hour is a full working day. Steven Rogelberg, who studies meetings, finds that people rate a large share of their meetings as a poor use of time, and that the usual fix is better-run meetings rather than simply fewer. A lead runs a lot of meetings; it is one of your most visible skills.

## Before: does it need to be a meeting?
Meet when a decision needs discussion, or the topic is sensitive. For a status update or a simple question, send a message ([[lesson:bluf-writing]]). For a recurring meeting, ask every quarter whether it still needs to exist.

## Write the purpose as a decision
Not *"Discuss search"* but *"Decide: Redis or the database for the price cache."* Then:
- **Name the decider** before the meeting. Atlassian's **DACI** helps: the Driver runs it, the Approver decides (one person), Contributors give input, the Informed get the outcome.
- **Invite the people the decision needs,** not everyone who might be interested. They get the notes.
- **Send a pre-read:** a one-page proposal with options. At Amazon, meetings start with everyone reading a written narrative in silence, so the discussion starts from the same facts.

## During: keep it on the decision
- Open with the decision and the time: *"We're here to choose between two options, in 30 minutes. Neha decides."*
- Hear the quietest people first. The most senior person speaks last, because seniority anchors everyone else.
- Park anything off-topic, visibly, with an owner.
- If you can't decide, decide what would let you: *"We need the load-test numbers; Divya has them by Thursday; we decide on Friday."*

## Close: decisions, owners, dates, in writing
The last five minutes matter most. Read back what was decided, who does what, and by when. Send it the same day, in the channel: *"Decided: Redis. Divya writes the decision record by Thursday. Anil starts the cache on Monday."* Add *"reply by Wednesday if anything here is wrong"*, so silence means agreement and nobody reopens it next week.

## Recurring meetings drift
A weekly sync starts with a purpose and ends as a status read-out for twelve people. Every few months, turn it into a written update with a short slot only for the decisions it raises, or cancel it and see who asks for it back.`,
      analogy: `A meeting is a synchronous, blocking call across many services. Use it when you need a transaction everyone commits to; for everything else, an asynchronous message is cheaper and blocks nobody. And like any blocking call, it needs a timeout and a clear return value.`,
      mistakes: [
        `An agenda of topics ("search, refunds, AOB") instead of decisions to make.`,
        `No named decider, so the meeting ends with "let's take it offline".`,
        `Inviting fifteen people "to keep them in the loop"; the notes would have done that.`,
        `The most senior person gives their view first, and everyone agrees with it.`,
        `No written summary, so the decision is reopened next week by someone who wasn't there.`
      ],
      say: [
        `"30 minutes to decide: Redis or the database for the price cache. Neha decides. Please read Divya's one-pager first."`,
        `"To confirm: we chose Redis; Divya writes the decision record by Thursday; Anil starts on Monday."`,
        `"If anything here is wrong, reply by Wednesday. After that, we build."`
      ],
      sources: [
        `Steven G. Rogelberg, *The Surprising Science of Meetings* (Oxford University Press, 2019)`,
        `Patrick Lencioni, *Death by Meeting* (Jossey-Bass, 2004)`,
        `Colin Bryar and Bill Carr, *Working Backwards* (St. Martin's Press, 2021), on Amazon's written narratives read at the start of meetings`,
        `Atlassian Team Playbook, "DACI: a decision-making framework"`
      ],
      related: ['scenario:sync-meeting-no-decisions', 'scenario:decision-reversed', 'playbook:sprint-planning', 'phrase:meeting-outcome', 'phrase:meeting-close', 'phrase:meeting-decider', 'term:daci']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'async-time-zones', track: 'comms', minutes: 7,
      title: 'Across teams, time zones and cultures',
      summary: 'When half the people are in another team, city or country, communication has to work without you in the room: written first, clear about who decides, and aware that "yes" travels differently.',
      keywords: ['time zone', 'time zones', 'onsite', 'offshore', 'async', 'asynchronous', 'remote', 'culture map', 'working agreement', 'cross-team', 'overlap', 'distributed'],
      body: `## The day starts somewhere else
An offshore team in Pune and a client in London overlap for three or four hours a day. A question asked at 6 pm in India waits until the next day; a day lost on every question is a week lost on a project. Distributed work rarely fails for lack of skill. It fails in the gaps between people.

## Written first
The habits that make cross-team and remote work run:
- **Write decisions down where everyone can find them,** with the reason. A decision log beats "we discussed it on a call".
- **Public channels over private messages.** A question answered in a channel helps the next three people who have it.
- **Make each message stand alone:** the context, the ask, the date. The reader may see it twelve hours later, with nobody awake to ask (see [[lesson:bluf-writing]]).
- **Use the overlap hours for what needs talking:** decisions, disagreements, anything sensitive. Status can go in writing.

GitLab, which has no offices, publishes its handbook on working asynchronously; its core rule is that the written record is the source of truth.

## A working agreement between teams
When your team depends on another, agree the basics once, in writing: how to raise a request, how fast each side replies, who decides when you disagree, how changes to a shared API are announced. Matthew Skelton and Manuel Pais (*Team Topologies*) also suggest agreeing the *kind* of relationship: working closely together for a while, one team providing a service the other uses, or one team helping the other learn.

## Culture changes how a message lands
Erin Meyer's *The Culture Map* compares cultures on eight scales, including how direct negative feedback is, how decisions are made, and how much meaning sits in context rather than in the words. Two of them often trip up Indian offshore and Western onsite teams:
- **"Yes" and context.** In high-context cultures, a lot is said between the lines: "yes" can mean "I heard you", and "it will be difficult" can mean "no". A low-context client hears a promise. Agree that "yes" means *I will do it by the date*, and that "I'm not sure" is welcome.
- **Disagreeing with seniority.** In hierarchical cultures, juniors may not contradict a senior person or a client in a meeting, even when they know the plan won't work. Ask them directly and privately, or ask for written comments before the meeting.

These are tendencies, not rules about people. Use them to ask better questions, never to label someone.

## Play it back across the gap
On a call across cultures, close each decision with a play-back: *"So by Monday we deliver the screen, and the export follows on Thursday. Is that right?"* It feels slow. It is faster than a week going the wrong way.`,
      analogy: `Asynchronous work across time zones is a message queue between services in different regions. Make each message self-contained (no shared session state), and acknowledge it. Synchronous calls across regions are slow and fragile; save them for the transactions that really need them.`,
      mistakes: [
        `Asking a question at the end of your day with no context, so the answer takes two days of back-and-forth.`,
        `Deciding on a call and not writing it down, so the people who were asleep learn about it from the code.`,
        `Taking "yes" as a commitment without a date and an owner.`,
        `Running every cross-team question through private messages, so knowledge stays in two heads.`,
        `Using cultural differences to explain a person away instead of asking them what they think.`
      ],
      say: [
        `"To check we agree: the screen by Monday, the export on Thursday. I'll confirm in the channel."`,
        `"When you say yes, can I take that as done by Friday? If anything might get in the way, tell me now; that's welcome."`,
        `"Let's agree how our teams work together: how to raise a request, how fast we each reply, and who decides if we disagree."`
      ],
      sources: [
        `Erin Meyer, *The Culture Map: Breaking Through the Invisible Boundaries of Global Business* (PublicAffairs, 2014)`,
        `GitLab Handbook, "How to embrace asynchronous communication for remote work" (handbook.gitlab.com)`,
        `Matthew Skelton and Manuel Pais, *Team Topologies* (IT Revolution, 2019), on how teams interact`
      ],
      related: ['scenario:client-yes-on-call', 'scenario:change-told-to-one-dev', 'lesson:managing-dependencies', 'phrase:ask-play-back', 'term:working-agreement', 'term:high-context']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'difficult-conversations', track: 'comms', minutes: 7,
      title: 'Disagreeing with peers and stakeholders',
      summary: 'How to disagree with a PM, an architect or another lead without damaging the relationship: the shared goal first, facts before conclusions, options, and the right room.',
      keywords: ['disagree', 'disagreement', 'conflict', 'difficult conversation', 'crucial conversations', 'push back', 'architect', 'peer', 'stakeholder', 'disagree and commit'],
      body: `## Why it gets hard
Disagreements at work are rarely about facts alone. Douglas Stone, Bruce Patton and Sheila Heen (*Difficult Conversations*) describe three conversations happening at once: **what happened** (the facts, and who is right), **feelings** (frustration, embarrassment) and **identity** (*am I competent? am I respected?*). A principal engineer whose design you question also hears a question about their competence. Handle that, and the facts get easier.

## Start from the shared goal
Before the disagreement, name what you both want: *"We both want refunds live before the sale without breaking checkout."* It turns "me against you" into "us against the problem". Kerry Patterson and his co-authors (*Crucial Conversations*) call this **mutual purpose**, and say it is the first thing to restore when a conversation turns tense.

## Facts first, then what you think they mean
Separate what you saw from what you concluded:
- The fact: *"With a shared database, both services run migrations on the same tables."*
- Your conclusion, offered as one: *"I think that will make our releases depend on each other. Am I missing something?"*

Their STATE method puts it in order: Share your facts, Tell your story, Ask for others' paths, Talk tentatively, Encourage testing. "Talk tentatively" doesn't mean apologising. It means "I think" instead of "obviously".

## Bring options, not a verdict
"Your design is wrong" invites a fight. *"I see a risk with the shared database. Two options I'd compare: a small API, or a read replica. Can we put all three in front of the design review?"* gives everyone a way forward without anyone having to lose.

## Choose the room
- A fact that changes a decision belongs in the meeting where the decision is made (see [[scenario:apologetic-question]]).
- Something that would embarrass a person belongs in private first.
- A disagreement between two teams that you can't settle goes to the people above you, raised **together** ([[template:escalation|the escalation template]]).

## Then commit
Once the person who owns the decision has made it, support it fully, even if you argued against it: **disagree and commit**. If new facts appear, raise them as new facts, not as "I told you so".`,
      analogy: `A disagreement handled well is a good code review: comment on the code, not the author; explain the risk with evidence; suggest an alternative; and once the owner decides, approve and move on. A review that says "this is wrong" with no reason gets defended, not fixed.`,
      mistakes: [
        `Opening with a verdict ("this won't work") instead of the fact behind it.`,
        `Arguing about someone's design in a big meeting before talking to them alone.`,
        `Hinting instead of saying it, so the other person never knows there was a disagreement.`,
        `Winning the argument and losing the relationship you will need next quarter.`,
        `Agreeing in the meeting, then working around the decision.`
      ],
      say: [
        `"We both want refunds live before the sale without breaking checkout. I see one risk in the design; can I show you?"`,
        `"Here's what I've seen, and here's what I think it means. Am I missing something?"`,
        `"Two options I'd compare with yours. Can we put all three in front of the design review?"`
      ],
      sources: [
        `Douglas Stone, Bruce Patton and Sheila Heen, *Difficult Conversations: How to Discuss What Matters Most* (Viking, 1999)`,
        `Kerry Patterson, Joseph Grenny, Ron McMillan and Al Switzler, *Crucial Conversations: Tools for Talking When Stakes Are High* (McGraw-Hill, 2002)`
      ],
      related: ['scenario:architect-disagree', 'scenario:conflicting-pms', 'scenario:public-blame-channel', 'phrase:disagree-options', 'phrase:disagree-commit', 'term:disagree-and-commit']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'senior-audiences', track: 'comms', minutes: 6,
      title: 'Talking to senior leaders: reviews, steering committees, demos',
      summary: 'Senior people have minutes, not hours. Lead with the answer and the ask, use numbers in their terms, say "I don\'t know" well, and leave with a decision.',
      keywords: ['senior leaders', 'executives', 'steering committee', 'presentation', 'demo', 'director', 'vp', 'present', 'leadership update', 'stakeholders'],
      body: `## What senior people need from you
A director or VP decides where money, people and attention go across many teams. In your ten minutes they want three things: is this on track, is there a decision they need to make, and can they trust what you tell them. They are not asking for the technical journey.

## Start with the answer
Open with the bottom line and, if there is one, the decision you need: *"Refunds will be live for the sale on the 20th. One risk: the bank's sandbox. I need one decision from you today: can Platform prioritise the refund endpoint?"* Then stop, and let them steer. Will Larson gives staff engineers the same advice for presenting to executives: start with the conclusion, then go as deep as they ask.

## Speak in their terms
- Translate engineering into business effects. Not "the payment module is tightly coupled", but *"every change to payments risks breaking checkout; three weeks of clean-up makes the next ten changes faster and safer"*.
- Use a few numbers, the ones they care about: customers, money, dates, risk.
- One chart or slide, one message. If it needs a legend to explain it, it's the wrong chart.

## When you don't know
You will be asked something you can't answer. Don't guess, and don't bluff: a confident wrong number does lasting damage. Say *"I don't know; I'll find out and send it to you by 5 pm today,"* then do it. A precise "I don't know" sounds more senior than a vague answer.

## Bad news early, with a plan
Senior leaders forgive bad news; they rarely forgive surprises. Say the problem, its effect, what you are doing, and what you need from them, in that order ([[lesson:rag-and-bad-news]]).

## Leave with something
End by confirming what was decided and what happens next, and send it in writing the same day. If nothing was decided, you gave a status update, which could have been an email.

## Demos to senior people
Show the outcome from the customer's side, with real data, in a few minutes. Rehearse it on the real environment. Show only what is done, and say plainly what isn't.`,
      analogy: `Talking to an executive is writing the summary line of an incident report. People who read only that line must get the essentials right: the impact, the status, what is needed. Everything else is in the body, for whoever wants to drill down.`,
      mistakes: [
        `Starting with background and architecture, so the decision you need comes in the last minute, after they have left.`,
        `Bluffing an answer, which is remembered long after the meeting.`,
        `Engineering words a business leader can't act on: "tech debt", "coupling", "refactor", without the business effect.`,
        `Ten slides of status and no ask.`,
        `Hiding a risk to keep the update positive.`
      ],
      say: [
        `"Refunds go live for the sale on the 20th. One risk, and one decision I need from you today."`,
        `"I don't know. I'll find out and send it to you by 5 pm today."`,
        `"Every change to payments today risks breaking checkout. Three weeks of clean-up makes the next ten changes faster and safer."`
      ],
      sources: [
        `Barbara Minto, *The Pyramid Principle* (first published 1987), on leading with the answer`,
        `Will Larson, *Staff Engineer: Leadership Beyond the Management Track* (2021), the chapter on presenting to executives`,
        `Nancy Duarte, *DataStory: Explain Data and Inspire Action Through Story* (Ideapress, 2019)`
      ],
      related: ['scenario:steering-unknown-answer', 'scenario:simple-change-three-weeks', 'scenario:review-hijacked', 'phrase:ask-dont-know', 'phrase:write-plain-business', 'term:steering-committee']
    }
  );
})(window.LELT);
