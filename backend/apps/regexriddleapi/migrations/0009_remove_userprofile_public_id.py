from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("regexriddleapi", "0008_remove_challenge_public_id"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="userprofile",
            name="public_id",
        ),
    ]
