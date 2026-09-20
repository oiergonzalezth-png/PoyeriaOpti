import { describe, it, expect } from "vitest";
import { buildGetPrioritiesScript, buildSetPrioritiesScript } from "../src/main/gaming/priorityCommands";

describe("PIDs en los scripts de PowerShell", () => {
  it("aceptan enteros positivos", () => {
    expect(buildGetPrioritiesScript([10, 20])).toContain("-Id 10,20");
    expect(buildSetPrioritiesScript([{ pid: 42, priority: "High" }])).toContain("-Id 42");
  });

  it("rechazan PIDs que permitirían inyectar código", () => {
    const evil = "1; Remove-Item C:\\ -Recurse" as unknown as number;
    expect(() => buildGetPrioritiesScript([evil])).toThrow();
    expect(() => buildSetPrioritiesScript([{ pid: evil, priority: "High" }])).toThrow();
    expect(() => buildGetPrioritiesScript([NaN])).toThrow();
    expect(() => buildGetPrioritiesScript([-5])).toThrow();
    expect(() => buildGetPrioritiesScript([1.5])).toThrow();
  });
});
