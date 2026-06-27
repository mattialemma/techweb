from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Attempt, Challenge
from .serializers import (
    AttemptCreateSerializer,
    AttemptReadSerializer,
    ChallengeCreateSerializer,
    ChallengeReadSerializer,
    LeaderboardEntrySerializer,
)
from .services import create_attempt_for_challenge
from ..users.serializers import user_avatar_url


class ChallengeListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        challenges = (
            Challenge.objects.filter(is_published=True)
            .select_related("author", "author__profile")
            .order_by("-created_at")
        )
        serializer = ChallengeReadSerializer(
            challenges,
            many=True,
            context={"request": request},
        )
        return Response(serializer.data)

    def post(self, request):
        serializer = ChallengeCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        challenge = serializer.save()
        read_serializer = ChallengeReadSerializer(challenge, context={"request": request})
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)


class ChallengeDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, challengeId: int):
        challenge = get_object_or_404(
            Challenge.objects.select_related("author", "author__profile"),
            pk=challengeId,
            is_published=True,
        )
        serializer = ChallengeReadSerializer(challenge, context={"request": request})
        return Response(serializer.data)


class ChallengeAttemptCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, challengeId: int):
        challenge = get_object_or_404(
            Challenge.objects.prefetch_related("control_strings"),
            pk=challengeId,
            is_published=True,
        )
        serializer = AttemptCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        attempt = create_attempt_for_challenge(
            challenge=challenge,
            solver=request.user,
            proposed_regex=serializer.validated_data["proposedRegex"],
        )
        return Response(AttemptReadSerializer(attempt).data, status=status.HTTP_201_CREATED)


class CurrentUserChallengeAttemptsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, challengeId: int):
        challenge = get_object_or_404(Challenge, pk=challengeId, is_published=True)
        attempts = challenge.attempts.filter(solver=request.user).order_by("-created_at")
        return Response(AttemptReadSerializer(attempts, many=True).data)


class LeaderboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        solved_attempts = (
            Attempt.objects.filter(solved=True)
            .select_related("solver", "solver__profile")
            .order_by("solver_id", "challenge_id", "attempt_number")
        )

        first_solved_by_user_and_challenge = {}
        for attempt in solved_attempts:
            key = (attempt.solver_id, attempt.challenge_id)
            if key not in first_solved_by_user_and_challenge:
                first_solved_by_user_and_challenge[key] = attempt

        grouped = {}
        for attempt in first_solved_by_user_and_challenge.values():
            entry = grouped.setdefault(
                attempt.solver_id,
                {
                    "user": attempt.solver,
                    "attempt_numbers": [],
                },
            )
            entry["attempt_numbers"].append(attempt.attempt_number)

        leaderboard_entries = []
        for entry in grouped.values():
            attempt_numbers = entry["attempt_numbers"]
            solved_count = len(attempt_numbers)
            average_attempts = sum(attempt_numbers) / solved_count if solved_count else 0
            user = entry["user"]
            leaderboard_entries.append(
                {
                    "user": user,
                    "solvedCount": solved_count,
                    "averageAttempts": round(average_attempts, 2),
                }
            )

        leaderboard_entries.sort(
            key=lambda entry: (
                -entry["solvedCount"],
                entry["averageAttempts"],
                entry["user"].username.lower(),
            )
        )

        response_data = [
            {
                "rank": index + 1,
                "userId": entry["user"].id,
                "username": entry["user"].username,
                "firstName": entry["user"].first_name,
                "lastName": entry["user"].last_name,
                "avatarUrl": user_avatar_url(entry["user"], request),
                "solvedCount": entry["solvedCount"],
                "averageAttempts": entry["averageAttempts"],
            }
            for index, entry in enumerate(leaderboard_entries)
        ]

        return Response(LeaderboardEntrySerializer(response_data, many=True).data)
