var HOTConnect=function(u){"use strict";var G=Object.defineProperty;var Q=(u,w,p)=>w in u?G(u,w,{enumerable:!0,configurable:!0,writable:!0,value:p}):u[w]=p;var c=(u,w,p)=>Q(u,typeof w!="symbol"?w+"":w,p);class w{async get(e){return localStorage.getItem(e)}async set(e,t){localStorage.setItem(e,t)}async remove(e){localStorage.removeItem(e)}}class p{constructor(){c(this,"events",{})}on(e,t){this.events[e]||(this.events[e]=[]),this.events[e].push(t)}emit(e,t){var n;(n=this.events[e])==null||n.forEach(s=>s(t))}off(e,t){var n;this.events[e]=(n=this.events[e])==null?void 0:n.filter(s=>s!==t)}once(e,t){const n=s=>{t(s),this.off(e,n)};this.on(e,n)}removeAllListeners(e){e?delete this.events[e]:this.events={}}}const S=()=>typeof window.crypto<"u"&&typeof window.crypto.randomUUID=="function"?window.crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(o){const e=Math.random()*16|0;return(o==="x"?e:e&3|8).toString(16)}),v="123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",D=(()=>{const o=Array(256).fill(-1);for(let e=0;e<v.length;++e)o[v.charCodeAt(e)]=e;return o})(),b={decode(o){if(!o||typeof o!="string")throw new Error(`Expected base58 string but got “${o}”`);if(o.match(/[IOl0]/gmu))throw new Error(`Invalid base58 character “${o.match(/[IOl0]/gmu)}”`);const e=o.match(/^1+/gmu),t=e?e[0].length:0,n=(o.length-t)*(Math.log(58)/Math.log(256))+1>>>0;return new Uint8Array([...new Uint8Array(t),...o.match(/.{1}/gmu).map(s=>v.indexOf(s)).reduce((s,r)=>(s=s.map(a=>{const i=a*58+r;return r=i>>8,i}),s),new Uint8Array(n)).reverse().filter((s=>r=>s=s||r)(!1))])},encode(o){const e=[];for(const t of o){let n=t;for(let s=0;s<e.length;++s){const r=(D[e[s]]<<8)+n;e[s]=v.charCodeAt(r%58),n=r/58|0}for(;n;)e.push(v.charCodeAt(n%58)),n=n/58|0}for(const t of o){if(t)break;e.push(49)}return e.reverse(),String.fromCharCode(...e)}};var d=(o=>(o[o.NEAR=1010]="NEAR",o[o.EVM=1]="EVM",o[o.SOLANA=1001]="SOLANA",o[o.TON=1111]="TON",o))(d||{});const g={encode(o){return[...o].map(e=>e.toString(16).padStart(2,"0")).join("")},decode(o){const t=o.replace(/^0x/,"").match(/[\dA-F]{2}/gi),n=(t==null?void 0:t.map(s=>parseInt(s,16)))||[];return new Uint8Array(n)}},f={decode(o){for(var e=atob(o),t=new Uint8Array(e.length),n=0;n<e.length;n++)t[n]=e.charCodeAt(n);return new Uint8Array(t.buffer)},encode(o){for(var e="",t=o.byteLength,n=0;n<t;n++)e+=String.fromCharCode(o[n]);return window.btoa(e)}};class E{constructor(){c(this,"getAddress",async()=>{const e=await this.getAccounts();if(e.length===0)throw new Error("No account found");return e[0].accountId});c(this,"getPublicKey",async()=>{const e=await this.getAccounts();if(e.length===0)throw new Error("No account found");return e[0].publicKey});c(this,"getIntentsAddress",async()=>await this.getAddress());c(this,"signIntentsWithAuth",async(e,t)=>{const n=await this.getAccounts();if(n.length===0)throw new Error("No account found");const s=g.encode(window.crypto.getRandomValues(new Uint8Array(32))),r=new TextEncoder().encode(`${e}_${s}`),a=await window.crypto.subtle.digest("SHA-256",r);return{intent:await this.signIntents(t||[],{nonce:new Uint8Array(a)}),address:n[0].accountId,publicKey:n[0].publicKey,chainId:d.NEAR,domain:e,seed:s}});c(this,"signIntents",async(e,t)=>{const n=new Uint8Array((t==null?void 0:t.nonce)||window.crypto.getRandomValues(new Uint8Array(32))),s=await this.getIntentsAddress(),r=JSON.stringify({deadline:t!=null&&t.deadline?new Date(t.deadline).toISOString():"2100-01-01T00:00:00.000Z",signer_id:s,intents:e}),a=await this.signMessage({message:r,recipient:"intents.near",nonce:n});if(!a)throw new Error("Failed to sign message");const{signature:i,publicKey:l}=a;return{standard:"nep413",payload:{nonce:f.encode(n),recipient:"intents.near",message:r},signature:`ed25519:${b.encode(f.decode(i))}`,public_key:l}})}get type(){return d.NEAR}}class M extends E{constructor(e,t){super(),this.connector=e,this.manifest=t}callParentFrame(e,t){const n=S();return window.parent.postMessage({type:"near-wallet-injected-request",id:n,method:e,params:t},"*"),new Promise((s,r)=>{const a=i=>{i.data.type==="near-wallet-injected-response"&&i.data.id===n&&(window.removeEventListener("message",a),i.data.success?s(i.data.result):r(i.data.error))};window.addEventListener("message",a)})}async signIn(e){const t=await this.callParentFrame("near:signIn",e);return Array.isArray(t)?t:[t]}async signOut(e){await this.callParentFrame("near:signOut",e)}async getAccounts(e){return this.callParentFrame("near:getAccounts",e)}async signAndSendTransaction(e){return this.callParentFrame("near:signAndSendTransaction",e)}async signAndSendTransactions(e){return this.callParentFrame("near:signAndSendTransactions",e)}async signMessage(e){return this.callParentFrame("near:signMessage",e)}}const k=o=>{try{return new URL(o)}catch{return null}},R=o=>`
${o} * {
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  color: #fff;
}

${o} p, h1, h2, h3, h4, h5, h6 {
  margin: 0;
}

${o} .modal-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 100000000;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    transition: opacity 0.2s ease-in-out;
}

@media (max-width: 600px) {
  ${o} .modal-container {
    justify-content: flex-end;
  }
}

${o} .modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;

  max-width: 420px;
  max-height: 600px;
  width: 100%;
  border-radius: 24px;
  background: #0d0d0d;
  border: 1.5px solid rgba(255, 255, 255, 0.1);
  transition: transform 0.2s ease-in-out;
}

@media (max-width: 600px) {
  ${o} .modal-content {
    max-width: 100%;
    width: 100%;
    max-height: 80%;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    border: none;
    border-top: 1.5px solid rgba(255, 255, 255, 0.1);
  }
}


${o} .modal-header {
    display: flex;
    padding: 24px;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    align-self: stretch;
}
  
${o} .modal-header p {
  color: #fff;
  text-align: center;
  font-size: 24px;
  font-style: normal;
  font-weight: 600;
  line-height: normal;
  margin: 0;
}


${o} .modal-body {
  display: flex;
  padding: 16px;
  flex-direction: column;
  align-items: flex-start;
  text-align: center;
  gap: 8px;
  overflow: auto;

  border-radius: 24px;
  background: rgba(255, 255, 255, 0.08);
  width: 100%;
  flex: 1;
}

${o} .modal-body button {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  background: #fff;
  color: #000;
  border: none;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.2s ease-in-out;
  margin-top: 16px;
}

${o} .footer {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 16px 24px;
  color: #fff;
  gap: 12px;
}

${o} .modal-body p {
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  font-size: 16px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
  letter-spacing: -0.8px;
}

${o} .footer img {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

${o} .get-wallet-link {
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  font-size: 16px;
  font-style: normal;
  font-weight: 500;
  margin-left: auto;
  text-decoration: none;
  transition: color 0.2s ease-in-out;
  cursor: pointer;
}
  
${o} .get-wallet-link:hover {
  color: rgba(255, 255, 255, 1);
}


${o} .connect-item {
  display: flex;
  padding: 12px;
  align-items: center;
  gap: 12px;
  align-self: stretch;
  cursor: pointer;

  transition: background 0.2s ease-in-out;
  border-radius: 24px;
}

${o} .connect-item img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

${o} .connect-item-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  text-align: left;
  flex: 1;
  margin-top: -2px;
}

${o} .connect-item-info .wallet-address {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
}

${o} .connect-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

${o} .connect-item img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

${o} .connect-item p {
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  font-size: 18px;
  font-style: normal;
  font-weight: 600;
  line-height: normal;
  letter-spacing: -0.36px;
  margin: 0;
}
`,C="hot-connector-popup",P=document.createElement("style");P.textContent=R(`.${C}`),document.head.append(P);class x{constructor(e){c(this,"isClosed",!1);c(this,"root",document.createElement("div"));c(this,"state",{});this.delegate=e}get dom(){return""}update(e){this.state=e,this.root.innerHTML=this.dom}create({show:e=!0}){this.root.className=C,this.root.innerHTML=this.dom,document.body.append(this.root);const t=this.root.querySelector(".modal-container"),n=this.root.querySelector(".modal-content"),s=this.root.querySelector(".get-wallet-link");n.style.transform="translateY(50px)",t.style.opacity="0",this.root.style.display="none",n.addEventListener("click",r=>r.stopPropagation()),s.addEventListener("click",()=>window.open("https://download.hot-labs.org?hotconnector","_blank")),t.addEventListener("click",()=>{this.delegate.onReject(),this.destroy()}),e&&setTimeout(()=>this.show(),10)}show(){const e=this.root.querySelector(".modal-container"),t=this.root.querySelector(".modal-content");t.style.transform="translateY(50px)",e.style.opacity="0",this.root.style.display="block",setTimeout(()=>{t.style.transform="translateY(0)",e.style.opacity="1"},100)}hide(){const e=this.root.querySelector(".modal-container"),t=this.root.querySelector(".modal-content");t.style.transform="translateY(50px)",e.style.opacity="0",setTimeout(()=>{this.root.style.display="none"},200)}destroy(){this.isClosed||(this.isClosed=!0,this.hide(),setTimeout(()=>{this.root.remove()},200))}}class U extends x{constructor(e){super(e),this.delegate=e}create(){var t;super.create({show:!1}),(t=this.root.querySelector("button"))==null||t.addEventListener("click",()=>this.delegate.onApprove()),this.root.querySelector(".modal-body").appendChild(this.delegate.iframe),this.delegate.iframe.style.width="100%",this.delegate.iframe.style.height="720px",this.delegate.iframe.style.border="none"}get dom(){return`
      <div class="modal-container">
        <div class="modal-content">
          <div class="modal-body" style="padding: 0; overflow: auto;">
          </div>

          <div class="footer">
            <img src="https://tgapp.herewallet.app/images/hot/hot-icon.png" alt="HOT Connector" />
            <p>HOT Connector</p>
            <p class="get-wallet-link">Don't have a wallet?</p>
          </div>
        </div>
      </div>`}}async function K(o){const e=await o.executor.getAllStorage(),t=o.executor.manifest,n=o.id,s=o.code.replaceAll("window.localStorage","window.sandboxedLocalStorage").replaceAll("window.top","window.selector").replaceAll("window.open","window.selector.open");return`
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body>
      <div id="root"></div>

      <style>
        :root {
          --background-color: rgb(40, 40, 40);
          --text-color: rgb(255, 255, 255);
          --border-color: rgb(209, 209, 209);
        }

        * {
          font-family: system-ui, Avenir, Helvetica, Arial, sans-serif
        }

        body, html {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          background-color: var(--background-color);
          color: var(--text-color);
        }

        #root {
          display: none;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          width: 100vw;
          background: radial-gradient(circle at center, #2c2c2c 0%, #1a1a1a 100%);
          text-align: center;
        }

        #root * {
          box-sizing: border-box;
          font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
          line-height: 1.5;
          color-scheme: light dark;
          color: rgb(255, 255, 255);
          font-synthesis: none;
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
        }

        .prompt-container img {
          width: 100px;
          height: 100px;
          object-fit: cover;
          border-radius: 12px;
        }

        .prompt-container h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
          margin-top: 16px;
        }

        .prompt-container p {
          margin: 0;
          font-size: 16px;
          font-weight: 500;
          color: rgb(209, 209, 209);
        }

        .prompt-container button {
          background-color: #131313;
          border: none;
          border-radius: 12px;
          padding: 12px 24px;
          cursor: pointer;
          transition: border-color 0.25s;
          color: #fff;
          outline: none;
          font-size: 14px;
          font-weight: 500;
          font-family: inherit;
          margin-top: 16px;
        }
      </style>


      <script>
      window.sandboxedLocalStorage = (() => {
        let storage = ${JSON.stringify(e)}

        return {
          setItem: function(key, value) {
            window.selector.storage.set(key, value)
            storage[key] = value || '';
          },
          getItem: function(key) {
            return key in storage ? storage[key] : null;
          },
          removeItem: function(key) {
            window.selector.storage.remove(key)
            delete storage[key];
          },
          get length() {
            return Object.keys(storage).length;
          },
          key: function(i) {
            const keys = Object.keys(storage);
            return keys[i] || null;
          },
        };
      })();

      const showPrompt = async (args) => {
        const root = document.getElementById("root");   
        root.style.display = "flex";
        root.innerHTML = \`
          <div class="prompt-container">
            <img src="${t.icon}" />
            <h1>${t.name}</h1>
            <p>\${args.title}</p>
            <button>\${args.button}</button>
          </div>
        \`;

        return new Promise((resolve) => {
          root.querySelector("button")?.addEventListener("click", () => {
            root.innerHTML = "";
            resolve(true);
          });
        });
      }

      class ProxyWindow {
        constructor(url, features) {
          this.closed = false;
          this.windowIdPromise = window.selector.call("open", { url, features });

          window.addEventListener("message", async (event) => {            
            if (event.data.origin !== "${n}") return;
            if (!event.data.method?.startsWith("proxy-window:")) return;
            const method = event.data.method.replace("proxy-window:", "");
            if (method === "closed" && event.data.windowId === await this.id()) this.closed = true;
          });
        } 

        async id() {
          return await this.windowIdPromise;
        }

        async focus() {
          await window.selector.call("panel.focus", { windowId: await this.id() });
        }

        async postMessage(data) {
          window.selector.call("panel.postMessage", { windowId: await this.id(), data });
        }

        async close() {
          await window.selector.call("panel.close", { windowId: await this.id() });
        }
      }

      window.selector = {
        wallet: null,
        location: "${window.location.href}",
        
        outerHeight: ${window.outerHeight},
        screenY: ${window.screenY},
        outerWidth: ${window.outerWidth},
        screenX: ${window.screenX},

        uuid() {
          return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });
        },
      
        async ready(wallet) {
          window.parent.postMessage({ method: "wallet-ready", origin: "${n}" }, "*");
          window.selector.wallet = wallet;
        },

        async call(method, params) {
          const id = window.selector.uuid();
          window.parent.postMessage({ method, params, id, origin: "${n}" }, "*");

          return new Promise((resolve, reject) => {
            const handler = (event) => {
              if (event.data.id !== id || event.data.origin !== "${n}") return;
              window.removeEventListener("message", handler);

              if (event.data.status === "failed") reject(event.data.result);
              else resolve(event.data.result);
            };

            window.addEventListener("message", handler);
          });
        },

        panelClosed(windowId) {
          window.parent.postMessage({ 
            method: "panel.closed", 
            origin: "${n}", 
            result: { windowId } 
          }, "*");
        },

        open(url, _, params) {
          return new ProxyWindow(url, params)
        },

        ui: {
          async whenApprove(options) {
            window.selector.ui.showIframe();
            await showPrompt(options);
            window.selector.ui.hideIframe();
          },

          async showIframe() {
            return await window.selector.call("ui.showIframe");
          },

          async hideIframe() {
            return await window.selector.call("ui.hideIframe");
          },
        },

        storage: {
          async set(key, value) {
            await window.selector.call("storage.set", { key, value });
          },
      
          async get(key) {
            return await window.selector.call("storage.get", { key });
          },
      
          async remove(key) {
            await window.selector.call("storage.remove", { key });
          },

          async keys() {
            return await window.selector.call("storage.keys", {});
          },
        },
      };

      window.addEventListener("message", async (event) => {
        if (event.data.origin !== "${n}") return;
        if (!event.data.method?.startsWith("wallet:")) return;
      
        const wallet = window.selector.wallet;
        const method = event.data.method.replace("wallet:", "");
        const payload = { id: event.data.id, origin: "${n}", method };
      
        if (wallet == null || typeof wallet[method] !== "function") {
          const data = { ...payload, status: "failed", result: "Method not found" };
          window.parent.postMessage(data, "*");
          return;
        }
        
        try {
          const result = await wallet[method](event.data.params);
          window.parent.postMessage({ ...payload, status: "success", result }, "*");
        } catch (error) {
          const data = { ...payload, status: "failed", result: error };
          window.parent.postMessage(data, "*");
        }
      });
      <\/script>

      <script type="module">${s}<\/script>
    </body>
  </html>
    `}class H{constructor(e,t,n){c(this,"origin");c(this,"iframe",document.createElement("iframe"));c(this,"events",new p);c(this,"popup");c(this,"handler");c(this,"readyPromiseResolve");c(this,"readyPromise",new Promise(e=>{this.readyPromiseResolve=e}));this.executor=e,this.origin=S(),this.handler=r=>{r.data.origin===this.origin&&(r.data.method==="wallet-ready"&&this.readyPromiseResolve(),n(this,r))},window.addEventListener("message",this.handler),this.iframe.setAttribute("sandbox","allow-scripts");const s=[];this.executor.checkPermissions("usb")&&s.push("usb *;"),this.executor.checkPermissions("hid")&&s.push("hid *;"),this.iframe.allow=s.join(" "),K({id:this.origin,executor:this.executor,code:t}).then(r=>{var a;(a=this.executor.connector.logger)==null||a.log("Iframe code injected"),this.iframe.srcdoc=r}),this.popup=new U({iframe:this.iframe,onApprove:()=>{},onReject:()=>{window.removeEventListener("message",this.handler),this.events.emit("close",{}),this.popup.destroy()}}),this.popup.create()}on(e,t){this.events.on(e,t)}show(){this.popup.show()}hide(){this.popup.hide()}postMessage(e){if(!this.iframe.contentWindow)throw new Error("Iframe not loaded");this.iframe.contentWindow.postMessage({...e,origin:this.origin},"*")}dispose(){window.removeEventListener("message",this.handler),this.popup.destroy()}}class q{constructor(e,t){c(this,"activePanels",{});c(this,"storageSpace");c(this,"_onMessage",async(e,t)=>{var n;if(t.data.method==="ui.showIframe"){e.show(),e.postMessage({...t.data,status:"success",result:null});return}if(t.data.method==="ui.hideIframe"){e.hide(),e.postMessage({...t.data,status:"success",result:null});return}if(t.data.method==="storage.set"&&this.checkPermissions("storage")){localStorage.setItem(`${this.storageSpace}:${t.data.params.key}`,t.data.params.value),e.postMessage({...t.data,status:"success",result:null});return}if(t.data.method==="storage.get"&&this.checkPermissions("storage")){const s=localStorage.getItem(`${this.storageSpace}:${t.data.params.key}`);e.postMessage({...t.data,status:"success",result:s});return}if(t.data.method==="storage.keys"&&this.checkPermissions("storage")){const s=Object.keys(localStorage).filter(r=>r.startsWith(`${this.storageSpace}:`));e.postMessage({...t.data,status:"success",result:s});return}if(t.data.method==="storage.remove"&&this.checkPermissions("storage")){localStorage.removeItem(`${this.storageSpace}:${t.data.params.key}`),e.postMessage({...t.data,status:"success",result:null});return}if(t.data.method==="panel.focus"){const s=this.activePanels[t.data.params.windowId];s&&s.focus(),e.postMessage({...t.data,status:"success",result:null});return}if(t.data.method==="panel.postMessage"){const s=this.activePanels[t.data.params.windowId];s&&s.postMessage(t.data.params.data,"*"),e.postMessage({...t.data,status:"success",result:null});return}if(t.data.method==="panel.close"){const s=this.activePanels[t.data.params.windowId];s&&s.close(),delete this.activePanels[t.data.params.windowId],e.postMessage({...t.data,status:"success",result:null});return}if(t.data.method==="parentFrame.postMessage"&&this.checkPermissions("parentFrame")){window.parent.postMessage(t.data.params.data,"*"),e.postMessage({...t.data,status:"success",result:null});return}if(t.data.method==="open"&&this.checkPermissions("open",t.data.params)){const s=typeof window<"u"?(n=window==null?void 0:window.Telegram)==null?void 0:n.WebApp:null;if(s&&t.data.params.url.startsWith("https://t.me")){s.openTelegramLink(t.data.params.url);return}const r=window.open(t.data.params.url,"_blank",t.data.params.features),a=r?S():null,i=l=>{const h=k(t.data.params.url);h&&h.origin===l.origin&&e.postMessage(l.data)};if(e.postMessage({...t.data,status:"success",result:a}),window.addEventListener("message",i),r&&a){this.activePanels[a]=r;const l=setInterval(()=>{if(!(r!=null&&r.closed))return;window.removeEventListener("message",i);const h={method:"proxy-window:closed",windowId:a};delete this.activePanels[a],clearInterval(l);try{e.postMessage(h)}catch{}},500)}return}});c(this,"actualCode",null);this.connector=e,this.manifest=t,this.storageSpace=t.id}checkPermissions(e,t){var n;if(e==="open"){const s=k((t==null?void 0:t.url)||""),r=this.manifest.permissions[e];return!s||typeof r!="object"||!r.allows?!1:r.allows.some(i=>{const l=k(i);return!(!l||s.protocol!==l.protocol||l.hostname&&s.hostname!==l.hostname||l.pathname&&l.pathname!=="/"&&s.pathname!==l.pathname)})}if(e==="parentFrame"){const s=((n=window.location.ancestorOrigins)==null?void 0:n[0])??"",r=this.manifest.permissions[e];return r?r.includes(s):!1}return this.manifest.permissions[e]}get parentOrigin(){var e;return(e=window.location.ancestorOrigins)==null?void 0:e[0]}get isParentFrame(){var e;return(e=this.manifest.permissions.parentFrame)==null?void 0:e.includes(this.parentOrigin)}async checkNewVersion(e,t){var s,r,a,i;if(this.actualCode)return(s=this.connector.logger)==null||s.log("New version of code already checked"),this.actualCode;const n=await fetch(e.manifest.executor).then(l=>l.text());return(r=this.connector.logger)==null||r.log("New version of code fetched"),this.actualCode=n,n===t?((a=this.connector.logger)==null||a.log("New version of code is the same as the current version"),this.actualCode):(await this.connector.db.setItem(`${this.manifest.id}:${this.manifest.version}`,n),(i=this.connector.logger)==null||i.log("New version of code saved to cache"),n)}async loadCode(){var n;const e=await this.connector.db.getItem(`${this.manifest.id}:${this.manifest.version}`).catch(()=>null);(n=this.connector.logger)==null||n.log("Code loaded from cache",e!==null);const t=this.checkNewVersion(this,e);return e||await t}async call(e,t){var a,i,l,h,m;(a=this.connector.logger)==null||a.log("Add to queue",e,t),(i=this.connector.logger)==null||i.log("Calling method",e,t);const n=await this.loadCode();(l=this.connector.logger)==null||l.log("Code loaded, preparing");const s=new H(this,n,this._onMessage);(h=this.connector.logger)==null||h.log("Code loaded, iframe initialized"),await s.readyPromise,(m=this.connector.logger)==null||m.log("Iframe ready");const r=S();return new Promise((I,$)=>{var j;try{const A=y=>{var _;y.data.id!==r||y.data.origin!==s.origin||(s.dispose(),window.removeEventListener("message",A),(_=this.connector.logger)==null||_.log("postMessage",{result:y.data,request:{method:e,params:t}}),y.data.status==="failed"?$(y.data.result):I(y.data.result))};window.addEventListener("message",A),s.postMessage({method:e,params:t,id:r}),s.on("close",()=>$(new Error("Wallet closed")))}catch(A){(j=this.connector.logger)==null||j.log("Iframe error",A),$(A)}})}async getAllStorage(){const e=Object.keys(localStorage).filter(n=>n.startsWith(`${this.storageSpace}:`)),t={};for(const n of e)t[n.replace(`${this.storageSpace}:`,"")]=localStorage.getItem(n);return t}async clearStorage(){const e=Object.keys(localStorage).filter(t=>t.startsWith(`${this.storageSpace}:`));for(const t of e)localStorage.removeItem(t)}}class N extends E{constructor(t,n){super();c(this,"executor");this.connector=t,this.manifest=n,this.executor=new q(t,n)}async signIn(t){return this.executor.call("wallet:signIn",{...t,network:t.network||this.connector.network})}async signOut(){await this.executor.call("wallet:signOut",{network:this.connector.network}),await this.executor.clearStorage()}async getAccounts(){return this.executor.call("wallet:getAccounts",{network:this.connector.network})}async signAndSendTransaction(t){const n=t.network||this.connector.network;return this.executor.call("wallet:signAndSendTransaction",{...t,network:n})}async signAndSendTransactions(t){const n=t.network||this.connector.network;return this.executor.call("wallet:signAndSendTransactions",{...t,network:n})}async signMessage(t){const n=t.network||this.connector.network;return this.executor.call("wallet:signMessage",{...t,network:n})}}class O extends E{constructor(e,t){super(),this.connector=e,this.wallet=t}get manifest(){return this.wallet.manifest}async signIn(e){return this.wallet.signIn({...e,network:e.network||this.connector.network})}async signOut(e){await this.wallet.signOut({network:(e==null?void 0:e.network)||this.connector.network})}async getAccounts(e){return this.wallet.getAccounts({network:(e==null?void 0:e.network)||this.connector.network})}async signAndSendTransaction(e){return this.wallet.signAndSendTransaction({...e,network:e.network||this.connector.network})}async signAndSendTransactions(e){return this.wallet.signAndSendTransactions({...e,network:e.network||this.connector.network})}async signMessage(e){return this.wallet.signMessage({...e,network:e.network||this.connector.network})}}class V extends x{constructor(e){super(e),this.delegate=e}create(){var e;super.create({show:!0}),(e=this.root.querySelector("button"))==null||e.addEventListener("click",()=>this.delegate.onApprove())}get dom(){return`
      <div class="modal-container">
        <div class="modal-content">
          <div class="modal-header">
            <p>Authorization</p>
          </div>

          <div class="modal-body">
            <p style="text-align: center; color: #fff">
              To verify your account, you need to sign a message, this action is safe, the platform does not have access to your assets.
            </p>

            <button style="margin-top: 16px">
              Sign message
            </button>
          </div>

          <div class="footer">
            <img src="https://tgapp.herewallet.app/images/hot/hot-icon.png" alt="HOT Connector" />
            <p>HOT Connector</p>
            <p class="get-wallet-link">Don't have a wallet?</p>
          </div>
        </div>
      </div>`}}class F extends x{constructor(e){super(e),this.delegate=e,this.state=e.wallets}create(){super.create({show:!0}),this.root.querySelectorAll(".connect-item").forEach(e=>{e instanceof HTMLDivElement&&e.addEventListener("click",()=>{this.state[Number(e.dataset.type)]?this.delegate.onDisconnect(Number(e.dataset.type)):this.delegate.onConnect(Number(e.dataset.type))})})}get logout(){return`
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M17 7L15.59 8.41L18.17 11H8V13H18.17L15.59 15.58L17 17L22 12L17 7ZM4 5H12V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H12V19H4V5Z" fill="rgba(255,255,255,0.5)"/>
			</svg>
		`}label(e){switch(e){case d.EVM:return"EVM Wallet";case d.SOLANA:return"Solana Wallet";case d.TON:return"TON Wallet";case d.NEAR:return"NEAR Wallet";default:return e}}address(e){return this.state[e]?this.state[e].length<20?this.state[e]:`${this.state[e].slice(0,8)}...${this.state[e].slice(-8)}`:null}walletOption(e){return`
			<div class="connect-item" data-type="${e}">
				<img src="https://storage.herewallet.app/ft/${e}:native.png" alt="${e}" />
				<div class="connect-item-info">
					<span>${this.label(e)}</span>
					${this.address(e)?`<span class="wallet-address">${this.address(e)}</span>`:""}
				</div>
				${this.address(e)?this.logout:""}
			</div>`}get dom(){return`
			<div class="modal-container">
				<div class="modal-content">
					<div class="modal-header">
						<p>Select network</p>
					</div>

					<div class="modal-body">
						${this.delegate.chains.map(e=>this.walletOption(e)).join("")}
					</div>

					<div class="footer">
						<img src="https://tgapp.herewallet.app/images/hot/hot-icon.png" alt="HOT Connector" />
						<p>HOT Connector</p>
						<p class="get-wallet-link">Don't have a wallet?</p>
					</div>
				</div>
			</div>`}}class z extends x{constructor(e){super(e),this.delegate=e}create(){var e;super.create({show:!0}),(e=this.root.querySelector("button"))==null||e.addEventListener("click",()=>this.delegate.onApprove())}get dom(){return`
        <div class="modal-container">
          <div class="modal-content">
            <div class="modal-header">
              <p>Disconnect</p>
            </div>
  
            <div class="modal-body">
              <p style="text-align: center; color: #fff">Your local session will be cleared, see you there!</p>
              <button>Bye-bye</button>
            </div>
  
            <div class="footer">
              <img src="https://tgapp.herewallet.app/images/hot/hot-icon.png" alt="HOT Connector" />
              <p>HOT Connector</p>
  
              <p class="get-wallet-link">Don't have a wallet?</p>
            </div>
          </div>
        </div>`}}class W{constructor(e){c(this,"getAddress",async()=>{const e=await this.wallet.request({method:"eth_requestAccounts"});if(!e||e.length===0)throw new Error("No account found");return e[0].toLowerCase()});c(this,"getPublicKey",async()=>{throw new Error("Not implemented")});c(this,"getIntentsAddress",async()=>(await this.getAddress()).toLowerCase());c(this,"signIntentsWithAuth",async(e,t)=>{const n=g.encode(window.crypto.getRandomValues(new Uint8Array(32))),s=new TextEncoder().encode(`${e}_${n}`),r=await window.crypto.subtle.digest("SHA-256",s),a=await this.getAddress();return{intent:await this.signIntents(t||[],{nonce:new Uint8Array(r)}),address:a,publicKey:a,chainId:d.EVM,seed:n}});this.wallet=e}get type(){return d.EVM}async signMessage(e){const t=await this.getAddress(),n=await this.wallet.request({method:"personal_sign",params:[e,t]}),s=g.decode(n.slice(2)),r=s.slice(-1,0),a=parseInt(`0x${g.encode(r)}`,16),i=g.decode("00"),l=g.decode("01");return new Uint8Array([...s.slice(0,-1),...a===27||a===0?i:l])}async sendTransaction(e){return await this.wallet.request({method:"eth_sendTransaction",params:[e]})}async signIntents(e,t){const n=await this.getAddress(),s=new Uint8Array((t==null?void 0:t.nonce)||window.crypto.getRandomValues(new Uint8Array(32))),r=JSON.stringify({deadline:t!=null&&t.deadline?new Date(t.deadline).toISOString():"2100-01-01T00:00:00.000Z",verifying_contract:"intents.near",signer_id:n.toLowerCase(),nonce:f.encode(s),intents:e}),a=await this.signMessage(r);return{signature:`secp256k1:${b.encode(a)}`,payload:r,standard:"erc191"}}}class L{constructor(e){c(this,"getAddress",async()=>{const e=await this.wallet.getAccounts();if(e.length===0)throw new Error("No account found");return e[0].address});c(this,"getPublicKey",async()=>this.getAddress());c(this,"getIntentsAddress",async()=>{const e=await this.getAddress();return g.encode(b.decode(e)).toLowerCase()});this.wallet=e}get type(){return d.SOLANA}async signIntentsWithAuth(e,t){const n=await this.getAddress(),s=g.encode(window.crypto.getRandomValues(new Uint8Array(32))),r=new TextEncoder().encode(`${e}_${s}`),a=await window.crypto.subtle.digest("SHA-256",r);return{intent:await this.signIntents(t||[],{nonce:new Uint8Array(a)}),publicKey:`ed25519:${n}`,chainId:d.SOLANA,address:n,seed:s}}async sendTransaction(e,t,n){return await this.wallet.sendTransaction(e,t,n)}async signMessage(e){return await this.wallet.signMessage(new TextEncoder().encode(e))}async signIntents(e,t){const n=new Uint8Array((t==null?void 0:t.nonce)||window.crypto.getRandomValues(new Uint8Array(32))),s=await this.getIntentsAddress(),r=await this.getPublicKey(),a=JSON.stringify({deadline:t!=null&&t.deadline?new Date(t.deadline).toISOString():"2100-01-01T00:00:00.000Z",nonce:f.encode(n),verifying_contract:"intents.near",signer_id:s,intents:e}),i=await this.signMessage(a);return{signature:`ed25519:${b.encode(i)}`,public_key:`ed25519:${r}`,standard:"raw_ed25519",payload:a}}}class T{constructor(e){c(this,"getAddress",async()=>{if(!this.wallet.account)throw new Error("No account found");return this.wallet.account.address});c(this,"getPublicKey",async()=>{var e;if(!((e=this.wallet.account)!=null&&e.publicKey))throw new Error("No public key found");return this.wallet.account.publicKey});this.wallet=e}get type(){return d.TON}async getIntentsAddress(){return(await this.getPublicKey()).toLowerCase()}async sendTransaction(e){return this.wallet.sendTransaction(e)}async signIntentsWithAuth(e,t){const n=g.encode(window.crypto.getRandomValues(new Uint8Array(32))),s=new TextEncoder().encode(`${e}_${n}`),r=await window.crypto.subtle.digest("SHA-256",s),a=await this.getPublicKey(),i=await this.getAddress();return{intent:await this.signIntents(t||[],{nonce:new Uint8Array(r)}),publicKey:`ed25519:${a}`,chainId:d.TON,address:i,seed:n}}async signIntents(e,t){const n=await this.getPublicKey(),s=new Uint8Array((t==null?void 0:t.nonce)||window.crypto.getRandomValues(new Uint8Array(32))),r={deadline:new Date(Date.now()+24*36e5*365).toISOString(),signer_id:await this.getIntentsAddress(),verifying_contract:"intents.near",nonce:f.encode(s),intents:e},a=await this.wallet.signData({text:JSON.stringify(r),type:"text"});return{...a,standard:"ton_connect",signature:"ed25519:"+b.encode(f.decode(a.signature)),public_key:`ed25519:${n}`}}}class B{constructor(e){c(this,"wallets",{[d.NEAR]:null,[d.EVM]:null,[d.SOLANA]:null,[d.TON]:null});var t,n,s,r,a,i,l;this.options=e,(t=this.options.tonConnect)==null||t.onStatusChange(async h=>{if(!h)return this.removeWallet(d.TON);this.setWallet(d.TON,new T(this.options.tonConnect))}),(n=this.options.tonConnect)==null||n.setConnectRequestParameters({state:"ready",value:{tonProof:"hot-connector"}}),(s=this.options.tonConnect)==null||s.connector.restoreConnection(),(r=this.options.nearConnector)==null||r.on("wallet:signOut",()=>this.removeWallet(d.NEAR)),(a=this.options.nearConnector)==null||a.on("wallet:signIn",({wallet:h})=>this.setWallet(d.NEAR,h)),(i=this.options.nearConnector)==null||i.getConnectedWallet().then(({wallet:h})=>this.setWallet(d.NEAR,h)),(l=this.options.appKit)==null||l.subscribeProviders(async h=>{const m=h.solana;m?this.setWallet(d.SOLANA,new L(m)):this.removeWallet(d.SOLANA);const I=h.eip155;I?this.setWallet(d.EVM,new W(I)):this.removeWallet(d.EVM)})}setWallet(e,t){this.wallets[e]=t,this.options.onConnect(t,e)}removeWallet(e){this.wallets[e]!=null&&(this.wallets[e]=null,this.options.onDisconnect(e))}getWallet(e){if(!this.wallets[e])throw new Error(`${e} not connected`);return this.wallets[e]}resolveWallet(e){const t=typeof e=="number"||typeof e=="string"?this.getWallet(e):e;if(!t)throw new Error("Wallet not found");return t}async connectWallet(e){var t,n,s,r;if(e===d.NEAR)return(t=this.options.nearConnector)==null?void 0:t.connect();if(e===d.EVM)return(n=this.options.appKit)==null?void 0:n.open({namespace:"eip155"});if(e===d.SOLANA)return(s=this.options.appKit)==null?void 0:s.open({namespace:"solana"});if(e===d.TON)return(r=this.options.tonConnect)==null?void 0:r.openModal()}async connect(){return new Promise(async(e,t)=>{var s,r,a,i;const n=new F({chains:this.options.chains,wallets:{[d.NEAR]:await((s=this.wallets[d.NEAR])==null?void 0:s.getAddress().catch(()=>{})),[d.EVM]:await((r=this.wallets[d.EVM])==null?void 0:r.getAddress().catch(()=>{})),[d.SOLANA]:await((a=this.wallets[d.SOLANA])==null?void 0:a.getAddress().catch(()=>{})),[d.TON]:await((i=this.wallets[d.TON])==null?void 0:i.getAddress().catch(()=>{}))},onConnect:l=>{this.connectWallet(l),n.destroy(),e()},onDisconnect:l=>{this.disconnect(l),n.destroy(),e()},onReject:()=>{t(new Error("User rejected")),n.destroy()}});n.create()})}async auth(e,t,n){const s=this.resolveWallet(e);return new Promise((r,a)=>{const i=new V({onApprove:async()=>{try{const l=await s.signIntentsWithAuth(t,n);r(l),i.destroy()}catch(l){a(l),i.destroy()}},onReject:()=>{a(new Error("User rejected")),i.destroy()}});i.create()})}async disconnect(e){const t=this.resolveWallet(e);return new Promise((n,s)=>{const r=new z({onApprove:async()=>{var a,i,l,h;t.type===d.NEAR&&await((a=this.options.nearConnector)==null?void 0:a.disconnect().catch(()=>null)),t.type===d.SOLANA&&await((i=this.options.appKit)==null?void 0:i.disconnect("solana").catch(()=>null)),t.type===d.EVM&&await((l=this.options.appKit)==null?void 0:l.disconnect("eip155").catch(()=>null)),t.type===d.TON&&await((h=this.options.tonConnect)==null?void 0:h.connector.disconnect().catch(()=>null)),this.removeWallet(t.type),r.destroy(),n()},onReject:()=>{s(new Error("User rejected")),r.destroy()}});r.create()})}async signIntents(e,t){return await this.resolveWallet(e).signIntents(t)}async executeIntents(e,t,n=[]){const s=await this.signIntents(e,t);return await this.publishSignedIntents([s],n)}async publishSignedIntents(e,t=[]){const n=await fetch("https://api0.herewallet.app/api/v1/evm/intent-solver",{headers:{"Content-Type":"application/json"},method:"POST",body:JSON.stringify({params:[{signed_datas:e,quote_hashes:t}],method:"publish_intents",id:"dontcare",jsonrpc:"2.0"})}),{result:s}=await n.json();if(s.status==="FAILED")throw s.reason;const r=s.intent_hashes[0],a=async()=>{const h=await fetch("https://api0.herewallet.app/api/v1/evm/intent-solver",{headers:{"Content-Type":"application/json"},method:"POST",body:JSON.stringify({id:"dontcare",jsonrpc:"2.0",method:"get_status",params:[{intent_hash:r}]})}),{result:m}=await h.json();return m},i=async()=>{await new Promise(m=>setTimeout(m,1e3));const h=await a().catch(()=>null);if(h==null)return await i();if(h.status==="SETTLED")return h.data.hash;if(h.status==="FAILED")throw h.reason||"Failed to publish intents";return await i()};return await i()}}class J extends x{constructor(e){super(e),this.delegate=e}create(){super.create({show:!0}),this.root.querySelectorAll(".connect-item").forEach(e=>{e instanceof HTMLDivElement&&e.addEventListener("click",()=>{this.delegate.onSelect(e.dataset.type)})})}address(e){return this.state[e]?`${this.state[e].slice(0,6)}...${this.state[e].slice(-4)}`:null}walletDom(e){var t;return`
			<div class="connect-item" data-type="${e.id}">
				<img style="background: #333" src="${e.icon}" alt="${e.name}" />
				<div class="connect-item-info">
					<span>${e.name}</span>
					<span class="wallet-address">${(t=k(e.website))==null?void 0:t.hostname}</span>
				</div>
			</div>
    `}get dom(){return`
			<div class="modal-container">
				<div class="modal-content">
					<div class="modal-header">
						<p>Select wallet</p>
					</div>

					<div class="modal-body">
						${this.delegate.wallets.map(e=>this.walletDom(e)).join("")}
					</div>

					<div class="footer">
						<img src="https://tgapp.herewallet.app/images/hot/hot-icon.png" alt="HOT Connector" />
						<p>HOT Connector</p>
						<p class="get-wallet-link">Don't have a wallet?</p>
					</div>
				</div>
			</div>`}}class Y{constructor(e,t){c(this,"dbName");c(this,"storeName");c(this,"version");this.dbName=e,this.storeName=t,this.version=1}getDb(){return new Promise((e,t)=>{const n=indexedDB.open(this.dbName,this.version);n.onerror=s=>{console.error("Error opening database:",s.target.error),t(new Error("Error opening database"))},n.onsuccess=s=>{e(n.result)},n.onupgradeneeded=s=>{const r=n.result;r.objectStoreNames.contains(this.storeName)||r.createObjectStore(this.storeName)}})}async getItem(e){const t=await this.getDb();if(typeof e=="number"&&(e=e.toString()),typeof e!="string")throw new Error("Key must be a string");return new Promise((n,s)=>{if(!this.storeName){s(new Error("Store name not set"));return}const r=t.transaction(this.storeName,"readonly");r.onerror=l=>s(r.error);const i=r.objectStore(this.storeName).get(e);i.onerror=l=>s(i.error),i.onsuccess=()=>{n(i.result),t.close()}})}async setItem(e,t){const n=await this.getDb();if(typeof e=="number"&&(e=e.toString()),typeof e!="string")throw new Error("Key must be a string");return new Promise((s,r)=>{if(!this.storeName){r(new Error("Store name not set"));return}const a=n.transaction(this.storeName,"readwrite");a.onerror=h=>r(a.error);const l=a.objectStore(this.storeName).put(t,e);l.onerror=h=>r(l.error),l.onsuccess=()=>{n.close(),s()}})}async removeItem(e){const t=await this.getDb();if(typeof e=="number"&&(e=e.toString()),typeof e!="string")throw new Error("Key must be a string");return new Promise((n,s)=>{if(!this.storeName){s(new Error("Store name not set"));return}const r=t.transaction(this.storeName,"readwrite");r.onerror=l=>s(r.error);const i=r.objectStore(this.storeName).delete(e);i.onerror=l=>s(i.error),i.onsuccess=()=>{t.close(),n()}})}async keys(){const e=await this.getDb();return new Promise((t,n)=>{if(!this.storeName){n(new Error("Store name not set"));return}const s=e.transaction(this.storeName,"readonly");s.onerror=i=>n(s.error);const a=s.objectStore(this.storeName).getAllKeys();a.onerror=i=>n(a.error),a.onsuccess=()=>{t(a.result),e.close()}})}async count(){const e=await this.getDb();return new Promise((t,n)=>{if(!this.storeName){n(new Error("Store name not set"));return}const s=e.transaction(this.storeName,"readonly");s.onerror=i=>n(s.error);const a=s.objectStore(this.storeName).count();a.onerror=i=>n(a.error),a.onsuccess=()=>{t(a.result),e.close()}})}async length(){return this.count()}async clear(){const e=await this.getDb();return new Promise((t,n)=>{if(!this.storeName){n(new Error("Store name not set"));return}const s=e.transaction(this.storeName,"readwrite");s.onerror=i=>n(s.error);const a=s.objectStore(this.storeName).clear();a.onerror=i=>n(a.error),a.onsuccess=()=>{e.close(),t()}})}}class Z{constructor(e){c(this,"storage");c(this,"events");c(this,"db");c(this,"wallets",[]);c(this,"manifest",{wallets:[],version:"1.0.0"});c(this,"features",{});c(this,"logger");c(this,"network","mainnet");c(this,"connectWithKey");c(this,"whenManifestLoaded");c(this,"_handleNearWalletInjected",e=>{this.wallets=this.wallets.filter(t=>t.manifest.id!==e.detail.manifest.id),this.wallets.unshift(new O(this,e.detail)),this.events.emit("selector:walletsChanged",{})});this.db=new Y("hot-connector","wallets"),this.storage=(e==null?void 0:e.storage)??new w,this.events=(e==null?void 0:e.events)??new p,this.logger=e==null?void 0:e.logger,this.network=(e==null?void 0:e.network)??"mainnet",this.connectWithKey=e==null?void 0:e.connectWithKey,this.features=(e==null?void 0:e.features)??{},this.whenManifestLoaded=new Promise(async t=>{(e==null?void 0:e.manifest)==null||typeof e.manifest=="string"?this.manifest=await this._loadManifest(e==null?void 0:e.manifest).catch(()=>({wallets:[],version:"1.0.0"})):this.manifest=(e==null?void 0:e.manifest)??{wallets:[],version:"1.0.0"},await new Promise(n=>setTimeout(n,100)),t()}),window.addEventListener("near-wallet-injected",this._handleNearWalletInjected),window.dispatchEvent(new Event("near-selector-ready")),this.whenManifestLoaded.then(()=>{window.parent.postMessage({type:"near-selector-ready"},"*"),this.manifest.wallets.forEach(t=>this.registerWallet(t)),this.storage.get("debug-wallets").then(t=>{JSON.parse(t??"[]").forEach(s=>this.registerDebugWallet(s))})}),window.addEventListener("message",async t=>{t.data.type==="near-wallet-injected"&&(await this.whenManifestLoaded.catch(()=>{}),this.wallets=this.wallets.filter(n=>n.manifest.id!==t.data.manifest.id),this.wallets.unshift(new M(this,t.data.manifest)),this.events.emit("selector:walletsChanged",{}),this.connect(t.data.manifest.id))})}get availableWallets(){return this.wallets.filter(t=>Object.entries(this.features).every(([n,s])=>{var r;return!(s&&!((r=t.manifest.features)!=null&&r[n]))})).filter(t=>{var n;return!(this.network==="testnet"&&!((n=t.manifest.features)!=null&&n.testnet))})}async _loadManifest(e){return await(await fetch(e||"https://raw.githubusercontent.com/hot-dao/near-selector/refs/heads/main/repository/manifest.json")).json()}async switchNetwork(e){await this.disconnect().catch(()=>{}),this.network=e,await this.connect()}async registerWallet(e){if(e.type!=="sandbox")throw new Error("Only sandbox wallets are supported");this.wallets.find(t=>t.manifest.id===e.id)||(this.wallets.push(new N(this,e)),this.events.emit("selector:walletsChanged",{}))}async registerDebugWallet(e){if(e.type!=="sandbox")throw new Error("Only sandbox wallets are supported");if(this.wallets.find(n=>n.manifest.id===e.id))throw new Error("Wallet already registered");e.debug=!0,this.wallets.push(new N(this,e)),this.events.emit("selector:walletsChanged",{});const t=this.wallets.filter(n=>n.manifest.debug).map(n=>n.manifest);this.storage.set("debug-wallets",JSON.stringify(t))}async selectWallet(){return await this.whenManifestLoaded.catch(()=>{}),new Promise((e,t)=>{const n=new J({wallets:this.availableWallets.map(s=>s.manifest),onSelect:s=>{e(s),n.destroy()},onReject:()=>{t(new Error("User rejected")),n.destroy()}});n.create()})}async connect(e){var t,n,s,r;await this.whenManifestLoaded.catch(()=>{}),e||(e=await this.selectWallet());try{const a=await this.wallet(e);(t=this.logger)==null||t.log("Wallet available to connect",a),await this.storage.set("selected-wallet",e),(n=this.logger)==null||n.log("Set preferred wallet, try to signIn",e);const i=await a.signIn(this.connectWithKey??{contractId:""});if((s=this.logger)==null||s.log("Signed in to wallet",e,i),!(i!=null&&i.length))throw new Error("Failed to sign in");return this.events.emit("wallet:signIn",{wallet:a,accounts:i,success:!0}),a}catch(a){throw(r=this.logger)==null||r.log("Failed to connect to wallet",a),a}}async disconnect(e){e||(e=await this.wallet()),await e.signOut({network:this.network}),await this.storage.remove("selected-wallet"),this.events.emit("wallet:signOut",{success:!0})}async getConnectedWallet(){await this.whenManifestLoaded.catch(()=>{});const e=await this.storage.get("selected-wallet"),t=this.wallets.find(s=>s.manifest.id===e);if(!t)throw new Error("No wallet selected");const n=await t.getAccounts();if(!(n!=null&&n.length))throw new Error("No accounts found");return{wallet:t,accounts:n}}async wallet(e){if(await this.whenManifestLoaded.catch(()=>{}),!e)return this.getConnectedWallet().then(({wallet:n})=>n).catch(async()=>{throw await this.storage.remove("selected-wallet"),new Error("No accounts found")});const t=this.wallets.find(n=>n.manifest.id===e);if(!t)throw new Error("Wallet not found");return t}on(e,t){this.events.on(e,t)}once(e,t){this.events.once(e,t)}off(e,t){this.events.off(e,t)}removeAllListeners(e){this.events.removeAllListeners(e)}}const X=Object.freeze(Object.defineProperty({__proto__:null},Symbol.toStringTag,{value:"Module"}));return u.EventEmitter=p,u.EvmWallet=W,u.HotConnector=B,u.InjectedWallet=O,u.LocalStorage=w,u.NearConnector=Z,u.NearWallet=E,u.ParentFrameWallet=M,u.SandboxWallet=N,u.SolanaWallet=L,u.TonWallet=T,u.WalletType=d,u.tx=X,Object.defineProperty(u,Symbol.toStringTag,{value:"Module"}),u}({});
