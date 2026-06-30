"""User account API views for registration, profile, avatar, and password changes."""

from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import permissions, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework import serializers
from rest_framework.views import APIView

from .serializers import (
    AccountAvatarUploadSerializer,
    AccountCreateSerializer,
    AccountPasswordChangeSerializer,
    AccountReadSerializer,
    AccountUpdateSerializer,
)
from .services import delete_avatar_storage_file


class AccountRegistrationEndpoint(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    @extend_schema(
        operation_id="users_create",
        request=AccountCreateSerializer,
        responses=AccountReadSerializer,
    )
    def post(self, request):
        serializer = AccountCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            AccountReadSerializer(user, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class CurrentAccountEndpoint(APIView):
    @extend_schema(operation_id="users_me_retrieve", responses=AccountReadSerializer)
    def get(self, request):
        return Response(AccountReadSerializer(request.user, context={"request": request}).data)

    @extend_schema(
        operation_id="users_me_partial_update",
        request=AccountUpdateSerializer,
        responses=AccountReadSerializer,
    )
    def patch(self, request):
        serializer = AccountUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(AccountReadSerializer(user, context={"request": request}).data)


class AccountAvatarEndpoint(APIView):
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(
        operation_id="users_me_avatar_update",
        request=AccountAvatarUploadSerializer,
        responses=AccountReadSerializer,
    )
    def put(self, request):
        serializer = AccountAvatarUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = request.user.profile
        if profile.avatar:
            profile.avatar.delete(save=False)
        profile.avatar = serializer.validated_data["avatar"]
        profile.save(update_fields=["avatar", "updated_at"])
        return Response(AccountReadSerializer(request.user, context={"request": request}).data)

    @extend_schema(operation_id="users_me_avatar_destroy", responses=None)
    def delete(self, request):
        delete_avatar_storage_file(request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class AccountPasswordEndpoint(APIView):
    @extend_schema(
        operation_id="users_me_password_update",
        request=AccountPasswordChangeSerializer,
        responses=inline_serializer(
            name="PasswordChangeResponse",
            fields={"detail": serializers.CharField()},
        ),
    )
    def put(self, request):
        serializer = AccountPasswordChangeSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Password aggiornata."})
