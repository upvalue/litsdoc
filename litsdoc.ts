#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-ffi

/**
 * # litsdoc
 * 
 * A literate programming tool that transforms source code into beautiful,
 * readable documentation. This tool extracts comments from source files
 * and presents them alongside the code in an elegant HTML format.
 * 
 * ## Key Features
 * - **Language Agnostic**: Uses tree-sitter for robust AST parsing
 * - **Multi-file Support**: Process multiple source files at once
 * - **Responsive Design**: Mobile-first with Docco-style desktop layout
 * - **Markdown Support**: Full GitHub Flavored Markdown in comments
 * - **Syntax Highlighting**: VS Code-quality highlighting with Shiki
 */

import Parser from "npm:tree-sitter@^0.21.0";
import C from "npm:tree-sitter-c@^0.21.0";
import JavaScript from "npm:tree-sitter-javascript@^0.21.0";
import Rust from "npm:tree-sitter-rust@^0.21.0";
import { codeToHtml } from "npm:shiki@^1.0.0";
import { marked } from "npm:marked@^12.0.0";
import { parseArgs } from "jsr:@std/cli/parse-args";


/**
 * ## Language Parser Mapping
 * 
 * Maps file extensions to their corresponding tree-sitter parser.
 * Tree-sitter provides language-agnostic AST parsing, allowing us
 * to extract comments from any supported language without hardcoding
 * comment syntax.
 * 
 * Currently supports: C, C headers, JavaScript, TypeScript, ES modules, and Rust.
 * Python is ready to be added when its parser is imported.
 * Linker scripts (.ld) use regex-based comment extraction as fallback.
 */
const LANGUAGE_MAP = {
  '.c': C,
  '.h': C,
  '.js': JavaScript,
  '.ts': JavaScript, // TypeScript uses same parser for comments
  '.mjs': JavaScript,
  '.rs': Rust,
  '.ld': null, // Linker scripts use regex fallback
  // '.py': Python,
};

/**
 * ## Syntax Highlighting Configuration
 * 
 * Maps file extensions to Shiki language identifiers for syntax highlighting.
 * Shiki uses VS Code's TextMate grammars, providing the same high-quality
 * syntax highlighting you see in Visual Studio Code.
 * 
 * For languages without specific Shiki support (like linker scripts),
 * we fall back to 'text' for plain text display without errors.
 */
const SHIKI_LANGUAGE_MAP: Record<string, string> = {
  'c': 'c',
  'h': 'c',
  'js': 'javascript',
  'ts': 'typescript',
  'mjs': 'javascript',
  'ld': 'text', // No specific Shiki support for linker scripts yet
  'py': 'python',
  'rs': 'rust',
  'go': 'go',
  'java': 'java',
  'cpp': 'cpp',
  'hpp': 'cpp',
};

/**
 * ## HTML Template
 * 
 * The base template for generated documentation. Uses Tailwind CSS via CDN
 * for styling, with placeholders for dynamic content:
 * - `{{TITLE}}`: Document title (shown in browser tab and header)
 * - `{{DESCRIPTION}}`: Markdown-processed description below title
 * - `{{CONTENT}}`: The main documentation content (comments and code)
 */
const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TITLE}}</title>
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <style>
    /* Custom prose styling since Tailwind prose isn't available in CDN */
    .prose {
      color: #374151;
      max-width: none;
    }
    .prose h1:first-of-type, .prose h2:first-of-type, .prose h3:first-of-type, .prose h4:first-of-type, .prose h5:first-of-type, .prose h6:first-of-type {
      margin-top: 0;
    }
    .prose h1 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
      margin-top: 1.5rem;
      color: #111827;
      line-height: 1.25;
    }
    .prose h2 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      margin-top: 1.25rem;
      color: #111827;
      line-height: 1.3;
    }
    .prose h3 {
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      margin-top: 1rem;
      color: #111827;
      line-height: 1.35;
    }
    .prose p {
      margin-bottom: 1rem;
      line-height: 1.6;
    }
    .prose ul, .prose ol {
      margin-bottom: 1rem;
      padding-left: 1.5rem;
    }
    .prose li {
      margin-bottom: 0.25rem;
      line-height: 1.6;
    }
    .prose ul li {
      list-style-type: disc;
    }
    .prose ol li {
      list-style-type: decimal;
    }
    .prose blockquote {
      border-left: 4px solid #e5e7eb;
      padding-left: 1rem;
      margin: 1rem 0;
      font-style: italic;
      color: #6b7280;
    }
    .prose code {
      background-color: #f3f4f6;
      padding: 0.125rem 0.25rem;
      border-radius: 0.25rem;
      font-size: 0.875rem;
      font-family: ui-monospace, SFMono-Regular, "Roboto Mono", "Cascadia Code", "Source Code Pro", Menlo, Consolas, "DejaVu Sans Mono", monospace;
    }
    .prose pre {
      background-color: #1f2937;
      color: #e5e7eb;
      padding: 0.75rem;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      overflow-x: auto;
      margin: 1rem 0;
    }
    .prose pre code {
      background-color: transparent;
      padding: 0;
      color: inherit;
    }
    .prose strong {
      font-weight: 600;
      color: #111827;
    }
    .prose em {
      font-style: italic;
    }
    .prose a {
      color: #2563eb;
      text-decoration: underline;
    }
    .prose a:hover {
      color: #1d4ed8;
    }
  </style>
