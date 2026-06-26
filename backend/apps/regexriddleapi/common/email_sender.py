"""Email delivery adapter used by auth and account workflows."""

from django.conf import settings
from django.core.mail import EmailMessage, send_mail


class EmailSender:
    """Sends plain dev emails or Brevo template emails from one stable interface."""

    def send(
        self,
        *,
        email: str,
        plain_subject: str,
        plain_message: str,
        brevo_template_id: str | int | None = None,
        brevo_merge_data: dict[str, object] | None = None,
    ) -> None:
        provider = getattr(settings, "EMAIL_PROVIDER", "console").lower()
        if provider == "brevo":
            self._send_brevo_template_email(
                email=email,
                template_id=brevo_template_id,
                merge_data=brevo_merge_data or {},
            )
            return

        self._send_plain_text_email(
            email=email,
            subject=plain_subject,
            message=plain_message,
        )

    def _send_brevo_template_email(
        self,
        *,
        email: str,
        template_id: str | int | None,
        merge_data: dict[str, object],
    ) -> None:
        if not template_id:
            raise RuntimeError("BREVO_OTP_TEMPLATE_ID is required when EMAIL_PROVIDER=brevo")

        message = EmailMessage(
            subject=None,
            body="",
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[email],
        )
        message.template_id = int(template_id)
        message.merge_global_data = merge_data

        sender_name = getattr(settings, "BREVO_SENDER_NAME", "").strip()
        if sender_name:
            message.from_email = f"{sender_name} <{settings.DEFAULT_FROM_EMAIL}>"

        message.send(fail_silently=False)

    def _send_plain_text_email(self, *, email: str, subject: str, message: str) -> None:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )


email_sender = EmailSender()
