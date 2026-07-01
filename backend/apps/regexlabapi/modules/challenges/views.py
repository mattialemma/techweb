"""View API per sfide, tentativi e classifica.

Le view orchestrano query, paginazione e serializer. Le regole di gioco
restano nei file ``rules.py`` e ``attempts.py``.
"""

from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, F, Window
from django.db.models.functions import RowNumber
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from ...api.pagination import DefaultPageNumberPagination
from ..users.serializers import avatar_url_for_user
from .attempts import save_solution_try
from .models import Attempt, Challenge
from .serializers import (
    ChallengeCardSerializer,
    ChallengeDraftSerializer,
    RankingLineSerializer,
    TryDraftSerializer,
    TryResultSerializer,
)

User = get_user_model()


# --- Query condivise --------------------------------------------------------


def challenge_order_from_query(request) -> list[str]:
    """Traduco il parametro ordering nei campi Django usati dalla query."""
    selected_order = request.query_params.get("ordering", "newest")
    if selected_order == "oldest":
        return ["created_at", "id"]
    return ["-created_at", "-id"]


def published_challenges():
    """Base query per mostrare solo sfide pubblicate."""
    return Challenge.objects.filter(is_published=True)


# --- Sfide -----------------------------------------------------------------


class ChallengeListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(operation_id="challenges_list", responses=ChallengeCardSerializer(many=True))
    def get(self, request):
        query = (
            published_challenges()
            .select_related("author", "author__profile")
            .order_by(*challenge_order_from_query(request))
        )
        paginator = DefaultPageNumberPagination()
        page = paginator.paginate_queryset(query, request, view=self)
        data = ChallengeCardSerializer(
            page,
            many=True,
            context={"request": request},
        ).data
        return paginator.get_paginated_response(data)

    @extend_schema(
        operation_id="challenges_create",
        request=ChallengeDraftSerializer,
        responses=ChallengeCardSerializer,
    )
    def post(self, request):
        serializer = ChallengeDraftSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        challenge = serializer.save()
        data = ChallengeCardSerializer(challenge, context={"request": request}).data
        return Response(data, status=status.HTTP_201_CREATED)


class ChallengeDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(operation_id="challenges_retrieve", responses=ChallengeCardSerializer)
    def get(self, request, challengeId):
        challenge = get_object_or_404(
            published_challenges().select_related("author", "author__profile"),
            id=challengeId,
        )
        data = ChallengeCardSerializer(challenge, context={"request": request}).data
        return Response(data)


# --- Tentativi --------------------------------------------------------------


class ChallengeTryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        operation_id="challenge_attempts_create",
        request=TryDraftSerializer,
        responses=TryResultSerializer,
    )
    def post(self, request, challengeId):
        challenge = get_object_or_404(
            published_challenges().prefetch_related("control_strings"),
            id=challengeId,
        )
        serializer = TryDraftSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        attempt = save_solution_try(
            challenge=challenge,
            solver=request.user,
            proposed_regex=serializer.validated_data["proposedRegex"],
        )
        return Response(TryResultSerializer(attempt).data, status=status.HTTP_201_CREATED)


class MyChallengeTriesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        operation_id="challenge_attempts_me_list",
        responses=TryResultSerializer(many=True),
    )
    def get(self, request, challengeId):
        challenge = get_object_or_404(published_challenges(), id=challengeId)
        my_attempts = challenge.attempts.filter(solver=request.user).order_by("-created_at")
        paginator = DefaultPageNumberPagination()
        page = paginator.paginate_queryset(my_attempts, request, view=self)
        data = TryResultSerializer(page, many=True).data
        return paginator.get_paginated_response(data)


# --- Classifica -------------------------------------------------------------


class LeaderboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(operation_id="leaderboard_list", responses=RankingLineSerializer(many=True))
    def get(self, request):
        solved_once = first_successful_attempts()
        ranking_rows = build_ranking_rows(solved_once)

        paginator = DefaultPageNumberPagination()
        page = paginator.paginate_queryset(ranking_rows, request, view=self)
        users = User.objects.select_related("profile").in_bulk(
            [row["solver_id"] for row in page]
        )

        data = [
            build_leaderboard_line(
                rank=paginator.page.start_index() + index,
                row=row,
                user=user,
                request=request,
            )
            for index, row in enumerate(page)
            if (user := users.get(row["solver_id"])) is not None
        ]

        return paginator.get_paginated_response(RankingLineSerializer(data, many=True).data)


def first_successful_attempts():
    """Tengo solo il primo tentativo risolutivo per ogni coppia utente-sfida."""
    return (
        Attempt.objects.filter(solved=True)
        .annotate(
            solve_rank=Window(
                expression=RowNumber(),
                partition_by=[F("solver_id"), F("challenge_id")],
                order_by=F("attempt_number").asc(),
            )
        )
        .filter(solve_rank=1)
    )


def build_ranking_rows(first_solves):
    """Aggrego numero di sfide risolte e media tentativi per ogni utente."""
    return (
        first_solves.values("solver_id")
        .annotate(
            solved_count=Count("challenge_id"),
            average_attempts=Avg("attempt_number"),
        )
        .order_by("-solved_count", "average_attempts", "solver__username")
    )


def build_leaderboard_line(*, rank: int, row: dict, user, request) -> dict:
    return {
        "rank": rank,
        "userId": user.id,
        "username": user.username,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "avatarUrl": avatar_url_for_user(user, request),
        "solvedCount": row["solved_count"],
        "averageAttempts": round(row["average_attempts"], 2),
    }
