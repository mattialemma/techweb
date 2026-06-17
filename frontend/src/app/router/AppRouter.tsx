import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { PublicOnly, RequireAuth } from "./guards";
import { LoginPage } from "@pages/auth/LoginPage";
import { ForgotPasswordPage } from "@pages/auth/ForgotPasswordPage";
import { RegisterPage } from "@pages/auth/RegisterPage";
import { ResetPasswordPage } from "@pages/auth/ResetPasswordPage";
import { ChallengesPage } from "@pages/challenges/ChallengesPage";
import { ChallengeDetailPage } from "@pages/challenges/ChallengeDetailPage";
import { CreateChallengePage } from "@pages/challenges/CreateChallengePage";
import { LeaderboardPage } from "@pages/leaderboard/LeaderboardPage";
import { HowToPlayPage } from "@pages/public/HowToPlayPage";
import { LandingPage } from "@pages/public/LandingPage";
import { AccountSettingsPage } from "@pages/settings/AccountSettingsPage";
import { PageShell } from "@widgets/PageShell";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PageShell />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/how-to-play" element={<HowToPlayPage />} />
          <Route
            path="/challenges"
            element={
              <RequireAuth>
                <ChallengesPage />
              </RequireAuth>
            }
          />
          <Route
            path="/challenges/new"
            element={
              <RequireAuth>
                <CreateChallengePage />
              </RequireAuth>
            }
          />
          <Route
            path="/challenges/:challengeId"
            element={
              <RequireAuth>
                <ChallengeDetailPage />
              </RequireAuth>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <RequireAuth>
                <LeaderboardPage />
              </RequireAuth>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireAuth>
                <AccountSettingsPage />
              </RequireAuth>
            }
          />
        </Route>
        <Route
          path="/login"
          element={
            <PublicOnly>
              <LoginPage />
            </PublicOnly>
          }
        />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/forgot-password/verify" element={<ResetPasswordPage />} />
        <Route
          path="/register"
          element={
            <PublicOnly>
              <RegisterPage />
            </PublicOnly>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
