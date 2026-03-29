// Lista de e-mails autorizados para acessar conta de Caixa (Admin)
// Adicione aqui os e-mails que podem ser administrador
export const AUTHORIZED_ADMIN_EMAILS = [
  'klebersanchez1982@gmail.com',
  'master@nabrasa.local',
  // Adicione mais e-mails de admins aqui
];

export const isAuthorizedAdmin = (email: string | null | undefined): boolean => {
  if (!email) return false;
  return AUTHORIZED_ADMIN_EMAILS.some((adminEmail) => 
    adminEmail.toLowerCase() === email.toLowerCase()
  );
};
