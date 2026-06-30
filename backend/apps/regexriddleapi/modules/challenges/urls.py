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
    path("challenges/<uuid:challengeId>", ChallengeDetailView.as_view(), name="challenges-detail"),
    path(
        "challenges/<uuid:challengeId>/attempts",
        ChallengeAttemptCreateView.as_view(),
        name="challenge-attempts-create",
    ),
    path(
        "challenges/<uuid:challengeId>/attempts/me",
        CurrentUserChallengeAttemptsView.as_view(),
        name="challenge-attempts-me",
    ),
]
