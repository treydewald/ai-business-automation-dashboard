# Contributing to AI Business Automation Dashboard

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

We are committed to providing a welcoming and inspiring community for all. Please read and adhere to our values:

- Be respectful and inclusive
- Assume good intent
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** to your local machine
3. **Create a feature branch** from `develop`
4. **Make your changes** following the guidelines below
5. **Submit a pull request** back to the main repository

## Development Setup

See [DEVELOPMENT.md](./DEVELOPMENT.md) for complete setup instructions.

Quick start:

```bash
# Backend
cd backend
pip install -e .[dev]
uvicorn app.main:app --reload

# Frontend (in another terminal)
cd frontend
npm install
npm start
```

## Contribution Guidelines

### Code Style

We maintain consistent code style across the project.

**Python (Backend):**
- Format with [Black](https://black.readthedocs.io/)
- Lint with [Flake8](https://flake8.pycqa.org/)
- Type hints are required for all functions
- Follow PEP 8 conventions

**TypeScript/React (Frontend):**
- Format with [Prettier](https://prettier.io/)
- Lint with [ESLint](https://eslint.org/)
- Strict TypeScript mode enabled
- Follow React hooks best practices

**Run formatting and linting:**

```bash
# Backend
cd backend
black app
flake8 app

# Frontend
cd frontend
npm run lint
npm run format
```

Or use pre-commit hooks (automatically installed):

```bash
pre-commit run --all-files
```

### Commits

Write clear, atomic commits with descriptive messages:

```
feat(api): add workflow versioning endpoint

- Implement GET /api/workflows/{id}/versions
- Add WorkflowVersion model
- Include rollback functionality

Fixes #123
```

**Commit types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `refactor:` - Code refactoring without functional changes
- `perf:` - Performance improvements
- `test:` - Test additions/modifications
- `chore:` - Build process, dependencies, tooling

### Pull Requests

1. **Branch naming:** Use descriptive names like `feature/new-dashboard` or `fix/login-bug`
2. **PR description:** Include:
   - What changes were made and why
   - Related issue number (if applicable)
   - How to test the changes
   - Screenshots for UI changes
3. **Keep PRs focused:** One feature or fix per PR
4. **Ensure tests pass:** Run full test suite locally before submitting

**PR template:**

```markdown
## Description
Brief description of what this PR does.

## Related Issue
Closes #123

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change

## How Has This Been Tested?
Describe the testing you've done.

## Screenshots (if applicable)
Add screenshots for UI changes.

## Checklist:
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have added tests for new functionality
- [ ] All tests pass locally
- [ ] I have updated documentation
```

### Testing

**All new code must include tests.** We target:
- Backend: 70%+ code coverage
- Frontend: 60%+ code coverage

**Backend tests:**

```bash
cd backend
pytest tests/ -v --cov=app
```

**Frontend tests:**

```bash
cd frontend
npm test -- --coverage
```

**Testing guidelines:**
- Write unit tests for business logic
- Write integration tests for API endpoints
- Test edge cases and error conditions
- Use meaningful test names
- Mock external dependencies

### Documentation

Update documentation for:
- New features or API endpoints
- Breaking changes
- Configuration options
- Architecture decisions

Update relevant files:
- `DEVELOPMENT.md` - Setup and workflow changes
- `docs/API.md` - API documentation
- `docs/architecture.md` - Architecture changes
- Code comments for complex logic

## Review Process

1. **Automated checks:**
   - GitHub Actions CI/CD pipeline must pass
   - Code coverage must not decrease
   - No linting errors

2. **Code review:**
   - At least one maintainer approval required
   - Address feedback and request re-review
   - Maintain respectful discussion

3. **Merge:**
   - All checks must pass
   - All conversations must be resolved
   - Squash commits if necessary for clean history

## Reporting Issues

Found a bug? Want to suggest a feature? [Create an issue](https://github.com/your-org/ai-business-automation-dashboard/issues/new).

**Bug reports should include:**
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Environment information (OS, Python version, etc.)

**Feature requests should include:**
- Clear description of the feature
- Use cases and benefits
- Possible implementation approach (optional)
- Related issues or discussions

## Project Structure

See [DEVELOPMENT.md](./DEVELOPMENT.md#project-structure) for detailed project structure.

## Performance Considerations

When contributing, consider:
- Database query performance (use indexes, avoid N+1 queries)
- API response times (target <200ms p95)
- Frontend bundle size (target <250KB gzipped)
- Memory usage (test with realistic data sizes)

## Security

- Never commit secrets or credentials
- Use environment variables for configuration
- Report security vulnerabilities privately to maintainers
- Follow OWASP guidelines
- Validate all user inputs

## Versioning

This project follows [Semantic Versioning](https://semver.org/):
- MAJOR version for incompatible API changes
- MINOR version for backward-compatible functionality
- PATCH version for backward-compatible bug fixes

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

## Questions?

- Check [DEVELOPMENT.md](./DEVELOPMENT.md)
- Search existing issues and discussions
- Create a new issue with the `question` label
- Reach out to maintainers

---

Thank you for contributing! 🎉
