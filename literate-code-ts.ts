#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-ffi

import Parser from "npm:tree-sitter@^0.21.0";
import C from "npm:tree-sitter-c@^0.21.0";
import JavaScript from "npm:tree-sitter-javascript@^0.21.0";
import { codeToHtml } from "npm:shiki@^1.0.0";
import { marked } from "npm:marked@^12.0.0";

// We'll add more language support as needed
// import Python from "npm:tree-sitter-python@^0.21.0";
// import Rust from "npm:tree-sitter-rust@^0.21.0";

const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TITLE}}</title>
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
</head>
<body class="bg-gray-50 font-sans">
  <div class="max-w-7xl mx-auto">
    <header class="py-8 px-6 bg-white shadow-sm border-b">
      <h1 class="text-3xl font-bold text-gray-900">{{TITLE}}</h1>
      <p class="text-gray-600 mt-2">Literate Programming Documentation</p>
    </header>
    
    <main class="block lg:flex min-h-screen">
      {{CONTENT}}
    </main>
  </div>
</body>
</html>`;

interface LiterateBlock {
  type: 'comment' | 'code';
  content: string;
  language?: string;
  lineStart: number;
  lineEnd: number;
}

const LANGUAGE_MAP = {
  '.c': C,
  '.h': C,
  '.js': JavaScript,
  '.ts': JavaScript, // TypeScript uses same parser for comments
  '.mjs': JavaScript,
  // '.py': Python,
  // '.rs': Rust,
};

// Map file extensions to Shiki language identifiers
const SHIKI_LANGUAGE_MAP: Record<string, string> = {
  'c': 'c',
  'h': 'c',
  'js': 'javascript',
  'ts': 'typescript',
  'mjs': 'javascript',
  'py': 'python',
  'rs': 'rust',
  'go': 'go',
  'java': 'java',
  'cpp': 'cpp',
  'hpp': 'cpp',
};

// Configure marked options
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Convert \n to <br>
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

async function highlightCode(code: string, language: string): Promise<string> {
  try {
    const shikiLanguage = SHIKI_LANGUAGE_MAP[language] || 'text';
    const html = await codeToHtml(code, {
      lang: shikiLanguage,
      theme: 'github-dark',
      transformers: [
        {
          pre(node) {
            // Remove default Shiki classes and add our own
            node.properties.class = 'text-sm leading-relaxed overflow-x-auto';
            node.properties.style = 'background-color: transparent; padding: 0; margin: 0;';
          },
          code(node) {
            // Ensure code maintains proper styling
            node.properties.style = 'background-color: transparent;';
          }
        }
      ]
    });
    
    return html;
  } catch (error) {
    console.warn(`Failed to highlight code for language ${language}:`, error.message);
    // Fallback to HTML-escaped plain text with proper pre/code structure
    const escapedCode = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<pre class="text-sm leading-relaxed overflow-x-auto"><code>${escapedCode}</code></pre>`;
  }
}

function parseArguments(): { inputFile: string; outputFile: string } {
  const args = Deno.args;
  
  if (args.length < 1) {
    console.error('Usage: literate-code-ts.ts <input-file> [--output-html <output-file>]');
    Deno.exit(1);
  }
  
  const inputFile = args[0];
  let outputFile = inputFile.replace(/\.[^.]+$/, '.html');
  
  const outputIndex = args.indexOf('--output-html');
  if (outputIndex !== -1 && outputIndex + 1 < args.length) {
    outputFile = args[outputIndex + 1];
  }
  
  return { inputFile, outputFile };
}

function getFileExtension(filename: string): string {
  const match = filename.match(/\.[^.]+$/);
  return match ? match[0] : '';
}

