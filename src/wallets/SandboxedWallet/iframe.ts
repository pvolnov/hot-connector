import SandboxExecutor from "./executor";

async function getIframeCode(executor: SandboxExecutor) {
  const storage = await executor.getAllStorage();
  const code = await fetch(executor.manifest.executor).then((res) => res.text());

  return /* html */ `
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
      </style>

      <script>
      window.sandboxedLocalStorage = (() => {
        let storage = ${JSON.stringify(storage)}

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

      class ProxyWindow {
        constructor(url, newTab, params) {
          this.closed = false;
          this.windowIdPromise = window.selector.call("open", { url, newTab, params });

          window.addEventListener("message", async (event) => {            
            if (event.data.origin !== "${executor.origin}") return;
            if (!event.data.method?.startsWith("proxy-window:")) return;
            const method = event.data.method.replace("proxy-window:", "");
            if (method === "closed" && event.data.windowId === await this.id()) this.closed = true;
          });
        } 

        async id() {
          return await this.windowIdPromise;
        }

        async focus() {
          await window.selector.call("windowFocus", { windowId: await this.id() });
        }

        async postMessage(data) {
          window.selector.call("windowPostMessage", { windowId: await this.id(), data });
        }

        async close() {
          window.selector.call("windowClose", { windowId: await this.id() });
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
          window.parent.postMessage({ method: "wallet-ready", origin: "${executor.origin}" }, "*");
          window.selector.wallet = wallet;
        },

        showContent() {
          window.parent.postMessage({ method: "showContent", origin: "${executor.origin}" }, "*");
        },

        async call(method, params) {
          const id = window.selector.uuid();
          window.parent.postMessage({ method, params, id, origin: "${executor.origin}" }, "*");

          return new Promise((resolve, reject) => {
            const handler = (event) => {
              if (event.data.id !== id || event.data.origin !== "${executor.origin}") return;
              window.removeEventListener("message", handler);

              if (event.data.status === "failed") reject(event.data.result);
              else resolve(event.data.result);
            };

            window.addEventListener("message", handler);
          });
        },

        panelClosed(windowId) {
          window.parent.postMessage({ method: "panelClosed", origin: "${executor.origin}", result: { windowId } }, "*");
        },

        open(url, newTab = false, params) {
          return new ProxyWindow(url, newTab, params)
        },

        storage: {
          async set(key, value) {
            await window.selector.call("setStorage", { key, value });
          },
      
          async get(key) {
            return await window.selector.call("getStorage", { key });
          },
      
          async remove(key) {
            await window.selector.call("removeStorage", { key });
          },

          async keys() {
            return await window.selector.call("getStorageKeys", {});
          },
        },
      };

      if (${executor.checkPermissions("parentFrame")}) {
        window.selector.parentFrame = {
          async postMessage(data) {
            return await window.selector.call("parentPostMessage", { data });
          },
        };
      }
      
      window.addEventListener("message", async (event) => {
        if (event.data.origin !== "${executor.origin}") return;
        if (!event.data.method?.startsWith("wallet:")) return;
      
        const wallet = window.selector.wallet;
        const method = event.data.method.replace("wallet:", "");
        const payload = { id: event.data.id, origin: "${executor.origin}", method };
      
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
      </script>
      
      <script type="module">${code}</script>
    `;
}

export default getIframeCode;
