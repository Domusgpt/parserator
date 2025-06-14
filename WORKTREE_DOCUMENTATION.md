# Parserator Multi-Claude Worktree System

## Overview
This documentation explains the Git worktree system set up for parallel development by multiple Claude instances on the Parserator project.

## Worktree Structure
```
parserator-launch-ready/                          # Main worktree (publishing focus)
├── .git/                                        # Git repository root
├── worktrees/                                   # All feature worktrees
│   ├── feature-testing/                         # Testing infrastructure
│   ├── feature-ci-cd/                          # CI/CD pipeline
│   ├── feature-extensions/                     # Extension improvements  
│   └── feature-monorepo/                       # Repository structure
├── CLAUDE.md                                    # Lead dev agent context
├── ***LOOKFIRST***.md                          # Project handoff briefing
└── [all project files]                         # Production-ready codebase
```

## Git Branches & Worktrees

| Worktree | Branch | Purpose | Agent Role |
|----------|--------|---------|------------|
| `main` | `main` | Publishing & deployment | Publishing Claude |
| `worktrees/feature-testing` | `feature/testing-infrastructure` | Test expansion | Testing Specialist |
| `worktrees/feature-ci-cd` | `feature/ci-cd-infrastructure` | CI/CD automation | CI/CD Specialist |
| `worktrees/feature-extensions` | `feature/extension-improvements` | Extension polish | Extension Specialist |
| `worktrees/feature-monorepo` | `feature/monorepo-structure` | Repo organization | Structure Specialist |

## Usage Instructions

### For Lead Dev Agent (Main Worktree)
- Work in: `/mnt/c/Users/millz/parserator-launch-ready/`
- Coordinate all sub-agents
- Manage merges from feature branches
- Maintain overall project direction

### For Sub-Agents (Feature Worktrees)
- Work in assigned worktree directory only
- Read context from `CLAUDE.md` in worktree root
- Stay within defined scope (see individual CLAUDE.md files)
- Coordinate through lead dev agent for merges

### Creating New Worktrees
```bash
# Create new branch
git branch feature/new-feature-name

# Create worktree
git worktree add worktrees/feature-new-name feature/new-feature-name

# Create context file
echo "# NEW FEATURE SUB-AGENT" > worktrees/feature-new-name/CLAUDE.md
```

### Managing Worktrees
```bash
# List all worktrees
git worktree list

# Remove worktree (after merge)
git worktree remove worktrees/feature-name
git branch -d feature/feature-name
```

## Isolation & Safety

### What Each Worktree Contains
- ✅ **Complete copy** of all project files
- ✅ **Independent working directory** (no conflicts)
- ✅ **Separate branch** for changes
- ✅ **Own context file** (CLAUDE.md)

### What's Shared
- ✅ **Git history** (.git directory)
- ✅ **Remote repositories** (same origin)
- ✅ **Main project context** (read-only access)

### Safety Guarantees
- 🔒 **No merge conflicts** between concurrent work
- 🔒 **Isolated changes** on separate branches
- 🔒 **Easy rollback** if changes don't work
- 🔒 **Clear responsibility** (one agent per worktree)

## Workflow Examples

### Sub-Agent Development Cycle
1. **Start**: Read context files and understand scope
2. **Develop**: Make changes in worktree directory
3. **Commit**: Regular commits on feature branch
4. **Test**: Validate changes within scope
5. **Report**: Update lead dev agent on progress
6. **Merge**: Coordinate merge through lead dev agent

### Lead Dev Coordination Cycle
1. **Assign**: Create worktrees and assign to sub-agents
2. **Monitor**: Check progress across all worktrees
3. **Review**: Evaluate completed work in feature branches
4. **Merge**: Integrate approved changes into main
5. **Deploy**: Coordinate releases and deployments

## Benefits

### For Development
- **Parallel Work**: Multiple agents work simultaneously
- **No Conflicts**: Isolated development environments
- **Easy Integration**: Clear merge points and review process
- **Rapid Iteration**: Fast context switching between features

### For Project Management
- **Clear Ownership**: Each feature has dedicated agent
- **Progress Tracking**: Easy to see status across all areas
- **Risk Management**: Changes isolated until proven
- **Quality Control**: Focused expertise per domain

## Current Active Worktrees

### feature-testing (Testing Infrastructure)
- **Agent**: Testing Specialist
- **Goal**: Expand test coverage and validation
- **Context**: `worktrees/feature-testing/CLAUDE.md`
- **Status**: Ready for agent assignment

### feature-ci-cd (CI/CD Pipeline)
- **Agent**: CI/CD Specialist  
- **Goal**: Automate builds, tests, and deployments
- **Context**: `worktrees/feature-ci-cd/CLAUDE.md`
- **Status**: Ready for agent assignment

### feature-extensions (Extension Improvements)
- **Agent**: Extension Specialist
- **Goal**: Polish Chrome, VS Code, JetBrains extensions
- **Context**: TBD
- **Status**: Worktree created, needs context file

### feature-monorepo (Repository Structure)
- **Agent**: Structure Specialist
- **Goal**: Clean up build processes and dependencies
- **Context**: TBD
- **Status**: Worktree created, needs context file

## Next Steps

1. **Complete Context Files**: Create CLAUDE.md for remaining worktrees
2. **Assign Sub-Agents**: Deploy Claude instances to each worktree
3. **Monitor Progress**: Track development across all areas
4. **Coordinate Merges**: Integrate completed work systematically

## Troubleshooting

### Common Issues
- **Wrong directory**: Ensure working in correct worktree path
- **Branch confusion**: Check `git branch` to verify current branch
- **Merge conflicts**: Should be rare with proper isolation
- **Context confusion**: Always read worktree-specific CLAUDE.md

### Recovery Commands
```bash
# Check current worktree and branch
git worktree list
git branch

# Return to main worktree
cd /mnt/c/Users/millz/parserator-launch-ready/

# Check specific worktree status
cd worktrees/feature-name && git status
```

This system enables efficient parallel development while maintaining code quality and project coordination.