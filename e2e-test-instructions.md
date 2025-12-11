# Obsidian CLI - E2E Test Instructions

Complete end-to-end test flow for validating all CLI functionality. Run these tests to verify the CLI is working correctly after changes.

## Prerequisites

```bash
# Build the CLI
bun build ./src/index.ts --compile --outfile ./dist/obsidian-cli

# Verify config exists
./dist/obsidian-cli config --list
```

## Test Notes Naming

All test notes use prefix `_e2e-test-` for easy identification and cleanup.

---

## Phase 1: Setup Verification

```bash
# Verify CLI is built and accessible
./dist/obsidian-cli --version

# Verify config
./dist/obsidian-cli config --list

# Show instructions
./dist/obsidian-cli instructions
```

## Phase 2: Creation Tests

```bash
# 2.1 Create note with auto-generated title (tests acronym handling)
./dist/obsidian-cli create "_e2e-test-adk-api-integration.md" "# Introduction

This is a test document for validating the obsidian-cli tool.

## Features

- Automatic title generation
- Timestamp handling
- Tag support

## Conclusion

End of test document."

# 2.2 Verify title was generated correctly
./dist/obsidian-cli frontmatter "_e2e-test-adk-api-integration.md" --get title
# Expected: title contains "ADK API Integration"

# 2.3 Verify timestamps exist
./dist/obsidian-cli frontmatter "_e2e-test-adk-api-integration.md" --get
# Expected: created_at and updated_at fields present

# 2.4 Create note with custom frontmatter and tags
./dist/obsidian-cli create "_e2e-test-with-tags.md" "Content with custom tags" --frontmatter '{"tags":["e2e","testing","validation"],"status":"draft"}'

# 2.5 Verify tags were set
./dist/obsidian-cli frontmatter "_e2e-test-with-tags.md" --get tags
# Expected: ["e2e","testing","validation"]
```

## Phase 3: Read & List Tests

```bash
# 3.1 Get note content
./dist/obsidian-cli get "_e2e-test-adk-api-integration.md"

# 3.2 List files and filter for test files
./dist/obsidian-cli list | jq '.results | map(select(startswith("_e2e-test")))'
# Expected: ["_e2e-test-adk-api-integration.md", "_e2e-test-with-tags.md"]
```

## Phase 4: Patch Tests

```bash
# 4.1 Capture original updated_at timestamp
./dist/obsidian-cli frontmatter "_e2e-test-adk-api-integration.md" --get updated_at

# 4.2 Wait 1 second then append content
sleep 1
./dist/obsidian-cli patch "_e2e-test-adk-api-integration.md" "

## Appended Section

This section was appended via patch command."

# 4.3 Verify updated_at changed
./dist/obsidian-cli frontmatter "_e2e-test-adk-api-integration.md" --get updated_at
# Expected: Different timestamp than 4.1

# 4.4 Prepend content
./dist/obsidian-cli patch "_e2e-test-adk-api-integration.md" "> This note was modified by E2E tests

" --prepend

# 4.5 Add content under specific heading
./dist/obsidian-cli patch "_e2e-test-adk-api-integration.md" "
- Added item under Features heading" --heading "Features"

# 4.6 Replace heading content
./dist/obsidian-cli patch "_e2e-test-adk-api-integration.md" "
This conclusion has been completely replaced." --heading "Conclusion" --replace

# 4.7 Verify all changes
./dist/obsidian-cli get "_e2e-test-adk-api-integration.md" | jq -r '.result.content'

# 4.8 Create note for delete test
./dist/obsidian-cli create "_e2e-test-delete-section.md" "# Keep This

Important content.

## Delete Me

This section will be deleted.

## Keep This Too

More important content."

# 4.9 Delete a heading section
./dist/obsidian-cli patch "_e2e-test-delete-section.md" --heading "Delete Me" --delete

# 4.10 Verify section was deleted
./dist/obsidian-cli get "_e2e-test-delete-section.md" | jq -r '.result.content'
# Expected: "Delete Me" section should be gone
```

## Phase 5: Frontmatter Tests

