import { ldp } from "rdf-namespaces";
import {
  TripleDocument,
  LocalTripleDocumentForContainer,
  createDocumentInContainer
} from "tripledoc";
import { PodData } from "./PodData";

// copied from
// https://github.com/inrupt/friend-requests-exploration/blob/master/src/services/usePersonDetails.ts
export const as = {
  following: "https://www.w3.org/TR/activitypub/#following"
};

export class SolidContact {
  podData: PodData;
  ourInbox: TripleDocument;
  ourOutbox: TripleDocument;
  theirInbox: string;
  nick: string;
  constructor(
    ourInbox: TripleDocument,
    ourOutbox: TripleDocument,
    theirInbox: string,
    nick: string,
    podData: PodData
  ) {
    this.ourInbox = ourInbox;
    this.ourOutbox = ourOutbox;
    this.theirInbox = theirInbox;
    this.nick = nick;
    this.podData = podData;
  }

  async sendMessageTo(
    box: string,
    cb: (doc: LocalTripleDocumentForContainer) => Promise<void>
  ): Promise<void> {
    const doc = createDocumentInContainer(box);
    await cb(doc);
    doc.save();
  }

  async sendMessage(
    cb: (doc: LocalTripleDocumentForContainer) => Promise<void>
  ): Promise<void> {
    this.sendMessageTo(this.ourOutbox.asRef(), cb);
    this.sendMessageTo(this.theirInbox, cb);
  }

  async fetchMessagesFrom(box: TripleDocument): Promise<TripleDocument[]> {
    const boxSub = box.getSubject("");
    const docs: string[] = boxSub.getAllRefs(ldp.contains);
    const promises: Promise<TripleDocument>[] = docs.map(
      async (msgDocUrl: string): Promise<TripleDocument> => {
        return this.podData.getDocumentAt(msgDocUrl);
      }
    );
    return Promise.all(promises);
  }

  async fetchSentMessages(): Promise<TripleDocument[]> {
    return this.fetchMessagesFrom(this.ourOutbox);
  }
  async fetchReceivedMessages(): Promise<TripleDocument[]> {
    return this.fetchMessagesFrom(this.ourInbox);
  }
}
