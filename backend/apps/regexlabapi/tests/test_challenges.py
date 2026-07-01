from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework import status
from rest_framework.test import APITestCase

from apps.regexlabapi.modules.challenges.models import Attempt, Challenge
from apps.regexlabapi.modules.challenges.scoring import regex_matches_text

User = get_user_model()


class SlowRegex:
    def fullmatch(self, value, *, timeout):
        raise TimeoutError


class ChallengeServiceTests(APITestCase):
    def test_regex_fullmatch_timeout_returns_validation_error(self):
        with self.assertRaises(serializers.ValidationError) as context:
            regex_matches_text(SlowRegex(), "aaaaaaaaaaaaaaaaaaaa")

        self.assertIn("detail", context.exception.detail)


class LeaderboardApiTests(APITestCase):
    def test_challenges_are_paginated(self):
        author = User.objects.create_user(
            username="author",
            email="author@example.com",
            password="StrongPass123!",
        )
        Challenge.objects.create(
            author=author,
            title="Codici",
            secret_regex=r"^[A-Z]+$",
            positive_example="ABC",
            negative_example="abc",
        )

        self.client.force_authenticate(user=author)
        response = self.client.get("/api/challenges")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["challengeId"], Challenge.objects.get().id)
        self.assertEqual(response.data["results"][0]["title"], "Codici")

    def test_challenge_detail_uses_id(self):
        author = User.objects.create_user(
            username="author",
            email="author@example.com",
            password="StrongPass123!",
        )
        challenge = Challenge.objects.create(
            author=author,
            title="Codici",
            secret_regex=r"^[A-Z]+$",
            positive_example="ABC",
            negative_example="abc",
        )

        self.client.force_authenticate(user=author)
        response = self.client.get(f"/api/challenges/{challenge.id}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["challengeId"], challenge.id)

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
        self.assertEqual(response.data["results"][0]["firstName"], "Mattia")
        self.assertEqual(response.data["results"][0]["lastName"], "Lemma")
