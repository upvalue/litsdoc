/**
 * A simple JavaScript literate program
 * This demonstrates different comment styles in JS
 */

// Single line comment explaining the constant
const GREETING = "Hello, World!";

/*
 * This is a block comment
 * explaining the main function
 */
function greetUser(name) {
    /** JSDoc style comment for the conditional */
    if (name) {
        // Return personalized greeting
        return `Hello, ${name}!`;
    }
    
    /*
     * Default greeting when no name provided
     */
    return GREETING;
}

/**
 * Main execution block
 * This runs the greeting function
 */
console.log(greetUser("Literate Programming"));
console.log(greetUser());