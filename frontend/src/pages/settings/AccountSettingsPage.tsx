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
  AppPage,
  Button,
  FileInput,
  FormField,
  InlineMessage,
  Input,
  Panel,
  PasswordInput,
} from "@shared/ui";

export function AccountSettingsPage() {
  const { user } = useAuth();
  const updateUser = useUpdateCurrentUser();
  const uploadAvatar = useUploadCurrentUserAvatar();
  const deleteAvatar = useDeleteCurrentUserAvatar();
  const [values, setValues] = useState({
    username: user?.username ?? "",
    email: user?.email ?? "",
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [message, setMessage] = useState("");
  const [passwordValues, setPasswordValues] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<ValidationErrors>({});
  const [passwordMessage, setPasswordMessage] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validateProfile(values);
    setErrors(nextErrors);
    setMessage("");
    if (Object.keys(nextErrors).length > 0) return;

    try {
      await updateUser.mutateAsync(values);
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
    const nextErrors = validatePasswordChange(passwordValues);
    setPasswordErrors(nextErrors);
    setPasswordMessage("");
    if (Object.keys(nextErrors).length > 0) return;

    setIsChangingPassword(true);
    try {
      await changeCurrentPassword(passwordValues.currentPassword, passwordValues.newPassword);
      setPasswordValues({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordMessage("Password aggiornata.");
    } catch (error) {
      setPasswordErrors(parseApiFieldErrors<ValidationErrors>(error));
      setPasswordMessage("Cambio password non riuscito.");
    } finally {
      setIsChangingPassword(false);
    }
  }

  return (
    <AppPage eyebrow="Account" title="Impostazioni profilo">
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
                  value={values.username}
                  maxLength={VALIDATION_LIMITS.username}
                  onChange={(event) => setValues({ ...values, username: event.target.value })}
                />
              </FormField>
              <FormField label="Email" error={errors.email}>
                <Input
                  inputMode="email"
                  value={values.email}
                  maxLength={VALIDATION_LIMITS.email}
                  onChange={(event) => setValues({ ...values, email: event.target.value })}
                />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Nome" error={errors.firstName}>
                  <Input
                    value={values.firstName}
                    maxLength={VALIDATION_LIMITS.name}
                    onChange={(event) => setValues({ ...values, firstName: event.target.value })}
                  />
                </FormField>
                <FormField label="Cognome" error={errors.lastName}>
                  <Input
                    value={values.lastName}
                    maxLength={VALIDATION_LIMITS.name}
                    onChange={(event) => setValues({ ...values, lastName: event.target.value })}
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
                  value={passwordValues.currentPassword}
                  onChange={(event) =>
                    setPasswordValues({ ...passwordValues, currentPassword: event.target.value })
                  }
                />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Nuova password" error={passwordErrors.newPassword}>
                  <PasswordInput
                    autoComplete="new-password"
                    maxLength={VALIDATION_LIMITS.password}
                    value={passwordValues.newPassword}
                    onChange={(event) =>
                      setPasswordValues({ ...passwordValues, newPassword: event.target.value })
                    }
                  />
                </FormField>
                <FormField label="Conferma nuova password" error={passwordErrors.confirmPassword}>
                  <PasswordInput
                    autoComplete="new-password"
                    maxLength={VALIDATION_LIMITS.password}
                    value={passwordValues.confirmPassword}
                    onChange={(event) =>
                      setPasswordValues({ ...passwordValues, confirmPassword: event.target.value })
                    }
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
    </AppPage>
  );
}
