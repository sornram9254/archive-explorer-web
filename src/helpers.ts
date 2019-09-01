import APIHELPER from "./tools/ApiHelper";
import { IUser } from "./tools/interfaces";
import SETTINGS from "./tools/Settings";
import { PartialTweet } from "twitter-archive-reader";
import UserCache from "./classes/UserCache";
import DMArchive from "twitter-archive-reader";

export const VERSION = "0.1.0";

declare global {
  interface Window {
    DEBUG: any;
  }
}

export function setPageTitle(title?: string) {
  document.title = "Archive Explorer" + (title ? ` - ${title}` : '');
}

export async function checkCredentials() {
  try {
    const reso: IUser = await APIHELPER.request('users/credentials');
    SETTINGS.user = reso;
    return !!reso.user_id;
  } catch (e) {
    return false;
  }
}

export function dateFromTweet(tweet: PartialTweet) : Date {
  if ('created_at_d' in tweet) {
    return tweet.created_at_d;
  }
  return tweet.created_at_d = new Date(tweet.created_at);
}

export function prefetchAllUserData(archive: DMArchive) {
  const sets: Set<string>[] = archive.messages.all.map(e => e.participants);

  const users = new Set<string>();

  for (const s of sets) {
    for (const u of s) {
      users.add(u);
    }
  }

  if (users.size)
    return UserCache.bulk([...users]);

  return Promise.resolve();
}

/**
 * Formate un objet Date en chaîne de caractères potable.
 * Pour comprendre les significations des lettres du schéma, se référer à : http://php.net/manual/fr/function.date.php
 * @param schema string Schéma de la chaîne. Supporte Y, m, d, g, H, i, s, n, N, v, z, w
 * @param date Date Date depuis laquelle effectuer le formatage
 * @returns string La chaîne formatée
 */
export function dateFormatter(schema: string, date = new Date()) : string {
  function getDayOfTheYear(now: Date) : number {
      const start = new Date(now.getFullYear(), 0, 0);
      const diff = now.getTime() - start.getTime();
      const oneDay = 1000 * 60 * 60 * 24;
      const day = Math.floor(diff / oneDay);
      
      return day - 1; // Retourne de 0 à 364/365
  }

  const Y = date.getFullYear();
  const N = date.getDay() === 0 ? 7 : date.getDay();
  const n = date.getMonth() + 1;
  const m = (n < 10 ? "0" : "") + String(n);
  const d = ((date.getDate()) < 10 ? "0" : "") + String(date.getDate());
  const L = Y % 4 == 0 ? 1 : 0;

  const i = ((date.getMinutes()) < 10 ? "0" : "") + String(date.getMinutes());
  const H = ((date.getHours()) < 10 ? "0" : "") + String(date.getHours());
  const g = date.getHours();
  const s = ((date.getSeconds()) < 10 ? "0" : "") + String(date.getSeconds());

  const replacements: any = {
      Y, m, d, i, H, g, s, n, N, L, v: date.getMilliseconds(), z: getDayOfTheYear, w: date.getDay()
  };

  let str = "";

  // Construit la chaîne de caractères
  for (const char of schema) {
      if (char in replacements) {
          if (typeof replacements[char] === 'string') {
              str += replacements[char];
          }
          else if (typeof replacements[char] === 'number') {
              str += String(replacements[char]);
          }
          else {
              str += String(replacements[char](date));
          }
      }
      else {
          str += char;
      }
  }

  return str;
}
