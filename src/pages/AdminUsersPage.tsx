import { useEffect, useState } from 'react';
import { Ban, Pencil, ShieldCheck, ShieldOff, Trash2, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  createManagedUserAsAdmin,
  deleteUserProfileAsAdmin,
  setUserDisabledAsAdmin,
  subscribeUsersForAdmin,
  updateUserProfileAsAdmin,
  updateUserRoleAsAdmin,
  type UserProfile,
} from '@/lib/firestore-user-role';
import { UserRole } from '@/types/restaurant';

const roles: UserRole[] = ['garcom', 'assador', 'caixa'];

const labels: Record<UserRole, string> = {
  garcom: 'Garcom',
  assador: 'Assador',
  caixa: 'Caixa',
};

type UserFilter = 'todos' | 'ativos' | 'bloqueados';

const AdminUsersPage = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [blockingUserId, setBlockingUserId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRoles, setNewRoles] = useState<UserRole[]>(['garcom']);
  const [userFilter, setUserFilter] = useState<UserFilter>('todos');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editRoles, setEditRoles] = useState<UserRole[]>([]);
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

  const isProtectedUser = (user: UserProfile) => {
    const username = (user.username ?? '').toLowerCase();
    const email = (user.email ?? '').toLowerCase();
    return username === 'master2' || email === 'master2@nabrasa.local';
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

  const deleteUser = async (user: UserProfile) => {
    if (isProtectedUser(user)) {
      setError('O usuario master2 e protegido e nao pode ser excluido.');
      return;
    }

    const userLabel = user.username || user.email || user.id;
    const confirmed = window.confirm(`Deseja realmente excluir o usuario ${userLabel}?`);
    if (!confirmed) {
      return;
    }

    setDeletingUserId(user.id);
    setError('');
    try {
      await deleteUserProfileAsAdmin(user.id);
    } catch {
      setError('Falha ao excluir usuario. Verifique as permissoes no Firestore.');
    } finally {
      setDeletingUserId(null);
    }
  };

  const toggleBlocked = async (user: UserProfile) => {
    if (isProtectedUser(user)) {
      setError('O usuario master2 e protegido e nao pode ser bloqueado.');
      return;
    }

    setBlockingUserId(user.id);
    setError('');
    try {
      await setUserDisabledAsAdmin(user.id, !user.disabled);
    } catch {
      setError('Falha ao alterar status de bloqueio do usuario.');
    } finally {
      setBlockingUserId(null);
    }
  };

  const openEdit = (user: UserProfile) => {
    setEditingUserId(user.id);
    setEditUsername(user.username ?? '');
    setEditRoles(user.roles.length > 0 ? user.roles : user.role ? [user.role] : ['garcom']);
    setError('');
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setEditUsername('');
    setEditRoles([]);
  };

  const toggleEditRole = (role: UserRole) => {
    setEditRoles((prev) => {
      if (prev.includes(role)) {
        if (prev.length === 1) return prev;
        return prev.filter((r) => r !== role);
      }

      return [...prev, role];
    });
  };

  const saveEdit = async (user: UserProfile) => {
    if (!editUsername.trim()) {
      setError('Informe um username valido para salvar.');
      return;
    }

    setUpdatingUserId(user.id);
    setError('');
    try {
      await updateUserProfileAsAdmin(user.id, {
        username: editUsername,
        roles: editRoles,
        currentRole: user.role,
      });
      cancelEdit();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao salvar edicao do usuario.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (userFilter === 'ativos') return !user.disabled;
    if (userFilter === 'bloqueados') return user.disabled;
    return true;
  });

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

      {!loading && users.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={userFilter === 'todos' ? 'default' : 'secondary'} onClick={() => setUserFilter('todos')}>
            Todos ({users.length})
          </Button>
          <Button
            size="sm"
            variant={userFilter === 'ativos' ? 'default' : 'secondary'}
            onClick={() => setUserFilter('ativos')}
          >
            Ativos ({users.filter((u) => !u.disabled).length})
          </Button>
          <Button
            size="sm"
            variant={userFilter === 'bloqueados' ? 'default' : 'secondary'}
            onClick={() => setUserFilter('bloqueados')}
          >
            Bloqueados ({users.filter((u) => u.disabled).length})
          </Button>
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-border bg-card p-4 text-muted-foreground">Carregando usuarios...</div>
      ) : users.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-4 text-muted-foreground">
          Nenhum usuario com perfil definido ainda.
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-4 text-muted-foreground">
          Nenhum usuario encontrado para este filtro.
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredUsers.map((user) => (
            <div key={user.id} className="rounded-lg border border-border bg-card p-4">
              <div className="mb-3 flex items-center gap-2">
                <UserCog className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium break-all">{user.username ?? 'usuario-nao-definido'}</p>
                  <p className="text-xs text-muted-foreground break-all">{user.email ?? 'Email nao informado'}</p>
                  {user.disabled && (
                    <p className="text-xs font-medium text-destructive">Usuario bloqueado</p>
                  )}
                  {isProtectedUser(user) && (
                    <p className="text-xs font-medium text-primary">Usuario protegido</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <Button
                    key={role}
                    size="sm"
                    variant={(user.roles.length > 0 ? user.roles : user.role ? [user.role] : []).includes(role) ? 'default' : 'secondary'}
                    disabled={updatingUserId === user.id || deletingUserId === user.id || blockingUserId === user.id || user.disabled}
                    onClick={() => toggleRole(user, role)}
                  >
                    {labels[role]}
                  </Button>
                ))}

                <Button
                  size="sm"
                  variant="outline"
                  disabled={updatingUserId === user.id || deletingUserId === user.id || blockingUserId === user.id}
                  onClick={() => openEdit(user)}
                >
                  <Pencil className="h-4 w-4" /> Editar
                </Button>

                <Button
                  size="sm"
                  variant={user.disabled ? 'secondary' : 'warning'}
                  disabled={blockingUserId === user.id || isProtectedUser(user)}
                  onClick={() => toggleBlocked(user)}
                >
                  {user.disabled ? <ShieldOff className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                  {blockingUserId === user.id ? 'Salvando...' : user.disabled ? 'Desbloquear' : 'Bloquear'}
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  disabled={deletingUserId === user.id || isProtectedUser(user) || user.disabled}
                  onClick={() => deleteUser(user)}
                >
                  <Trash2 className="h-4 w-4" />
                  {deletingUserId === user.id ? 'Excluindo...' : 'Excluir'}
                </Button>
              </div>

              {editingUserId === user.id && (
                <div className="mt-4 rounded-md border border-border bg-muted/40 p-3">
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">Edicao de usuario</p>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="username"
                    className="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {roles.map((role) => (
                      <Button
                        key={`edit-${user.id}-${role}`}
                        size="sm"
                        variant={editRoles.includes(role) ? 'default' : 'secondary'}
                        onClick={() => toggleEditRole(role)}
                        disabled={updatingUserId === user.id}
                      >
                        {labels[role]}
                      </Button>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" onClick={() => saveEdit(user)} disabled={updatingUserId === user.id}>
                      {updatingUserId === user.id ? 'Salvando...' : 'Salvar'}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={cancelEdit} disabled={updatingUserId === user.id}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
