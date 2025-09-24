# Sloppo - Development Log

## Project Overview
A literate programming tool implemented in Deno that generates HTML documentation from source code comments using tree-sitter for language-agnostic parsing.

## Architecture

### Core Components
- **Tree-sitter Integration**: Language-agnostic AST parsing for robust comment extraction
- **Two-stage Pipeline**: Source → JSON structure → HTML output
- **Responsive Layout**: Mobile-first design with desktop Docco-style side-by-side view
- **Multi-language Support**: Extensible language mapping system

### Current Language Support
- **C/C++**: `.c`, `.h` files using `tree-sitter-c`
- **JavaScript/TypeScript**: `.js`, `.ts`, `.mjs` files using `tree-sitter-javascript`
- **Extensible**: Framework ready for Python, Rust, Go, etc.

## Key Features Implemented

### 1. Language-Agnostic Comment Parsing
- Uses tree-sitter's universal "comment" node type
- No hardcoded comment syntax (supports `/**/`, `//`, `#`, `<!---->`, `--`, etc.)
- Clean content extraction with `extractCommentContent()` function
- Proper handling of JSDoc-style and regular comments

### 2. Responsive HTML Layout
- **Mobile**: Natural interleaved documentation-code flow
- **Desktop**: Docco-style side-by-side layout with 2:3 ratio
- **Flexbox Implementation**: Proper vertical alignment between related blocks
- **Smart Pairing**: Consecutive comment+code blocks aligned horizontally

### 3. Modern Styling & Content Processing
- **Tailwind CSS**: CDN-based styling with `@tailwindcss/browser@4`
- **Template System**: Configurable HTML template with placeholder substitution
- **Markdown Rendering**: Full GitHub Flavored Markdown support with `marked`
- **Shiki Integration**: VS Code-quality syntax highlighting with GitHub Dark theme
- **Typography**: Tailwind Prose classes for optimal readability
- **Color Scheme**: White docs on left, dark code background on right
- **Language Support**: Automatic highlighting for C, JavaScript, TypeScript, Python, Rust, Go, Java, C++

## Technical Implementation

### Dependencies
```typescript
import Parser from "npm:tree-sitter@^0.21.0";
import C from "npm:tree-sitter-c@^0.21.0";
import JavaScript from "npm:tree-sitter-javascript@^0.21.0";
import { codeToHtml } from "npm:shiki@^1.0.0";
import { marked } from "npm:marked@^12.0.0";
```

### Configuration Files
- `deno.json`: Enables node modules directory for tree-sitter compatibility
- Shebang: `#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-ffi`

### Block Structure
```typescript
interface LiterateBlock {
  type: 'comment' | 'code';
  content: string;
  language?: string;
  lineStart: number;
  lineEnd: number;
}
```

### Layout Strategy
1. **Mobile Layout**: Each block gets full width, stacked vertically
2. **Desktop Layout**: Flexbox rows with intelligent comment-code pairing
3. **Responsive Breakpoint**: `lg:` (1024px+) for desktop features

### Content Processing Systems

#### Markdown Rendering
1. **Marked Integration**: Full GitHub Flavored Markdown (GFM) support
2. **Rich Features**: Headers, lists, emphasis, links, blockquotes, code blocks
3. **Custom Renderer**: Tailored inline code and code block styling
4. **HTML Safety**: Allows trusted HTML while maintaining security
5. **Line Breaks**: Converts single line breaks to `<br>` tags

#### Syntax Highlighting
1. **Shiki Integration**: Uses VS Code's TextMate grammars for accurate highlighting
2. **Language Detection**: Automatic language detection based on file extensions
3. **Theme**: GitHub Dark theme for consistency with dark code background
4. **Fallback**: Graceful fallback to plain HTML-escaped text if highlighting fails
5. **Performance**: Async processing for non-blocking operation

## Command Line Usage
```bash
./sloppo.ts <input-file> [--output-html <output-file>]
```

**Examples:**
```bash
./sloppo.ts tests/c/hello-world.c
./sloppo.ts tests/js/example.js --output-html docs.html
```

## Development Challenges Solved

### 1. Tree-sitter Deno Integration
- **Issue**: Deno panics with tree-sitter native modules
- **Solution**: Install with lifecycle scripts and proper permissions
- **Command**: `deno install --allow-scripts=npm:tree-sitter@0.21.1,npm:tree-sitter-c@0.21.4`

### 2. Responsive Layout Alignment
- **Issue**: Grid layout caused vertical misalignment and mobile stacking problems
- **Solution**: Switched to flexbox with smart block pairing
- **Result**: Perfect desktop side-by-side alignment with mobile interleaved flow

### 3. Comment Content Extraction
- **Issue**: Language-specific comment syntax hardcoding
- **Solution**: Universal tree-sitter comment detection + regex cleanup patterns
- **Benefit**: Single codebase supports multiple languages seamlessly

### 4. Content Processing Enhancement
- **Issue**: Basic regex-based markdown was insufficient for rich documentation
- **Solution**: Integrated `marked` for full GitHub Flavored Markdown support
- **Result**: Professional documentation with headers, lists, links, blockquotes, and more

### 5. Syntax Highlighting Integration
- **Issue**: Need for professional-quality code highlighting
- **Solution**: Integrated Shiki with VS Code TextMate grammars and GitHub Dark theme
- **Result**: Beautiful, accurate syntax highlighting with automatic language detection

## File Structure
```
literate-code-ts/
├── literate-code-ts.ts     # Main implementation
├── deno.json               # Deno configuration
├── CLAUDE.md               # This documentation
├── README.md               # Project description
└── tests/
    ├── c/
    │   ├── hello-world.c     # Test C file with literate comments
    │   ├── mixed-comments.c  # Various comment style tests
    │   └── markdown-test.c   # Rich markdown features test
    └── js/
        └── example.js        # Test JavaScript file
```

## Future Enhancements
- [x] ~~Syntax highlighting with Prism.js or similar~~ ✅ **Implemented with Shiki**
- [ ] Additional language support (Python, Rust, Go via tree-sitter)
- [ ] Custom Shiki themes (VS Code Light, Monokai, etc.)
- [ ] JSON intermediate output option
- [ ] Custom CSS theme support
- [ ] Table of contents generation
- [ ] Cross-reference linking
- [ ] Multi-file project support
- [ ] Line number display option

## Testing

Visual testing performed with Playwright browser automation:

Use python -m http.server to serve up the HTML files in an accessible way.

- Mobile layout verification (375px viewport)
- Desktop layout verification (1200px viewport)
- Cross-browser compatibility testing
- Screenshot-based regression testing
