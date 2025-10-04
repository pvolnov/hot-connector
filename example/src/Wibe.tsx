import { useState } from "react";
import { useWibe3, Wibe3Client } from "../../wibe3/src/client";
import { OmniToken, Wibe3Wallet } from "../../wibe3/src";

const wibe3 = new Wibe3Client();

const wallet = new Wibe3Wallet({
  privateKey: "ed25519:4J1Svjdiy71rRyRL84zq9aPDUHdDjieWLhF1vBYt5XFWZwDpQoRxEhq48PfqtRAuPZ9d9EoPcy1k3UHtg76i79s5",
});

export const Wibe = () => {
  const { address, tradingAddress, withdraw, connect, auth, disconnect } = useWibe3(wibe3);
  const [jwt, setJwt] = useState<string | null>(null);

  const authWallet = async () => {
    const signed = await auth();

    const isValid = await wallet.validateAuth(signed);
    if (!isValid) throw new Error("Invalid auth");

    setJwt("jwt");
  };

  const claim = async () => {
    if (!tradingAddress) throw new Error("Trading address not found");
    await wallet.transfer({ token: OmniToken.USDT, amount: 0.01, to: tradingAddress, paymentId: "claim" });
  };

  if (!address) {
    return (
      <div>
        <button onClick={() => connect()}>Connect</button>
      </div>
    );
  }

  if (!jwt) {
    return (
      <div>
        <p>Address: {address}</p>
        <button onClick={() => authWallet()}>Auth</button>
        <button onClick={() => disconnect()}>Disconnect</button>
      </div>
    );
  }

  return (
    <div>
      <p>Address: {address}</p>
      <button onClick={() => claim()}>Claim 0.01$</button>
      <button onClick={() => withdraw()}>Withdraw</button>
      <button onClick={() => disconnect()}>Disconnect</button>
    </div>
  );
};
