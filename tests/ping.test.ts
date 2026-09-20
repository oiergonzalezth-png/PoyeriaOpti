import { describe, it, expect } from "vitest";
import { parseWindowsPingOutput, parseUnixPingOutput } from "../src/main/network/ping";

describe("parseWindowsPingOutput", () => {
  it("parsea una salida en inglés sin pérdida de paquetes", () => {
    const output = `
Pinging 1.1.1.1 with 32 bytes of data:
Reply from 1.1.1.1: bytes=32 time=11ms TTL=57
Reply from 1.1.1.1: bytes=32 time=12ms TTL=57
Reply from 1.1.1.1: bytes=32 time=10ms TTL=57
Reply from 1.1.1.1: bytes=32 time=13ms TTL=57

Ping statistics for 1.1.1.1:
    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),
Approximate round trip times in milli-seconds:
    Minimum = 10ms, Maximum = 13ms, Average = 11ms
`;
    const result = parseWindowsPingOutput(output);
    expect(result.latencyMs).toBe(11);
    expect(result.jitterMs).toBe(3);
    expect(result.packetLossPercent).toBe(0);
  });

  it("parsea una salida en español", () => {
    const output = `
Haciendo ping a 1.1.1.1 con 32 bytes de datos:
Respuesta desde 1.1.1.1: bytes=32 tiempo=15ms TTL=57

Estadísticas de ping para 1.1.1.1:
    Paquetes: enviados = 4, recibidos = 2, perdidos = 2 (50% perdidos),
Tiempos aproximados de ida y vuelta en milisegundos:
    Mínimo = 14ms, Máximo = 16ms, Media = 15ms
`;
    const result = parseWindowsPingOutput(output);
    expect(result.latencyMs).toBe(15);
    expect(result.jitterMs).toBe(2);
    expect(result.packetLossPercent).toBe(50);
  });

  it("devuelve null en latencia/jitter si no hay estadísticas reconocibles, sin inventar", () => {
    const result = parseWindowsPingOutput("salida irreconocible");
    expect(result.latencyMs).toBeNull();
    expect(result.jitterMs).toBeNull();
    expect(result.packetLossPercent).toBeNull();
  });
});

describe("parseUnixPingOutput", () => {
  it("parsea una salida típica de Linux", () => {
    const output = `
PING 1.1.1.1 (1.1.1.1) 56(84) bytes of data.
64 bytes from 1.1.1.1: icmp_seq=1 ttl=57 time=11.2 ms
64 bytes from 1.1.1.1: icmp_seq=2 ttl=57 time=12.8 ms

--- 1.1.1.1 ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3005ms
rtt min/avg/max/mdev = 10.123/12.456/14.789/1.234 ms
`;
    const result = parseUnixPingOutput(output);
    expect(result.latencyMs).toBe(12.456);
    expect(result.jitterMs).toBe(1.234);
    expect(result.packetLossPercent).toBe(0);
  });

  it("detecta 100% de pérdida de paquetes sin estadísticas de rtt", () => {
    const output = `
PING host-inalcanzable (10.0.0.99) 56(84) bytes of data.

--- host-inalcanzable ping statistics ---
4 packets transmitted, 0 received, 100% packet loss, time 3010ms
`;
    const result = parseUnixPingOutput(output);
    expect(result.packetLossPercent).toBe(100);
    expect(result.latencyMs).toBeNull();
  });
});
