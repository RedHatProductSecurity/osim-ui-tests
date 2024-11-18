import { Agent, setGlobalDispatcher } from 'undici';
import { GSS_MECH_OID_KRB5, initializeClient } from 'kerberos';
import { type BrowserContextOptions } from '@playwright/test';
import { readFile, writeFile } from 'fs/promises';
import dayjs_base from 'dayjs';
import utc_plugin from 'dayjs/plugin/utc';

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

export async function authenticate(): Promise<{ refresh: string; access: string }> {
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

  return { access, refresh };
}

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
type Storage = Exclude<BrowserContextOptions['storageState'], undefined | string>;

export async function loadStorage(): Promise<Storage> {
  const storage = JSON.parse(await readFile('playwright/.auth/user.json', 'utf8')) as Storage;
  return storage;
}

export async function saveStorage(storage: Optional<Storage, 'cookies'>): Promise<void> {
  await writeFile('playwright/.auth/user.json', JSON.stringify(storage, null, 2));
}

export const { utc: dayjs } = dayjs_base;
