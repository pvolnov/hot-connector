import { useState } from "react";
import { useWibe3, Wibe3Client } from "@hot-labs/wibe3/client";

const wibe3 = new Wibe3Client();

export const Wibe = () => {
  const { address, connect, auth } = useWibe3(wibe3);
  const [jwt, setJwt] = useState<string | null>(null);

  const authWallet = async () => {
    await auth();
    setJwt("jwt");
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
      </div>
    );
  }

  return (
    <div>
      <p>JWT: {jwt}</p>
    </div>
  );
};
