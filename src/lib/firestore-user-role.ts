import { collection, doc, onSnapshot, setDoc, type Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserRole } from '@/types/restaurant';

const usersCollection = 'users';
const usersRef = collection(db, usersCollection);

export interface UserProfile {
  id: string;
  email: string | null;
  role: UserRole | null;
  roles: UserRole[];
}

export const subscribeUserRole = (
  uid: string,
  onRole: (role: UserRole | null, roles: UserRole[]) => void,
  onError?: (error: unknown) => void
): Unsubscribe => {
  const userRef = doc(db, usersCollection, uid);

  return onSnapshot(
    userRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onRole(null, []);
        return;
      }

      const data = snapshot.data() as { role?: UserRole | null; roles?: UserRole[] | null };
      const roles = Array.isArray(data.roles)
        ? data.roles.filter((r): r is UserRole => r === 'garcom' || r === 'assador' || r === 'caixa')
        : data.role
          ? [data.role]
          : [];

      onRole(data.role ?? null, roles);
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

  const userRef = doc(db, usersCollection, uid);

  await setDoc(
    userRef,
    {
      email: email.trim().toLowerCase(),
      updatedAt: new Date(),
    },
    { merge: true }
  );
};

export const setUserRoleInFirestore = async (
  uid: string,
  role: UserRole | null,
  email?: string | null,
  roles?: UserRole[]
) => {
  const userRef = doc(db, usersCollection, uid);

  const normalizedRoles = (roles && roles.length > 0 ? roles : role ? [role] : [])
    .filter((r): r is UserRole => r === 'garcom' || r === 'assador' || r === 'caixa');

  const payload: { role: UserRole | null; roles: UserRole[]; updatedAt: Date; email?: string } = {
    role,
    roles: normalizedRoles,
    updatedAt: new Date(),
  };

  if (email && email.trim()) {
    payload.email = email.trim().toLowerCase();
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
        };

        const roles = Array.isArray(data.roles)
          ? data.roles.filter((r): r is UserRole => r === 'garcom' || r === 'assador' || r === 'caixa')
          : data.role
            ? [data.role]
            : [];

        return {
          id: snapshotDoc.id,
          email: data.email ?? null,
          role: data.role ?? null,
          roles,
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
