// File: AccountSettingsPage.tsx
// Scopo: Gestisce profilo, avatar e cambio password dell'utente corrente.
// Livello: Pagina privata
// Dipende da: auth/user feature, parser errori API, primitive form condivise

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";

import {
  useAuth,
  validateAvatar,
  validatePasswordChange,
  validateProfile,
  type ValidationErrors,
} from "@features/auth";
import { changeCurrentPassword } from "@features/auth/api";
import {
  useDeleteCurrentUserAvatar,
  useUpdateCurrentUser,
  useUploadCurrentUserAvatar,
} from "@features/user";
import { parseApiFieldErrors } from "@shared/api";
import { VALIDATION_LIMITS } from "@shared/lib/validation";
import {
  Avatar,
  Button,
  ContentStage,
  FileInput,
  FormField,
  InlineMessage,
  Input,
  Panel,
  PasswordInput,
} from "@shared/ui";

type ProfileDraft = {
  email: string;
  firstName: string;
  lastName: string;
  username: string;
};

type PasswordDraft = {
  confirmPassword: string;
  currentPassword: string;
  newPassword: string;
};

const emptyPasswordDraft: PasswordDraft = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function profileDraftFromUser(user: ReturnType<typeof useAuth>["user"]): ProfileDraft {
  return {
    username: user?.username ?? "",
    email: user?.email ?? "",
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
  };
}

export function AccountSettingsPage() {
  const { user } = useAuth();
  const updateUser = useUpdateCurrentUser();
  const uploadAvatar = useUploadCurrentUserAvatar();
  const deleteAvatar = useDeleteCurrentUserAvatar();
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>(() => profileDraftFromUser(user));
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [message, setMessage] = useState("");
  const [passwordDraft, setPasswordDraft] = useState<PasswordDraft>(emptyPasswordDraft);
  const [passwordErrors, setPasswordErrors] = useState<ValidationErrors>({});
  const [passwordMessage, setPasswordMessage] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  function updateProfileField(field: keyof ProfileDraft, value: string) {
    setProfileDraft((current) => ({ ...current, [field]: value }));
  }

  function updatePasswordField(field: keyof PasswordDraft, value: string) {
    setPasswordDraft((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validateProfile(profileDraft);
    setErrors(nextErrors);
    setMessage("");
    if (Object.keys(nextErrors).length > 0) return;

    try {
      await updateUser.mutateAsync(profileDraft);
      setMessage("Profilo aggiornato.");
    } catch (error) {
      setErrors(parseApiFieldErrors<ValidationErrors>(error));
      setMessage("Aggiornamento non riuscito.");
    }
  }

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const validationError = validateAvatar(file);
    setErrors({});
    setMessage("");
    if (validationError) {
      setErrors({ avatar: validationError });
      return;
    }

    try {
      await uploadAvatar.mutateAsync(file);
      setMessage("Avatar aggiornato.");
    } catch {
      setErrors({ avatar: "Upload avatar non riuscito." });
    } finally {
      event.target.value = "";
    }
  }

  async function handleDeleteAvatar() {
    setMessage("");
    await deleteAvatar.mutateAsync();
    setMessage("Avatar rimosso.");
  }

  async function handlePasswordSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validatePasswordChange(passwordDraft);
    setPasswordErrors(nextErrors);
    setPasswordMessage("");
    if (Object.keys(nextErrors).length > 0) return;

    setIsChangingPassword(true);
    try {
      await changeCurrentPassword(passwordDraft.currentPassword, passwordDraft.newPassword);
      setPasswordDraft(emptyPasswordDraft);
      setPasswordMessage("Password aggiornata.");
    } catch (error) {
      setPasswordErrors(parseApiFieldErrors<ValidationErrors>(error));
      setPasswordMessage("Cambio password non riuscito.");
    } finally {
      setIsChangingPassword(false);
    }
  }

  return (
    <ContentStage eyebrow="Account" title="Impostazioni profilo">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Panel as="aside">
          <Avatar src={user?.avatarUrl} name={user?.username} size="lg" />
          <h2 className="mt-4 text-xl font-bold">{user?.username}</h2>
          <p className="mt-1 break-all text-sm text-slate-400">{user?.email}</p>
          <div className="mt-5 space-y-3">
            <FormField label="Avatar" error={errors.avatar}>
              <FileInput accept="image/*" onChange={handleAvatarChange} />
            </FormField>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={handleDeleteAvatar}
              disabled={!user?.avatarUrl}
              isLoading={deleteAvatar.isPending}
            >
              Rimuovi avatar
            </Button>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {message ? (
                <InlineMessage tone={message.includes("non") ? "error" : "success"}>{message}</InlineMessage>
              ) : null}
              <FormField label="Username" error={errors.username}>
                <Input
                  value={profileDraft.username}
                  maxLength={VALIDATION_LIMITS.username}
                  onChange={(event) => updateProfileField("username", event.target.value)}
                />
              </FormField>
              <FormField label="Email" error={errors.email}>
                <Input
                  inputMode="email"
                  value={profileDraft.email}
                  maxLength={VALIDATION_LIMITS.email}
                  onChange={(event) => updateProfileField("email", event.target.value)}
                />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Nome" error={errors.firstName}>
                  <Input
                    value={profileDraft.firstName}
                    maxLength={VALIDATION_LIMITS.name}
                    onChange={(event) => updateProfileField("firstName", event.target.value)}
                  />
                </FormField>
                <FormField label="Cognome" error={errors.lastName}>
                  <Input
                    value={profileDraft.lastName}
                    maxLength={VALIDATION_LIMITS.name}
                    onChange={(event) => updateProfileField("lastName", event.target.value)}
                  />
                </FormField>
              </div>
              <Button type="submit" isLoading={updateUser.isPending}>
                Salva modifiche
              </Button>
            </form>
          </Panel>

          <Panel>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">Cambia password</h2>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  Inserisci quella attuale e scegli una nuova password.
                </p>
              </div>
              <Link
                className="text-sm font-semibold text-emerald-300 hover:text-emerald-200"
                to="/forgot-password"
              >
                Non la ricordi?
              </Link>
            </div>
            <form className="mt-5 space-y-4" onSubmit={handlePasswordSubmit}>
              {passwordMessage ? (
                <InlineMessage tone={passwordMessage.includes("non") ? "error" : "success"}>
                  {passwordMessage}
                </InlineMessage>
              ) : null}
              <FormField label="Password attuale" error={passwordErrors.currentPassword}>
                <PasswordInput
                  autoComplete="current-password"
                  maxLength={VALIDATION_LIMITS.password}
                  value={passwordDraft.currentPassword}
                  onChange={(event) => updatePasswordField("currentPassword", event.target.value)}
                />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Nuova password" error={passwordErrors.newPassword}>
                  <PasswordInput
                    autoComplete="new-password"
                    maxLength={VALIDATION_LIMITS.password}
                    value={passwordDraft.newPassword}
                    onChange={(event) => updatePasswordField("newPassword", event.target.value)}
                  />
                </FormField>
                <FormField label="Conferma nuova password" error={passwordErrors.confirmPassword}>
                  <PasswordInput
                    autoComplete="new-password"
                    maxLength={VALIDATION_LIMITS.password}
                    value={passwordDraft.confirmPassword}
                    onChange={(event) => updatePasswordField("confirmPassword", event.target.value)}
                  />
                </FormField>
              </div>
              <Button type="submit" isLoading={isChangingPassword}>
                Aggiorna password
              </Button>
            </form>
          </Panel>
        </div>
      </div>
    </ContentStage>
  );
}
