import React from "react";
import { Wifi } from "lucide-react";
import { useNetworkTest } from "../hooks/useNetworkTest";
import { useTranslation } from "../providers/SettingsProvider";
import Notice from "../components/Notice";
import PageHeader from "../components/PageHeader";

function Metric({
  label,
  value,
  unit,
  badge
}: {
  label: string;
  value: number | null;
  unit: string;
  badge?: string;
}): React.JSX.Element {
  return (
    <div className="net-metric">
      <div className="net-metric__value">
        {value != null ? value : "–"}
        {value != null && <span className="net-metric__unit">{unit}</span>}
      </div>
      <div className="net-metric__label">
        {label}
        {badge && <span className="net-method-badge">{badge}</span>}
      </div>
    </div>
  );
}

function methodLabel(method: "icmp" | "tcp" | "https" | null): string {
  if (method === "icmp") return "ICMP";
  if (method === "tcp") return "TCP";
  if (method === "https") return "HTTPS";
  return "";
}

export default function Network(): React.JSX.Element {
  const { t } = useTranslation();
  const { result, running, error, runTest } = useNetworkTest();

  return (
    <div className="page">
      <PageHeader
        title={t("network.title")}
        description={t("network.subtitle")}
        actions={
          <button type="button" className="btn btn--primary" disabled={running} onClick={runTest}>
            <Wifi size={16} aria-hidden="true" />
            {running ? t("network.running") : t("network.run")}
          </button>
        }
      />

      {error && <Notice tone="danger">{error}</Notice>}
      {!result && !running && !error && <p className="hint">{t("network.idle")}</p>}

      {result && (
        <>
          {result.errors.length > 0 && (
            <Notice tone="warn">
              {result.errors.map((e, i) => (
                <div key={i}>{e}</div>
              ))}
            </Notice>
          )}

          <div className="net-metrics">
            <Metric
              label={t("network.metric.ping", { host: result.pingHost })}
              value={result.latencyMs}
              unit=" ms"
              badge={methodLabel(result.pingMethod ?? null)}
            />
            <Metric label={t("network.metric.jitter")} value={result.jitterMs} unit=" ms" />
            <Metric label={t("network.metric.loss")} value={result.packetLossPercent} unit=" %" />
            <Metric label={t("network.metric.download")} value={result.downloadMbps} unit=" Mbps" />
            <Metric label={t("network.metric.upload")} value={result.uploadMbps} unit=" Mbps" />
          </div>

          <section className="section">
            <h2 className="section__title">{t("network.dns.title")}</h2>
            {result.dnsServers.length === 0 ? (
              <p className="hint">{t("network.dns.empty")}</p>
            ) : (
              <ul className="chips">
                {result.dnsServers.map((dns) => (
                  <li key={dns} className="tag">
                    {dns}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="section">
            <h2 className="section__title">{t("network.adapters.title")}</h2>
            {result.adapters.length === 0 ? (
              <p className="hint">{t("network.adapters.empty")}</p>
            ) : (
              <div className="rows">
                {result.adapters.map((a) => (
                  <div key={a.name} className="row">
                    <div className="row__main">
                      <div className="row__title">
                        {a.name}{" "}
                        {a.isDefault && (
                          <span className="tag tag--ok net-default">{t("network.adapter.default")}</span>
                        )}
                      </div>
                      <div className="row__meta">
                        <span>
                          {t("network.adapter.type")}: {a.type ?? t("common.na")}
                        </span>
                        <span>IPv4: {a.ipv4 ?? t("common.na")}</span>
                        <span>
                          {t("network.adapter.mac")}: {a.mac ?? t("common.na")}
                        </span>
                        <span>
                          {t("network.adapter.speed")}:{" "}
                          {a.speedMbps != null ? `${a.speedMbps} Mbps` : t("common.na")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
