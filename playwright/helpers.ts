import { Agent, setGlobalDispatcher } from 'undici';
import { GSS_MECH_OID_KRB5, initializeClient } from 'kerberos';
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

export async function authenticate(): Promise<{ refresh: string; access: string; cookies: string[] }> {
  const client = await initializeClient(`HTTP@${process.env.OSIDB_URL}`, {
    mechOID: GSS_MECH_OID_KRB5,
  });
  const ticket = await client.step('');

  const resp = await fetch(`https://${process.env.OSIDB_URL}/auth/token`, {
    headers: {
      Authorization: `Negotiate ${ticket}`,
    },
    method: 'GET',
  });

  const { access, refresh } = await resp.json() as JSONResponse;

  // Extract cookies from response headers for non-dev environments
  const cookies = resp.headers.getSetCookie();

  return { access, refresh, cookies };
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

  let url = `https://${process.env.OSIDB_URL}/osidb/api/v1/flaws/${uuid}`;
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
