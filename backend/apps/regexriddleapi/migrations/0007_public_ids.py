"""Add non-enumerable public UUIDs for users and challenges."""

import uuid

from django.db import migrations, models


def populate_public_ids(apps, schema_editor):
    Challenge = apps.get_model("regexriddleapi", "Challenge")
    UserProfile = apps.get_model("regexriddleapi", "UserProfile")

    for challenge in Challenge.objects.filter(public_id__isnull=True):
        challenge.public_id = uuid.uuid4()
        challenge.save(update_fields=["public_id"])

    for profile in UserProfile.objects.filter(public_id__isnull=True):
        profile.public_id = uuid.uuid4()
        profile.save(update_fields=["public_id"])


class Migration(migrations.Migration):
    dependencies = [
        ("regexriddleapi", "0006_unique_user_email_lower"),
    ]

    operations = [
        migrations.AddField(
            model_name="challenge",
            name="public_id",
            field=models.UUIDField(db_index=True, editable=False, null=True, unique=True),
        ),
        migrations.AddField(
            model_name="userprofile",
            name="public_id",
            field=models.UUIDField(db_index=True, editable=False, null=True, unique=True),
        ),
        migrations.RunPython(populate_public_ids, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="challenge",
            name="public_id",
            field=models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True),
        ),
        migrations.AlterField(
            model_name="userprofile",
            name="public_id",
            field=models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True),
        ),
    ]
