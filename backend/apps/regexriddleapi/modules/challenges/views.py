"""Challenge API views for listing, solving, attempt history, and leaderboard."""

from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, F, Window
from django.db.models.functions import RowNumber
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from ...api.pagination import DefaultPageNumberPagination
from ..users.serializers import build_avatar_url
from .models import Attempt, Challenge
from .serializers import (
    AttemptCreateSerializer,
    AttemptReadSerializer,
    ChallengeCreateSerializer,
    ChallengeReadSerializer,
    LeaderboardEntrySerializer,
)
from .attempts import record_attempt_for_challenge

User = get_user_model()


def resolve_challenge_sort_fields(request) -> list[str]:
    ordering = request.query_params.get("ordering", "newest")
    return ["created_at", "id"] if ordering == "oldest" else ["-created_at", "-id"]


class PuzzleCollectionEndpoint(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(operation_id="challenges_list", responses=ChallengeReadSerializer(many=True))
    def get(self, request):
        challenges = (
            Challenge.objects.filter(is_published=True)
            .select_related("author", "author__profile")
            .order_by(*resolve_challenge_sort_fields(request))
        )
        paginator = DefaultPageNumberPagination()
        page = paginator.paginate_queryset(challenges, request, view=self)
        serializer = ChallengeReadSerializer(
            page,
            many=True,
            context={"request": request},
        )
        return paginator.get_paginated_response(serializer.data)

    @extend_schema(
        operation_id="challenges_create",
        request=ChallengeCreateSerializer,
        responses=ChallengeReadSerializer,
    )
    def post(self, request):
        serializer = ChallengeCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        challenge = serializer.save()
        read_serializer = ChallengeReadSerializer(challenge, context={"request": request})
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)


class PuzzleDetailEndpoint(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(operation_id="challenges_retrieve", responses=ChallengeReadSerializer)
    def get(self, request, challengeId):
        challenge = get_object_or_404(
            Challenge.objects.select_related("author", "author__profile"),
            id=challengeId,
            is_published=True,
        )
        serializer = ChallengeReadSerializer(challenge, context={"request": request})
        return Response(serializer.data)


class PuzzleAttemptEndpoint(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        operation_id="challenge_attempts_create",
        request=AttemptCreateSerializer,
        responses=AttemptReadSerializer,
    )
    def post(self, request, challengeId):
        challenge = get_object_or_404(
            Challenge.objects.prefetch_related("control_strings"),
            id=challengeId,
            is_published=True,
        )
        serializer = AttemptCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        attempt = record_attempt_for_challenge(
            challenge=challenge,
            solver=request.user,
            proposed_regex=serializer.validated_data["proposedRegex"],
        )
        return Response(AttemptReadSerializer(attempt).data, status=status.HTTP_201_CREATED)


class MyPuzzleAttemptsEndpoint(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        operation_id="challenge_attempts_me_list",
        responses=AttemptReadSerializer(many=True),
    )
    def get(self, request, challengeId):
        challenge = get_object_or_404(Challenge, id=challengeId, is_published=True)
        attempts = challenge.attempts.filter(solver=request.user).order_by("-created_at")
        paginator = DefaultPageNumberPagination()
        page = paginator.paginate_queryset(attempts, request, view=self)
        return paginator.get_paginated_response(AttemptReadSerializer(page, many=True).data)


class SolverRankingEndpoint(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(operation_id="leaderboard_list", responses=LeaderboardEntrySerializer(many=True))
    def get(self, request):
        first_solved_attempts = (
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
        leaderboard_entries = (
            first_solved_attempts.values("solver_id")
            .annotate(
                solved_count=Count("challenge_id"),
                average_attempts=Avg("attempt_number"),
            )
            .order_by("-solved_count", "average_attempts", "solver__username")
        )

        paginator = DefaultPageNumberPagination()
        page = paginator.paginate_queryset(leaderboard_entries, request, view=self)
        users = User.objects.select_related("profile").in_bulk(
            [entry["solver_id"] for entry in page]
        )

        response_data = [
            {
                "rank": paginator.page.start_index() + index,
                "userId": user.id,
                "username": user.username,
                "firstName": user.first_name,
                "lastName": user.last_name,
                "avatarUrl": build_avatar_url(user, request),
                "solvedCount": entry["solved_count"],
                "averageAttempts": round(entry["average_attempts"], 2),
            }
            for index, entry in enumerate(page)
            if (user := users.get(entry["solver_id"])) is not None
        ]

        return paginator.get_paginated_response(
            LeaderboardEntrySerializer(response_data, many=True).data
        )
