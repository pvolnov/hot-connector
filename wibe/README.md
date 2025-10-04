# Wibe3

`yarn add @hot-labs/wibe3`

## Client side

```tsx
import { Wibe3Client, useWibe3 } from "@hot-labs/wibe3/client";

const wibe3 = new Wibe3Client();

const Wibe3App = () => {
  const { address, connect, auth } = useWibe3(wibe3);
  const [jwt, setJwt] = useState<string | null>(null);

  const authUser = async () => {
    const auth = await wibe3.auth();
    const jwt = await fetch("/auth", { body: JSON.stringify(auth), method: "POST" }).then((r) => r.json());
    setJwt(jwt);
  };

  const claim = async () => {
    const password = prompt("Enter password to get 10 USDT");
    await fetch("/claim", {
      body: JSON.stringify({ password }),
      headers: { Authorization: jwt },
      method: "POST",
    });
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
        <button onClick={() => authUser()}>Auth</button>
      </div>
    );
  }

  return (
    <div>
      <p>Address: {address}</p>
      <button onClick={() => claim()}>Claim 10$</button>
    </div>
  );
};
```

## Backend side

```ts
import { Wibe3Wallet, OmniToken } from "@hot-labs/wibe3";

const wibe3 = new Wibe3Wallet({
  privateKey: "", // from HOT Wallet
});

server.post("/auth", async (res) => {
  if (!(await wibe3.validateAuth(res.body))) return res.send(401);
  const jwt = createUserAndGenerateJwt(res.body);
  return res.send(200, jwt);
});

server.post("/claim", async (res) => {
  if (res.body.password !== "halyava") return res.send(401);
  const user = getUserFromJwt(res.headers.Authorization);
  const paymentId = `${user.tradingAddress}-giveaway1`;

  // paymentId garantee that this user claim price only once!
  await wibe3.transfer({ token: OmniToken.USDT, amount: 10, to: user.tradingAddress, paymentId });
});
```
