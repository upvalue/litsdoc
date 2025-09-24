/**
  * `hello-world.c` - a brief hello world in C.
  * This is a literate program
  */

/** We start by including stdio.h ("standard input and output")
  * a header that allows us to use some functions for input and output */
#include <stdio.h>

/**
  * The main function is executed when our program starts.
  * It returns an int to tell the operating system
  * whether it was successful or failed
  */
int main(void) {
  /** Print hello world to the user */
  printf("Hello, world!\n");

  /** Return zero, indicating succcess */
  return 0;
}

/**
  * This program can be compiled and run with:
  * `cc -o hello-world ./hello-world.c && ./hello-world`
  */
