"""Rotte delle sfide: lista, dettaglio, tentativi e classifica."""

from django.urls import path

from .views import (
    ChallengeDetailView,
    ChallengeListView,
    ChallengeTryView,
    LeaderboardView,
    MyChallengeTriesView,
)


# Gli URL restano uguali: cambia solo l'organizzazione interna del modulo.
urlpatterns = [
    path("challenges", ChallengeListView.as_view(), name="challenges-list-create"),
    path("leaderboard", LeaderboardView.as_view(), name="leaderboard"),
    path("challenges/<int:challengeId>", ChallengeDetailView.as_view(), name="challenges-detail"),
    path(
        "challenges/<int:challengeId>/attempts",
        ChallengeTryView.as_view(),
        name="challenge-attempts-create",
    ),
    path(
        "challenges/<int:challengeId>/attempts/me",
        MyChallengeTriesView.as_view(),
        name="challenge-attempts-me",
    ),
]
