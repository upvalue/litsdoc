/**
 * # Indentation Test Program
 * 
 * This program tests that code indentation is properly preserved
 * when using Shiki syntax highlighting.
 */
#include <stdio.h>

/**
 * ## Nested Structure Example
 * 
 * This function demonstrates proper indentation with:
 * - Nested blocks
 * - Multiple levels of indentation  
 * - Complex control flow
 */
int main(void) {
    /** Initialize variables with proper indentation */
    int x = 10;
    int y = 20;
    
    /** Nested conditional with multiple indentation levels */
    if (x > 5) {
        printf("x is greater than 5\n");
        
        if (y > 15) {
            printf("y is also greater than 15\n");
            
            for (int i = 0; i < 3; i++) {
                printf("Loop iteration %d\n", i);
                
                if (i == 1) {
                    printf("  This is deeply nested\n");
                    printf("  With multiple lines\n");
                }
            }
        } else {
            printf("y is not greater than 15\n");
        }
    }
    
    /** Return with standard indentation */
    return 0;
}