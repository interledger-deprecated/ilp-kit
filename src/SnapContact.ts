import {
  StateTransition,
  SnapChecker,
  SnapTransactionState,
  checkStateTransitionIsValid
} from "snap-checker";
import {
  TripleDocument,
  createDocumentInContainer,
  LocalTripleDocumentForContainer
} from "tripledoc";
import { SolidContact } from "./solid-models/SolidContact";
import { Balances } from "snap-checker/lib/SnapChecker";

const DEFAULT_UNIT = "10E-6 USD";
const OUR_DEFAULT_TRUST = 1000;
const THEIR_DEFAULT_TRUST = 1000;

// copied from
// https://github.com/inrupt/friend-requests-exploration/blob/master/src/services/usePersonDetails.ts
export const as = {
  following: "https://www.w3.org/TR/activitypub/#following"
};

const prefix = "https://legerloops.com/snap/#";
const ns = {
  snap: function(term: string): string {
    return prefix + term;
  }
};

function uriToTransactionState(uri: string): SnapTransactionState {
  switch (uri) {
    case ns.snap("Proposing"):
      return SnapTransactionState.Proposing;
    case ns.snap("Proposed"):
      return SnapTransactionState.Proposed;
    case ns.snap("Accepting"):
      return SnapTransactionState.Accepting;
    case ns.snap("Accepted"):
      return SnapTransactionState.Accepted;
    case ns.snap("Rejecting"):
      return SnapTransactionState.Rejecting;
    case ns.snap("Rejected"):
      return SnapTransactionState.Rejected;
  }
}

function transactionStateToUri(state: SnapTransactionState): string {
  switch (state) {
    case SnapTransactionState.Proposing:
      return ns.snap("Proposing");
    case SnapTransactionState.Proposed:
      return ns.snap("Proposed");
    case SnapTransactionState.Accepting:
      return ns.snap("Accepting");
    case SnapTransactionState.Accepted:
      return ns.snap("Accepted");
    case SnapTransactionState.Rejecting:
      return ns.snap("Rejecting");
    case SnapTransactionState.Rejected:
      return ns.snap("Rejected");
  }
}

export function snapMessageFromWeb(
  doc: TripleDocument
): { stateTransition: StateTransition | null; newTrustLevel: number | null } {
  const sub = doc.getSubject("#this");
  let stateTransition: StateTransition | null = {
    transId: sub.getInteger(ns.snap("transId")),
    newState: uriToTransactionState(sub.getRef(ns.snap("newState"))),
    amount: sub.getInteger(ns.snap("amount")),
    condition: sub.getString(ns.snap("condition")),
    preimage: sub.getString(ns.snap("preimage")),
    expiresAt: sub.getDateTime(ns.snap("expiresAt"))
  };
  ["amount", "condition", "preimage", "expiresAt"].forEach(
    (optionalField: string) => {
      if (stateTransition[optionalField] === null) {
        delete stateTransition[optionalField];
      }
    }
  );
  if (!stateTransition.transId) {
    stateTransition = null;
  }
  const newTrustLevel = doc
    .getSubject("#newTrustLevel")
    .getInteger(ns.snap("newTrustLevel"));
  return {
    stateTransition,
    newTrustLevel
  };
}

export async function snapMessageToWeb(
  msg: StateTransition,
  box: string
): Promise<void> {
  checkStateTransitionIsValid(msg);
  const doc = createDocumentInContainer(box);
  return void doc.save();
}

export class SnapContact {
  snapChecker: SnapChecker;
  solidContact: SolidContact;
  constructor(solidContact: SolidContact) {
    this.solidContact = solidContact;
    this.snapChecker = new SnapChecker(["me"]);
    this.snapChecker.processMessage({
      from: "me",
      to: this.solidContact.nick,
      time: new Date(),
      unit: DEFAULT_UNIT,
      newTrustLevel: OUR_DEFAULT_TRUST
    });
    this.snapChecker.processMessage({
      from: this.solidContact.nick,
      to: "me",
      time: new Date(),
      unit: DEFAULT_UNIT,
      newTrustLevel: THEIR_DEFAULT_TRUST
    });
  }

  async sendMessage(msg: StateTransition): Promise<void> {
    return this.solidContact.sendMessage(
      async (doc: LocalTripleDocumentForContainer) => {
        const sub = doc.addSubject({
          identifier: "this"
        });
        sub.addInteger(ns.snap("transId"), msg.transId);
        sub.addRef(ns.snap("newState"), transactionStateToUri(msg.newState));
        if (msg.amount) {
          sub.addInteger(ns.snap("amount"), msg.amount);
        }
        if (msg.condition) {
          sub.addString(ns.snap("condition"), msg.condition);
        }
        if (msg.preimage) {
          sub.addString(ns.snap("preimage"), msg.preimage);
        }
        if (msg.expiresAt) {
          sub.addDateTime(ns.snap("expiresAt"), msg.expiresAt);
        }
      }
    );
  }

  async setTrust(newValue: number): Promise<void> {
    return this.solidContact.sendMessage(
      async (doc: LocalTripleDocumentForContainer) => {
        const sub = doc.addSubject({
          identifier: "newTrustLevel"
        });
        sub.addInteger(ns.snap("trust"), newValue);
      }
    );
  }
  processMessage(
    doc: TripleDocument,
    from: string,
    to: string,
    unit: string,
    time: Date
  ): void {
    const msgFieldData = snapMessageFromWeb(doc);
    console.log("Decoded SNAP message from RDF", msgFieldData);
    try {
      const result = this.snapChecker.processMessage({
        from,
        to,
        unit,
        stateTransition: msgFieldData.stateTransition,
        newTrustLevel: msgFieldData.newTrustLevel,
        time
      });
      console.log(result);
    } catch (e) {
      console.log("SnapChecker throws", e.message);
    }
  }
  async loadMessages(): Promise<void> {
    const docsSent: TripleDocument[] = await this.solidContact.fetchSentMessages();
    const docsRcvd: TripleDocument[] = await this.solidContact.fetchReceivedMessages();
    docsSent.map((doc: TripleDocument) => {
      this.processMessage(
        doc,
        "me",
        this.solidContact.nick,
        DEFAULT_UNIT,
        new Date()
      );
    });
    docsRcvd.map((doc: TripleDocument) => {
      this.processMessage(
        doc,
        this.solidContact.nick,
        "me",
        DEFAULT_UNIT,
        new Date()
      );
    });
    console.log("Done loading messages");
  }

  getBalances(): Balances {
    return this.snapChecker.getBalances(
      "me",
      this.solidContact.nick,
      DEFAULT_UNIT
    );
  }
}
