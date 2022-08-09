import React, { useReducer } from 'react';
import './App.css';
import { Types, AptosClient, TxnBuilderTypes, AptosAccount } from 'aptos';
import { Buffer } from "buffer"
import { SetMessage, toHex } from './message';
import {useAptos} from "./hooks/aptos";
import { aptosReducer } from './lib/contexts/AptosContext';

// Create an AptosClient to interact with devnet.
const client = new AptosClient('https://fullnode.devnet.aptoslabs.com');

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
      arguments: [toHex(message)],
      type_arguments: [],
    };

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
  const resource = resources.find((r) => r.type.toString() === resourceType);
  const data = resource?.data as {message: string} | undefined;
  const message = data?.message;

  const aptos = useAptos();

  React.useEffect(() => {
    aptos.updateAccount().catch(console.error)
  }, [aptos]);

  const CreateAccountA = async () => {
    try {
      await SetMessage("0xd33a8f77a8b28d34a930b9eeb9d923aa90324f4d9e1e796a94459289d53ee4a6", "PUBLISHER");
    } catch (e) {
      console.log(e);
      window.alert(e);
      return
    }
    await aptos.updateAccount()
    console.log("success");
  }

  return (
    <div className="App">
      <p>Address: {aptos.account?.address}</p>
      <button className="button" onClick={CreateAccountA} disabled={false}>
        Create Tx
      </button>
      <button
          className="px-4 py-2 bg-gray-100 hover:bg-gray-300 duration-300 rounded-md my-auto ml-auto mr-4"
          onClick={aptos.disconnect}
      >
          解除连接
      </button>
      <button
          className={"px-4 py-2 bg-indigo-500 text-white rounded-md"}
          onClick={aptos.connect}
      >
          连接钱包
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