</head>
<body class="bg-gray-50 font-sans">
  <div class="max-w-7xl mx-auto">
    <header class="py-8 px-6 bg-white shadow-sm border-b">
      <h1 class="text-3xl font-bold text-gray-900">{{TITLE}}</h1>
      <div class="text-gray-600 mt-2 prose">{{DESCRIPTION}}</div>
    </header>
    
    <main class="block lg:flex min-h-screen">
      {{CONTENT}}
    </main>
  </div>
</body>
</html>`;

/**
 * ## Core Data Structures
 * 
 * `LiterateBlock` represents a single unit of documentation or code.
 * These blocks are extracted from source files and alternated to create
 * the literate programming layout where documentation and code are paired.
 */
interface LiterateBlock {
  type: 'comment' | 'code';
  content: string;
  language?: string;
  lineStart: number;
  lineEnd: number;
  fileName: string;
}

/**
 * `ProcessedFile` contains all blocks from a single source file,
 * along with metadata for URL linking.
 */
interface ProcessedFile {
  fileName: string;
  blocks: LiterateBlock[];
  baseUrl?: string;
}

/**
 * `CommandLineOptions` defines all available CLI arguments.
 * Supports both direct CLI usage and argfile configuration.
 */
interface CommandLineOptions {
  files: string[];
  outputHtml?: string;
  codeUrl?: string;
  title?: string;
  description?: string;
  argfile?: string;
  stdout?: boolean;
  help?: boolean;
  version?: boolean;
}

/**
 * ## Markdown Processing Configuration
 * 
 * Configures the `marked` library for processing markdown in comments.
 * Enables GitHub Flavored Markdown without automatic line break conversion
 * to prevent unwanted <br> tags in our clean prose formatting.
 */
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: false, // Don't convert \n to <br> - let proper paragraph handling work
  sanitize: false, // Allow HTML (we trust our source code comments)
});

// Custom renderer for inline code to match our styling
const renderer = new marked.Renderer();
renderer.code = (code: string, language: string | undefined) => {
  // For code blocks in markdown, we'll use inline styling that matches our theme
  const escapedCode = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<pre class="bg-gray-800 text-gray-200 p-2 rounded text-sm overflow-x-auto"><code>${escapedCode}</code></pre>`;
};

renderer.codespan = (text: string) => {
  return `<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">${text}</code>`;
};

marked.setOptions({ renderer });

/**
 * ## Markdown Processing
 * 
 * Converts markdown content from comments into HTML.
 * Handles all standard markdown features including headers, lists,
 * emphasis, links, and code blocks. Falls back to simple paragraph
 * wrapping if markdown processing fails.
 */
async function processMarkdown(content: string): Promise<string> {
  try {
    // Use marked to process the markdown content
    const html = await marked.parse(content);
    return html;
  } catch (error) {
    console.warn('Failed to process markdown:', error.message);
    // Fallback to simple paragraph wrapping
    return `<p class="mb-4">${content.replace(/\n/g, '<br>')}</p>`;
  }
}

/**
 * ## Syntax Highlighting
 * 
 * Applies VS Code-quality syntax highlighting using Shiki with fallback strategies.
 * Uses GitHub Dark theme with custom transformers for consistent styling.
 */
