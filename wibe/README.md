# Wibe3

`yarn add @hot-labs/wibe3`

## Client side

```ts
import { Wibe3Client } from "@hot-labs/wibe3";

const wibe3 = await Wibe3Client.initialize();

// Connect user wallet
await wibe3.connect();

// Authorize user crypto wallet
const auth = await wibe3.auth();
const jwt = await fetch("/auth", { body: JSON.stringify(auth), method: "POST" }).then((r) => r.json());

// Claim some crypto to user after auth
const password = prompt("Enter password to get 10 USDT");
await fetch("/claim", {
  body: JSON.stringify({ password }),
  headers: { Authorization: jwt },
  method: "POST",
});

// After claim user can withdraw crypto!
await wibe3.withdraw();
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
