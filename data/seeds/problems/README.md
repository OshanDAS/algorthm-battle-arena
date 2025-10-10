# Problem Seed Files

This directory contains curated algorithm problems for seeding the Algorithm Battle Arena database.

## File Structure

- `easy.json` - Beginner-friendly problems (3 problems)
- `medium.json` - Intermediate algorithmic challenges (3 problems) 
- `hard.json` - Advanced problems requiring complex algorithms (2 problems)

## Problem Object Format

Each problem follows this JSON structure:

```json
{
  "slug": "unique-identifier",
  "title": "Problem Title",
  "description": "Detailed problem description with constraints",
  "difficulty": "Easy|Medium|Hard",
  "isPublic": true,
  "isActive": true,
  "timeLimitMs": 1000,
  "memoryLimitMb": 128,
  "tags": ["array", "hash-table"],
  "testCases": [
    {
      "input": "input data as string",
      "expectedOutput": "expected output as string",
      "isSample": true
    }
  ]
}
```

## Field Descriptions

- **slug**: Unique identifier for the problem (kebab-case)
- **title**: Human-readable problem name
- **description**: Complete problem statement with examples and constraints
- **difficulty**: Problem complexity level
- **isPublic**: Whether problem is visible to all users
- **isActive**: Whether problem can be used in contests
- **timeLimitMs**: Maximum execution time in milliseconds
- **memoryLimitMb**: Maximum memory usage in megabytes
- **tags**: Array of relevant algorithm/data structure tags
- **testCases**: Array of input/output test cases with sample flag

## Test Cases

Each problem includes:
- At least 2 test cases
- Mix of sample cases (visible to users) and hidden cases
- Edge cases for comprehensive testing
- Input/output as strings for consistent parsing

## Usage

These files are designed for bulk import into the database using EF Core transactions with validation and rollback on errors.

## Validation Rules

- Slug must be unique across all problems
- Title and description are required
- At least one test case required
- Time/memory limits must be positive integers
- Tags array can be empty but must be valid JSON