import type {AptosPayload} from "./lib/aptos/TransactionBuilder";
import type {Address} from "./lib/aptos";
import {accountResource, tableItems, waitForTransaction} from "./lib/aptos";

export const toHex = (s: string) => Array.from(new TextEncoder().encode(s)).map(x => x.toString(16)).join("")

export async function SetMessage(publisher: Address, message: string) {
  const payload: AptosPayload = {
      type: "script_function_payload",
      function: `${publisher}::Message::set_message`,
      arguments: [toHex(message)],
      type_arguments: [],
  }
  const tx = await window.aptos!.signAndSubmitTransaction(payload)
  return await waitForTransaction(tx)
}
