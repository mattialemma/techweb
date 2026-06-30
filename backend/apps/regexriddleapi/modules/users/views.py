"""User account API views for registration, profile, avatar, and password changes."""

from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import permissions, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework import serializers
from rest_framework.views import APIView

from .serializers import (
    AvatarUploadSerializer,
    ChangeCurrentPasswordSerializer,
    RegisterUserSerializer,
    UpdateCurrentUserSerializer,
    UserReadSerializer,
)
from .services import remove_avatar_file


class UserCreateView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    @extend_schema(
        operation_id="users_create",
        request=RegisterUserSerializer,
        responses=UserReadSerializer,
    )
    def post(self, request):
        serializer = RegisterUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            UserReadSerializer(user, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class CurrentUserView(APIView):
    @extend_schema(operation_id="users_me_retrieve", responses=UserReadSerializer)
    def get(self, request):
        return Response(UserReadSerializer(request.user, context={"request": request}).data)

    @extend_schema(
        operation_id="users_me_partial_update",
        request=UpdateCurrentUserSerializer,
        responses=UserReadSerializer,
    )
    def patch(self, request):
        serializer = UpdateCurrentUserSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserReadSerializer(user, context={"request": request}).data)


class CurrentUserAvatarView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(
        operation_id="users_me_avatar_update",
        request=AvatarUploadSerializer,
        responses=UserReadSerializer,
    )
    def put(self, request):
        serializer = AvatarUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = request.user.profile
        if profile.avatar:
            profile.avatar.delete(save=False)
        profile.avatar = serializer.validated_data["avatar"]
        profile.save(update_fields=["avatar", "updated_at"])
        return Response(UserReadSerializer(request.user, context={"request": request}).data)

    @extend_schema(operation_id="users_me_avatar_destroy", responses=None)
    def delete(self, request):
        remove_avatar_file(request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class CurrentUserPasswordView(APIView):
    @extend_schema(
        operation_id="users_me_password_update",
        request=ChangeCurrentPasswordSerializer,
        responses=inline_serializer(
            name="PasswordChangeResponse",
            fields={"detail": serializers.CharField()},
        ),
    )
    def put(self, request):
        serializer = ChangeCurrentPasswordSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Password aggiornata."})
