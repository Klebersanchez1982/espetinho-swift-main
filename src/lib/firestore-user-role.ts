import { deleteApp, initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, deleteUser, getAuth, signOut } from 'firebase/auth';
import { collection, deleteDoc, doc, onSnapshot, setDoc, type Unsubscribe } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { db } from '@/lib/firebase';
import { UserRole } from '@/types/restaurant';
import { normalizeUsername, usernameToEmail } from '@/lib/auth';
import { isAuthorizedAdmin } from '@/lib/authorized-admins';

const usersCollection = 'users';
const usersRef = collection(db, usersCollection);

const getErrorCode = (error: unknown): string => {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return String((error as { code?: unknown }).code ?? '');
  }

  return '';
};

export interface UserProfile {
  id: string;
  email: string | null;
  username: string | null;
  role: UserRole | null;
  roles: UserRole[];
  disabled: boolean;
}

export const subscribeUserRole = (
  uid: string,
  onRole: (role: UserRole | null, roles: UserRole[], disabled: boolean) => void,
  onError?: (error: unknown) => void
): Unsubscribe => {
  const userRef = doc(db, usersCollection, uid);

  return onSnapshot(
    userRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onRole(null, [], false);
        return;
      }

      const data = snapshot.data() as { role?: UserRole | null; roles?: UserRole[] | null; disabled?: boolean | null };
      const roles = Array.isArray(data.roles)
        ? data.roles.filter((r): r is UserRole => r === 'garcom' || r === 'assador' || r === 'caixa')
        : data.role
          ? [data.role]
          : [];

      const disabled = data.disabled === true;

      if (disabled) {
        onRole(null, [], true);
        return;
      }

      onRole(data.role ?? null, roles, false);
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    }
  );
};

export const ensureUserEmailInFirestore = async (uid: string, email: string | null | undefined) => {
  if (!email || !email.trim()) return;

  const normalizedEmail = email.trim().toLowerCase();
  const usernameFromEmail = normalizeUsername(normalizedEmail.split('@')[0] ?? '');

  const userRef = doc(db, usersCollection, uid);

  await setDoc(
    userRef,
    {
      email: normalizedEmail,
      username: usernameFromEmail || null,
      updatedAt: new Date(),
    },
    { merge: true }
  );
};

