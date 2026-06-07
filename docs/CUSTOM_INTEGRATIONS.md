# Custom Integrations Builder

Create custom integrations through the UI without writing code.

## Overview

The Custom Integrations Builder allows users to:
- Define HTTP API integrations visually
- Configure authentication methods
- Map API responses to workflow variables
- Test integrations before using them
- Reuse integrations across workflows

## Features

### Request Builder
- **HTTP Methods**: GET, POST, PUT, DELETE, PATCH
- **URL Configuration**: Static or dynamic with variable interpolation
- **Headers**: Custom headers with variable support
- **Body**: JSON payloads with templating
- **Query Parameters**: URL parameter configuration

### Authentication
- **Bearer Token**: OAuth and JWT tokens
- **API Key**: Custom header-based API keys
- **Basic Auth**: Username/password authentication
- **Custom Headers**: Flexible authentication headers
- **No Auth**: For public endpoints

### Response Mapping
- **JSON Path**: Extract data using JSONPath syntax
- **Regex**: Extract data using regular expressions
- **Headers**: Extract data from response headers
- **Full Response**: Use entire response as-is
- **Default Values**: Fallback values for extraction failures

### Testing
- **Test Context**: Provide sample variables for testing
- **Live Execution**: Execute against real API
- **Response Preview**: See extracted data
- **Error Handling**: Clear error messages

## Usage

### Creating an Integration

1. **Navigate to Custom Integrations Builder**
   ```
   /custom-integrations
   ```

2. **Fill in Basic Information**
   - Name: Unique identifier
   - Description: What does it do?

3. **Configure HTTP Request**
   - Select HTTP method (GET, POST, etc.)
   - Enter API endpoint URL
   - Set authentication if needed
   - Configure headers if required

4. **Configure Response Mapping**
   - Choose extraction method:
     - **JSON Path**: `$.data.results[0].id`
     - **Regex**: `<id>(\d+)</id>`
     - **Header**: `X-Custom-Header`

5. **Test the Integration**
   - Provide test variables
   - Click "Test Integration"
   - Review response

6. **Save Integration**
   - Click "Save Integration"
   - Integration is ready to use

### Using in Workflows

Add a custom integration step:
```json
{
  "type": "custom_integration",
  "integration_id": "my-api-integration",
  "context": {
    "userId": "${previous_step.user_id}",
    "apiKey": "${secrets.api_key}"
  },
  "output_var": "api_response"
}
```

## Request Template Syntax

### Variable Interpolation

Use `{{variable_name}}` syntax in:
- URLs
- Headers
- Body (JSON)

Example:
```
URL: https://api.example.com/users/{{userId}}

Headers:
{
  "Authorization": "Bearer {{token}}"
}

Body:
{
  "name": "{{userName}}",
  "email": "{{userEmail}}"
}
```

### URL Parameters

Define dynamic URL parameters:
```
Base URL: https://api.example.com/search
Params: {
  "q": "{{searchQuery}}",
  "limit": "10"
}

Final URL: https://api.example.com/search?q=python&limit=10
```

## Response Mapping Examples

### JSON Path Examples
```
Response:
{
  "data": {
    "user": {
      "id": "123",
      "name": "John",
      "emails": ["a@example.com", "b@example.com"]
    }
  }
}

Mappings:
- $.data.user.id → "123"
- $.data.user.name → "John"
- $.data.user.emails[0] → "a@example.com"
- $.data.user → entire user object
```

### Regex Examples
```
Response body:
<id>abc123</id>
<status>active</status>

Regex pattern: <id>([^<]+)</id>
Extracted: "abc123"
```

### Header Extraction
```
Response headers:
X-Rate-Limit-Remaining: 100
X-Request-ID: req-456

Extract: X-Rate-Limit-Remaining
Result: "100"
```

## Authentication Methods

### Bearer Token
```
Type: Bearer
Token: eyJhbGciOiJIUzI1NiIs...

Adds header:
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### API Key
```
Type: API Key
Header Name: X-API-Key
Value: sk_live_abc123...

Adds header:
X-API-Key: sk_live_abc123...
```

### Basic Auth
```
Type: Basic Auth
Username: user@example.com
Password: secretpassword

