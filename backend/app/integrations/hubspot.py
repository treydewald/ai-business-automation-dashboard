import requests
from typing import Any, Dict, Optional, List
from app.services.integration_base import IntegrationProvider
import logging

logger = logging.getLogger(__name__)

HUBSPOT_API_BASE = "https://api.hubapi.com"


class HubSpotIntegration(IntegrationProvider):
    """HubSpot CRM integration for contact and company operations."""

    @property
    def integration_type(self) -> str:
        return "hubspot"

    def test_connection(self) -> bool:
        """Test HubSpot API connection."""
        try:
            api_key = self.credentials.get("api_key")
            if not api_key:
                return False

            headers = self._get_headers()
            response = requests.get(
                f"{HUBSPOT_API_BASE}/crm/v3/objects/contacts",
                headers=headers,
                params={"limit": 1},
                timeout=10,
            )
            return response.status_code == 200
        except Exception as e:
            logger.error(f"HubSpot test connection failed: {e}")
            return False

    def execute(self, action: str, **kwargs) -> Dict[str, Any]:
        """Execute HubSpot action."""
        if action == "create_contact":
            return self.create_contact(
                email=kwargs.get("email"),
                properties=kwargs.get("properties", {}),
            )
        elif action == "update_contact":
            return self.update_contact(
                contact_id=kwargs.get("contact_id"),
                properties=kwargs.get("properties", {}),
            )
        elif action == "search_contacts":
            return self.search_contacts(
                query=kwargs.get("query"),
                properties=kwargs.get("properties"),
                limit=kwargs.get("limit", 10),
            )
        elif action == "create_company":
            return self.create_company(
                name=kwargs.get("name"),
                properties=kwargs.get("properties", {}),
            )
        elif action == "update_company":
            return self.update_company(
                company_id=kwargs.get("company_id"),
                properties=kwargs.get("properties", {}),
            )
        elif action == "search_companies":
            return self.search_companies(
                query=kwargs.get("query"),
                properties=kwargs.get("properties"),
                limit=kwargs.get("limit", 10),
            )
        elif action == "get_contact":
            return self.get_contact(
                contact_id=kwargs.get("contact_id"),
                properties=kwargs.get("properties"),
            )
        elif action == "get_company":
            return self.get_company(
                company_id=kwargs.get("company_id"),
                properties=kwargs.get("properties"),
            )
        else:
            raise ValueError(f"Unknown HubSpot action: {action}")

    def create_contact(
        self, email: str, properties: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create a new contact in HubSpot."""
        if not email:
            raise ValueError("Email is required to create contact")

        properties = properties or {}
        properties["email"] = email

        payload = {"properties": properties}

        try:
            response = requests.post(
                f"{HUBSPOT_API_BASE}/crm/v3/objects/contacts",
                headers=self._get_headers(),
                json=payload,
                timeout=self.config.get("timeout", 30),
            )

            if response.status_code >= 400:
                error_text = response.text[:500]
                raise RuntimeError(
                    f"HubSpot create contact failed: {response.status_code} - {error_text}"
                )

            result = response.json()
            self.log_call("create_contact", True, email=email)
            return {
                "success": True,
                "contact_id": result.get("id"),
                "properties": result.get("properties", {}),
            }

        except requests.RequestException as e:
            error_msg = f"HubSpot request failed: {e}"
            self.log_call("create_contact", False, error=error_msg, email=email)
            self.handle_error(error_msg)
            raise

    def update_contact(
        self, contact_id: str, properties: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Update an existing contact in HubSpot."""
        if not contact_id:
            raise ValueError("Contact ID is required to update contact")

        properties = properties or {}
        payload = {"properties": properties}

        try:
            response = requests.patch(
                f"{HUBSPOT_API_BASE}/crm/v3/objects/contacts/{contact_id}",
                headers=self._get_headers(),
                json=payload,
                timeout=self.config.get("timeout", 30),
            )

            if response.status_code >= 400:
                error_text = response.text[:500]
                raise RuntimeError(
                    f"HubSpot update contact failed: {response.status_code} - {error_text}"
                )

            result = response.json()
            self.log_call("update_contact", True, contact_id=contact_id)
            return {
                "success": True,
                "contact_id": result.get("id"),
                "updated": True,
            }

        except requests.RequestException as e:
            error_msg = f"HubSpot request failed: {e}"
            self.log_call(
                "update_contact", False, error=error_msg, contact_id=contact_id
            )
            self.handle_error(error_msg)
            raise

    def search_contacts(
        self,
        query: str,
        properties: Optional[List[str]] = None,
        limit: int = 10,
    ) -> Dict[str, Any]:
        """Search contacts in HubSpot."""
        if not query:
            raise ValueError("Search query is required")

        limit = min(limit, 100)  # Cap at 100

        search_payload = {
            "query": query,
            "limit": limit,
        }
        if properties:
            search_payload["properties"] = properties

        try:
            response = requests.post(
                f"{HUBSPOT_API_BASE}/crm/v3/objects/contacts/search",
                headers=self._get_headers(),
                json=search_payload,
                timeout=self.config.get("timeout", 30),
            )

            if response.status_code >= 400:
                error_text = response.text[:500]
                raise RuntimeError(
                    f"HubSpot search contacts failed: {response.status_code} - {error_text}"
                )

            result = response.json()
            results = result.get("results", [])

            self.log_call("search_contacts", True, query=query, count=len(results))
            return {
                "success": True,
                "count": len(results),
                "contacts": [
                    {
                        "id": r.get("id"),
                        "properties": r.get("properties", {}),
                    }
                    for r in results
                ],
            }

        except requests.RequestException as e:
            error_msg = f"HubSpot request failed: {e}"
            self.log_call("search_contacts", False, error=error_msg, query=query)
            self.handle_error(error_msg)
            raise

    def create_company(
        self, name: str, properties: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create a new company in HubSpot."""
        if not name:
            raise ValueError("Company name is required")

        properties = properties or {}
        properties["name"] = name

        payload = {"properties": properties}

        try:
            response = requests.post(
                f"{HUBSPOT_API_BASE}/crm/v3/objects/companies",
                headers=self._get_headers(),
                json=payload,
                timeout=self.config.get("timeout", 30),
            )

            if response.status_code >= 400:
                error_text = response.text[:500]
                raise RuntimeError(
                    f"HubSpot create company failed: {response.status_code} - {error_text}"
                )

            result = response.json()
            self.log_call("create_company", True, name=name)
            return {
                "success": True,
                "company_id": result.get("id"),
                "properties": result.get("properties", {}),
            }

        except requests.RequestException as e:
            error_msg = f"HubSpot request failed: {e}"
            self.log_call("create_company", False, error=error_msg, name=name)
            self.handle_error(error_msg)
            raise

    def update_company(
        self, company_id: str, properties: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Update an existing company in HubSpot."""
        if not company_id:
            raise ValueError("Company ID is required to update company")

        properties = properties or {}
        payload = {"properties": properties}

        try:
            response = requests.patch(
                f"{HUBSPOT_API_BASE}/crm/v3/objects/companies/{company_id}",
                headers=self._get_headers(),
                json=payload,
                timeout=self.config.get("timeout", 30),
            )

            if response.status_code >= 400:
                error_text = response.text[:500]
                raise RuntimeError(
                    f"HubSpot update company failed: {response.status_code} - {error_text}"
                )

            result = response.json()
            self.log_call("update_company", True, company_id=company_id)
            return {
                "success": True,
                "company_id": result.get("id"),
                "updated": True,
            }

        except requests.RequestException as e:
            error_msg = f"HubSpot request failed: {e}"
            self.log_call(
                "update_company", False, error=error_msg, company_id=company_id
            )
            self.handle_error(error_msg)
            raise

    def search_companies(
        self,
        query: str,
        properties: Optional[List[str]] = None,
        limit: int = 10,
    ) -> Dict[str, Any]:
        """Search companies in HubSpot."""
        if not query:
            raise ValueError("Search query is required")

        limit = min(limit, 100)  # Cap at 100

        search_payload = {
            "query": query,
            "limit": limit,
        }
        if properties:
            search_payload["properties"] = properties

        try:
            response = requests.post(
                f"{HUBSPOT_API_BASE}/crm/v3/objects/companies/search",
                headers=self._get_headers(),
                json=search_payload,
                timeout=self.config.get("timeout", 30),
            )

            if response.status_code >= 400:
                error_text = response.text[:500]
                raise RuntimeError(
                    f"HubSpot search companies failed: {response.status_code} - {error_text}"
                )

            result = response.json()
            results = result.get("results", [])

            self.log_call("search_companies", True, query=query, count=len(results))
            return {
                "success": True,
                "count": len(results),
                "companies": [
                    {
                        "id": r.get("id"),
                        "properties": r.get("properties", {}),
                    }
                    for r in results
                ],
            }

        except requests.RequestException as e:
            error_msg = f"HubSpot request failed: {e}"
            self.log_call("search_companies", False, error=error_msg, query=query)
            self.handle_error(error_msg)
            raise

    def get_contact(
        self, contact_id: str, properties: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Get a specific contact from HubSpot."""
        if not contact_id:
            raise ValueError("Contact ID is required")

        try:
            params = {}
            if properties:
                params["properties"] = properties

            response = requests.get(
                f"{HUBSPOT_API_BASE}/crm/v3/objects/contacts/{contact_id}",
                headers=self._get_headers(),
                params=params,
                timeout=self.config.get("timeout", 30),
            )

            if response.status_code == 404:
                return {"success": False, "error": "Contact not found"}

            if response.status_code >= 400:
                error_text = response.text[:500]
                raise RuntimeError(
                    f"HubSpot get contact failed: {response.status_code} - {error_text}"
                )

            result = response.json()
            self.log_call("get_contact", True, contact_id=contact_id)
            return {
                "success": True,
                "contact_id": result.get("id"),
                "properties": result.get("properties", {}),
            }

        except requests.RequestException as e:
            error_msg = f"HubSpot request failed: {e}"
            self.log_call("get_contact", False, error=error_msg, contact_id=contact_id)
            self.handle_error(error_msg)
            raise

    def get_company(
        self, company_id: str, properties: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Get a specific company from HubSpot."""
        if not company_id:
            raise ValueError("Company ID is required")

        try:
            params = {}
            if properties:
                params["properties"] = properties

            response = requests.get(
                f"{HUBSPOT_API_BASE}/crm/v3/objects/companies/{company_id}",
                headers=self._get_headers(),
                params=params,
                timeout=self.config.get("timeout", 30),
            )

            if response.status_code == 404:
                return {"success": False, "error": "Company not found"}

            if response.status_code >= 400:
                error_text = response.text[:500]
                raise RuntimeError(
                    f"HubSpot get company failed: {response.status_code} - {error_text}"
                )

            result = response.json()
            self.log_call("get_company", True, company_id=company_id)
            return {
                "success": True,
                "company_id": result.get("id"),
                "properties": result.get("properties", {}),
            }

        except requests.RequestException as e:
            error_msg = f"HubSpot request failed: {e}"
            self.log_call("get_company", False, error=error_msg, company_id=company_id)
            self.handle_error(error_msg)
            raise

    def _get_headers(self) -> Dict[str, str]:
        """Build headers with API key."""
        api_key = self.credentials.get("api_key")
        if not api_key:
            raise ValueError("Missing HubSpot API key in credentials")

        return {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
