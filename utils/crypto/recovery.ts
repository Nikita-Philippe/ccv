import { IAuthenticatedUser, IRecoverEntry } from "@models/User.ts";
import { getDailyEntryKey } from "@utils/common.ts";
import { getContent } from "@utils/content.ts";
import { KV_CRYPTO, KV_CRYPTO_RECOVERYKEYS } from "@utils/crypto/constants.ts";
import { generateEncryptionKey } from "@utils/crypto/generators.ts";
import { hashData } from "@utils/crypto/hash.ts";
import { exportEntries } from "@utils/entries.ts";
import { getInKv, setInKv } from "@utils/kv/index.ts";
import { openCryptoKv } from "@utils/kv/instance.ts";
import { wipeUser } from "@utils/user/index.ts";
import { DateTime } from "luxon";

/** Create a user's recovery key, used to recover its datas if he lost access to his account.
 *
 * * The recovery key is a random generated string. It is used to encrypt an entry in the kv store, that contains
 * some basic user config. These datas are single use to retrieve all user datas, and then deleted.
 *
 * * @param {IAuthenticatedUser} user The user to create the recovery key for
 * * @returns {Promise<string>} The recovery key
 */
export const createUserRecoveryKey = async (user: IAuthenticatedUser): Promise<string> => {
  const rawRecoveryKey = await generateEncryptionKey();
  const rkKey = await hashData(rawRecoveryKey);

  const kv = await openCryptoKv(rawRecoveryKey);

  await setInKv(kv, [KV_CRYPTO, KV_CRYPTO_RECOVERYKEYS, rkKey], {
    id: user.id,
    // Save email, to verify user informations when he needs to recover the key
    email: user.email,
    provider: user.provider,
  } as IRecoverEntry);

  kv.close();

  return rawRecoveryKey;
};

/** Recover the user account using the recovery key and email
 *
 * Use the recovery key to decrypt the entry in the kv store, that contains the user id and email.
 * If entry data match, retrieve all users datas and delete all user related datas.
 *
 * @param {string} recoveryKey The recovery key to use
 * @param {string} email The email of the user to recover
 * @param {string} sessionId The session id of the user to recover. Needs to be provided to remove the current users session
 * @returns {Promise<IRecoverEntry | null>} The recovered user datas. Null if recover key is invalid or email doesn't match.
 */
export const recoverUserAccount = async (recoveryKey: string, email: string, sessionId: string) => {
  const rkKey = await hashData(recoveryKey);

  const recoveryKv = await openCryptoKv(recoveryKey);

  const recoveryEntry: Deno.KvKey = [KV_CRYPTO, KV_CRYPTO_RECOVERYKEYS, rkKey];

  const userDatas = await getInKv<IRecoverEntry | null>(recoveryKv, recoveryEntry);
  recoveryKv.close();

  if (!userDatas.value?.id) return null;
  if (userDatas.value.email.toLowerCase() != email.toLowerCase()) return null;
  const user = { ...userDatas.value, sessionId, isAuthenticated: true };

  // Export configs
  const configs = await getContent(user);

  // Export entries
  const entries = await exportEntries(user, {
    contentId: configs?.id ?? "0",
    from: getDailyEntryKey(DateTime.now().minus({ years: 10 })),
    to: getDailyEntryKey(DateTime.now()),
  });

  // Now delete all user-related datas
  await wipeUser(user, recoveryEntry);

  return {
    configs: {
      filename: `recovery_${DateTime.now().toFormat("yyyy-MM-dd")}_configs.json`,
      data: configs,
    },
    entries: {
      filename: `recovery_${DateTime.now().toFormat("yyyy-MM-dd")}_entries.json`,
      data: entries,
    },
  };
};
