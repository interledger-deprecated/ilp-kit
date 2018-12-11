In ILP-KIT, payments were modeled as semi-circle transactions: if Alice wants to buy a book from Bob, she sends a multi-hop payment to Bob, through Charlie, mentioning the book as a reason for that payment. If Alice pays after receiving the book, then she temporarily owes Bob the value of the book. If she pays  beforehand, then Bob temporarily owes her that value. After both payment and delivery are completed, they don't owe  each other anything anymore. This use trust between Alice and Bob was not modeled by ILP-KIT.

In NLT-KIT, such a trade is modeled with two transactions. The logic behind the just-in-time top-ups is that:
* you should have a trust relationship with each of your trade partners, so remote payments are not natural.
* therefore, semi-circle payments as used in Interledger, are no longer supported in NLT-KIT.
* unconditional payments are always one hop, and are assumed to be counterbalanced by some trade in the real world.
* conditional payments could be interpreted as adding up to an ILP-KIT-style semi-circle payment, when combined with a subsequent direct unconditional payment.
