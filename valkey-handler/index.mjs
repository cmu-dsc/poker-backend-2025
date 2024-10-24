import Redis from 'ioredis';

const valkeyClient = new Redis({
  host: process.env.VALKEY_ENDPOINT,
  port: 6379,
  tls: {},
  enableAutoPipelining: true
});

const getLogs = async (event) => {
  const { match_id, last_timestamp = 0 } = event;
  
  const logs = await valkeyClient.zrangebyscore(
    `match:${match_id}:logs`,
    last_timestamp + 1,
    '+inf',
    'WITHSCORES'
  );

  const result = [];
  for (let i = 0; i < logs.length; i += 2) {
    result.push(JSON.parse(logs[i]));
  }

  return result;
};

const addLog = async (event) => {
  const { match_id, timestamp, message, level, expiration } = event;
  const logEntry = { match_id, timestamp, message, level, expiration };

  await valkeyClient.zadd(
    `match:${match_id}:logs`,
    timestamp,
    JSON.stringify(logEntry)
  );

  const ttl = expiration - Math.floor(Date.now() / 1000);
  if (ttl > 0) {
    await valkeyClient.expire(`match:${match_id}:logs`, ttl);
  }

  return logEntry;
};

export async function handler(event) {
  const { operation, ...args } = event;

  switch (operation) {
    case 'getLogs':
      return await getLogs(args);
    case 'addLog':
      return await addLog(args);
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}
