import {
  VirtualSubject,
  VirtualContainer,
  // describeContainer,
  // Reference,
  TripleDocument,
  fetchDocument,
  describeDocument,
  VirtualDocument,
  describeSubject,
  describeContainer,
  // eslint-disable-next-line @typescript-eslint/camelcase
  internal_fetchContainer
} from "plandoc";
import { space, ldp } from "rdf-namespaces";

export async function test(): Promise<void> {
  ((window as unknown) as {
    solid: {
      auth: {
        trackSession: (callback: (session: { webId: string }) => void) => void;
      };
    };
  }).solid.auth.trackSession(async (session: { webId: string }) => {
    if (!session) {
      throw new Error("The user needs to be logged in for this");
    }
    const profileDoc = await fetchDocument(
      describeDocument().isFoundAt(session.webId)
    );
    const profileSub = profileDoc.getSubject(session.webId);
    const existingInboxLink = profileSub.getRef(ldp.inbox);
    console.log({ existingInboxLink });
    if (existingInboxLink === null) {
      const virtualProfileSub: VirtualSubject = describeSubject().isFoundAt(
        session.webId
      );
      const virtualPodRoot: VirtualContainer = describeContainer().isFoundOn(
        virtualProfileSub,
        space.storage
      );
      const virtualInboxContainer: VirtualContainer = describeContainer().experimental_isContainedIn(
        virtualPodRoot,
        "inbox"
      );
      const inboxUrl = await internal_fetchContainer(virtualInboxContainer);
      // const inboxUrl2 = await internal_fetchContainer(inboxContainer2);
      console.log(inboxUrl);
      profileSub.addRef(ldp.inbox, inboxUrl);
    }
  });
}
