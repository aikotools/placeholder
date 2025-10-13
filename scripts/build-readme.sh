#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Building README.md from AsciiDoc files...${NC}"

# Base directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
DOC_DIR="$ROOT_DIR/doc"
TMP_DIR="$ROOT_DIR/.tmp-docs"

# Create temp directory
mkdir -p "$TMP_DIR"

# Function to convert adoc to markdown (via HTML intermediate)
convert_adoc() {
    local input=$1
    local output=$2
    local html_tmp="${output%.md}.html"
    echo -e "${GREEN}Converting $input...${NC}"

    # Convert AsciiDoc to HTML using asciidoctor
    asciidoctor "$input" -o "$html_tmp" -s -a sectanchors=false -a icons!

    # Convert HTML to Markdown using pandoc
    pandoc "$html_tmp" -f html -t gfm -o "$output" --wrap=none

    # Clean up HTML file
    rm -f "$html_tmp"
}

# Convert individual files from archive
ARCHIVE_DIR="$DOC_DIR/archive"
convert_adoc "$ARCHIVE_DIR/introduction.adoc" "$TMP_DIR/01-introduction.md"
convert_adoc "$ARCHIVE_DIR/getting-started.adoc" "$TMP_DIR/02-getting-started.md"
convert_adoc "$ARCHIVE_DIR/core-concepts.adoc" "$TMP_DIR/03-core-concepts.md"
convert_adoc "$ARCHIVE_DIR/plugins.adoc" "$TMP_DIR/04-plugins.md"
convert_adoc "$ARCHIVE_DIR/transforms.adoc" "$TMP_DIR/05-transforms.md"
convert_adoc "$ARCHIVE_DIR/api-reference.adoc" "$TMP_DIR/06-api-reference.md"
convert_adoc "$ARCHIVE_DIR/examples.adoc" "$TMP_DIR/07-examples.md"

# Build the final README.md
echo -e "${BLUE}Merging into README.md...${NC}"

cat > "$ROOT_DIR/README.md" << 'HEADER'
# @aikotools/placeholder

A powerful placeholder template engine with generate and compare modes for E2E testing scenarios.

[![GitHub](https://img.shields.io/badge/github-%23121011.svg?style=flat&logo=github&logoColor=white)](https://github.com/aikotools/placeholder)
[![npm version](https://badge.fury.io/js/@aikotools%2Fplaceholder.svg)](https://www.npmjs.com/package/@aikotools/placeholder)
[![License: DBISL](https://img.shields.io/badge/License-DBISL-blue.svg)](LICENSE)

## Table of Contents

- [Introduction](#introduction)
- [Getting Started](#getting-started)
- [Core Concepts](#core-concepts)
- [Plugins](#plugins)
- [Transforms](#transforms)
- [API Reference](#api-reference)
- [Examples](#examples)

---

HEADER

# Append all sections
for file in "$TMP_DIR"/*.md; do
    echo "" >> "$ROOT_DIR/README.md"
    cat "$file" >> "$ROOT_DIR/README.md"
    echo "" >> "$ROOT_DIR/README.md"
done

# Clean up HTML artifacts
echo -e "${BLUE}Cleaning up HTML artifacts...${NC}"
sed -i '' '/<div[^>]*>/d' "$ROOT_DIR/README.md"
sed -i '' '/<\/div>/d' "$ROOT_DIR/README.md"
sed -i '' '/<a href="#[^"]*" class="anchor"><\/a>/d' "$ROOT_DIR/README.md"
sed -i '' '/^$/N;/^\n$/d' "$ROOT_DIR/README.md"  # Remove consecutive empty lines

# Add footer
cat >> "$ROOT_DIR/README.md" << 'FOOTER'

---

## License

DBISL - See [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues, questions, or feature requests, please use the [GitHub Issues](https://github.com/aikotools/placeholder/issues) page.

FOOTER

# Cleanup
rm -rf "$TMP_DIR"

echo -e "${GREEN}✓ README.md successfully created!${NC}"
echo -e "${BLUE}Location: $ROOT_DIR/README.md${NC}"