const SHIKI_TRANSFORMERS = [{
  pre(node: any) {
    node.properties.class = 'text-sm leading-relaxed overflow-x-auto';
    node.properties.style = 'background-color: transparent; padding: 0; margin: 0;';
  },
  code(node: any) {
    node.properties.style = 'background-color: transparent;';
  }
}];

async function highlightCode(code: string, language: string): Promise<string> {
  const strategies = [
    () => codeToHtml(code, {
      lang: SHIKI_LANGUAGE_MAP[language] || 'text',
      theme: 'github-dark',
      transformers: SHIKI_TRANSFORMERS
    }),
    () => codeToHtml(code, {
      lang: 'text',
      theme: 'github-dark', 
      transformers: SHIKI_TRANSFORMERS
    }),
    () => Promise.resolve(`<pre class="text-sm leading-relaxed overflow-x-auto"><code>${
      code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    }</code></pre>`)
  ];
  
  for (const [i, strategy] of strategies.entries()) {
    try {
      return await strategy();
    } catch (error) {
      if (i < strategies.length - 1) {
        console.warn(`Highlight strategy ${i + 1} failed, trying fallback:`, (error as Error).message);
      }
    }
  }
  
  throw new Error('All highlighting strategies failed');
}

/**
 * ## Argument File Parser
 * 
 * Reads and parses arguments from a configuration file using regex.
 * Supports quoted strings with spaces for complex configurations.
 */
