# Contributing to Clinic Desk

Thank you for taking an interest in contributing to **Clinic Desk**.
This project exists to make everyday clinic desk work calmer, simpler, and more reliable—and community contributions are a big part of keeping it that way.

This guide explains how to get started, what kinds of contributions are most helpful, and the boundaries that keep the project focused and sustainable.

---

## Code of Conduct

Clinic Desk is built for real healthcare environments, so we value clarity, respect, and professionalism.

Please keep in mind:

- Be respectful and kind in discussions and reviews
- Offer feedback constructively and in good faith
- Keep conversations relevant to clinic desk workflows
- Remember that this tool supports healthcare professionals in their daily work

---

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork locally**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/opd-platanist.git
   cd opd-platanist
   ```
3. **Add the upstream repository**:
   ```bash
   git remote add upstream https://github.com/abdullahanzar/clinic-desk-platanist.git
   ```

This makes it easy to stay up to date with ongoing development.

---

## Development Setup

### Prerequisites

- Node.js 20 or higher
- pnpm (recommended) or npm
- MongoDB (local install or Docker)

### Local Development

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your local configuration as needed.

3. **Start MongoDB** (if using Docker):
   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo:7.0
   ```

4. **Run the development server**:
   ```bash
   pnpm dev
   ```

5. Open the app at `http://localhost:3000`

### Using Docker for Development

```bash
docker-compose up -d
docker-compose logs -f app
docker-compose restart app
```

---

## How to Contribute

### Reporting Bugs

If you encounter a bug:

1. Check the existing Issues to see if it’s already reported
2. If not, open a new issue and include:
   - A clear description of the problem
   - Steps to reproduce it
   - Expected vs actual behavior
   - Screenshots if helpful
   - Environment details (OS, browser, Docker, etc.)

Clear bug reports save everyone time—thank you for taking care with them.

---

### Suggesting Features

Before proposing a new feature, please review the **Project Scope** below. Clinic Desk is intentionally opinionated and kept small on purpose.

If your idea fits the scope:

1. Check existing issues for similar suggestions
2. Open a new issue describing:
   - The problem you’re trying to solve
   - The proposed solution
   - How it fits within the project’s goals
   - Example workflows or mockups if relevant

Thoughtful feature discussions are always welcome.

---

### Submitting Code Changes

1. **Create a branch from `main`**:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make your changes**, following the coding standards below

3. **Test your work**:
   - Run the app locally
   - Manually test affected flows
   - Check for console errors
   - Test Docker builds if relevant

4. **Commit your changes**:
   ```bash
   git commit -m "feat: add feature description"
   # or
   git commit -m "fix: fix bug description"
   ```

5. **Push to your fork** and open a Pull Request

---

## Pull Request Process

When opening a PR, please ensure that it:

- Has a clear title and description
- References related issues if applicable
- Stays within the project scope
- Updates documentation where needed
- Does not break existing functionality

Reviews may take some time—thank you for your patience. Feedback is meant to improve the project, not to discourage contributors.

---

## Project Scope

Clinic Desk is designed to be **simple, reliable, and clinic-focused**.
This focus helps avoid unnecessary complexity, legal overhead, and operational risk.

### In Scope

- Clinic desk workflow improvements
- Billing and receipt management
- Staff management for in-clinic use
- Prescription and visit tracking
- Printing and physical document workflows
- Template management
- Straightforward, reliable data entry

### Out of Scope

To keep the project lightweight and sustainable, Clinic Desk intentionally does **not** include:

- Patient accounts or portals
- Email or SMS delivery systems
- Automated messaging
- Insurance system integrations
- Hospital-scale or multi-site features
- Full Electronic Health Record (EHR) systems
- Medical device integrations
- Compliance or regulatory automation tools

If your idea falls outside this scope, it may be better suited to a fork or a separate project—and that’s perfectly okay.

---

## Coding Standards

### General

- Favor clarity and maintainability
- Follow existing patterns and structure
- Keep functions focused and readable
- Use comments where logic is non-obvious

### TypeScript / React

- Use functional components and hooks
- Define clear TypeScript types
- Handle loading and error states explicitly
- Follow established React best practices

### Styling

- Use Tailwind CSS
- Follow existing visual patterns
- Ensure responsive behavior across screen sizes

### Git Commits

Use conventional commit messages:

```
feat: add new feature
fix: fix bug
docs: update documentation
style: formatting or typos
refactor: internal refactors
test: add or update tests
chore: maintenance tasks
```

---

## Testing

Automated tests are limited for now, so please:

- Manually test all affected flows
- Check behavior across browsers
- Verify responsive layouts
- Document testing steps in your PR

---

## Documentation

Please update documentation when relevant:

- `README.md` for user-facing changes
- `DOCKER_SETUP.md` for deployment updates
- `.env.example` for environment variables
- Inline comments for complex logic

---

## Questions or Uncertainty?

If you’re unsure about anything:

- Check existing Issues or Discussions
- Open a Discussion for general questions
- Open an Issue for bugs or proposals

Asking early is encouraged—we’d rather talk things through than fix misunderstandings later.

---

## License

By contributing to Clinic Desk by Platanist, you agree that your contributions are licensed under **GNU AGPL-3.0**.

In short:
- Contributions remain open source
- Modifications must be shared if used as a hosted service

Please see the `LICENSE` file for full details.

---

Thank you for contributing your time and care to Clinic Desk by Platanist.
Thoughtful contributions—code, ideas, or feedback—are always appreciated. 🏥
