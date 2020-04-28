import { PodData } from "./solid-models/PodData";
import { SolidContact } from "./solid-models/SolidContact";
import { SnapContact } from "./SnapContact";

export class SnapSolid {
  podData: PodData;
  snapContacts: SnapContact[] | undefined;
  constructor(sessionWebId: string) {
    const podRoot = sessionWebId.substring(
      0,
      sessionWebId.length - "profile/card#me".length
    );
    this.podData = new PodData(sessionWebId, podRoot);
  }
  async addContact(webId: string, nick: string): Promise<void> {
    const newSolidContact = await this.podData.addContact(webId, nick);
    const snapContact = new SnapContact(newSolidContact);
    await snapContact.loadMessages();
    this.snapContacts.push(snapContact);
  }
  async getContacts(): Promise<SnapContact[]> {
    if (this.snapContacts === undefined) {
      const solidContacts = await this.podData.getContacts();
      this.snapContacts = solidContacts.map((solidContact: SolidContact) => {
        return new SnapContact(solidContact);
      });
    }
    console.log("Loading messages");
    await Promise.all(
      this.snapContacts.map((contact: SnapContact) => {
        return contact.loadMessages();
      })
    );
    console.log("Returning Snap Contacts");
    return this.snapContacts;
  }
}
