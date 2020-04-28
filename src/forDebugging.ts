import { SnapSolid } from "./SnapSolid";
import {
  fetchDocument,
  createDocument,
  createDocumentInContainer
} from "tripledoc";
import { ldp, space, acl, vcard } from "rdf-namespaces";
import { runPresentation } from "./presentation";
import { SnapChecker } from "snap-checker";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function forDebugging(window: any, snapSolid: SnapSolid): void {
  window.snapSolid = snapSolid;
  window.fetchDocument = fetchDocument;
  window.createDocument = createDocument;
  window.createDocumentInContainer = createDocumentInContainer;
  window.ldp = ldp;
  window.space = space;
  window.acl = acl;
  window.vcard = vcard;
  window.as = {
    following: "https://www.w3.org/TR/activitypub/#following"
  };
  window.SnapChecker = SnapChecker;
  window.runPresentation = runPresentation;
}
