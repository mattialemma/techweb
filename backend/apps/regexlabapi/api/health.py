""" Health check endpoint utilizzati da Docker """

from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import serializers


class HealthCheckView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(
        operation_id="health_check",
        responses=inline_serializer(
            name="HealthCheckResponse",
            fields={"status": serializers.CharField()},
        ),
    )
    def get(self, request):
        return Response({"status": "ok"})
