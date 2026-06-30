from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("regexriddleapi", "0007_public_ids"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="challenge",
            name="public_id",
        ),
    ]
