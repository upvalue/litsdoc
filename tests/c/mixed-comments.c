/**
  * This is a JSDoc-style comment
  * with multiple lines and asterisks
  */
#include <stdio.h>

/* 
 * This is a regular block comment
 * without the extra asterisk
 */
int global_var = 42;

/* Single line block comment */
int main(void) {
    /** Inline documentation comment */
    printf("Hello, mixed comments!\n");
    
    /* Another block comment
       spanning multiple lines
       without leading asterisks */
    return 0;
}

/**
  * Final documentation block
  * explaining the program's purpose
  */