"""Add a database guard for case-insensitive user email uniqueness."""

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("regexriddleapi", "0005_passwordresetotp"),
    ]

    operations = [
        migrations.RunSQL(
            sql=(
                "CREATE UNIQUE INDEX IF NOT EXISTS auth_user_email_lower_unique "
                "ON auth_user (LOWER(email)) WHERE email <> '';"
            ),
            reverse_sql="DROP INDEX IF EXISTS auth_user_email_lower_unique;",
        ),
    ]
