from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.regexriddleapi.modules.challenges.models import Attempt, Challenge

User = get_user_model()


class LeaderboardApiTests(APITestCase):
    def test_leaderboard_returns_solver_first_and_last_name(self):
        author = User.objects.create_user(
            username="author",
            email="author@example.com",
            password="StrongPass123!",
            first_name="Ada",
            last_name="Author",
        )
        solver = User.objects.create_user(
            username="solver",
            email="solver@example.com",
            password="StrongPass123!",
            first_name="Mattia",
            last_name="Lemma",
        )
        challenge = Challenge.objects.create(
            author=author,
            title="Codici",
            secret_regex=r"^[A-Z]+$",
            positive_example="ABC",
            negative_example="abc",
        )
        Attempt.objects.create(
            challenge=challenge,
            solver=solver,
            proposed_regex=r"^[A-Z]+$",
            positive_matched=1,
            negative_matched=1,
            total_positive=1,
            total_negative=1,
            solved=True,
            attempt_number=1,
        )

        self.client.force_authenticate(user=solver)
        response = self.client.get("/api/leaderboard")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]["firstName"], "Mattia")
        self.assertEqual(response.data[0]["lastName"], "Lemma")
