import { Agent, setGlobalDispatcher } from 'undici';
import { type BrowserContextOptions } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'fs/promises';
import dayjs_base from 'dayjs';
import utc_plugin from 'dayjs/plugin/utc';
import { existsSync } from 'fs';

dayjs_base.extend(utc_plugin);

const agent = new Agent({
  connect: {
    rejectUnauthorized: false,
  },
});

setGlobalDispatcher(agent);

interface JSONResponse {
  access: string;
  refresh: string;
}

const storagePath = 'playwright/.auth/';

// Use http for localhost (CI), https otherwise
export const osidbBaseUrl = () => {
  const host = process.env.OSIDB_URL || '';
  const protocol = host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https';
  return `${protocol}://${host}`;
};

async function authenticateWithKerberos(): Promise<{ access: string; refresh: string; cookies: string[] }> {
  const { GSS_MECH_OID_KRB5, initializeClient } = await import('kerberos');
  const client = await initializeClient(`HTTP@${process.env.OSIDB_URL}`, {
    mechOID: GSS_MECH_OID_KRB5,
  });
  const ticket = await client.step('');

  const resp = await fetch(`${osidbBaseUrl()}/auth/token`, {
    headers: {
      Authorization: `Negotiate ${ticket}`,
    },
    method: 'GET',
  });

  const { access, refresh } = await resp.json() as JSONResponse;
  const cookies = resp.headers.getSetCookie();

  return { access, refresh, cookies };
}

async function authenticateWithCredentials(): Promise<{ access: string; refresh: string; cookies: string[] }> {
  const resp = await fetch(`${osidbBaseUrl()}/auth/token`, {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({
      username: process.env.OSIM_USERNAME,
      password: process.env.OSIM_PASSWORD,
    }),
  });

  if (!resp.ok) {
    throw new Error(`Authentication failed: ${resp.status} ${resp.statusText}`);
  }

  const { access, refresh } = await resp.json() as JSONResponse;
  const cookies = resp.headers.getSetCookie();

  return { access, refresh, cookies };
}

export async function authenticate(): Promise<{ refresh: string; access: string; cookies: string[] }> {
  // Use credentials auth if username/password are provided, otherwise fall back to Kerberos
  if (process.env.OSIM_USERNAME && process.env.OSIM_PASSWORD) {
    return authenticateWithCredentials();
  }
  return authenticateWithKerberos();
}

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
type Storage = Exclude<BrowserContextOptions['storageState'], undefined | string>;

export async function loadStorage(): Promise<Storage> {
  const storage = JSON.parse(await readFile(`${storagePath}/user.json`, 'utf8')) as Storage;
  return storage;
}

export async function saveStorage(storage: Optional<Storage, 'cookies'>): Promise<void> {
  if (!existsSync(storagePath)) {
    await mkdir(storagePath, { recursive: true });
  }
  await writeFile(`${storagePath}/user.json`, JSON.stringify(storage, null, 2));
}

export async function getFlawFromAPI<T extends string>(uuid: string, fields?: T[]): Promise<Record<T, unknown>> {
  const { access } = await authenticate();

  let url = `${osidbBaseUrl()}/osidb/api/v1/flaws/${uuid}`;
  if (fields) {
    url += '?' + new URLSearchParams({ include_fields: fields.join(',') }).toString();
  }

  const resp = await fetch(url, {
    headers: {
      Authorization: 'Bearer ' + access,
    },
    method: 'GET',
  });

  return (await resp.json() as Record<T, unknown>);
}

/**
 * Sleep is discouraged in tests, don't use for UI interactions.
 * https://playwright.dev/docs/api/class-page#page-wait-for-timeout
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
export const { utc: dayjs } = dayjs_base;
