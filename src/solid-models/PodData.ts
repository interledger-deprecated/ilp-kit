import {
  TripleDocument,
  TripleSubject,
  createDocument,
  LocalTripleDocumentWithRef,
  fetchDocument
} from "tripledoc";
import {
  acl as aclUpstream,
  ldp,
  rdf,
  space,
  schema,
  vcard
} from "rdf-namespaces";
import { v4 as uuid } from "uuid";
import { SolidContact } from "./SolidContact";

const acl = Object.assign(
  {
    default: "http://www.w3.org/ns/auth/acl#default"
  },
  aclUpstream
);

// copied from
// https://github.com/inrupt/friend-requests-exploration/blob/master/src/services/usePersonDetails.ts
export const as = {
  following: "https://www.w3.org/TR/activitypub/#following"
};

export const contacts = {
  webId: "https://ledgerloops.com/contacts/#webId",
  nick: "https://ledgerloops.com/contacts/#nick"
};

const snap = {
  ourInbox: "https://ledgerloops.com/snap/#our-in",
  ourOutbox: "https://ledgerloops.com/snap/#our-out",
  theirInbox: "https://ledgerloops.com/snap/#their-in",
  root: "https://ledgerloops.com/snap/#root"
};

export class PodData {
  sessionWebId: string;
  podRoot: string;
  promises: {
    [url: string]: Promise<TripleDocument>;
  };
  constructor(sessionWebId: string, podRoot: string) {
    this.sessionWebId = sessionWebId;
    this.podRoot = podRoot;
    this.promises = {};
  }

  async createDocumentOrContainer(
    url: string
  ): Promise<LocalTripleDocumentWithRef> {
    if (url.substr(-1) === "/") {
      const dummy = createDocument(url + ".dummy");
      await dummy.save();
      return fetchDocument(url);
    }
    return createDocument(url);
  }
  async fetchOrCreate(
    url: string,
    initIfMissing?: (newDoc: LocalTripleDocumentWithRef) => Promise<void>
  ): Promise<TripleDocument> {
    let fetched: TripleDocument | null = null;
    try {
      fetched = await fetchDocument(url);
    } catch (e) {
      if (e.message === "Fetching the Document failed: 401 Unauthorized.") {
        console.log("Throwing fetch error");
        throw e;
      }
      console.log("Swallowing fetch error", e.message);
      // e.g. 404 etc.
    }
    if (fetched === null) {
      const newDoc = await this.createDocumentOrContainer(url);
      if (initIfMissing) {
        await initIfMissing(newDoc);
      }
      return newDoc.save();
    }
    return fetched;
  }
  async getDocumentAt(
    url: string,
    initIfMissing?: (newDoc: LocalTripleDocumentWithRef) => Promise<void>
  ): Promise<TripleDocument> {
    const urlNoFrag = url.split("#")[0];
    if (!this.promises[urlNoFrag]) {
      this.promises[urlNoFrag] = this.fetchOrCreate(url, initIfMissing);
    }
    try {
      await this.promises[urlNoFrag];
    } catch (e) {
      if (e.message === "Fetching the Document failed: 401 Unauthorized.") {
        throw new Error("Try clearing your cookie!");
      }
      throw e;
    }
    return this.promises[urlNoFrag];
  }
  async getSubjectAt(
    uri: string,
    initIfMissing?: (newDoc: LocalTripleDocumentWithRef) => Promise<void>
  ): Promise<TripleSubject> {
    const doc = await this.getDocumentAt(uri, initIfMissing);
    return doc.getSubject(uri);
  }
  async followOrLink(
    s: TripleSubject,
    p: string,
    defaultLocation: string
  ): Promise<string> {
    const followed: string | null = s.getRef(p);
    if (followed === null) {
      s.addRef(p, defaultLocation);
      await (s.getDocument() as TripleDocument).save();
      return defaultLocation;
    }
    return followed;
  }
  async getDocumentOn(
    s: TripleSubject,
    p: string,
    defaultLocation: string,
    initDocIfMissing?: (newDoc: LocalTripleDocumentWithRef) => Promise<void>
  ): Promise<TripleDocument> {
    const uri = await this.followOrLink(s, p, defaultLocation);
    return this.getDocumentAt(uri, initDocIfMissing);
  }
  async getContainerOn(
    s: TripleSubject,
    p: string,
    defaultLocation: string,
    initDocIfMissing?: (newDoc: LocalTripleDocumentWithRef) => Promise<void>
  ): Promise<TripleDocument> {
    const uri = await this.followOrLink(s, p, defaultLocation);
    return this.getDocumentAt(uri, initDocIfMissing);
  }
  async getSubjectOn(
    s: TripleSubject,
    p: string,
    defaultLocation: string,
    initDocIfMissing?: (newDoc: LocalTripleDocumentWithRef) => Promise<void>
  ): Promise<TripleSubject> {
    const uri = await this.followOrLink(s, p, defaultLocation);
    return this.getSubjectAt(uri, initDocIfMissing);
  }

  /**
   * This will fetch or create the profile doc
   */
  async getProfileSub(): Promise<TripleSubject> {
    const webIdParts = this.sessionWebId.split("#");
    let webIdFragment = "";
    if (webIdParts.length == 2) {
      webIdFragment = webIdParts[1];
    }
    const profileDoc = await this.getDocumentAt(
      this.sessionWebId,
      async (newDoc: LocalTripleDocumentWithRef) => {
        const newProfileSub = newDoc.addSubject({
          identifier: webIdFragment
        });
        newProfileSub.addRef(rdf.type, schema.Person);
        newProfileSub.addRef(space.storage, this.podRoot);
      }
    );
    return profileDoc.getSubject(this.sessionWebId);
  }

