import pytest
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient
import json
import os
from unittest.mock import patch, MagicMock

from app.db import SessionLocal, Base, engine
from app.models.integration import Integration, IntegrationStatus
from app.services.encryption import EncryptionService, get_encryption_service
from app.services.integration_base import IntegrationProvider, IntegrationExecutor


@pytest.fixture
def setup_encryption():
    os.environ["ENCRYPTION_KEY"] = "test_key_for_testing_only_needs_to_be_32_chars_minimum_or_base64"
    import cryptography.fernet
    os.environ["ENCRYPTION_KEY"] = cryptography.fernet.Fernet.generate_key().decode()
    yield
    if "ENCRYPTION_KEY" in os.environ:
        del os.environ["ENCRYPTION_KEY"]


@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)


class TestEncryptionService:
    def test_encrypt_decrypt_credentials(self, setup_encryption):
        encryption_service = EncryptionService()
        creds = {"api_key": "secret123", "username": "admin"}

        encrypted = encryption_service.encrypt(creds)
        assert isinstance(encrypted, str)
        assert encrypted != json.dumps(creds)

        decrypted = encryption_service.decrypt(encrypted)
        assert decrypted == creds

    def test_encrypt_decrypt_complex_data(self, setup_encryption):
        encryption_service = EncryptionService()
        creds = {
            "webhook_url": "https://example.com/webhook",
            "headers": {"Authorization": "Bearer token123"},
            "settings": {"timeout": 30, "retries": 3},
        }

        encrypted = encryption_service.encrypt(creds)
        decrypted = encryption_service.decrypt(encrypted)
        assert decrypted == creds


class TestIntegrationProvider:
    def test_custom_provider_implementation(self):
        class SlackProvider(IntegrationProvider):
            @property
            def integration_type(self) -> str:
                return "slack"

            def test_connection(self) -> bool:
                return "webhook_url" in self.credentials

            def execute(self, action: str, **kwargs):
                if action == "send_message":
                    return {"message_id": "123", "sent": True}
                return {}

        creds = {"webhook_url": "https://hooks.slack.com/services/xxx"}
        provider = SlackProvider(creds)

        assert provider.integration_type == "slack"
        assert provider.test_connection() is True

        result = provider.execute("send_message", text="Hello")
        assert result["message_id"] == "123"

        provider.log_call("send_message", True)
        assert provider.call_count == 1

    def test_integration_executor(self):
        class MockProvider(IntegrationProvider):
            @property
            def integration_type(self) -> str:
                return "test"

            def test_connection(self) -> bool:
                return True

            def execute(self, action: str, **kwargs):
                if action == "fail":
                    raise Exception("Test error")
                return {"status": "ok"}

        provider = MockProvider({})
        executor = IntegrationExecutor(provider)

        result = executor.execute("success")
        assert result["success"] is True
        assert result["data"]["status"] == "ok"

        result = executor.execute("fail")
        assert result["success"] is False
        assert "error" in result


class TestIntegrationModel:
    def test_create_integration(self, db_session, setup_encryption):
        encryption_service = EncryptionService()
        creds = {"api_key": "test123"}
        encrypted = encryption_service.encrypt(creds)

        integration = Integration(
            id="int-001",
            type="slack",
            name="Production Slack",
            credentials=encrypted,
            config={"channel": "#alerts"},
            status=IntegrationStatus.ACTIVE,
        )
        db_session.add(integration)
        db_session.commit()

        retrieved = db_session.query(Integration).filter_by(id="int-001").first()
        assert retrieved is not None
        assert retrieved.type == "slack"
        assert retrieved.name == "Production Slack"
        assert retrieved.status == IntegrationStatus.ACTIVE

    def test_integration_soft_delete(self, db_session, setup_encryption):
        encryption_service = EncryptionService()
        creds = encryption_service.encrypt({"key": "value"})

        integration = Integration(
            id="int-002",
            type="email",
            name="SMTP Config",
            credentials=creds,
            status=IntegrationStatus.ACTIVE,
        )
        db_session.add(integration)
        db_session.commit()

        from datetime import datetime
        integration.deleted_at = datetime.utcnow()
        db_session.commit()

        active = db_session.query(Integration).filter(
            Integration.id == "int-002",
            Integration.deleted_at == None,
        ).first()
        assert active is None

        all_including_deleted = db_session.query(Integration).filter(
            Integration.id == "int-002"
        ).first()
        assert all_including_deleted is not None
        assert all_including_deleted.deleted_at is not None


