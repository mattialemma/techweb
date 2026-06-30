from django.urls import path

from .views import (
    ChallengeAttemptCreateView,
    ChallengeDetailView,
    ChallengeListCreateView,
    CurrentUserChallengeAttemptsView,
    LeaderboardView,
)

urlpatterns = [
    path("challenges", ChallengeListCreateView.as_view(), name="challenges-list-create"),
    path("leaderboard", LeaderboardView.as_view(), name="leaderboard"),
    path("challenges/<int:challengeId>", ChallengeDetailView.as_view(), name="challenges-detail"),
    path(
        "challenges/<int:challengeId>/attempts",
        ChallengeAttemptCreateView.as_view(),
        name="challenge-attempts-create",
    ),
    path(
        "challenges/<int:challengeId>/attempts/me",
        CurrentUserChallengeAttemptsView.as_view(),
        name="challenge-attempts-me",
    ),
]
