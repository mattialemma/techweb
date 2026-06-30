from django.urls import path

from .views import (
    MyPuzzleAttemptsEndpoint,
    PuzzleAttemptEndpoint,
    PuzzleCollectionEndpoint,
    PuzzleDetailEndpoint,
    SolverRankingEndpoint,
)

urlpatterns = [
    path("challenges", PuzzleCollectionEndpoint.as_view(), name="challenges-list-create"),
    path("leaderboard", SolverRankingEndpoint.as_view(), name="leaderboard"),
    path("challenges/<int:challengeId>", PuzzleDetailEndpoint.as_view(), name="challenges-detail"),
    path(
        "challenges/<int:challengeId>/attempts",
        PuzzleAttemptEndpoint.as_view(),
        name="challenge-attempts-create",
    ),
    path(
        "challenges/<int:challengeId>/attempts/me",
        MyPuzzleAttemptsEndpoint.as_view(),
        name="challenge-attempts-me",
    ),
]