  /**
   * This will fetch or create the addressbook
   */
  async getAddressBookSub(): Promise<TripleSubject> {
    const profileSub = await this.getProfileSub();
    return this.getSubjectOn(
      profileSub,
      as.following,
      this.podRoot + "contacts.ttl#friends"
    );
  }
  async getContacts(): Promise<SolidContact[]> {
    const addressBookSub = await this.getAddressBookSub();
    const contactUris = addressBookSub.getAllRefs(vcard.hasMember);
    const promises: Promise<SolidContact>[] = contactUris.map(
      (contactUri: string) => {
        return this.getContact(contactUri);
      }
    );
    return Promise.all(promises);
  }

  generateSubUri(ref: string): string {
    const fragment = `#${uuid()}`;
    return new URL(fragment, ref).toString();
  }

  async generateContactSubUri(): Promise<string> {
    const addressBookSub = await this.getAddressBookSub();
    const ref: string = addressBookSub.asRef();
    return this.generateSubUri(ref);
  }

  async getContact(uri: string): Promise<SolidContact> {
    const contactSub = await this.getSubjectAt(uri);
    const theirWebId = contactSub.getRef(contacts.webId);
    const nick = contactSub.getString(contacts.nick);
    const theirProfileDoc = await fetchDocument(theirWebId);
    const theirInbox = theirProfileDoc.getSubject(theirWebId).getRef(ldp.inbox);

    const ourInbox = await this.getDocumentOn(
      contactSub,
      snap.ourInbox,
      `${this.podRoot}snap/${encodeURIComponent(nick)}/our-in/`
    );
    const ourOutbox = await this.getDocumentOn(
      contactSub,
      snap.ourOutbox,
      `${this.podRoot}snap/${encodeURIComponent(nick)}/our-out/`
    );
    return new SolidContact(ourInbox, ourOutbox, theirInbox, nick, this);
  }

  addAuthorization(
    doc: LocalTripleDocumentWithRef,
    targetDocUrl: string,
    subFragStr: string,
    webId: string,
    preds: string[],
    modes: string[]
  ): void {
    const sub = doc.addSubject({
      identifier: subFragStr
    });
    sub.addRef(rdf.type, acl.Authorization);
    sub.addRef(acl.agent, webId);
    preds.forEach((pred: string) => {
      sub.addRef(pred, targetDocUrl);
    });
    modes.forEach((mode: string) => {
      sub.addRef(acl.mode, mode);
    });
  }
  addAuthorizations(
    doc: LocalTripleDocumentWithRef,
    targetDocUrl: string,
    map: { [wedId: string]: string[] },
    preds: string[]
  ): void {
    Object.keys(map).forEach((webId: string) => {
      this.addAuthorization(
        doc,
        targetDocUrl,
        uuid(),
        webId,
        preds,
        map[webId]
      );
    });
  }
  async ensureAcl(
    forDoc: TripleDocument,
    access: { [wedId: string]: string[] },
    defaults: { [wedId: string]: string[] }
  ): Promise<void> {
    const targetDocUrl: string = forDoc.asRef();
    const aclDocUrl: string = forDoc.getAclRef();
    await this.getDocumentAt(
      aclDocUrl,
      async (newDoc: LocalTripleDocumentWithRef): Promise<void> => {
        // FIXME: leave out acl.default if ACL is not for a container.
        const ownerPreds = [acl.accessTo, acl.default];
        this.addAuthorization(
          newDoc,
          targetDocUrl,
          "owner",
          this.sessionWebId,
          ownerPreds,
          [acl.Read, acl.Write, acl.Control]
        );
        this.addAuthorizations(newDoc, targetDocUrl, access, [acl.accessTo]);
        this.addAuthorizations(newDoc, targetDocUrl, defaults, [acl.default]);
      }
    );
  }

  async addContact(theirWebId: string, nick: string): Promise<SolidContact> {
    const uri = await this.generateContactSubUri();
    const addressBookSub: TripleSubject = await this.getAddressBookSub();
    addressBookSub.addRef(vcard.hasMember, uri);
    const contactSub = await this.getSubjectAt(uri);
    contactSub.addRef(contacts.webId, theirWebId);
    contactSub.addString(contacts.nick, nick);
    const theirProfileDoc = await fetchDocument(theirWebId);
    const theirInbox = theirProfileDoc.getSubject(theirWebId).getRef(ldp.inbox);

    const ourInbox = await this.getDocumentOn(
      contactSub,
      snap.ourInbox,
      `${this.podRoot}snap/${encodeURIComponent(nick)}/our-in/`
    );
    await this.ensureAcl(ourInbox, { [theirWebId]: [acl.Append] }, {});
    const ourOutbox = await this.getDocumentOn(
      contactSub,
      snap.ourOutbox,
      `${this.podRoot}snap/${encodeURIComponent(nick)}/our-out/`
    );
    await this.ensureAcl(ourOutbox, {}, {});
    const docUri = await (addressBookSub.getDocument() as LocalTripleDocumentWithRef).asRef();
    const doc = await this.getDocumentAt(docUri);
    await (doc as LocalTripleDocumentWithRef).save();
    return new SolidContact(ourInbox, ourOutbox, theirInbox, nick, this);
  }
}
