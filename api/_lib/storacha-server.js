let storachaServerClientPromise = null;
let storachaModulesPromise = null;

function hasStorachaServerConfig() {
  return Boolean(
    process.env.STORACHA_AGENT_KEY &&
      process.env.STORACHA_AGENT_PROOF &&
      process.env.STORACHA_SPACE_DID
  );
}

async function loadStorachaModules() {
  if (!storachaModulesPromise) {
    storachaModulesPromise = Promise.all([
      import('@storacha/client'),
      import('@storacha/client/stores/memory'),
      import('@storacha/client/proof'),
      import('@storacha/client/principal/ed25519'),
    ]).then(([Client, memoryStoreModule, Proof, ed25519Module]) => ({
      Client,
      Proof,
      StoreMemory: memoryStoreModule.StoreMemory,
      Signer: ed25519Module.Signer,
    }));
  }

  return storachaModulesPromise;
}

export async function getStorachaServerClient() {
  if (!hasStorachaServerConfig()) {
    return null;
  }

  if (storachaServerClientPromise) {
    return storachaServerClientPromise;
  }

  storachaServerClientPromise = (async () => {
    const { Client, Proof, StoreMemory, Signer } = await loadStorachaModules();
    const principal = Signer.parse(process.env.STORACHA_AGENT_KEY);
    const store = new StoreMemory();
    const client = await Client.create({ principal, store });
    const proof = await Proof.parse(process.env.STORACHA_AGENT_PROOF);
    await client.addSpace(proof);
    await client.setCurrentSpace(process.env.STORACHA_SPACE_DID);
    return client;
  })();

  return storachaServerClientPromise;
}

export async function uploadJsonWithStoracha(name, payload) {
  const client = await getStorachaServerClient();
  if (!client) {
    return null;
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const file = new File([blob], name, { type: 'application/json' });
  const cid = await client.uploadFile(file);
  return cid.toString();
}

export async function fetchJsonByCid(cid) {
  const gatewayBase = process.env.STORACHA_GATEWAY_BASE ?? 'https://w3s.link/ipfs';
  const response = await fetch(`${gatewayBase}/${cid}`);
  if (!response.ok) {
    throw new Error(`Unable to fetch Storacha CID ${cid}.`);
  }

  return response.json();
}

export function storachaServerStatus() {
  return hasStorachaServerConfig() ? 'configured' : 'client-assisted';
}
