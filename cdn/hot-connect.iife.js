var HOTConnect=function(u){"use strict";var ie=Object.defineProperty;var ce=(u,m,f)=>m in u?ie(u,m,{enumerable:!0,configurable:!0,writable:!0,value:f}):u[m]=f;var l=(u,m,f)=>ce(u,typeof m!="symbol"?m+"":m,f);class m{async get(e){return localStorage.getItem(e)}async set(e,t){localStorage.setItem(e,t)}async remove(e){localStorage.removeItem(e)}}class f{constructor(){l(this,"events",{})}on(e,t){this.events[e]||(this.events[e]=[]),this.events[e].push(t)}emit(e,t){var s;(s=this.events[e])==null||s.forEach(n=>n(t))}off(e,t){var s;this.events[e]=(s=this.events[e])==null?void 0:s.filter(n=>n!==t)}once(e,t){const s=n=>{t(n),this.off(e,s)};this.on(e,s)}removeAllListeners(e){e?delete this.events[e]:this.events={}}}const E=()=>typeof window.crypto<"u"&&typeof window.crypto.randomUUID=="function"?window.crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(a){const e=Math.random()*16|0;return(a==="x"?e:e&3|8).toString(16)}),x="123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",D=(()=>{const a=Array(256).fill(-1);for(let e=0;e<x.length;++e)a[x.charCodeAt(e)]=e;return a})(),y={decode(a){if(!a||typeof a!="string")throw new Error(`Expected base58 string but got “${a}”`);if(a.match(/[IOl0]/gmu))throw new Error(`Invalid base58 character “${a.match(/[IOl0]/gmu)}”`);const e=a.match(/^1+/gmu),t=e?e[0].length:0,s=(a.length-t)*(Math.log(58)/Math.log(256))+1>>>0;return new Uint8Array([...new Uint8Array(t),...a.match(/.{1}/gmu).map(n=>x.indexOf(n)).reduce((n,r)=>(n=n.map(o=>{const i=o*58+r;return r=i>>8,i}),n),new Uint8Array(s)).reverse().filter((n=>r=>n=n||r)(!1))])},encode(a){const e=[];for(const t of a){let s=t;for(let n=0;n<e.length;++n){const r=(D[e[n]]<<8)+s;e[n]=x.charCodeAt(r%58),s=r/58|0}for(;s;)e.push(x.charCodeAt(s%58)),s=s/58|0}for(const t of a){if(t)break;e.push(49)}return e.reverse(),String.fromCharCode(...e)}};var c=(a=>(a[a.NEAR=1010]="NEAR",a[a.EVM=1]="EVM",a[a.SOLANA=1001]="SOLANA",a[a.STELLAR=1100]="STELLAR",a[a.TON=1111]="TON",a))(c||{});const g={encode(a){return[...a].map(e=>e.toString(16).padStart(2,"0")).join("")},decode(a){const t=a.replace(/^0x/,"").match(/[\dA-F]{2}/gi),s=(t==null?void 0:t.map(n=>parseInt(n,16)))||[];return new Uint8Array(s)}},p={decode(a){for(var e=atob(a),t=new Uint8Array(e.length),s=0;s<e.length;s++)t[s]=e.charCodeAt(s);return new Uint8Array(t.buffer)},encode(a){for(var e="",t=a.byteLength,s=0;s<t;s++)e+=String.fromCharCode(a[s]);return window.btoa(e)}};class k{constructor(){l(this,"getAddress",async()=>{const e=await this.getAccounts();if(e.length===0)throw new Error("No account found");return e[0].accountId});l(this,"getPublicKey",async()=>{const e=await this.getAccounts();if(e.length===0)throw new Error("No account found");return e[0].publicKey});l(this,"getIntentsAddress",async()=>await this.getAddress());l(this,"signIntentsWithAuth",async(e,t)=>{const s=await this.getAccounts();if(s.length===0)throw new Error("No account found");const n=g.encode(window.crypto.getRandomValues(new Uint8Array(32))),r=new TextEncoder().encode(`${e}_${n}`),o=await window.crypto.subtle.digest("SHA-256",r);return{signed:await this.signIntents(t||[],{nonce:new Uint8Array(o)}),address:s[0].accountId,publicKey:s[0].publicKey,chainId:c.NEAR,domain:e,seed:n}});l(this,"signIntents",async(e,t)=>{const s=new Uint8Array((t==null?void 0:t.nonce)||window.crypto.getRandomValues(new Uint8Array(32))),n=await this.getIntentsAddress(),r=JSON.stringify({deadline:t!=null&&t.deadline?new Date(t.deadline).toISOString():"2100-01-01T00:00:00.000Z",signer_id:n,intents:e}),o=await this.signMessage({message:r,recipient:"intents.near",nonce:s});if(!o)throw new Error("Failed to sign message");const{signature:i,publicKey:d}=o;return{standard:"nep413",payload:{nonce:p.encode(s),recipient:"intents.near",message:r},signature:`ed25519:${y.encode(p.decode(i))}`,public_key:d}})}get type(){return c.NEAR}}class W extends k{constructor(e,t){super(),this.connector=e,this.manifest=t}callParentFrame(e,t){const s=E();return window.parent.postMessage({type:"near-wallet-injected-request",id:s,method:e,params:t},"*"),new Promise((n,r)=>{const o=i=>{i.data.type==="near-wallet-injected-response"&&i.data.id===s&&(window.removeEventListener("message",o),i.data.success?n(i.data.result):r(i.data.error))};window.addEventListener("message",o)})}async signIn(e){const t=await this.callParentFrame("near:signIn",e);return Array.isArray(t)?t:[t]}async signOut(e){await this.callParentFrame("near:signOut",e)}async getAccounts(e){return this.callParentFrame("near:getAccounts",e)}async signAndSendTransaction(e){return this.callParentFrame("near:signAndSendTransaction",e)}async signAndSendTransactions(e){return this.callParentFrame("near:signAndSendTransactions",e)}async signMessage(e){return this.callParentFrame("near:signMessage",e)}}const I=a=>{try{return new URL(a)}catch{return null}},H=a=>`
${a} * {
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  color: #fff;
}

${a} p, h1, h2, h3, h4, h5, h6 {
  margin: 0;
}

${a} .modal-container {
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
  ${a} .modal-container {
    justify-content: flex-end;
  }
}

${a} .modal-content {
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
  ${a} .modal-content {
    max-width: 100%;
    width: 100%;
    max-height: 80%;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    border: none;
    border-top: 1.5px solid rgba(255, 255, 255, 0.1);
  }
}


${a} .modal-header {
    display: flex;
    padding: 24px;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    align-self: stretch;
}
  
${a} .modal-header p {
  color: #fff;
  text-align: center;
  font-size: 24px;
  font-style: normal;
  font-weight: 600;
  line-height: normal;
  margin: 0;
}


${a} .modal-body {
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

${a} .modal-body button {
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

${a} .footer {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 16px 24px;
  color: #fff;
  gap: 12px;
}

${a} .modal-body p {
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  font-size: 16px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
  letter-spacing: -0.8px;
}

${a} .footer img {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

${a} .get-wallet-link {
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
  
${a} .get-wallet-link:hover {
  color: rgba(255, 255, 255, 1);
}


${a} .connect-item {
  display: flex;
  padding: 12px;
  align-items: center;
  gap: 12px;
  align-self: stretch;
  cursor: pointer;

  transition: background 0.2s ease-in-out;
  border-radius: 24px;
}

${a} .connect-item img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

${a} .connect-item-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  text-align: left;
  flex: 1;
  margin-top: -2px;
}

${a} .connect-item-info .wallet-address {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
}

${a} .connect-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

${a} .connect-item img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

${a} .connect-item p {
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  font-size: 18px;
  font-style: normal;
  font-weight: 600;
  line-height: normal;
  letter-spacing: -0.36px;
  margin: 0;
}
`,C="hot-connector-popup",O=document.createElement("style");O.textContent=H(`.${C}`),document.head.append(O);class A{constructor(e){l(this,"isClosed",!1);l(this,"root",document.createElement("div"));l(this,"state",{});this.delegate=e}get dom(){return""}update(e){this.state=e,this.root.innerHTML=this.dom}create({show:e=!0}){this.root.className=C,this.root.innerHTML=this.dom,document.body.append(this.root);const t=this.root.querySelector(".modal-container"),s=this.root.querySelector(".modal-content"),n=this.root.querySelector(".get-wallet-link");s.style.transform="translateY(50px)",t.style.opacity="0",this.root.style.display="none",s.addEventListener("click",r=>r.stopPropagation()),n.addEventListener("click",()=>window.open("https://download.hot-labs.org?hotconnector","_blank")),t.addEventListener("click",()=>{this.delegate.onReject(),this.destroy()}),e&&setTimeout(()=>this.show(),10)}show(){const e=this.root.querySelector(".modal-container"),t=this.root.querySelector(".modal-content");t.style.transform="translateY(50px)",e.style.opacity="0",this.root.style.display="block",setTimeout(()=>{t.style.transform="translateY(0)",e.style.opacity="1"},100)}hide(){const e=this.root.querySelector(".modal-container"),t=this.root.querySelector(".modal-content");t.style.transform="translateY(50px)",e.style.opacity="0",setTimeout(()=>{this.root.style.display="none"},200)}destroy(){this.isClosed||(this.isClosed=!0,this.hide(),setTimeout(()=>{this.root.remove()},200))}}class q extends A{constructor(e){super(e),this.delegate=e}create(){var t;super.create({show:!1}),(t=this.root.querySelector("button"))==null||t.addEventListener("click",()=>this.delegate.onApprove()),this.root.querySelector(".modal-body").appendChild(this.delegate.iframe),this.delegate.iframe.style.width="100%",this.delegate.iframe.style.height="720px",this.delegate.iframe.style.border="none"}get dom(){return`
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
      </div>`}}async function V(a){const e=await a.executor.getAllStorage(),t=a.executor.manifest,s=a.id,n=a.code.replaceAll("window.localStorage","window.sandboxedLocalStorage").replaceAll("window.top","window.selector").replaceAll("window.open","window.selector.open");return`
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
            if (event.data.origin !== "${s}") return;
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
          window.parent.postMessage({ method: "wallet-ready", origin: "${s}" }, "*");
          window.selector.wallet = wallet;
        },

        async call(method, params) {
          const id = window.selector.uuid();
          window.parent.postMessage({ method, params, id, origin: "${s}" }, "*");

          return new Promise((resolve, reject) => {
            const handler = (event) => {
              if (event.data.id !== id || event.data.origin !== "${s}") return;
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
            origin: "${s}", 
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
        if (event.data.origin !== "${s}") return;
        if (!event.data.method?.startsWith("wallet:")) return;
      
        const wallet = window.selector.wallet;
        const method = event.data.method.replace("wallet:", "");
        const payload = { id: event.data.id, origin: "${s}", method };
      
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

      <script type="module">${n}<\/script>
    </body>
  </html>
    `}class F{constructor(e,t,s){l(this,"origin");l(this,"iframe",document.createElement("iframe"));l(this,"events",new f);l(this,"popup");l(this,"handler");l(this,"readyPromiseResolve");l(this,"readyPromise",new Promise(e=>{this.readyPromiseResolve=e}));this.executor=e,this.origin=E(),this.handler=r=>{r.data.origin===this.origin&&(r.data.method==="wallet-ready"&&this.readyPromiseResolve(),s(this,r))},window.addEventListener("message",this.handler),this.iframe.setAttribute("sandbox","allow-scripts");const n=[];this.executor.checkPermissions("usb")&&n.push("usb *;"),this.executor.checkPermissions("hid")&&n.push("hid *;"),this.iframe.allow=n.join(" "),V({id:this.origin,executor:this.executor,code:t}).then(r=>{var o;(o=this.executor.connector.logger)==null||o.log("Iframe code injected"),this.iframe.srcdoc=r}),this.popup=new q({iframe:this.iframe,onApprove:()=>{},onReject:()=>{window.removeEventListener("message",this.handler),this.events.emit("close",{}),this.popup.destroy()}}),this.popup.create()}on(e,t){this.events.on(e,t)}show(){this.popup.show()}hide(){this.popup.hide()}postMessage(e){if(!this.iframe.contentWindow)throw new Error("Iframe not loaded");this.iframe.contentWindow.postMessage({...e,origin:this.origin},"*")}dispose(){window.removeEventListener("message",this.handler),this.popup.destroy()}}class z{constructor(e,t){l(this,"activePanels",{});l(this,"storageSpace");l(this,"_onMessage",async(e,t)=>{var s;if(t.data.method==="ui.showIframe"){e.show(),e.postMessage({...t.data,status:"success",result:null});return}if(t.data.method==="ui.hideIframe"){e.hide(),e.postMessage({...t.data,status:"success",result:null});return}if(t.data.method==="storage.set"&&this.checkPermissions("storage")){localStorage.setItem(`${this.storageSpace}:${t.data.params.key}`,t.data.params.value),e.postMessage({...t.data,status:"success",result:null});return}if(t.data.method==="storage.get"&&this.checkPermissions("storage")){const n=localStorage.getItem(`${this.storageSpace}:${t.data.params.key}`);e.postMessage({...t.data,status:"success",result:n});return}if(t.data.method==="storage.keys"&&this.checkPermissions("storage")){const n=Object.keys(localStorage).filter(r=>r.startsWith(`${this.storageSpace}:`));e.postMessage({...t.data,status:"success",result:n});return}if(t.data.method==="storage.remove"&&this.checkPermissions("storage")){localStorage.removeItem(`${this.storageSpace}:${t.data.params.key}`),e.postMessage({...t.data,status:"success",result:null});return}if(t.data.method==="panel.focus"){const n=this.activePanels[t.data.params.windowId];n&&n.focus(),e.postMessage({...t.data,status:"success",result:null});return}if(t.data.method==="panel.postMessage"){const n=this.activePanels[t.data.params.windowId];n&&n.postMessage(t.data.params.data,"*"),e.postMessage({...t.data,status:"success",result:null});return}if(t.data.method==="panel.close"){const n=this.activePanels[t.data.params.windowId];n&&n.close(),delete this.activePanels[t.data.params.windowId],e.postMessage({...t.data,status:"success",result:null});return}if(t.data.method==="parentFrame.postMessage"&&this.checkPermissions("parentFrame")){window.parent.postMessage(t.data.params.data,"*"),e.postMessage({...t.data,status:"success",result:null});return}if(t.data.method==="open"&&this.checkPermissions("open",t.data.params)){const n=typeof window<"u"?(s=window==null?void 0:window.Telegram)==null?void 0:s.WebApp:null;if(n&&t.data.params.url.startsWith("https://t.me")){n.openTelegramLink(t.data.params.url);return}const r=window.open(t.data.params.url,"_blank",t.data.params.features),o=r?E():null,i=d=>{const h=I(t.data.params.url);h&&h.origin===d.origin&&e.postMessage(d.data)};if(e.postMessage({...t.data,status:"success",result:o}),window.addEventListener("message",i),r&&o){this.activePanels[o]=r;const d=setInterval(()=>{if(!(r!=null&&r.closed))return;window.removeEventListener("message",i);const h={method:"proxy-window:closed",windowId:o};delete this.activePanels[o],clearInterval(d);try{e.postMessage(h)}catch{}},500)}return}});l(this,"actualCode",null);this.connector=e,this.manifest=t,this.storageSpace=t.id}checkPermissions(e,t){var s;if(e==="open"){const n=I((t==null?void 0:t.url)||""),r=this.manifest.permissions[e];return!n||typeof r!="object"||!r.allows?!1:r.allows.some(i=>{const d=I(i);return!(!d||n.protocol!==d.protocol||d.hostname&&n.hostname!==d.hostname||d.pathname&&d.pathname!=="/"&&n.pathname!==d.pathname)})}if(e==="parentFrame"){const n=((s=window.location.ancestorOrigins)==null?void 0:s[0])??"",r=this.manifest.permissions[e];return r?r.includes(n):!1}return this.manifest.permissions[e]}get parentOrigin(){var e;return(e=window.location.ancestorOrigins)==null?void 0:e[0]}get isParentFrame(){var e;return(e=this.manifest.permissions.parentFrame)==null?void 0:e.includes(this.parentOrigin)}async checkNewVersion(e,t){var n,r,o,i;if(this.actualCode)return(n=this.connector.logger)==null||n.log("New version of code already checked"),this.actualCode;const s=await fetch(e.manifest.executor).then(d=>d.text());return(r=this.connector.logger)==null||r.log("New version of code fetched"),this.actualCode=s,s===t?((o=this.connector.logger)==null||o.log("New version of code is the same as the current version"),this.actualCode):(await this.connector.db.setItem(`${this.manifest.id}:${this.manifest.version}`,s),(i=this.connector.logger)==null||i.log("New version of code saved to cache"),s)}async loadCode(){var s;const e=await this.connector.db.getItem(`${this.manifest.id}:${this.manifest.version}`).catch(()=>null);(s=this.connector.logger)==null||s.log("Code loaded from cache",e!==null);const t=this.checkNewVersion(this,e);return e||await t}async call(e,t){var o,i,d,h,w;(o=this.connector.logger)==null||o.log("Add to queue",e,t),(i=this.connector.logger)==null||i.log("Calling method",e,t);const s=await this.loadCode();(d=this.connector.logger)==null||d.log("Code loaded, preparing");const n=new F(this,s,this._onMessage);(h=this.connector.logger)==null||h.log("Code loaded, iframe initialized"),await n.readyPromise,(w=this.connector.logger)==null||w.log("Iframe ready");const r=E();return new Promise((v,M)=>{var j;try{const S=b=>{var K;b.data.id!==r||b.data.origin!==n.origin||(n.dispose(),window.removeEventListener("message",S),(K=this.connector.logger)==null||K.log("postMessage",{result:b.data,request:{method:e,params:t}}),b.data.status==="failed"?M(b.data.result):v(b.data.result))};window.addEventListener("message",S),n.postMessage({method:e,params:t,id:r}),n.on("close",()=>M(new Error("Wallet closed")))}catch(S){(j=this.connector.logger)==null||j.log("Iframe error",S),M(S)}})}async getAllStorage(){const e=Object.keys(localStorage).filter(s=>s.startsWith(`${this.storageSpace}:`)),t={};for(const s of e)t[s.replace(`${this.storageSpace}:`,"")]=localStorage.getItem(s);return t}async clearStorage(){const e=Object.keys(localStorage).filter(t=>t.startsWith(`${this.storageSpace}:`));for(const t of e)localStorage.removeItem(t)}}class L extends k{constructor(t,s){super();l(this,"executor");this.connector=t,this.manifest=s,this.executor=new z(t,s)}async signIn(t){return this.executor.call("wallet:signIn",{...t,network:t.network||this.connector.network})}async signOut(){await this.executor.call("wallet:signOut",{network:this.connector.network}),await this.executor.clearStorage()}async getAccounts(){return this.executor.call("wallet:getAccounts",{network:this.connector.network})}async signAndSendTransaction(t){const s=t.network||this.connector.network;return this.executor.call("wallet:signAndSendTransaction",{...t,network:s})}async signAndSendTransactions(t){const s=t.network||this.connector.network;return this.executor.call("wallet:signAndSendTransactions",{...t,network:s})}async signMessage(t){const s=t.network||this.connector.network;return this.executor.call("wallet:signMessage",{...t,network:s})}}class T extends k{constructor(e,t){super(),this.connector=e,this.wallet=t}get manifest(){return this.wallet.manifest}async signIn(e){return this.wallet.signIn({...e,network:e.network||this.connector.network})}async signOut(e){await this.wallet.signOut({network:(e==null?void 0:e.network)||this.connector.network})}async getAccounts(e){return this.wallet.getAccounts({network:(e==null?void 0:e.network)||this.connector.network})}async signAndSendTransaction(e){return this.wallet.signAndSendTransaction({...e,network:e.network||this.connector.network})}async signAndSendTransactions(e){return this.wallet.signAndSendTransactions({...e,network:e.network||this.connector.network})}async signMessage(e){return this.wallet.signMessage({...e,network:e.network||this.connector.network})}}class B extends A{constructor(e){super(e),this.delegate=e}create(){var e;super.create({show:!0}),(e=this.root.querySelector("button"))==null||e.addEventListener("click",()=>this.delegate.onApprove())}get dom(){return`
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
      </div>`}}class J extends A{constructor(e){super(e),this.delegate=e,this.state=e.wallets}create(){super.create({show:!0}),this.root.querySelectorAll(".connect-item").forEach(e=>{e instanceof HTMLDivElement&&e.addEventListener("click",()=>{this.state[Number(e.dataset.type)]?this.delegate.onDisconnect(Number(e.dataset.type)):this.delegate.onConnect(Number(e.dataset.type))})})}get logout(){return`
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M17 7L15.59 8.41L18.17 11H8V13H18.17L15.59 15.58L17 17L22 12L17 7ZM4 5H12V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H12V19H4V5Z" fill="rgba(255,255,255,0.5)"/>
			</svg>
		`}label(e){switch(e){case c.EVM:return"EVM Wallet";case c.SOLANA:return"Solana Wallet";case c.TON:return"TON Wallet";case c.NEAR:return"NEAR Wallet";case c.STELLAR:return"Stellar Wallet";default:return e}}address(e){return this.state[e]?this.state[e].length<20?this.state[e]:`${this.state[e].slice(0,8)}...${this.state[e].slice(-8)}`:null}walletOption(e){return`
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
			</div>`}}class Y extends A{constructor(e){super(e),this.delegate=e}create(){var e;super.create({show:!0}),(e=this.root.querySelector("button"))==null||e.addEventListener("click",()=>this.delegate.onApprove())}get dom(){return`
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
        </div>`}}class P{constructor(e){l(this,"getAddress",async()=>{const e=await this.wallet.request({method:"eth_requestAccounts"});if(!e||e.length===0)throw new Error("No account found");return e[0].toLowerCase()});l(this,"getPublicKey",async()=>{throw new Error("Not implemented")});l(this,"getIntentsAddress",async()=>(await this.getAddress()).toLowerCase());l(this,"signIntentsWithAuth",async(e,t)=>{const s=g.encode(window.crypto.getRandomValues(new Uint8Array(32))),n=new TextEncoder().encode(`${e}_${s}`),r=await window.crypto.subtle.digest("SHA-256",new Uint8Array(n)),o=await this.getAddress();return{signed:await this.signIntents(t||[],{nonce:new Uint8Array(r)}),address:o,publicKey:o,chainId:c.EVM,seed:s}});this.wallet=e}get type(){return c.EVM}async signMessage(e){const t=await this.getAddress(),s=await this.wallet.request({method:"personal_sign",params:[e,t]}),n=parseInt(s.slice(-2),16),r=n===27||n===0;return g.decode(s.slice(2,-2)+(r?"00":"01"))}async sendTransaction(e){return await this.wallet.request({method:"eth_sendTransaction",params:[e]})}async signIntents(e,t){const s=await this.getAddress(),n=new Uint8Array((t==null?void 0:t.nonce)||window.crypto.getRandomValues(new Uint8Array(32))),r=JSON.stringify({deadline:t!=null&&t.deadline?new Date(t.deadline).toISOString():"2100-01-01T00:00:00.000Z",verifying_contract:"intents.near",signer_id:s.toLowerCase(),nonce:p.encode(n),intents:e}),o=await this.signMessage(r);return{signature:`secp256k1:${y.encode(o)}`,payload:r,standard:"erc191"}}}class _{constructor(e){l(this,"getAddress",async()=>{const e=await this.wallet.getAccounts();if(e.length===0)throw new Error("No account found");return e[0].address});l(this,"getPublicKey",async()=>this.getAddress());l(this,"getIntentsAddress",async()=>{const e=await this.getAddress();return g.encode(y.decode(e)).toLowerCase()});this.wallet=e}get type(){return c.SOLANA}async signIntentsWithAuth(e,t){const s=await this.getAddress(),n=g.encode(window.crypto.getRandomValues(new Uint8Array(32))),r=new TextEncoder().encode(`${e}_${n}`),o=await window.crypto.subtle.digest("SHA-256",new Uint8Array(r));return{signed:await this.signIntents(t||[],{nonce:new Uint8Array(o)}),publicKey:`ed25519:${s}`,chainId:c.SOLANA,address:s,seed:n}}async sendTransaction(e,t,s){return await this.wallet.sendTransaction(e,t,s)}async signMessage(e){return await this.wallet.signMessage(new TextEncoder().encode(e))}async signIntents(e,t){const s=new Uint8Array((t==null?void 0:t.nonce)||window.crypto.getRandomValues(new Uint8Array(32))),n=await this.getIntentsAddress(),r=await this.getPublicKey(),o=JSON.stringify({deadline:t!=null&&t.deadline?new Date(t.deadline).toISOString():"2100-01-01T00:00:00.000Z",nonce:p.encode(s),verifying_contract:"intents.near",signer_id:n,intents:e}),i=await this.signMessage(o);return{signature:`ed25519:${y.encode(i)}`,public_key:`ed25519:${r}`,standard:"raw_ed25519",payload:o}}}const Z=81,X=128,G=(a,e=!1)=>{const{wc:t,hex:s}=Q(a);let n=Z;e&&(n|=X);const r=new Int8Array(34);r[0]=n,r[1]=t,r.set(s,2);const o=new Uint8Array(36);return o.set(r),o.set(ee(new Uint8Array(r)),34),p.encode(o).replace(/\+/g,"-").replace(/\//g,"_")},Q=a=>{if(!a.includes(":"))throw`Wrong address ${a}. Address must include ":".`;const e=a.split(":");if(e.length!==2)throw`Wrong address ${a}. Address must include ":" only once.`;const t=parseInt(e[0]);if(t!==0&&t!==-1)throw`Wrong address ${a}. WC must be eq 0 or -1, but ${t} received.`;const s=e[1];if((s===null||g===void 0?void 0:s.length)!==64)throw`Wrong address ${a}. Hex part must be 64bytes length, but ${s===null||g===void 0?void 0:s.length} received.`;return{wc:t,hex:g.decode(s)}},ee=a=>{let t=0;const s=new Uint8Array(a.length+2);s.set(a);for(let n of s){let r=128;for(;r>0;)t<<=1,n&r&&(t+=1),r>>=1,t>65535&&(t&=65535,t^=4129)}return new Uint8Array([Math.floor(t/256),t%256])};class R{constructor(e){l(this,"getAddress",async()=>{if(!this.wallet.account)throw new Error("No account found");return G(this.wallet.account.address)});l(this,"getPublicKey",async()=>{var e;if(!((e=this.wallet.account)!=null&&e.publicKey))throw new Error("No public key found");return y.encode(g.decode(this.wallet.account.publicKey))});this.wallet=e}get type(){return c.TON}async getIntentsAddress(){var e;if(!((e=this.wallet.account)!=null&&e.publicKey))throw new Error("No public key found");return this.wallet.account.publicKey.toLowerCase()}async sendTransaction(e){return this.wallet.sendTransaction(e)}async signIntentsWithAuth(e,t){var d;const s=(d=this.wallet.account)==null?void 0:d.address;if(!s)throw new Error("Wallet not connected");const n=g.encode(window.crypto.getRandomValues(new Uint8Array(32))),r=new TextEncoder().encode(`${e}_${n}`),o=await window.crypto.subtle.digest("SHA-256",new Uint8Array(r)),i=await this.getPublicKey();return{signed:await this.signIntents(t||[],{nonce:new Uint8Array(o)}),publicKey:`ed25519:${i}`,chainId:c.TON,address:s,seed:n}}async signIntents(e,t){const s=await this.getPublicKey(),n=new Uint8Array((t==null?void 0:t.nonce)||window.crypto.getRandomValues(new Uint8Array(32))),r={deadline:new Date(Date.now()+24*36e5*365).toISOString(),signer_id:await this.getIntentsAddress(),verifying_contract:"intents.near",nonce:p.encode(n),intents:e},o=await this.wallet.signData({text:JSON.stringify(r),type:"text"});return{...o,standard:"ton_connect",signature:"ed25519:"+y.encode(p.decode(o.signature)),public_key:`ed25519:${s}`}}}const N="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",te=(()=>{const a=Array(256).fill(-1);for(let e=0;e<N.length;++e)a[N.charCodeAt(e)]=e;return a})(),U={decode(a){if(!a||typeof a!="string")throw new Error(`Expected base32 string but got "${a}"`);a=a.replace(/=+$/,"").toUpperCase();let e=0,t=0,s=0;const n=new Uint8Array(Math.ceil(a.length*5/8));for(let r=0;r<a.length;r++){const o=a[r],i=te[o.charCodeAt(0)];if(i===-1)throw new Error(`Invalid base32 character "${o}"`);t=t<<5|i,e+=5,e>=8&&(n[s++]=t>>>e-8&255,e-=8)}return n.slice(0,s)},encode(a){let e="",t=0,s=0;for(let n=0;n<a.length;n++)for(s=s<<8|a[n],t+=8;t>=5;){const r=s>>>t-5&31;e+=N[r],t-=5}if(t>0){const n=s<<5-t&31;e+=N[n]}for(;e.length%8!==0;)e+="=";return e}};class ${constructor(e,t){l(this,"getAddress",async()=>this.address);l(this,"getPublicKey",async()=>{const e=U.decode(this.address);return y.encode(e.slice(1,-2))});l(this,"getIntentsAddress",async()=>{const e=U.decode(this.address);return g.encode(e.slice(1,-2))});this.kit=e,this.address=t,this.address=t}get type(){return c.STELLAR}async signIntentsWithAuth(e,t){const s=await this.getAddress(),n=await this.getPublicKey(),r=g.encode(window.crypto.getRandomValues(new Uint8Array(32))),o=new TextEncoder().encode(`${e}_${r}`),i=await window.crypto.subtle.digest("SHA-256",new Uint8Array(o));return{signed:await this.signIntents(t||[],{nonce:new Uint8Array(i)}),publicKey:`ed25519:${n}`,chainId:c.STELLAR,address:s,seed:r}}async signMessage(e){return await this.kit.signMessage(e)}async signIntents(e,t){const s=new Uint8Array((t==null?void 0:t.nonce)||window.crypto.getRandomValues(new Uint8Array(32))),n=await this.getIntentsAddress(),r=await this.getPublicKey(),o=JSON.stringify({deadline:t!=null&&t.deadline?new Date(t.deadline).toISOString():"2100-01-01T00:00:00.000Z",nonce:p.encode(s),verifying_contract:"intents.near",signer_id:n,intents:e}),i=await this.signMessage(o);return{signature:`ed25519:${y.encode(p.decode(i.signedMessage))}`,public_key:`ed25519:${r}`,standard:"sep53",payload:o}}}class se{constructor(e){l(this,"storage");l(this,"wallets",{[c.NEAR]:null,[c.EVM]:null,[c.SOLANA]:null,[c.TON]:null,[c.STELLAR]:null});var t,s,n,r,o,i,d;this.options=e,this.storage=e.storage||new m,(t=this.options.tonConnect)==null||t.onStatusChange(async h=>{if(!h)return this.removeWallet(c.TON);this.setWallet(c.TON,new R(this.options.tonConnect))}),(s=this.options.tonConnect)==null||s.setConnectRequestParameters({state:"ready",value:{tonProof:"hot-connector"}}),(n=this.options.tonConnect)==null||n.connector.restoreConnection(),(r=this.options.nearConnector)==null||r.on("wallet:signOut",()=>this.removeWallet(c.NEAR)),(o=this.options.nearConnector)==null||o.on("wallet:signIn",({wallet:h})=>this.setWallet(c.NEAR,h)),(i=this.options.nearConnector)==null||i.getConnectedWallet().then(({wallet:h})=>this.setWallet(c.NEAR,h)),this.storage.get("hot-connector:stellar").then(h=>{try{if(!h||!this.options.stellarKit)throw"No wallet";const{id:w,address:v}=JSON.parse(h);this.options.stellarKit.setWallet(w),this.setWallet(c.STELLAR,new $(this.options.stellarKit,v))}catch{this.removeWallet(c.STELLAR)}}),(d=this.options.appKit)==null||d.subscribeProviders(async h=>{const w=h.solana;w?this.setWallet(c.SOLANA,new _(w)):this.removeWallet(c.SOLANA);const v=h.eip155;v?this.setWallet(c.EVM,new P(v)):this.removeWallet(c.EVM)})}setWallet(e,t){this.wallets[e]=t,this.options.onConnect(t,e)}removeWallet(e){this.wallets[e]!=null&&(this.wallets[e]=null,this.options.onDisconnect(e))}getWallet(e){if(!this.wallets[e])throw new Error(`${e} not connected`);return this.wallets[e]}resolveWallet(e){const t=typeof e=="number"||typeof e=="string"?this.getWallet(e):e;if(!t)throw new Error("Wallet not found");return t}async connectWallet(e){var t,s,n,r,o;if(e===c.NEAR)return(t=this.options.nearConnector)==null?void 0:t.connect();if(e===c.EVM)return(s=this.options.appKit)==null?void 0:s.open({namespace:"eip155"});if(e===c.SOLANA)return(n=this.options.appKit)==null?void 0:n.open({namespace:"solana"});if(e===c.TON)return(r=this.options.tonConnect)==null?void 0:r.openModal();if(e===c.STELLAR)return(o=this.options.stellarKit)==null?void 0:o.openModal({onWalletSelected:async i=>{var h,w;if(!this.options.stellarKit)return;(h=this.options.stellarKit)==null||h.setWallet(i.id);const{address:d}=await((w=this.options.stellarKit)==null?void 0:w.getAddress());this.setWallet(c.STELLAR,new $(this.options.stellarKit,d)),this.storage.set("hot-connector:stellar",JSON.stringify({id:i.id,address:d}))}})}async connect(){return new Promise(async(e,t)=>{var n,r,o,i,d;const s=new J({chains:this.options.chains,wallets:{[c.NEAR]:await((n=this.wallets[c.NEAR])==null?void 0:n.getAddress().catch(()=>{})),[c.EVM]:await((r=this.wallets[c.EVM])==null?void 0:r.getAddress().catch(()=>{})),[c.SOLANA]:await((o=this.wallets[c.SOLANA])==null?void 0:o.getAddress().catch(()=>{})),[c.TON]:await((i=this.wallets[c.TON])==null?void 0:i.getAddress().catch(()=>{})),[c.STELLAR]:await((d=this.wallets[c.STELLAR])==null?void 0:d.getAddress().catch(()=>{}))},onConnect:h=>{this.connectWallet(h),s.destroy(),e()},onDisconnect:h=>{this.disconnect(h),s.destroy(),e()},onReject:()=>{t(new Error("User rejected")),s.destroy()}});s.create()})}async auth(e,t,s){const n=this.resolveWallet(e);return new Promise((r,o)=>{const i=new B({onApprove:async()=>{try{const d=await n.signIntentsWithAuth(t,s);r(d),i.destroy()}catch(d){o(d),i.destroy()}},onReject:()=>{o(new Error("User rejected")),i.destroy()}});i.create()})}async disconnect(e){const t=this.resolveWallet(e);return new Promise((s,n)=>{const r=new Y({onApprove:async()=>{var o,i,d,h,w;t.type===c.NEAR&&await((o=this.options.nearConnector)==null?void 0:o.disconnect().catch(()=>null)),t.type===c.SOLANA&&await((i=this.options.appKit)==null?void 0:i.disconnect("solana").catch(()=>null)),t.type===c.EVM&&await((d=this.options.appKit)==null?void 0:d.disconnect("eip155").catch(()=>null)),t.type===c.TON&&await((h=this.options.tonConnect)==null?void 0:h.connector.disconnect().catch(()=>null)),t.type===c.STELLAR&&(await((w=this.options.stellarKit)==null?void 0:w.disconnect().catch(()=>null)),this.storage.remove("hot-connector:stellar")),this.removeWallet(t.type),r.destroy(),s()},onReject:()=>{n(new Error("User rejected")),r.destroy()}});r.create()})}async signIntents(e,t){return await this.resolveWallet(e).signIntents(t)}async executeIntents(e,t,s=[]){const n=await this.signIntents(e,t);return await this.publishSignedIntents([n],s)}async publishSignedIntents(e,t=[]){const s=await fetch("https://api0.herewallet.app/api/v1/evm/intent-solver",{headers:{"Content-Type":"application/json"},method:"POST",body:JSON.stringify({params:[{signed_datas:e,quote_hashes:t}],method:"publish_intents",id:"dontcare",jsonrpc:"2.0"})}),{result:n}=await s.json();if(n.status==="FAILED")throw n.reason;const r=n.intent_hashes[0],o=async()=>{const h=await fetch("https://api0.herewallet.app/api/v1/evm/intent-solver",{headers:{"Content-Type":"application/json"},method:"POST",body:JSON.stringify({id:"dontcare",jsonrpc:"2.0",method:"get_status",params:[{intent_hash:r}]})}),{result:w}=await h.json();return w},i=async()=>{await new Promise(w=>setTimeout(w,1e3));const h=await o().catch(()=>null);if(h==null)return await i();if(h.status==="SETTLED")return h.data.hash;if(h.status==="FAILED")throw h.reason||"Failed to publish intents";return await i()};return await i()}async simulateIntents(e){return await this.viewMethod("intents.near","simulate_intents",{signed:e})}async viewMethod(e,t,s={}){const r=await fetch("https://rpc.mainnet.near.org",{headers:{"Content-Type":"application/json"},method:"POST",body:JSON.stringify({jsonrpc:"2.0",id:"dontcare",method:"query",params:{request_type:"call_function",finality:"final",account_id:e,method_name:t,args_base64:p.encode(new TextEncoder().encode(JSON.stringify(s)))}})}),{result:o}=await r.json();if(o.error)throw o.error;if(!(o!=null&&o.result))throw new Error("Failed to call view method");try{return JSON.parse(Buffer.from(o.result).toString())}catch{return o.result}}}class ne extends A{constructor(e){super(e),this.delegate=e}create(){super.create({show:!0}),this.root.querySelectorAll(".connect-item").forEach(e=>{e instanceof HTMLDivElement&&e.addEventListener("click",()=>{this.delegate.onSelect(e.dataset.type)})})}address(e){return this.state[e]?`${this.state[e].slice(0,6)}...${this.state[e].slice(-4)}`:null}walletDom(e){var t;return`
			<div class="connect-item" data-type="${e.id}">
				<img style="background: #333" src="${e.icon}" alt="${e.name}" />
				<div class="connect-item-info">
					<span>${e.name}</span>
					<span class="wallet-address">${(t=I(e.website))==null?void 0:t.hostname}</span>
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
			</div>`}}class re{constructor(e,t){l(this,"dbName");l(this,"storeName");l(this,"version");this.dbName=e,this.storeName=t,this.version=1}getDb(){return new Promise((e,t)=>{const s=indexedDB.open(this.dbName,this.version);s.onerror=n=>{console.error("Error opening database:",n.target.error),t(new Error("Error opening database"))},s.onsuccess=n=>{e(s.result)},s.onupgradeneeded=n=>{const r=s.result;r.objectStoreNames.contains(this.storeName)||r.createObjectStore(this.storeName)}})}async getItem(e){const t=await this.getDb();if(typeof e=="number"&&(e=e.toString()),typeof e!="string")throw new Error("Key must be a string");return new Promise((s,n)=>{if(!this.storeName){n(new Error("Store name not set"));return}const r=t.transaction(this.storeName,"readonly");r.onerror=d=>n(r.error);const i=r.objectStore(this.storeName).get(e);i.onerror=d=>n(i.error),i.onsuccess=()=>{s(i.result),t.close()}})}async setItem(e,t){const s=await this.getDb();if(typeof e=="number"&&(e=e.toString()),typeof e!="string")throw new Error("Key must be a string");return new Promise((n,r)=>{if(!this.storeName){r(new Error("Store name not set"));return}const o=s.transaction(this.storeName,"readwrite");o.onerror=h=>r(o.error);const d=o.objectStore(this.storeName).put(t,e);d.onerror=h=>r(d.error),d.onsuccess=()=>{s.close(),n()}})}async removeItem(e){const t=await this.getDb();if(typeof e=="number"&&(e=e.toString()),typeof e!="string")throw new Error("Key must be a string");return new Promise((s,n)=>{if(!this.storeName){n(new Error("Store name not set"));return}const r=t.transaction(this.storeName,"readwrite");r.onerror=d=>n(r.error);const i=r.objectStore(this.storeName).delete(e);i.onerror=d=>n(i.error),i.onsuccess=()=>{t.close(),s()}})}async keys(){const e=await this.getDb();return new Promise((t,s)=>{if(!this.storeName){s(new Error("Store name not set"));return}const n=e.transaction(this.storeName,"readonly");n.onerror=i=>s(n.error);const o=n.objectStore(this.storeName).getAllKeys();o.onerror=i=>s(o.error),o.onsuccess=()=>{t(o.result),e.close()}})}async count(){const e=await this.getDb();return new Promise((t,s)=>{if(!this.storeName){s(new Error("Store name not set"));return}const n=e.transaction(this.storeName,"readonly");n.onerror=i=>s(n.error);const o=n.objectStore(this.storeName).count();o.onerror=i=>s(o.error),o.onsuccess=()=>{t(o.result),e.close()}})}async length(){return this.count()}async clear(){const e=await this.getDb();return new Promise((t,s)=>{if(!this.storeName){s(new Error("Store name not set"));return}const n=e.transaction(this.storeName,"readwrite");n.onerror=i=>s(n.error);const o=n.objectStore(this.storeName).clear();o.onerror=i=>s(o.error),o.onsuccess=()=>{e.close(),t()}})}}class ae{constructor(e){l(this,"storage");l(this,"events");l(this,"db");l(this,"wallets",[]);l(this,"manifest",{wallets:[],version:"1.0.0"});l(this,"features",{});l(this,"logger");l(this,"network","mainnet");l(this,"connectWithKey");l(this,"whenManifestLoaded");l(this,"_handleNearWalletInjected",e=>{this.wallets=this.wallets.filter(t=>t.manifest.id!==e.detail.manifest.id),this.wallets.unshift(new T(this,e.detail)),this.events.emit("selector:walletsChanged",{})});this.db=new re("hot-connector","wallets"),this.storage=(e==null?void 0:e.storage)??new m,this.events=(e==null?void 0:e.events)??new f,this.logger=e==null?void 0:e.logger,this.network=(e==null?void 0:e.network)??"mainnet",this.connectWithKey=e==null?void 0:e.connectWithKey,this.features=(e==null?void 0:e.features)??{},this.whenManifestLoaded=new Promise(async t=>{(e==null?void 0:e.manifest)==null||typeof e.manifest=="string"?this.manifest=await this._loadManifest(e==null?void 0:e.manifest).catch(()=>({wallets:[],version:"1.0.0"})):this.manifest=(e==null?void 0:e.manifest)??{wallets:[],version:"1.0.0"},await new Promise(s=>setTimeout(s,100)),t()}),window.addEventListener("near-wallet-injected",this._handleNearWalletInjected),window.dispatchEvent(new Event("near-selector-ready")),this.whenManifestLoaded.then(()=>{window.parent.postMessage({type:"near-selector-ready"},"*"),this.manifest.wallets.forEach(t=>this.registerWallet(t)),this.storage.get("debug-wallets").then(t=>{JSON.parse(t??"[]").forEach(n=>this.registerDebugWallet(n))})}),window.addEventListener("message",async t=>{t.data.type==="near-wallet-injected"&&(await this.whenManifestLoaded.catch(()=>{}),this.wallets=this.wallets.filter(s=>s.manifest.id!==t.data.manifest.id),this.wallets.unshift(new W(this,t.data.manifest)),this.events.emit("selector:walletsChanged",{}),this.connect(t.data.manifest.id))})}get availableWallets(){return this.wallets.filter(t=>Object.entries(this.features).every(([s,n])=>{var r;return!(n&&!((r=t.manifest.features)!=null&&r[s]))})).filter(t=>{var s;return!(this.network==="testnet"&&!((s=t.manifest.features)!=null&&s.testnet))})}async _loadManifest(e){return await(await fetch(e||"https://raw.githubusercontent.com/hot-dao/near-selector/refs/heads/main/repository/manifest.json")).json()}async switchNetwork(e){await this.disconnect().catch(()=>{}),this.network=e,await this.connect()}async registerWallet(e){if(e.type!=="sandbox")throw new Error("Only sandbox wallets are supported");this.wallets.find(t=>t.manifest.id===e.id)||(this.wallets.push(new L(this,e)),this.events.emit("selector:walletsChanged",{}))}async registerDebugWallet(e){if(e.type!=="sandbox")throw new Error("Only sandbox wallets are supported");if(this.wallets.find(s=>s.manifest.id===e.id))throw new Error("Wallet already registered");e.debug=!0,this.wallets.push(new L(this,e)),this.events.emit("selector:walletsChanged",{});const t=this.wallets.filter(s=>s.manifest.debug).map(s=>s.manifest);this.storage.set("debug-wallets",JSON.stringify(t))}async selectWallet(){return await this.whenManifestLoaded.catch(()=>{}),new Promise((e,t)=>{const s=new ne({wallets:this.availableWallets.map(n=>n.manifest),onSelect:n=>{e(n),s.destroy()},onReject:()=>{t(new Error("User rejected")),s.destroy()}});s.create()})}async connect(e){var t,s,n,r;await this.whenManifestLoaded.catch(()=>{}),e||(e=await this.selectWallet());try{const o=await this.wallet(e);(t=this.logger)==null||t.log("Wallet available to connect",o),await this.storage.set("selected-wallet",e),(s=this.logger)==null||s.log("Set preferred wallet, try to signIn",e);const i=await o.signIn(this.connectWithKey??{contractId:""});if((n=this.logger)==null||n.log("Signed in to wallet",e,i),!(i!=null&&i.length))throw new Error("Failed to sign in");return this.events.emit("wallet:signIn",{wallet:o,accounts:i,success:!0}),o}catch(o){throw(r=this.logger)==null||r.log("Failed to connect to wallet",o),o}}async disconnect(e){e||(e=await this.wallet()),await e.signOut({network:this.network}),await this.storage.remove("selected-wallet"),this.events.emit("wallet:signOut",{success:!0})}async getConnectedWallet(){await this.whenManifestLoaded.catch(()=>{});const e=await this.storage.get("selected-wallet"),t=this.wallets.find(n=>n.manifest.id===e);if(!t)throw new Error("No wallet selected");const s=await t.getAccounts();if(!(s!=null&&s.length))throw new Error("No accounts found");return{wallet:t,accounts:s}}async wallet(e){if(await this.whenManifestLoaded.catch(()=>{}),!e)return this.getConnectedWallet().then(({wallet:s})=>s).catch(async()=>{throw await this.storage.remove("selected-wallet"),new Error("No accounts found")});const t=this.wallets.find(s=>s.manifest.id===e);if(!t)throw new Error("Wallet not found");return t}on(e,t){this.events.on(e,t)}once(e,t){this.events.once(e,t)}off(e,t){this.events.off(e,t)}removeAllListeners(e){this.events.removeAllListeners(e)}}const oe=Object.freeze(Object.defineProperty({__proto__:null},Symbol.toStringTag,{value:"Module"}));return u.EventEmitter=f,u.EvmWallet=P,u.HotConnector=se,u.InjectedWallet=T,u.LocalStorage=m,u.NearConnector=ae,u.NearWallet=k,u.ParentFrameWallet=W,u.SandboxWallet=L,u.SolanaWallet=_,u.StellarWallet=$,u.TonWallet=R,u.WalletType=c,u.tx=oe,Object.defineProperty(u,Symbol.toStringTag,{value:"Module"}),u}({});
