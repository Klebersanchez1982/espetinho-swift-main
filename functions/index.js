import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp();

const AUTHORIZED_ADMIN_EMAILS = new Set([
  'klebersanchez1982@gmail.com',
  'klebervsanchez@gmail.com',
  'master@nabrasa.local',
  'master2@nabrasa.local',
]);

const isAuthorizedByEmail = (email) => {
  if (!email) return false;
  return AUTHORIZED_ADMIN_EMAILS.has(String(email).toLowerCase());
};

const isCaixaByProfile = async (uid) => {
  if (!uid) return false;

  const snapshot = await getFirestore().collection('users').doc(uid).get();
  if (!snapshot.exists) return false;

  const data = snapshot.data() || {};
  if (data.disabled === true) return false;

  const role = data.role;
  const roles = Array.isArray(data.roles) ? data.roles : [];

  return role === 'caixa' || roles.includes('caixa');
};

export const resetUserPasswordAsAdmin = onCall({ region: 'us-central1' }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuario nao autenticado.');
  }

  const callerUid = request.auth.uid;
  const callerEmail = (request.auth.token?.email || '').toString().toLowerCase();

  const canManageByEmail = isAuthorizedByEmail(callerEmail);
  const canManageByRole = await isCaixaByProfile(callerUid);

  if (!canManageByEmail && !canManageByRole) {
    throw new HttpsError('permission-denied', 'Sem permissao para redefinir senha de usuarios.');
  }

  const uid = String(request.data?.uid || '').trim();
  const newPassword = String(request.data?.newPassword || '').trim();

  if (!uid) {
    throw new HttpsError('invalid-argument', 'UID do usuario alvo e obrigatorio.');
  }

  if (newPassword.length < 6) {
    throw new HttpsError('invalid-argument', 'A senha deve ter ao menos 6 caracteres.');
  }

  await getAuth().updateUser(uid, { password: newPassword });

  return { success: true };
});