Adds header:
Authorization: Basic dXNlckBleGFtcGxlLmNvbTpzZWNyZXRwYXNzd29yZA==
```

## Best Practices

### Security
1. **Never commit credentials** to version control
2. **Use workflow secrets** for sensitive values
3. **Use API key scoping** for limited permissions
4. **Test with non-sensitive data** when possible
5. **Enable HTTPS only** for all API endpoints

### Performance
1. **Use efficient JSON paths** for extraction
2. **Limit response payload** size
3. **Set appropriate timeouts** (default 30s)
4. **Cache results** when possible
5. **Minimize external API calls**

### Reliability
1. **Add default values** for optional fields
2. **Handle missing data** gracefully
3. **Implement retry logic** in workflows
4. **Log API errors** for debugging
5. **Monitor API availability**

### Testing
1. **Always test before** using in workflows
2. **Test with real data** patterns
3. **Test error scenarios**
4. **Verify response extraction**
5. **Check timeout behavior**

## API Reference

### Create Custom Integration

**Endpoint**: `POST /api/integrations`

**Request**:
```json
{
  "name": "My API",
  "description": "Description",
  "method": "GET",
  "url": "https://api.example.com/data",
  "auth_type": "bearer",
  "auth_value": "token123",
  "extract_json_path": "$.data"
}
```

**Response**:
```json
{
  "id": "integration-123",
  "name": "My API",
  "created_at": "2024-01-15T10:00:00Z"
}
```

### Test Custom Integration

**Endpoint**: `POST /api/integrations/test`

**Request**:
```json
{
  "method": "GET",
  "url": "https://api.example.com/data",
  "context": {
    "userId": "123"
  },
  "extract_json_path": "$.data"
}
```

**Response**:
```json
{
  "status": "success",
  "status_code": 200,
  "result": { "data": "extracted_value" }
}
```

### List Custom Integrations

**Endpoint**: `GET /api/integrations`

**Query Parameters**:
- `owner_id`: Filter by owner
- `tags`: Filter by tags (comma-separated)

**Response**:
```json
{
  "integrations": [
    {
      "id": "integration-123",
      "name": "My API",
      "description": "Description",
      "owner_id": "user-123",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Get Custom Integration

**Endpoint**: `GET /api/integrations/{id}`

**Response**:
```json
{
  "id": "integration-123",
  "name": "My API",
  "method": "GET",
  "url": "https://api.example.com/data",
  "extract_json_path": "$.data"
}
```

### Update Custom Integration

**Endpoint**: `PUT /api/integrations/{id}`

**Request**: Same as create

**Response**: Updated integration object

### Delete Custom Integration

**Endpoint**: `DELETE /api/integrations/{id}`

**Response**:
```json
{
  "status": "deleted"
}
```

## Troubleshooting

### "URL is required"
- Ensure you've entered a valid API endpoint

### "Authentication failed"
- Verify credentials are correct
- Check auth type matches API requirements
- Ensure token/key hasn't expired

### "No data extracted"
- Verify JSON path matches response structure
- Use real test data
- Check response is valid JSON

### "Request timeout"
- Increase timeout if API is slow
- Check network connectivity
- Verify API endpoint is accessible

### "Authentication header not set"
- Select correct auth type
- Verify credentials are provided
- Test with curl first

## Limitations

- **Max response size**: 10MB
- **Request timeout**: 30 seconds (configurable)
- **Max integrations**: 1000 per user
- **Rate limiting**: 100 requests/minute

## Advanced Usage

### Chaining Integrations

Use output from one integration as input to another:

```json
Step 1: Get user ID from first API
{
  "type": "custom_integration",
  "integration_id": "get-user",
  "context": { "email": "user@example.com" },
  "output_var": "user"
}

Step 2: Use user ID in second API
{
  "type": "custom_integration",
  "integration_id": "get-user-posts",
  "context": { "userId": "{{user.id}}" },
  "output_var": "posts"
}
```

### Conditional Integration Calls

```json
{
  "type": "conditional",
  "condition": "{{user.status}} === 'active'",
  "if_true": {
    "type": "custom_integration",
    "integration_id": "send-welcome-email"
  }
}
```

### Error Handling

```json
{
  "type": "custom_integration",
  "integration_id": "api-call",
  "on_error": {
    "type": "send_notification",
    "message": "API integration failed"
  }
}
```

## Related Documentation

- [Integrations Overview](./INTEGRATIONS.md)
- [Workflow Execution](./WORKFLOW_EXECUTION.md)
- [API Documentation](./API.md)
