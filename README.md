# litsdoc

This is a tool that allows you to generate literate programming documentation for your code. It uses
tree-sitter to parse most source code and reliably find comments.

It's 99.9% vibe coded so approach with caution.

It's an inverted tool -> You write markdown in comments in code files, invoke the tool with the
order you want to process files in, and then you get an HTML file with markdown comments on the left
and syntax highlighted code on the right. 

You can see an example of the tool running on itself at
[litsdoc.html](https://upvalue.github.io/litsdoc/litsdoc.html)

# Supported languages

The `LANGUAGE_MAP` and `SHIKI_LANGUAGE_MAP` at the top control language support.

Currently supported languages:
- C 
- .ld Linker scripts
- JavaScript & TypeScript
- Rust

# How to invoke

> ./litsdoc.ts tests/c/hello-world.c tests/c/indentation-test.c -o docs.html

The files will be processed in the order given

One additional useful option is `--code-url` -- this will link source files with code-url as the
prefix, so it can be set to e.g. a GitHub repository to view the source directly.

Since you might want to use it over and over again, you can put these arguments into an argfile and
then invoke with `--argfile` to get the arguments from that file, ex:

> ./litsdoc.ts --argfile self-doc.argfile 

to generate `litsdoc.html`.

Use

> ./litsdoc.ts --help

To see all the options.

# How to "install"

Since it's a Deno script, it just needs to be placed in a directory along with `deno.json` and
`deno.lock` to handle dependencies. To "install", put it somewhere and then alias or symlink it to
something memorable instead of `litsdoc.ts`. I use `,litsdoc`

