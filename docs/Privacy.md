# Privacy

In ILP-KIT, there was a distinction between users and payment providers. Users trust payment providers with their data.

In NLT-KIT, the situation is basically the same, but the design is more peer-to-peer, with not just trusted payment providers, but also normal users getting access to the network's routing information, and this is both good and bad for privacy.

On the positive side, unconditional transactions are kept between the two parties involved, so they the actual purchase transactions are more rivate.

On the negative side, when you top up a trustline using network money, anyone could be involved in that circular payment with you. And even worse: in order to route these circular top-up payments, landmarks have to be announced even to network nodes that will not even be involved in the eventual payment.

The short story is, this is a problem and we don't currently have a good solution. You can of course use cryptic landmark names, but if the time and amount coincide with a real-world purchase, then outside observers could probably discover information about when you use peer-to-peer network money, and possibly even what trades you use it for. So using network money is probably not much more private than using a cryptocurrency...
