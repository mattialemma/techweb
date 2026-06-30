"""Console email delivery adapter used by auth and account workflows."""

from django.conf import settings
from django.core.mail import send_mail


class EmailSender:
    """Sends plain text emails through Django's configured console backend."""

    def send(
        self,
        *,
        email: str,
        plain_subject: str,
        plain_message: str,
    ) -> None:
        send_mail(
            subject=plain_subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )


email_sender = EmailSender()