class TestIntegrationAPI:
    @pytest.fixture
    def client(self, setup_encryption):
        from main import app
        return TestClient(app)

    def test_create_integration_api(self, client, db_session):
        payload = {
            "type": "slack",
            "name": "Test Slack",
            "credentials": {"webhook_url": "https://hooks.slack.com/xxx"},
            "config": {"channel": "#alerts"},
        }
        response = client.post("/api/integrations", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["type"] == "slack"
        assert data["name"] == "Test Slack"
        assert data["status"] == "active"

    def test_list_integrations_api(self, client, db_session, setup_encryption):
        encryption_service = EncryptionService()

        for i in range(3):
            integration = Integration(
                id=f"int-{i}",
                type="slack" if i < 2 else "email",
                name=f"Integration {i}",
                credentials=encryption_service.encrypt({"key": f"value{i}"}),
                status=IntegrationStatus.ACTIVE,
            )
            db_session.add(integration)
        db_session.commit()

        response = client.get("/api/integrations")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3

    def test_get_integration_api(self, client, db_session, setup_encryption):
        encryption_service = EncryptionService()
        integration = Integration(
            id="int-test",
            type="webhook",
            name="Test Webhook",
            credentials=encryption_service.encrypt({"url": "https://example.com"}),
            status=IntegrationStatus.ACTIVE,
        )
        db_session.add(integration)
        db_session.commit()

        response = client.get("/api/integrations/int-test")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "int-test"
        assert data["type"] == "webhook"

    def test_get_nonexistent_integration(self, client):
        response = client.get("/api/integrations/nonexistent")
        assert response.status_code == 404

    def test_delete_integration_api(self, client, db_session, setup_encryption):
        encryption_service = EncryptionService()
        integration = Integration(
            id="int-delete",
            type="email",
            name="Delete Test",
            credentials=encryption_service.encrypt({"smtp": "server"}),
            status=IntegrationStatus.ACTIVE,
        )
        db_session.add(integration)
        db_session.commit()

        response = client.delete("/api/integrations/int-delete")
        assert response.status_code == 204

        deleted = db_session.query(Integration).filter(
            Integration.id == "int-delete",
            Integration.deleted_at == None,
        ).first()
        assert deleted is None

    def test_test_integration_api(self, client, db_session, setup_encryption):
        encryption_service = EncryptionService()
        integration = Integration(
            id="int-test-conn",
            type="slack",
            name="Test Connection",
            credentials=encryption_service.encrypt({"webhook_url": "https://hooks.slack.com"}),
            status=IntegrationStatus.ACTIVE,
        )
        db_session.add(integration)
        db_session.commit()

        response = client.post("/api/integrations/int-test-conn/test")
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert "message" in data


class TestSlackIntegration:
    def test_slack_provider_initialization(self):
        from app.integrations.slack import SlackIntegration

        creds = {"webhook_url": "https://hooks.slack.com/services/xxx"}
        slack = SlackIntegration(creds)
        assert slack.integration_type == "slack"

    def test_slack_send_message(self):
        from app.integrations.slack import SlackIntegration
        from unittest.mock import patch, MagicMock

        creds = {"webhook_url": "https://hooks.slack.com/services/xxx"}
        slack = SlackIntegration(creds, {"timeout": 5})

        with patch("requests.post") as mock_post:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {"ts": "1234567890.123456"}
            mock_post.return_value = mock_response

            result = slack.send_message("Test message", "#channel")
            assert result["success"] is True
            assert "message_id" in result

    def test_slack_send_blocks(self):
        from app.integrations.slack import SlackIntegration
        from unittest.mock import patch, MagicMock

        creds = {"webhook_url": "https://hooks.slack.com/services/xxx"}
        slack = SlackIntegration(creds)

        blocks = [
            {
                "type": "section",
                "text": {"type": "mrkdwn", "text": "Workflow execution complete"},
            }
        ]

        with patch("requests.post") as mock_post:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {"ts": "1234567890.123456"}
            mock_post.return_value = mock_response

            result = slack.send_blocks(blocks)
            assert result["success"] is True

    def test_slack_rate_limit_handling(self):
        from app.integrations.slack import SlackIntegration
        from unittest.mock import patch, MagicMock

        creds = {"webhook_url": "https://hooks.slack.com/services/xxx"}
        slack = SlackIntegration(creds)

        with patch("requests.post") as mock_post:
            mock_response = MagicMock()
            mock_response.status_code = 429
            mock_response.headers = {"Retry-After": "5"}
            mock_post.return_value = mock_response

            with patch("time.sleep"):
                try:
                    slack.send_message("Test")
                except RuntimeError as e:
                    assert "rate limited" in str(e).lower()

    def test_slack_webhook_signature_verification(self):
        from app.integrations.slack import SlackIntegration

        body = "test_body"
        signing_secret = "test_secret"

        sig_to_verify = "v0=test_sig"
        result = SlackIntegration.verify_webhook_signature(body, sig_to_verify, signing_secret)
        assert result is False

    def test_slack_execute_action(self):
        from app.integrations.slack import SlackIntegration
        from unittest.mock import patch, MagicMock

        creds = {"webhook_url": "https://hooks.slack.com/services/xxx"}
        slack = SlackIntegration(creds)

        with patch("requests.post") as mock_post:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {"ts": "123"}
            mock_post.return_value = mock_response

            result = slack.execute("send_message", text="Hello", channel="#general")
            assert result["success"] is True
