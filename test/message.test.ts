import { StateTransition, SnapTransactionState } from "snap-checker";
import { snapMessageToWeb } from "../src/message";

describe("snapMessageToWeb", () => {
  it("runs", async () => {
    const uri = "https://example.com/#this";
    const msg: StateTransition = {
      transId: 1,
      newState: SnapTransactionState.Proposing,
      amount: 5
    };
    const result = await snapMessageToWeb(msg, uri);
    expect(result).toEqual(undefined);
  });
});
