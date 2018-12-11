# Routing

In the routing table, entries have the following form:
* `user_id` (this is because NLT-KIT is implemented as multiple nodes in one server, each node only ever sees its own routes)
* `landmark` (the node to reach)
* `approach` (the last node before it)
* `contact_id` (neighbor who announced a route to this landmark to you)
* `max_to` (maximum amount this neighbor is willing to forward from you, *to* that landmark)
* `max_from` (maximum amount this neighbor is willing to forward to you, *from* that landmark)

End-point landmarks are defined implicitly; the end-point near Alice on the Alice-Bob trustline is denoted as  'Alice:Bob'.
When trying to send a circular transaction through contact A, via a landmark, through your contact B, back to yourself,
include landmark entries for your end-point at the receiving trustline, for contact B, and for the landmark you want to use, and then propose the conditional transaction to contact A. Make sure the amount doesn't exceed the amount you can send contact A, contact A's `max_to`, contact  B's `max_from`, and the max amount you can receive from contact B on your trustline to them.

When a new contact is added, send them a ROUTING message, listing your end-point landmark for them, your own landmark, and all routes in your own routing table which have both a non-zero `max_to` and some balance room to send to that contact, or both a non-zero `max_from` and some balance room to receive from that contact.

When receiving a ROUTING message, wait 30 seconds and then forward any relevant information from it to all your other contacts. When receiving two or more ROUTING messages within 30 seconds (even if they are from unrelated contacts), combine the two information updates into one.

Example:

Alice and Bob trust each other for 10 UCR and Alice owes Bob 5 UCR.
Alice and Charlie also trust each other for 10 UCR and Alice also owes Charlie 5 UCR.
Bob and Charlie  also trust each other for 10 UCR, but the balance between them is zero.
Alice now wants to buy a book from Bob, for 10 UCR. Her remaining trustline balance of 10-5 is insufficient.
So Alice will try to top up her trustline with Bob first, through Charlie. Let's look at all the landmarks and how routes for them appear in each node's routing table:

* Each node landmark can be routed to and from with unlimited amounts from that node itself, so the following six entries exist, marked 'self' below.
* Then there are the two-hop routes, like Alice -> Bob -> Charlie, which are limited by the max amount the second node is willing to pay to the third one. In practice, they are also limited by what the first node is willing to pay the second one, but that limit is applied on-the-fly, and not recorded in the routing table. Two-hop routes are marked '2 hop' below:

`user_id` `landmark` `approach` `contact_id`  `max_to` `max_from`
 Alice     Bob        Alice      Bob           Infinity Infinity // self A -> A
 Alice     Charlie    Alice      Charlie       Infinity Infinity // self A -> A
 Bob       Alice      Bob        Alice         Infinity Infinity // self B -> B
 Bob       Charlie    Bob        Charlie       Infinity Infinity // self B -> B
 Charlie   Alice      Charlie    Alice         Infinity Infinity // self C -> C
 Charlie   Bob        Charlie    Bob           Infinity Infinity // self C -> C

 Alice     Charlie    Bob        Bob           10       10       // 2 hop A -> B (10< >10) C
 Alice     Bob        Charlie    Charlie       10       10       // 2 hop A -> C (10< >10) B
 Bob       Alice      Charlie    Charlie       15       5        // 2 hop B -> C ( 5< >15) A
 Bob       Charlie    Alice      Alice         5        15       // 2 hop B -> A (15< > 5) C
 Charlie   Alice      Bob        Bob           15       5        // 2 hop C -> B ( 5< >15) A
 Charlie   Bob        Alice      Alice         5        15       // 2 hop C -> A (15< > 5) B

 Alice     Alice      Bob        Charlie       10       5        // 3 hop A -> C (10< >10) B ( 5< >15) A
 Alice     Alice      Charlie    Bob           10       5        // 3 hop A -> B (10< >10) C ( 5< >15) A
 Bob       Bob        Charlie    Alice         5        10       // 3 hop B -> A (15< > 5) C (10< >10) B
 Bob       Bob        Alice      Charlie       5        10       // 3 hop B -> C (10< >10) A (15< > 5) B
 Charlie   Charlie    Bob        Alice         5        10       // 3 hop C -> A (15< > 5) B (10< >10) C
 Charlie   Charlie    Alice      Bob           5        10       // 3 hop C -> B ( 5< >15) A (15< > 5) C

Now to buy the book from Bob, Alice will have to top up her trustline first, using a circular payment via Charlie and Bob to herself.
She creates a conditional proposal to Charlie, listing landmarks 'Alice:B' (the end-point she wants to top up), and 'Bob' (the landmark Charlie is more likely to know). She sets the amount to `liquidity_needed - liquidity_available = 10 - (10-5) = 5 UCR`.
In her routing table, she looks up landmark Alice, approach Bob, and sees that contact Charlie can route up to 10 UCR to there.
But mind that she herself can only get 5 UCR to Charlie on the circular payment's first hop, so that limit is applied on-the-fly.
After the top-up, she owes Charlie 5 UCR, and owes Bob zero, a situation that allows her to buy the book from Bob.
