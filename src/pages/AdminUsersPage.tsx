import { useEffect, useState } from 'react';
import { ShieldCheck, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createManagedUserAsAdmin, subscribeUsersForAdmin, updateUserRoleAsAdmin, type UserProfile } from '@/lib/firestore-user-role';
import { UserRole } from '@/types/restaurant';

const roles: UserRole[] = ['garcom', 'assador', 'caixa'];

const labels: Record<UserRole, string> = {
  garcom: 'Garcom',
  assador: 'Assador',
  caixa: 'Caixa',
};

const AdminUsersPage = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRoles, setNewRoles] = useState<UserRole[]>(['garcom']);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeUsersForAdmin(
      (nextUsers) => {
        setUsers(nextUsers);
        setLoading(false);
      },
      () => {
        setError('Nao foi possivel carregar usuarios. Verifique as regras do Firestore.');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const toggleRole = async (user: UserProfile, role: UserRole) => {
    const currentRoles = user.roles.length > 0 ? user.roles : user.role ? [user.role] : [];
    const hasRole = currentRoles.includes(role);
    const nextRoles = hasRole
      ? currentRoles.filter((r) => r !== role)
      : [...currentRoles, role];

    if (nextRoles.length === 0) {
      setError('Selecione pelo menos um modulo para o usuario.');
      return;
    }

    setUpdatingUserId(user.id);
    setError('');
    try {
      await updateUserRoleAsAdmin(user.id, nextRoles, user.role);
    } catch {
      setError('Falha ao atualizar modulos do usuario.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const toggleNewRole = (role: UserRole) => {
    setNewRoles((prev) => {
      if (prev.includes(role)) {
        if (prev.length === 1) return prev;
        return prev.filter((r) => r !== role);
      }

      return [...prev, role];
    });
  };

  const createUser = async () => {
    if (!newUsername.trim() || !newPassword.trim()) {
      setError('Preencha usuario e senha para criar o novo acesso.');
      return;
    }

    if (newPassword.trim().length < 6) {
      setError('Senha deve ter ao menos 6 caracteres.');
      return;
    }

    setCreating(true);
    setError('');
    try {
      await createManagedUserAsAdmin(newUsername.trim(), newPassword, newRoles);
      setNewUsername('');
      setNewPassword('');
      setNewRoles(['garcom']);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao criar usuario.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <h2 className="font-display text-2xl font-bold">Administracao de Usuarios</h2>
      </div>

      <p className="text-sm text-muted-foreground">
        Somente perfil Caixa pode visualizar e alterar perfis de usuarios.
      </p>

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Novo usuario</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="usuario"
            className="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="senha"
            className="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {roles.map((role) => (
            <Button
              key={`create-${role}`}
              size="sm"
              variant={newRoles.includes(role) ? 'default' : 'secondary'}
              disabled={creating}
              onClick={() => toggleNewRole(role)}
            >
              {labels[role]}
            </Button>
          ))}
        </div>
        <Button className="mt-3" disabled={creating} onClick={createUser}>
          {creating ? 'Criando...' : 'Criar usuario'}
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-border bg-card p-4 text-muted-foreground">Carregando usuarios...</div>
      ) : users.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-4 text-muted-foreground">
          Nenhum usuario com perfil definido ainda.
        </div>
      ) : (
        <div className="grid gap-3">
          {users.map((user) => (
            <div key={user.id} className="rounded-lg border border-border bg-card p-4">
              <div className="mb-3 flex items-center gap-2">
                <UserCog className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium break-all">{user.username ?? 'usuario-nao-definido'}</p>
                  <p className="text-xs text-muted-foreground break-all">{user.email ?? 'Email nao informado'}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <Button
                    key={role}
                    size="sm"
                    variant={(user.roles.length > 0 ? user.roles : user.role ? [user.role] : []).includes(role) ? 'default' : 'secondary'}
                    disabled={updatingUserId === user.id}
                    onClick={() => toggleRole(user, role)}
                  >
                    {labels[role]}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
