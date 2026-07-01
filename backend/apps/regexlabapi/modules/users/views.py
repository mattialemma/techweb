"""View API per registrazione, profilo, avatar e password.

Qui gestisco solo richieste e risposte HTTP. Validazioni e trasformazioni dei
dati stanno nei serializer, mentre la cancellazione avatar sta nei services.
"""

from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import permissions, serializers, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    AvatarFileSerializer,
    NewUserSerializer,
    PasswordUpdateSerializer,
    ProfilePatchSerializer,
    PublicUserSerializer,
)
from .services import remove_avatar_file


# --- Account e profilo ------------------------------------------------------


class RegisterUserView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    @extend_schema(
        operation_id="users_create",
        request=NewUserSerializer,
        responses=PublicUserSerializer,
    )
    def post(self, request):
        serializer = NewUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        data = PublicUserSerializer(user, context={"request": request}).data
        return Response(data, status=status.HTTP_201_CREATED)


class MyProfileView(APIView):
    @extend_schema(operation_id="users_me_retrieve", responses=PublicUserSerializer)
    def get(self, request):
        data = PublicUserSerializer(request.user, context={"request": request}).data
        return Response(data)

    @extend_schema(
        operation_id="users_me_partial_update",
        request=ProfilePatchSerializer,
        responses=PublicUserSerializer,
    )
    def patch(self, request):
        serializer = ProfilePatchSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        data = PublicUserSerializer(user, context={"request": request}).data
        return Response(data)


# --- Avatar ----------------------------------------------------------------


class MyAvatarView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(
        operation_id="users_me_avatar_update",
        request=AvatarFileSerializer,
        responses=PublicUserSerializer,
    )
    def put(self, request):
        serializer = AvatarFileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        profile = request.user.profile
        if profile.avatar:
            profile.avatar.delete(save=False)
        profile.avatar = serializer.validated_data["avatar"]
        profile.save(update_fields=["avatar", "updated_at"])

        data = PublicUserSerializer(request.user, context={"request": request}).data
        return Response(data)

    @extend_schema(operation_id="users_me_avatar_destroy", responses=None)
    def delete(self, request):
        remove_avatar_file(request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


# --- Password ---------------------------------------------------------------


class MyPasswordView(APIView):
    @extend_schema(
        operation_id="users_me_password_update",
        request=PasswordUpdateSerializer,
        responses=inline_serializer(
            name="PasswordChangeResponse",
            fields={"detail": serializers.CharField()},
        ),
    )
    def put(self, request):
        serializer = PasswordUpdateSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Password aggiornata."})
