import React from 'react';
import './App.css';
import { Types, AptosClient, TxnBuilderTypes, AptosAccount } from 'aptos';
import { Buffer } from "buffer"
require('dotenv').config({ path: '.env' })

// Create an AptosClient to interact with devnet.
const client = new AptosClient('https://fullnode.devnet.aptoslabs.com');
const privateKey = process.env.PRIVATEKEY;
console.log(privateKey, "privateKey");

/** Convert string to hex-encoded utf-8 bytes. */
function stringToHex(text: string) {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(text);
  return Array.from(encoded, (i) => i.toString(16).padStart(2, "0")).join("");
}

function stringToUint8Array(str: string){
  var arr = [];
  for (var i = 0, j = str.length; i < j; ++i) {
    arr.push(str.charCodeAt(i));
  }
 
  var tmpUint8Array = new Uint8Array(arr);
  return tmpUint8Array
}

function App() {
  // Retrieve aptos.account on initial render and store it.
  const urlAddress = window.location.pathname.slice(1);
  const isEditable = !urlAddress;
  const [address, setAddress] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (urlAddress) {
      setAddress(urlAddress);
    } else {
      window.aptos.account().then((data : {address: string}) => setAddress(data.address));
    }
  }, [urlAddress]);

  // Use the AptosClient to retrieve details about the account.
  const [account, setAccount] = React.useState<Types.AccountData | null>(null);
  React.useEffect(() => {
    if (!address) return;
    client.getAccount(address).then(setAccount);
  }, [address]);

  const privateKeyBuffer = Buffer.from(privateKey, 'hex')
  const account1 = new AptosAccount(privateKeyBuffer);
  console.log(account1.address(), "account1");

  // Check for the module; show publish instructions if not present.
  const [modules, setModules] = React.useState<Types.MoveModuleBytecode[]>([]);
  React.useEffect(() => {
    if (!address) return;
    client.getAccountModules(address).then(setModules);
  }, [address]);

  const hasModule = modules.some((m) => m.abi?.name === 'Message');
  const publishInstructions = (
    <pre>
      Run this command to publish the module:
      <br />
      aptos move publish --package-dir /path/to/hello_blockchain/
      --named-addresses HelloBlockchain={address}
    </pre>
  );

  // Call set_message with the textarea value on submit.
  const ref = React.createRef<HTMLTextAreaElement>();
  const [isSaving, setIsSaving] = React.useState(false);
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!ref.current) return;

    const message = ref.current.value;
    const transaction = {
      type: "script_function_payload",
      function: "0x33c8840298b3f75cfbe37ac11051ba7085b65bbc074937624114cfad8d4d5113::Message::set_message",
      arguments: [stringToHex(message)],
      type_arguments: [],
    };
    console.log(transaction, "transaction");

    try {
      setIsSaving(true);
      const result = await window.aptos.signAndSubmitTransaction(transaction);
      console.log(result, "result");
    } finally {
      setIsSaving(false);
    }
  };

  // Get the message from account resources.
  const [resources, setResources] = React.useState<Types.MoveResource[]>([]);
  React.useEffect(() => {
    if (!address) return;
    client.getAccountResources(address).then(setResources);
  }, [address]);
  const resourceType = `${address}::Message::MessageHolder`;
  const resourcea = resources.map((r) => r.type.address);
  const resourceg = resources.map((r) => r.type.generic_type_params);
  const resourcem = resources.map((r) => r.type.module);
  const resourcen = resources.map((r) => r.type.name);
  console.log(resourcea, resourceg, resourcem, resourcen);
  const resource = resources.find((r) => r.type.toString() === resourceType);
  const data = resource?.data as {message: string} | undefined;
  const message = data?.message;

  async function createTx() {
    try {
      const messageTransferFunction = {
        module: {
          address: `${account1.address()}`,
          name: "Message",
        },
        name: "set_message",
      };
      const payload: Types.TransactionPayload = {
        type: "script_function_payload",
        function: messageTransferFunction,
        type_arguments: [],
        arguments: [stringToHex("coool")],
      };
      console.log(account1.address());
      console.log(payload, "payload");
      const txnRequest = await client.generateTransaction(account1.address(), payload);
      console.log(txnRequest, "txnRequest");
      if (!account) {
        return;
      } else {
        const transactionRes = (await client.simulateTransaction(account1, txnRequest))[0];
        console.log(transactionRes, "transactionRes");
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="App">
      <button className="button" onClick={createTx} disabled={false}>
        Create Tx
      </button>
      {hasModule ? (
        <form onSubmit={handleSubmit}>
          <textarea ref={ref} defaultValue={message} readOnly={!isEditable} />
          {isEditable && (<input disabled={isSaving} type="submit" />)}
          {isEditable && (<a href={address!}>Get public URL</a>)}
        </form>
      ) : publishInstructions}
    </div>
  );
}

export default App;