export const ensureAuthorizedAdminAccess = async (uid: string, email: string | null | undefined) => {
  if (!email || !isAuthorizedAdmin(email)) {
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const usernameFromEmail = normalizeUsername(normalizedEmail.split('@')[0] ?? '');
  const userRef = doc(db, usersCollection, uid);

  await setDoc(
    userRef,
    {
      email: normalizedEmail,
      username: usernameFromEmail || null,
      role: 'caixa',
      roles: ['caixa', 'garcom', 'assador'],
      disabled: false,
      updatedAt: new Date(),
    },
    { merge: true }
  );
};

export const setUserRoleInFirestore = async (
  uid: string,
  role: UserRole | null,
  email?: string | null,
  roles?: UserRole[],
  username?: string | null
) => {
  const userRef = doc(db, usersCollection, uid);

  const normalizedRoles = (roles && roles.length > 0 ? roles : role ? [role] : [])
    .filter((r): r is UserRole => r === 'garcom' || r === 'assador' || r === 'caixa');

  const payload: { role: UserRole | null; roles: UserRole[]; updatedAt: Date; email?: string; username?: string } = {
    role,
    roles: normalizedRoles,
    updatedAt: new Date(),
  };

  if (email && email.trim()) {
    payload.email = email.trim().toLowerCase();
  }

  if (username && username.trim()) {
    payload.username = normalizeUsername(username);
  }

  await setDoc(
    userRef,
    payload,
    { merge: true }
  );
};

export const subscribeUsersForAdmin = (
  onUsers: (users: UserProfile[]) => void,
  onError?: (error: unknown) => void
): Unsubscribe => {
  return onSnapshot(
    usersRef,
    (snapshot) => {
      const users = snapshot.docs.map((snapshotDoc) => {
        const data = snapshotDoc.data() as {
          role?: UserRole | null;
          roles?: UserRole[] | null;
          email?: string | null;
          username?: string | null;
          disabled?: boolean | null;
        };

        const roles = Array.isArray(data.roles)
          ? data.roles.filter((r): r is UserRole => r === 'garcom' || r === 'assador' || r === 'caixa')
          : data.role
            ? [data.role]
            : [];

        return {
          id: snapshotDoc.id,
          email: data.email ?? null,
          username: data.username ?? null,
          role: data.role ?? null,
          roles,
          disabled: data.disabled === true,
        } satisfies UserProfile;
      });

      onUsers(users);
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    }
  );
};

export const updateUserRoleAsAdmin = async (uid: string, roles: UserRole[], currentRole?: UserRole | null) => {
  const userRef = doc(db, usersCollection, uid);

  const normalizedRoles = roles.filter((r): r is UserRole => r === 'garcom' || r === 'assador' || r === 'caixa');
  const nextRole =
    (currentRole && normalizedRoles.includes(currentRole) ? currentRole : normalizedRoles[0]) ?? null;

  await setDoc(
    userRef,
    {
      role: nextRole,
      roles: normalizedRoles,
      updatedAt: new Date(),
    },
    { merge: true }
  );
};

export const createManagedUserAsAdmin = async (
  username: string,
  password: string,
  roles: UserRole[]
) => {
  const normalizedRoles = roles.filter((r): r is UserRole => r === 'garcom' || r === 'assador' || r === 'caixa');
  if (normalizedRoles.length === 0) {
    throw new Error('Selecione ao menos um modulo para o novo usuario.');
  }

  const normalizedUsername = normalizeUsername(username);
  if (!/^[a-z0-9._-]{3,40}$/.test(normalizedUsername)) {
    throw new Error('Usuario invalido. Use 3-40 caracteres: letras, numeros, ponto, underline ou hifen.');
  }

  if ((password || '').trim().length < 6) {
    throw new Error('Senha deve ter ao menos 6 caracteres.');
  }

  const email = usernameToEmail(normalizedUsername);
  const secondaryAppName = `provision-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const secondaryApp = initializeApp(firebaseApp.options, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const createdUid = credential.user.uid;

    try {
      await setDoc(
        doc(db, usersCollection, createdUid),
        {
          email,
          username: normalizedUsername,
          role: normalizedRoles[0],
          roles: normalizedRoles,
          disabled: false,
          updatedAt: new Date(),
        },
        { merge: true }
      );
    } catch (firestoreError) {
      // Rollback: remove usuario recém-criado do Auth para evitar cadastro parcial.
      if (secondaryAuth.currentUser) {
        await deleteUser(secondaryAuth.currentUser).catch(() => undefined);
      }

      const firestoreCode = getErrorCode(firestoreError);
      if (firestoreCode === 'permission-denied') {
        throw new Error('Permissao negada para gravar usuario no Firestore. Verifique perfil caixa/admin e regras de users.');
      }

      throw new Error('Falha ao gravar usuario no Firestore. Cadastro revertido no Authentication.');
    }

    return { uid: createdUid, email, username: normalizedUsername };
  } catch (error) {
    const code = getErrorCode(error);
    if (code === 'auth/email-already-in-use') {
      throw new Error('Usuario ja existe. Escolha outro nome de usuario.');
    }
    if (code === 'auth/weak-password') {
      throw new Error('Senha fraca. Use ao menos 6 caracteres.');
    }

    throw error;
  } finally {
    await signOut(secondaryAuth).catch(() => undefined);
    await deleteApp(secondaryApp).catch(() => undefined);
  }
};

export const deleteUserProfileAsAdmin = async (uid: string) => {
  await deleteDoc(doc(db, usersCollection, uid));
};

export const setUserDisabledAsAdmin = async (uid: string, disabled: boolean) => {
  const userRef = doc(db, usersCollection, uid);

  await setDoc(
    userRef,
    {
      disabled,
      updatedAt: new Date(),
    },
    { merge: true }
  );
};
