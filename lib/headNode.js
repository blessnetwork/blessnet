const getFetch = async () => {
  const fetch = await import('node-fetch');
  return fetch.default;
};

const getHeadTriggerData = async (cid) => {
    const headApiEndpoint = 'http://localhost:8080';

    const response = await fetch(`${headApiEndpoint}/api/v1/functions/${cid}/jobs`);
    const data = await response.json();

    console.log(data);

    return data;
}

const deployTrigger = async (cid, oldCid, trigger) => {
    const headApiEndpoint = 'http://localhost:8080';

    // Clear all existing jobs for this function
    await fetch(`${headApiEndpoint}/api/v1/functions/${oldCid}/jobs`, {
      method: 'DELETE'
    });

    // Deploy the new trigger
    const response = await fetch(`${headApiEndpoint}/api/v1/functions/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        function_id: cid,
        command: 'blessnet.wasm',
        schedule: trigger.schedule,
        description: trigger.name
      })
    });
    
    const data = await response.json();

    return data;
}
module.exports = { getHeadTriggerData, deployTrigger };