async function parseArgsFromFile(argfilePath: string): Promise<string[]> {
  try {
    const content = await Deno.readTextFile(argfilePath);
    return content.trim().match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g)
      ?.map(s => s.replace(/^["']|["']$/g, '')) || [];
  } catch (error) {
    console.error(`Error reading argfile '${argfilePath}': ${error.message}`);
    Deno.exit(1);
  }
}


/**
 * ## Unified Command Line Argument Parser
 * 
 * Handles both direct CLI arguments and argfile-based configuration.
 * When an argfile is specified, reads arguments from the file and
 * parses them as if they were provided on the command line.
 */
async function parseCommandLineArgs(): Promise<CommandLineOptions> {
  // First check if --argfile is specified
  const initialArgs = parseArgs(Deno.args, {
    string: ["argfile"],
    alias: { "argfile": "f" }
  });

  let argsToProcess = Deno.args;

  // If argfile is specified, read arguments from file
  if (initialArgs.argfile) {
    console.log(`Reading arguments from: ${initialArgs.argfile}`);
    argsToProcess = await parseArgsFromFile(initialArgs.argfile as string);
  }

  const args = parseArgs(argsToProcess, {
    boolean: ["help", "version", "stdout"],
    string: ["output-html", "code-url", "title", "description", "argfile"],
    alias: {
      "help": "h",
      "version": "v",
      "output-html": "o",
      "code-url": "u",
      "title": "t",
      "description": "d",
      "argfile": "f",
      "stdout": "s"
    },
    default: {
      "help": false,
      "version": false,
      "stdout": false
    }
  });

  if (args.help) {
    console.log(`
Usage: litsdoc.ts [file1] [file2] [...] [options]

Options:
  -h, --help                    Show this help message
  -v, --version                 Show version information
  -o, --output-html <file>      Output HTML file (default: first-input-file.html)
  -s, --stdout                  Output HTML to stdout instead of file
  -u, --code-url <url>          Base URL for linking to source files
  -t, --title <title>           Custom title (markdown supported)
  -d, --description <desc>      Custom description (markdown supported)
  -f, --argfile <file>          Read arguments from file (overrides CLI args)

Examples:
  litsdoc.ts hello.c
  litsdoc.ts a.c b.js --output-html docs.html
  litsdoc.ts hello.c --stdout > docs.html
  litsdoc.ts *.c --code-url https://github.com/user/repo/tree/main/
  litsdoc.ts --title "My Project" --description "**Documentation** for my project"
  litsdoc.ts --argfile myproject.argfile
    `);
    Deno.exit(0);
  }

  if (args.version) {
    console.log("litsdoc v1.2.0");
    Deno.exit(0);
  }

  if (args._.length < 1) {
    console.error('Error: At least one input file is required');
    console.error('Usage: litsdoc.ts [file1] [file2] [...] [options]');
    console.error('Use --help for more information');
    Deno.exit(1);
  }

  const files = args._.map(f => String(f));
  const outputHtml = args["output-html"] || files[0].replace(/\.[^.]+$/, '.html');
  const codeUrl = args["code-url"];
  const title = args["title"];
  const description = args["description"];
  const stdout = args["stdout"];

  return {
    files,
    outputHtml,
    codeUrl,
    title,
    description,
    stdout,
    help: args.help,
    version: args.version
  };
}

/**
 * ## Comment Content Extraction Patterns
 * 
 * Pattern matching for different comment styles to enable language-agnostic parsing.
 */
const COMMENT_PATTERNS = [
  {
    test: (s: string) => s.startsWith('/*'),
    clean: (s: string) => s
      .replace(/^\/\*\*?/, '')
      .replace(/\*\/$/, '')
      .split('\n')
      .map(line => line.replace(/^\s*\*\s?/, ''))
      .join('\n')
      .trim()
  },
  {
    test: (s: string) => s.startsWith('//'),
    clean: (s: string) => s
      .split('\n')
      .map(line => line.replace(/^\s*\/\/\s?/, ''))
      .join('\n')
      .trim()
  },
  {
    test: (s: string) => s.startsWith('#'),
    clean: (s: string) => s
      .split('\n')
      .map(line => line.replace(/^\s*#\s?/, ''))
      .join('\n')
      .trim()
  },
  {
    test: (s: string) => s.startsWith('<!--'),
    clean: (s: string) => s.replace(/^<!--/, '').replace(/-->$/, '').trim()
  },
  {
    test: (s: string) => s.startsWith('--'),
    clean: (s: string) => s
      .split('\n')
      .map(line => line.replace(/^\s*--\s?/, ''))
      .join('\n')
      .trim()
  }
];

function getFileExtension(filename: string): string {
  const match = filename.match(/\.[^.]+$/);
  return match ? match[0] : '';
}

/**
 * ## Comment Content Extraction
 * 
 * Extracts the actual content from raw comment text.
 * This is the key to language-agnostic comment parsing - we don't
 * need to know the comment syntax, just clean it up after tree-sitter
 * identifies it as a comment.
 * 
 * Handles:
 * - C-style block comments
 * - C++/JS/TS line comments
 * - Python/Shell comments
 * - HTML/XML comments
 * - SQL comments
 */
function extractCommentContent(rawComment: string): string {
  const content = rawComment.trim();
  
  for (const pattern of COMMENT_PATTERNS) {
    if (pattern.test(content)) {
      return pattern.clean(content);
    }
  }
  
  return content;
}

/**
 * ## File Header Generation
 * 
 * Creates a visual header for each source file in multi-file documentation.
 * Includes an optional link to the source file on GitHub or other repositories.
 * The header uses a file icon and distinctive styling to mark file boundaries.
 */
function generateFileHeader(fileName: string, codeUrl?: string): string {
  const displayName = fileName.split('/').pop() || fileName;
  const fileLink = codeUrl ? `${codeUrl.endsWith('/') ? codeUrl : codeUrl + '/'}${fileName}` : '';
  
  const headerContent = fileLink 
    ? `<a href="${fileLink}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 hover:underline">${displayName}</a>`
    : displayName;

  return `
    <!-- File Header: ${fileName} -->
    <div class="bg-gray-100 border-b-2 border-gray-300 lg:flex w-full">
      <div class="w-full lg:w-2/5 bg-gray-50 border-r border-gray-300">
        <div class="p-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-2">
            <svg class="inline-block w-4 h-4 mr-2 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"></path>
            </svg>
            ${headerContent}
          </h2>
        </div>
      </div>
      <div class="hidden lg:block w-3/5 bg-gray-100">
        <div class="p-6">
          <div class="h-full min-h-[3rem] flex items-center">
            <span class="text-gray-500 text-sm italic">Source file</span>
          </div>
        </div>
      </div>
    </div>`;
}

/**
 * ## Regex-based Comment Parser for Linker Scripts
 * 
 * Extracts C-style comments from linker scripts using regex patterns.
 * This fallback is used when tree-sitter parsers aren't available.
 * Specifically handles multi-line comments (slash-star ... star-slash) in .ld files.
 */
function parseLinkerScriptComments(sourceCode: string, fileName: string): LiterateBlock[] {
  const lines = sourceCode.split('\n');
  const blocks: LiterateBlock[] = [];
  
  // Regex to match C-style block comments /* ... */
  const commentRegex = /\/\*[\s\S]*?\*\//g;
  let match;
  
  while ((match = commentRegex.exec(sourceCode)) !== null) {
    const commentText = match[0];
    const matchStart = match.index;
    
    // Find line numbers for this comment
    const beforeComment = sourceCode.substring(0, matchStart);
    const startLine = beforeComment.split('\n').length;
    const commentLines = commentText.split('\n');
    const endLine = startLine + commentLines.length - 1;
    
    // Clean the comment content
    const cleanContent = extractCommentContent(commentText);
    
    if (cleanContent.trim()) {
      blocks.push({
        type: 'comment',
        content: cleanContent,
        lineStart: startLine,
        lineEnd: endLine,
        fileName: fileName
      });
    }
  }
  
  return blocks.sort((a, b) => a.lineStart - b.lineStart);
}

/**
 * ## Block Building Helper
 * 
 * Builds alternating sequence of comment and code blocks from extracted comments.
 * This helper is used by both tree-sitter parsing and regex fallback parsing.
 */
function buildAlternatingBlocks(comments: LiterateBlock[], sourceCode: string, inputFile: string): LiterateBlock[] {
  const lines = sourceCode.split('\n');
  const ext = getFileExtension(inputFile);
  const result: LiterateBlock[] = [];
  let lastLine = 0;
  
  for (const commentBlock of comments) {
    // Add code before this comment
    if (lastLine < commentBlock.lineStart - 1) {
      const codeLines = lines.slice(lastLine, commentBlock.lineStart - 1);
      const codeContent = codeLines.join('\n').trim();
      if (codeContent) {
        result.push({
          type: 'code',
          content: codeContent,
          language: ext.substring(1),
          lineStart: lastLine + 1,
          lineEnd: commentBlock.lineStart - 1,
          fileName: inputFile
        });
      }
    }
    
    result.push(commentBlock);
    lastLine = commentBlock.lineEnd;
  }
  
  // Add remaining code after last comment
  if (lastLine < lines.length) {
    const codeLines = lines.slice(lastLine);
    const codeContent = codeLines.join('\n').trim();
    if (codeContent) {
      result.push({
        type: 'code',
        content: codeContent,
        language: ext.substring(1),
        lineStart: lastLine + 1,
        lineEnd: lines.length,
        fileName: inputFile
      });
    }
  }
  
  return result;
}

/**
 * ## Source File Parser
 * 
 * The core parsing function that extracts comments and code blocks from a source file.
 * 
 * ### How it works:
 * 1. **Initialize Parser**: Sets up tree-sitter with the appropriate language grammar
 * 2. **Parse AST**: Generates an Abstract Syntax Tree of the source code
 * 3. **Extract Comments**: Traverses the AST to find all comment nodes
 * 4. **Build Blocks**: Creates alternating comment and code blocks
 * 5. **Sort and Return**: Returns blocks in source order
 * 
 * This approach is language-agnostic - we don't need to know comment syntax,
 * just identify comment nodes in the AST.
 */
async function parseSourceFile(inputFile: string): Promise<LiterateBlock[]> {
  const ext = getFileExtension(inputFile);
  const LanguageParser = LANGUAGE_MAP[ext as keyof typeof LANGUAGE_MAP];
  
  const sourceCode = await Deno.readTextFile(inputFile);
  
  // Special handling for .ld files using regex fallback
  if (LanguageParser === null && ext === '.ld') {
    const comments = parseLinkerScriptComments(sourceCode, inputFile);
    return buildAlternatingBlocks(comments, sourceCode, inputFile);
  }
  
  if (!LanguageParser) {
    throw new Error(`Unsupported file extension: ${ext}`);
  }
  
  const lines = sourceCode.split('\n');
  
  let parser: Parser;
  try {
    parser = new Parser();
    parser.setLanguage(LanguageParser);
  } catch (error) {
    console.error('Failed to initialize tree-sitter parser:', error.message);
    throw error;
  }
  
  let tree: any;
  try {
    tree = parser.parse(sourceCode);
  } catch (error) {
    console.error('Failed to parse source code:', error.message);
    throw error;
  }
  
  const comments: LiterateBlock[] = [];
  
  function traverse(node: any) {
    try {
      // Check for different comment node types across languages
      if (node.type === 'comment' || node.type === 'line_comment' || node.type === 'block_comment') {
        const startLine = node.startPosition.row;
        const endLine = node.endPosition.row;
        const content = node.text;
        
        // Extract clean content from comment (language-agnostic)
        const cleanContent = extractCommentContent(content);
        
        comments.push({
          type: 'comment',
          content: cleanContent,
          lineStart: startLine + 1,
          lineEnd: endLine + 1,
          fileName: inputFile
        });
      }
      
      if (node.children) {
        for (const child of node.children) {
          traverse(child);
        }
      }
    } catch (error) {
      console.error('Error traversing AST node:', error.message);
    }
  }
  
  try {
    traverse(tree.rootNode);
  } catch (error) {
    console.error('Error traversing AST:', error.message);
    throw error;
  }
  
  // Sort comments by line number
  comments.sort((a, b) => a.lineStart - b.lineStart);
  
  // Build alternating blocks using the helper function
  return buildAlternatingBlocks(comments, sourceCode, inputFile);
}

/**
 * ## Multi-File Processor
 * 
 * Processes multiple source files sequentially, building a collection
 * of processed files for combined documentation. Each file maintains
 * its own block structure while sharing common configuration like URLs.
 */
async function processMultipleFiles(files: string[], codeUrl?: string, quiet = false): Promise<ProcessedFile[]> {
  const processedFiles: ProcessedFile[] = [];
  
  for (const file of files) {
    if (!quiet) {
      console.log(`Processing: ${file}`);
    }
    const blocks = await parseSourceFile(file);
    processedFiles.push({
      fileName: file,
      blocks,
      baseUrl: codeUrl
    });
  }
  
  return processedFiles;
}

/**
 * ## HTML Generation
 * 
 * Generates the final HTML documentation from processed files.
 * 
 * ### Layout Strategy:
 * - **Mobile**: Stacks all blocks vertically for easy scrolling
 * - **Desktop**: Side-by-side layout with comments on left, code on right
 * - **Responsive**: Uses Tailwind's breakpoint system for adaptation
 * 
 * ### Block Pairing:
 * When a comment is followed by code, they're paired horizontally on desktop.
 * Unpaired comments or code blocks get empty space on the opposite side.
 * 
 * This creates the classic literate programming aesthetic where prose
 * and code are visually connected.
 */
async function generateMultiFileHTML(processedFiles: ProcessedFile[], customTitle?: string, customDescription?: string): Promise<string> {
  const title = customTitle || (processedFiles.length === 1 
    ? (processedFiles[0].fileName.split('/').pop() || 'Literate Code')
    : `Literate Code (${processedFiles.length} files)`);
  
  const description = customDescription 
    ? await processMarkdown(customDescription)
    : 'Literate Programming Documentation';
  
  // Mobile: stack all blocks vertically
  let mobileContent = '';
  
  // Desktop: create pairs by grouping consecutive comment+code or individual blocks
  let desktopContent = '';
  
  for (let fileIndex = 0; fileIndex < processedFiles.length; fileIndex++) {
    const processedFile = processedFiles[fileIndex];
    const { fileName, blocks, baseUrl } = processedFile;
    
    // Add file header (only if we have multiple files or this is the first file with content)
    if (processedFiles.length > 1 || fileIndex === 0) {
      const fileHeader = generateFileHeader(fileName, baseUrl);
      mobileContent += fileHeader.replace('lg:flex', 'lg:hidden'); // Mobile version
      desktopContent += fileHeader.replace('lg:hidden', 'hidden lg:flex'); // Desktop version
    }

    // Process blocks for this file
    for (let i = 0; i < blocks.length; i++) {
      const currentBlock = blocks[i];
      const nextBlock = blocks[i + 1];
      
      if (currentBlock.type === 'comment') {
        const markdownContent = await processMarkdown(currentBlock.content);
        
        // Mobile version
        mobileContent += `
          <div class="bg-white border-b border-gray-200 lg:hidden">
            <div class="p-6">
              <div class="prose">
                ${markdownContent}
              </div>
            </div>
          </div>`;
        
        // Desktop version: check if next block is code to pair them
        if (nextBlock && nextBlock.type === 'code') {
          // Pair comment with following code block
          const highlightedCode = await highlightCode(nextBlock.content, nextBlock.language || 'text');
          
          desktopContent += `
            <div class="hidden lg:flex w-full">
              <div class="w-2/5 bg-white border-r border-gray-200">
                <div class="p-6">
                  <div class="prose">
                    ${markdownContent}
                  </div>
                </div>
              </div>
              <div class="w-3/5 bg-gray-900">
                <div class="p-6">
                  ${highlightedCode}
                </div>
              </div>
            </div>`;
          
          // Add mobile version of the code block
          mobileContent += `
            <div class="bg-gray-900 border-b border-gray-200 lg:hidden">
              <div class="p-6">
                ${highlightedCode}
              </div>
            </div>`;
          
          // Skip the next block since we've already processed it
          i++;
        } else {
          // Comment without following code - pair with empty space
          desktopContent += `
            <div class="hidden lg:flex w-full">
              <div class="w-2/5 bg-white border-r border-gray-200">
                <div class="p-6">
                  <div class="prose">
                    ${markdownContent}
                  </div>
                </div>
              </div>
              <div class="w-3/5 bg-gray-900">
                <div class="p-6">
                  <div class="h-full min-h-[4rem]"></div>
                </div>
              </div>
            </div>`;
        }
      } else {
        // Code block (not paired with preceding comment)
        const highlightedCode = await highlightCode(currentBlock.content, currentBlock.language || 'text');
        
        // Mobile version
        mobileContent += `
          <div class="bg-gray-900 border-b border-gray-200 lg:hidden">
            <div class="p-6">
              ${highlightedCode}
            </div>
          </div>`;
        
        // Desktop version - empty left, code right
        desktopContent += `
          <div class="hidden lg:flex w-full">
            <div class="w-2/5 bg-white border-r border-gray-200">
              <div class="p-6">
                <div class="h-full min-h-[4rem]"></div>
              </div>
            </div>
            <div class="w-3/5 bg-gray-900">
              <div class="p-6">
                ${highlightedCode}
              </div>
            </div>
          </div>`;
      }
    }
  }
  
  const content = `
    ${mobileContent}
    <div class="hidden lg:flex lg:flex-col w-full">
      ${desktopContent}
    </div>`;
  
  return HTML_TEMPLATE
    .replace(/{{TITLE}}/g, title)
    .replace('{{DESCRIPTION}}', description)
    .replace('{{CONTENT}}', content);
}

/**
 * ## Main Entry Point
 * 
 * Orchestrates the entire documentation generation process:
 * 1. Parse command-line arguments (with argfile support)
 * 2. Process all input files to extract blocks
 * 3. Generate HTML from processed blocks
 * 4. Output to file or stdout
 * 5. Report statistics (unless in quiet/stdout mode)
 * 
 * The main function handles all error cases and provides
 * appropriate exit codes for CLI usage.
 */
async function main() {
  try {
    const options = await parseCommandLineArgs();
    
    if (!options.stdout) {
      console.log(`Processing ${options.files.length} file(s): ${options.files.join(', ')}`);
      console.log(`Output: ${options.outputHtml}`);
      if (options.codeUrl) {
        console.log(`Code URL: ${options.codeUrl}`);
      }
      if (options.title) {
        console.log(`Title: ${options.title}`);
      }
      if (options.description) {
        console.log(`Description: ${options.description}`);
      }
    }
    
    const processedFiles = await processMultipleFiles(options.files, options.codeUrl, options.stdout);
    const html = await generateMultiFileHTML(processedFiles, options.title, options.description);
    
    if (options.stdout) {
      console.log(html);
    } else {
      await Deno.writeTextFile(options.outputHtml, html);
    }
    
    if (!options.stdout) {
      const totalBlocks = processedFiles.reduce((sum, file) => sum + file.blocks.length, 0);
      const totalComments = processedFiles.reduce((sum, file) => sum + file.blocks.filter(b => b.type === 'comment').length, 0);
      const totalCodeBlocks = processedFiles.reduce((sum, file) => sum + file.blocks.filter(b => b.type === 'code').length, 0);
      
      console.log(`Generated HTML: ${options.outputHtml}`);
      console.log(`Processed ${options.files.length} files with ${totalBlocks} blocks (${totalComments} comments, ${totalCodeBlocks} code)`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await main();
}
