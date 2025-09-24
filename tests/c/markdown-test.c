/**
 * # Markdown Test Program
 * 
 * This program demonstrates **rich markdown** support in literate programming,
 * including:
 * 
 * - Lists with *emphasis*
 * - Code snippets like `printf()`
 * - Links to [GitHub](https://github.com)
 * - And much more!
 * 
 * ## Features Tested
 * 
 * 1. Headers at multiple levels
 * 2. **Bold** and *italic* text
 * 3. Inline `code` formatting
 * 4. Lists (ordered and unordered)
 * 
 * > This is a blockquote to test markdown rendering
 * 
 * ### Code Example
 * ```c
 * int example = 42;
 * ```
 */
#include <stdio.h>

/**
 * ## The main function
 * 
 * This function demonstrates:
 * 
 * - Standard **C programming** patterns
 * - Use of the `printf()` function
 * - Return codes for success/failure
 * 
 * Parameters: `void` (no parameters)
 * Returns: `int` status code
 */
int main(void) {
    /** Print a greeting with *markdown* **formatting** */
    printf("Hello from markdown test!\n");
    
    /**
     * ### Success Status
     * 
     * We return `0` to indicate successful program execution.
     * This follows the standard UNIX convention where:
     * 
     * - `0` = success
     * - Non-zero = error
     */
    return 0;
}

/**
 * # Program Compilation
 * 
 * To compile and run this program:
 * 
 * ```bash
 * gcc -o markdown-test markdown-test.c
 * ./markdown-test
 * ```
 * 
 * Expected output:
 * ```
 * Hello from markdown test!
 * ```
 */