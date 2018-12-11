# Message flows

## Login
* The client-side code calls the /session endpoint on the backend
* If the username was not registered before, it is registered on-the-fly, with the password provided
* If the username exists in the postgres database ('users' table), the password is checked
* All API calls are done with Basic Authorization header (base64-encoded '<username>:<password>')

## Publish your profile
(not implemented yet)
For now, if you want to be listed on https://unicurn.network, you need to send a pull request on https://github.com/ledgerloops/unicurn.network

## Add a contact
* The client-side code collects the display name, peerUrl, trust amount
* sends a friendrequest
* peer also creates the contact
* both create an end-point landmark for the new link
* both send the other side a routing message (see [Routing](./Routing.md)).

## Pay a contact
* Make sure the person you want to pay is a contact, i.e. a network neighbor (this wasn't necessary in earlier ILP-KIT versions, but is now)
* If necessary, top up the trustline by sending a payment to the near end-point on the link to this contact
  * Create a landmarks list, containing:
    * your near end-point on the trustline you want to top up
    * that contact's own landmark, as announced by them (see [Routing](./Routing.md))
    * landmarks the contact wants to be paid through, as announced by them, in order of decreasing max amount (see [Routing](./Routing.md))
  * Order your other contacts by max amount you could top up through them, descending
  * For each contact in that ordered list, if they hadn't announced any of the landmarks in the list, skip them
  * Otherwise, send the lower of their max amount, the remaining top up amount, and the highest matching landmark amount, in a conditional SNAP transaction, mentioning the full landmarks list (see [SNAP](https://michielbdejong.com/blog/20.html))
* Pay using an unconditional SNAP transaction (see [SNAP](https://michielbdejong.com/blog/20.html))
* If there are routes for which the trustline balance is or was a bottleneck, tell all your other contacts about the new limits (see [Routing](./Routing.md))

