#!/usr/bin/env -S deno test --allow-read --allow-run --allow-write

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { assertSnapshot } from "https://deno.land/std@0.224.0/testing/snapshot.ts";

/**
 * Helper function to run literate-code-ts and capture output
 */
async function runLiterateCodeTs(args: string[]): Promise<{ code: number; output: string; stderr: string }> {
  const command = new Deno.Command("./literate-code-ts.ts", {
    args: [...args, "--stdout"],
    stdout: "piped",
    stderr: "piped",
  });
  
  const { code, stdout, stderr } = await command.output();
  
  return {
    code,
    output: new TextDecoder().decode(stdout),
    stderr: new TextDecoder().decode(stderr)
  };
}

/**
 * Basic snapshot test for hello-world.c
 * This captures the complete HTML output as a snapshot
 */
Deno.test("hello-world.c basic output", async (t) => {
  const { code, output, stderr } = await runLiterateCodeTs(["tests/c/hello-world.c"]);
  
  assertEquals(code, 0, `Command failed with code ${code}. Stderr: ${stderr}`);
  
  await assertSnapshot(t, output);
});

/**
 * Test with custom title and description
 */
Deno.test("hello-world.c with custom title and description", async (t) => {
  const { code, output, stderr } = await runLiterateCodeTs([
    "tests/c/hello-world.c",
    "--title", "Custom Test Title",
    "--description", "This is a **test** with *markdown* support!"
  ]);
  
  assertEquals(code, 0, `Command failed with code ${code}. Stderr: ${stderr}`);
  
  await assertSnapshot(t, output);
});

/**
 * Test with URL linking
 */
Deno.test("hello-world.c with code URL", async (t) => {
  const { code, output, stderr } = await runLiterateCodeTs([
    "tests/c/hello-world.c",
    "--code-url", "https://github.com/example/repo/tree/main/"
  ]);
  
  assertEquals(code, 0, `Command failed with code ${code}. Stderr: ${stderr}`);
  
  await assertSnapshot(t, output);
});

/**
 * Test multi-file processing
 */
Deno.test("multi-file processing", async (t) => {
  const { code, output, stderr } = await runLiterateCodeTs([
    "tests/c/hello-world.c",
    "tests/js/example.js",
    "--title", "Multi-file Project",
    "--description", "Testing **multi-file** processing"
  ]);
  
  assertEquals(code, 0, `Command failed with code ${code}. Stderr: ${stderr}`);
  
  await assertSnapshot(t, output);
});

/**
 * Test linker script (.ld) file processing with regex fallback
 */
Deno.test("linker script processing", async (t) => {
  const { code, output, stderr } = await runLiterateCodeTs([
    "tests/ld/example.ld",
    "--title", "ARM Cortex-M Linker Script Test",
    "--description", "Testing **linker script** parsing with regex fallback"
  ]);
  
  assertEquals(code, 0, `Command failed with code ${code}. Stderr: ${stderr}`);
  
  await assertSnapshot(t, output);
});

/**
 * Test error handling - this should not create a snapshot since it fails
 */
Deno.test("error handling for non-existent file", async () => {
  const { code } = await runLiterateCodeTs(["nonexistent-file.c"]);
  
  // Should fail with non-zero exit code
  assertEquals(code, 1, "Expected command to fail for non-existent file");
});