/*
 * # ARM Cortex-M Linker Script
 * 
 * This linker script defines the memory layout for an ARM Cortex-M
 * microcontroller. It specifies where different sections of the
 * program will be placed in memory.
 */

/* Define the memory regions available on the target device */
MEMORY
{
    /*
     * ## Flash Memory Region
     * 
     * The FLASH region contains the program code and read-only data.
     * This starts at address 0x08000000 with 256KB of space.
     */
    FLASH (rx) : ORIGIN = 0x08000000, LENGTH = 256K
    
    /*
     * ## RAM Memory Region
     * 
     * The RAM region is used for variables, stack, and heap.
     * This starts at address 0x20000000 with 64KB of space.
     */
    RAM (rwx) : ORIGIN = 0x20000000, LENGTH = 64K
}

/*
 * ## Entry Point Definition
 * 
 * The entry point is the first function that gets called when
 * the microcontroller starts up.
 */
ENTRY(Reset_Handler)

/*
 * ## Section Definitions
 * 
 * These sections define how different parts of the program
 * are organized in memory.
 */
SECTIONS
{
    /*
     * ### Vector Table Section
     * 
     * The vector table must be placed at the beginning of flash
     * memory. It contains the initial stack pointer and reset vector.
     */
    .isr_vector :
    {
        . = ALIGN(4);
        KEEP(*(.isr_vector))
        . = ALIGN(4);
    } >FLASH

    /*
     * ### Program Code Section
     * 
     * This section contains the actual program instructions.
     * It includes all .text sections from input files.
     */
    .text :
    {
        . = ALIGN(4);
        *(.text)
        *(.text*)
        
        /* Read-only data like string constants */
        *(.rodata)
        *(.rodata*)
        
        . = ALIGN(4);
        _etext = .;
    } >FLASH

    /*
     * ### Initialized Data Section
     * 
     * This section contains global variables that have initial values.
     * They are stored in flash but copied to RAM at startup.
     */
    .data :
    {
        . = ALIGN(4);
        _sdata = .;
        *(.data)
        *(.data*)
        . = ALIGN(4);
        _edata = .;
    } >RAM AT> FLASH

    /*
     * ### Uninitialized Data Section
     * 
     * This section contains global variables that start with zero values.
     * They don't take up space in flash, only in RAM.
     */
    .bss :
    {
        . = ALIGN(4);
        _sbss = .;
        __bss_start__ = _sbss;
        *(.bss)
        *(.bss*)
        *(COMMON)
        . = ALIGN(4);
        _ebss = .;
        __bss_end__ = _ebss;
    } >RAM

    /*
     * ### Stack Definition
     * 
     * The stack grows downward from the end of RAM.
     * We ensure there's at least 1KB of stack space.
     */
    ._user_heap_stack :
    {
        . = ALIGN(8);
        PROVIDE ( end = . );
        PROVIDE ( _end = . );
        . = . + _Min_Heap_Size;
        . = . + _Min_Stack_Size;
        . = ALIGN(8);
    } >RAM
}

/* Minimum required heap and stack sizes */
_Min_Heap_Size = 0x200;  /* 512 bytes */
_Min_Stack_Size = 0x400; /* 1024 bytes */