#!/usr/bin/env bash
# Lists AI/tool credits in deliverables. Exit 1 if any are found.
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)" || exit 2
pat='co-authored-by: *claude|claude-session|generated (by|with) \[?claude|made (by|with) (claude|ai)|built (by|with) (claude|ai)|ai[- ]generated|anthropic|claude\.ai|claude code|name="generator"|name="claude:'
hits=$(git ls-files -- '*.html' '*.md' '*.txt' '*.css' '*.js' '*.json' 'robots.txt' ':!:src/*.html' ':!:.claude/**' ':!:CLAUDE.md' 2>/dev/null | xargs -r grep -niE "$pat" 2>/dev/null)
if [ -n "$hits" ]; then echo "AI or tool credits found:"; echo "$hits"; exit 1; fi
echo "No AI or tool credits in deliverables."
