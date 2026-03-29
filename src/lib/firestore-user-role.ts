import { collection, doc, onSnapshot, setDoc, type Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserRole } from '@/types/restaurant';

const usersCollection = 'users';
const usersRef = collection(db, usersCollection);

export interface UserProfile {
  id: string;
  email: string | null;
  role: UserRole | null;
}

export const subscribeUserRole = (
  uid: string,
  onRole: (role: UserRole | null) => void,
  onError?: (error: unknown) => void
): Unsubscribe => {
  const userRef = doc(db, usersCollection, uid);

  return onSnapshot(
    userRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onRole(null);
        return;
      }

      const data = snapshot.data() as { role?: UserRole | null };
      onRole(data.role ?? null);
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    }
  );
};

export const setUserRoleInFirestore = async (
  uid: string,
  role: UserRole | null,
  email?: string | null
) => {
  const userRef = doc(db, usersCollection, uid);

  const payload: { role: UserRole | null; updatedAt: Date; email?: string } = {
    role,
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
        const data = snapshotDoc.data() as { role?: UserRole | null; email?: string | null };
        return {
          id: snapshotDoc.id,
          email: data.email ?? null,
          role: data.role ?? null,
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

export const updateUserRoleAsAdmin = async (uid: string, role: UserRole) => {
  const userRef = doc(db, usersCollection, uid);

  await setDoc(
    userRef,
    {
      role,
      updatedAt: new Date(),
    },
    { merge: true }
  );
};