function extractCommentContent(rawComment: string): string {
  // Language-agnostic comment content extraction
  // Tree-sitter gives us the full comment including delimiters
  // We need to strip common comment patterns
  
  let content = rawComment.trim();
  
  // Handle C-style block comments: /* ... */ or /** ... */
  if (content.startsWith('/*')) {
    content = content
      .replace(/^\/\*\*?/, '')  // Remove opening /* or /**
      .replace(/\*\/$/, '')     // Remove closing */
      .split('\n')
      .map(line => {
        // Remove leading * and whitespace from each line
        const cleaned = line.replace(/^\s*\*\s?/, '');
        return cleaned;
      })
      .join('\n')
      .trim();
  }
  // Handle C++/JS/TS style line comments: // ...
  else if (content.startsWith('//')) {
    content = content
      .split('\n')
      .map(line => line.replace(/^\s*\/\/\s?/, ''))
      .join('\n')
      .trim();
  }
  // Handle Python/Ruby/Shell style comments: # ...
  else if (content.startsWith('#')) {
    content = content
      .split('\n')
      .map(line => line.replace(/^\s*#\s?/, ''))
      .join('\n')
      .trim();
  }
  // Handle HTML/XML comments: <!-- ... -->
  else if (content.startsWith('<!--')) {
    content = content
      .replace(/^<!--/, '')
      .replace(/-->$/, '')
      .trim();
  }
  // Handle SQL comments: -- ...
  else if (content.startsWith('--')) {
    content = content
      .split('\n')
      .map(line => line.replace(/^\s*--\s?/, ''))
      .join('\n')
      .trim();
  }
  // For any other comment style, just return as-is
  // Tree-sitter should have already identified it as a comment
  
  return content;
}

async function parseSourceFile(inputFile: string): Promise<LiterateBlock[]> {
  const ext = getFileExtension(inputFile);
  const LanguageParser = LANGUAGE_MAP[ext as keyof typeof LANGUAGE_MAP];
  
  if (!LanguageParser) {
    throw new Error(`Unsupported file extension: ${ext}`);
  }
  
  const sourceCode = await Deno.readTextFile(inputFile);
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
      if (node.type === 'comment') {
        const startLine = node.startPosition.row;
        const endLine = node.endPosition.row;
        const content = node.text;
        
        // Extract clean content from comment (language-agnostic)
        const cleanContent = extractCommentContent(content);
        
        comments.push({
          type: 'comment',
          content: cleanContent,
          lineStart: startLine + 1,
          lineEnd: endLine + 1
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
  
  // Build alternating blocks of comments and code
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
          lineEnd: commentBlock.lineStart - 1
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
        lineEnd: lines.length
      });
    }
  }
  
  return result;
}

async function generateHTML(blocks: LiterateBlock[], inputFile: string): Promise<string> {
  const title = inputFile.split('/').pop() || 'Literate Code';
  
  // Mobile: stack all blocks vertically
  let mobileContent = '';
  
  // Desktop: create pairs by grouping consecutive comment+code or individual blocks
  let desktopContent = '';
  
  // Note: processMarkdown function is now defined at the top level as an async function

  for (let i = 0; i < blocks.length; i++) {
    const currentBlock = blocks[i];
    const nextBlock = blocks[i + 1];
    
    if (currentBlock.type === 'comment') {
      const markdownContent = await processMarkdown(currentBlock.content);
      
      // Mobile version
      mobileContent += `
        <div class="bg-white border-b border-gray-200 lg:hidden">
          <div class="p-6">
            <div class="prose prose-sm prose-gray max-w-none">
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
                <div class="prose prose-sm prose-gray max-w-none">
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
                <div class="prose prose-sm prose-gray max-w-none">
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
            <pre class="text-sm leading-relaxed overflow-x-auto"><code>${highlightedCode}</code></pre>
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
  
  const content = `
    ${mobileContent}
    <div class="hidden lg:flex lg:flex-col w-full">
      ${desktopContent}
    </div>`;
  
  return HTML_TEMPLATE
    .replace(/{{TITLE}}/g, title)
    .replace('{{CONTENT}}', content);
}

async function main() {
  try {
    const { inputFile, outputFile } = parseArguments();
    
    console.log(`Processing: ${inputFile}`);
    console.log(`Output: ${outputFile}`);
    
    const blocks = await parseSourceFile(inputFile);
    const html = await generateHTML(blocks, inputFile);
    
    await Deno.writeTextFile(outputFile, html);
    
    console.log(`Generated HTML: ${outputFile}`);
    console.log(`Found ${blocks.length} blocks (${blocks.filter(b => b.type === 'comment').length} comments, ${blocks.filter(b => b.type === 'code').length} code)`);
    
  } catch (error) {
    console.error('Error:', error.message);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await main();
}
