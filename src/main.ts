import { runPresentation } from "./presentation";

window.onload = (): void => {
  console.log("document ready");
  const solidAuth = ((window as unknown) as {
    solid: {
      auth: {
        trackSession: (callback: (session: { webId: string }) => void) => void;
        logout: () => void;
      };
    };
  }).solid.auth;
  solidAuth.trackSession(async (session: { webId: string }) => {
    if (!session) {
      console.log("The user is not logged in");
      document.getElementById(
        "loginBanner"
      ).innerHTML = `<button onclick="solid.auth.login(window.location.toString())">Log in or register</button>`;
      document.getElementById("ui").style.display = "none";
    } else {
      console.log(`Logged in as ${session.webId}`);
      try {
        await runPresentation(window as unknown, session.webId);
      } catch (e) {
        if (
          e.message === "Try clearing your cookie!" ||
          e.message === "Unauthorized"
        ) {
          solidAuth.logout();
          console.log("Logged out possibly stale session");
        } else {
          console.log("Unknown error", e.message);
        }
      }
    }
  });
};
