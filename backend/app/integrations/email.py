import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Any, Dict, Optional, List
from app.services.integration_base import IntegrationProvider
import logging
import re

logger = logging.getLogger(__name__)


class EmailIntegration(IntegrationProvider):
    """Email integration provider for sending emails via SMTP."""

    @property
    def integration_type(self) -> str:
        return "email"

    def test_connection(self) -> bool:
        """Test SMTP connection."""
        try:
            smtp_host = self.credentials.get("smtp_host")
            smtp_port = int(self.credentials.get("smtp_port", 587))
            username = self.credentials.get("username")
            password = self.credentials.get("password")

            server = smtplib.SMTP(smtp_host, smtp_port, timeout=5)
            server.starttls()
            server.login(username, password)
            server.quit()
            return True
        except Exception as e:
            logger.error(f"Email test connection failed: {e}")
            return False

    def execute(self, action: str, **kwargs) -> Dict[str, Any]:
        """Execute email action."""
        if action == "send_email":
            return self.send_email(
                to=kwargs.get("to", []),
                subject=kwargs.get("subject", ""),
                body=kwargs.get("body", ""),
                html=kwargs.get("html"),
                cc=kwargs.get("cc", []),
                bcc=kwargs.get("bcc", []),
            )
        elif action == "send_template":
            return self.send_template(
                to=kwargs.get("to", []),
                template=kwargs.get("template", ""),
                variables=kwargs.get("variables", {}),
            )
        else:
            raise ValueError(f"Unknown Email action: {action}")

    def send_email(
        self,
        to: List[str],
        subject: str,
        body: str,
        html: Optional[str] = None,
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Send an email."""
        if not self._validate_email_addresses(to):
            raise ValueError("Invalid email addresses in 'to' field")

        try:
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = self.credentials.get("from_address", self.credentials.get("username"))
            message["To"] = ", ".join(to)

            if cc:
                message["Cc"] = ", ".join(cc)

            message.attach(MIMEText(body, "plain"))
            if html:
                message.attach(MIMEText(html, "html"))

            all_recipients = to + (cc or []) + (bcc or [])
            self._send_via_smtp(message, all_recipients)

            self.log_call("send_email", True, to=to, subject=subject)
            return {"success": True, "message": "Email sent successfully"}

        except Exception as e:
            error_msg = str(e)
            self.log_call("send_email", False, error=error_msg, to=to)
            self.handle_error(error_msg)
            raise

    def send_template(
        self, to: List[str], template: str, variables: Dict[str, str]
    ) -> Dict[str, Any]:
        """Send email using template with variable interpolation."""
        templates = self.config.get("templates", {})
        if template not in templates:
            raise ValueError(f"Template '{template}' not found")

        template_config = templates[template]
        subject = self._interpolate(template_config["subject"], variables)
        body = self._interpolate(template_config["body"], variables)
        html = None
        if "html" in template_config:
            html = self._interpolate(template_config["html"], variables)

        return self.send_email(to=to, subject=subject, body=body, html=html)

    def _validate_email_addresses(self, addresses: List[str]) -> bool:
        """Validate email addresses format."""
        email_regex = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        return all(re.match(email_regex, email) for email in addresses)

    def _interpolate(self, template_str: str, variables: Dict[str, str]) -> str:
        """Interpolate variables in template string."""
        result = template_str
        for key, value in variables.items():
            result = result.replace(f"{{{{{key}}}}}", str(value))
        return result

    def _send_via_smtp(self, message: MIMEMultipart, recipients: List[str]):
        """Send message via SMTP."""
        smtp_host = self.credentials.get("smtp_host")
        smtp_port = int(self.credentials.get("smtp_port", 587))
        username = self.credentials.get("username")
        password = self.credentials.get("password")

        try:
            server = smtplib.SMTP(
                smtp_host, smtp_port, timeout=self.config.get("timeout", 10)
            )
            server.starttls()
            server.login(username, password)
            server.sendmail(message["From"], recipients, message.as_string())
            server.quit()
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"SMTP authentication failed: {e}")
            raise RuntimeError("SMTP authentication failed")
        except smtplib.SMTPException as e:
            logger.error(f"SMTP error: {e}")
            raise RuntimeError(f"SMTP error: {e}")