```bash
# 5.1 Get full frontmatter
./dist/obsidian-cli frontmatter "_e2e-test-with-tags.md" --get

# 5.2 Get specific field
./dist/obsidian-cli frontmatter "_e2e-test-with-tags.md" --get status
# Expected: "draft"

# 5.3 Set new frontmatter (WARNING: replaces ALL fields)
./dist/obsidian-cli frontmatter "_e2e-test-with-tags.md" --set '{"custom_field":"test_value"}'

# 5.4 Verify set replaced everything
./dist/obsidian-cli frontmatter "_e2e-test-with-tags.md" --get
# Expected: Only custom_field present

# 5.5 Merge additional fields (preserves existing)
./dist/obsidian-cli frontmatter "_e2e-test-with-tags.md" --set '{"priority":"high","reviewer":"claude"}' --merge

# 5.6 Verify merge worked
./dist/obsidian-cli frontmatter "_e2e-test-with-tags.md" --get
# Expected: custom_field, priority, reviewer all present

# 5.7 Delete a specific field
./dist/obsidian-cli frontmatter "_e2e-test-with-tags.md" --delete "custom_field"

# 5.8 Verify deletion
./dist/obsidian-cli frontmatter "_e2e-test-with-tags.md" --get
# Expected: custom_field gone, priority and reviewer remain
```

## Phase 6: Search Tests

```bash
# 6.1 Search for test notes by content
./dist/obsidian-cli search "E2E test" --limit 5

# 6.2 Search for specific content
./dist/obsidian-cli search "ADK API Integration" --limit 5

# 6.3 Verify search returns test files
./dist/obsidian-cli search "_e2e-test" --limit 10
# Expected: All _e2e-test-* files should appear in results
```

## Phase 7: File Input Tests

```bash
# 7.1 Create a temp file with content
cat > /tmp/e2e-test-content.md << 'EOF'
# From File Test

This content was loaded from a file using --from-file.

## Benefits

- Avoids shell escaping issues
- Handles large content
- Preserves formatting
EOF

# 7.2 Create note from file
./dist/obsidian-cli create "_e2e-test-from-file.md" --from-file /tmp/e2e-test-content.md --frontmatter '{"source":"file-input"}'

# 7.3 Verify content
./dist/obsidian-cli get "_e2e-test-from-file.md" | jq -r '.result.content'

# 7.4 Patch from file
cat > /tmp/e2e-patch-content.md << 'EOF'

## Additional Section

Added via --from-file patch.
EOF

./dist/obsidian-cli patch "_e2e-test-from-file.md" --from-file /tmp/e2e-patch-content.md

# 7.5 Verify patch applied
./dist/obsidian-cli get "_e2e-test-from-file.md" | jq -r '.result.content'

# 7.6 Cleanup temp files
rm /tmp/e2e-test-content.md /tmp/e2e-patch-content.md
```

## Phase 8: Cleanup

```bash
# 8.1 Delete all test notes
./dist/obsidian-cli delete "_e2e-test-adk-api-integration.md"
./dist/obsidian-cli delete "_e2e-test-with-tags.md"
./dist/obsidian-cli delete "_e2e-test-delete-section.md"
./dist/obsidian-cli delete "_e2e-test-from-file.md"

# 8.2 Verify deletion
./dist/obsidian-cli list | jq '.results | map(select(startswith("_e2e-test")))'
# Expected: []
```

---

## Known Issues & Workarounds

All issues from initial testing have been **FIXED**:

### ~~Issue 1: Title Generation Includes Leading Underscore~~ FIXED
- Leading underscores/special chars now stripped
- Added more acronyms: E2E, POC, MVP, JWT, OAuth, SSO, AWS, GCP, CI, CD

### ~~Issue 2: `--delete` Requires Content Input~~ FIXED
- `--delete` now works without providing content:
```bash
./dist/obsidian-cli patch "note.md" --heading "Section" --delete
```

### Issue 3: `--set` Without `--merge` Replaces All Frontmatter (BY DESIGN)

**Behavior:** Using `frontmatter --set` without `--merge` replaces ALL frontmatter.

**Solution:** Always use `--merge` flag when updating frontmatter:
```bash
# WRONG - loses all existing fields:
./dist/obsidian-cli frontmatter "note.md" --set '{"status":"done"}'

# CORRECT - preserves existing fields:
./dist/obsidian-cli frontmatter "note.md" --set '{"status":"done"}' --merge
```

**Note:** Instructions updated to emphasize `--merge` is REQUIRED.

---

## Success Criteria

- [ ] All commands execute without errors
- [ ] Title generation handles ADK, API, CLI acronyms correctly
- [ ] Timestamps (created_at, updated_at) are auto-generated
- [ ] Patch operations target correct sections
- [ ] Frontmatter operations work with --merge
- [ ] Search returns expected results via Omnisearch
- [ ] File input (--from-file) works for create and patch
- [ ] Cleanup removes all test notes
