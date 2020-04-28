import { SnapTransactionState } from "snap-checker";
import { SnapSolid, SnapContact } from "snap-solid";
import { forDebugging } from "./forDebugging";

export async function runPresentation(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  window: any,
  sessionWebId: string
): Promise<void> {
  const snapSolid = new SnapSolid(sessionWebId);
  forDebugging(window as unknown, snapSolid);

  document.getElementById(
    "loginBanner"
  ).innerHTML = `Logged in as ${sessionWebId} <button onclick="solid.auth.logout()">Log out</button>`;
  document.getElementById("ui").style.display = "block";

  window.addSomeone = async (): Promise<void> => {
    const webId = document.getElementById("webId").getAttribute("value");
    const nick = document.getElementById("nick").getAttribute("value");
    await snapSolid.addContact(webId, nick);
  };
  let peer = "alice";
  if (sessionWebId === "https://lolcathost.de/storage/alice/profile/card#me") {
    peer = "bob";
  }
  let foundPeer = false;
  const contacts = await snapSolid.getContacts();
  const promises = contacts.map(async (contact: SnapContact) => {
    if (contact.solidContact.theirInbox.split("/")[4] === peer) {
      foundPeer = true;
    }
    const li = document.createElement("li");
    li.appendChild(document.createTextNode(contact.solidContact.nick));
    const amountInput = document.createElement("input");
    amountInput.setAttribute("value", "20");
    li.appendChild(amountInput);

    const sendButton = document.createElement("button");
    sendButton.onclick = (): void => {
      contact.sendMessage({
        transId: 1,
        newState: SnapTransactionState.Proposing,
        amount: parseInt(amountInput.getAttribute("value"))
      });
    };
    sendButton.appendChild(document.createTextNode("Send IOU"));
    li.appendChild(sendButton);

    const trustInput = document.createElement("input");
    trustInput.setAttribute("value", "20");
    li.appendChild(trustInput);

    const trustButton = document.createElement("button");
    trustButton.onclick = (): void => {
      contact.setTrust(parseInt(trustInput.getAttribute("value")));
    };
    trustButton.appendChild(document.createTextNode("Set Trust"));
    li.appendChild(trustButton);

    const paragraph = document.createElement("p");
    const balances = contact.getBalances();
    paragraph.innerText = `Current: ${balances.current} Payable: ${balances.payable} Receivable: ${balances.receivable}`;
    li.appendChild(paragraph);
    document.getElementById("contacts").appendChild(li);
  });

  if (!foundPeer) {
    document
      .getElementById("webId")
      .setAttribute(
        "value",
        `https://lolcathost.de/storage/${encodeURIComponent(
          peer
        )}/profile/card#me`
      );
    document
      .getElementById("nick")
      .setAttribute(
        "value",
        peer.substring(0, 1).toLocaleUpperCase() + peer.substring(1)
      );
  }
  return void Promise.all(promises);
}
