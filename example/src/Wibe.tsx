import { useState } from "react";
import { useWibe3, Wibe3Client } from "../../wibe3/src/client";
import { OmniToken, Wibe3Wallet } from "../../wibe3/src";

const wibe3 = new Wibe3Client();

const wallet = new Wibe3Wallet({
  privateKey: process.env.PRIVATE_KEY!,
});

export const Wibe = () => {
  const { address, tradingAddress, withdraw, connect, auth, disconnect, refresh } = useWibe3(wibe3);
  const [jwt, setJwt] = useState<string | null>(null);

  const authWallet = async () => {
    const signed = await auth();
    const isValid = await wallet.validateAuth(signed);
    if (!isValid) throw new Error("Invalid auth");
    setJwt("jwt");
  };

  const claim = async () => {
    try {
      if (!tradingAddress) throw new Error("Trading address not found");
      await wallet.transfer({ token: OmniToken.USDT, amount: 0.01, to: tradingAddress, paymentId: "claim" });
    } catch (e) {
      alert(e);
    }
  };

  const withdrawToken = async () => {
    try {
      await withdraw(OmniToken.USDT, 0.01);
      await refresh().catch(() => {});
      alert("Withdraw successful");
    } catch (e) {
      alert(e);
    }
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
        <Balances />

        <button onClick={() => authWallet()}>Auth</button>
        <button onClick={() => disconnect()}>Disconnect</button>
      </div>
    );
  }

  return (
    <div>
      <Balances />

      <button onClick={() => claim()}>Claim 0.01$</button>
      <button onClick={() => withdraw(OmniToken.USDT, 0.01)}>Withdraw USDT</button>
      <button onClick={() => disconnect()}>Disconnect</button>
    </div>
  );
};

const Balances = () => {
  const { balances, address } = useWibe3(wibe3);

  if (!address) return null;

  return (
    <div>
      <p style={{ margin: 0 }}>Address: {address}</p>
      <p style={{ margin: 0 }}>Balances:</p>

      {balances.map((balance) => (
        <div key={balance.symbol} style={styles.balance}>
          <img
            style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }}
            src={balance.icon}
            alt={balance.symbol}
          />
          <p style={{ margin: 0 }}>
            {balance.float} {balance.symbol}
          </p>
        </div>
      ))}
    </div>
  );
};

const styles = {
  balance: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    border: "1px solid #bebebe",
    padding: 8,
    borderRadius: 16,
    width: "fit-content",
    marginBottom: 8,
  },
};
