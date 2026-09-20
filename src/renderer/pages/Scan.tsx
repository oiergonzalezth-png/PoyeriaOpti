import React from "react";
import { useHardwareSnapshot } from "../hooks/useHardwareSnapshot";
import { useTranslation } from "../providers/SettingsProvider";
import type { TranslationKey } from "../i18n/es";
import Notice from "../components/Notice";
import PageHeader from "../components/PageHeader";

function Row({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div className="kv__row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <section>
      <h2 className="section__title scan__title">{title}</h2>
      {children}
    </section>
  );
}

export default function Scan(): React.JSX.Element {
  const { t } = useTranslation();
  const { data, loading, error } = useHardwareSnapshot(6000);
  const na = t("common.na");
  const r = (key: TranslationKey): string => t(key);

  return (
    <div className="page">
      <PageHeader title={t("scan.title")} description={t("scan.subtitle")} />

      {loading && !data && <p className="hint">{t("scan.analyzing")}</p>}
      {error && <Notice tone="danger">{t("scan.error", { message: error })}</Notice>}

      {data && (
        <div className="scan__grid">
          <Section title={r("scan.section.cpu")}>
            <dl className="kv">
              <Row label={r("scan.row.manufacturer")} value={data.cpu.manufacturer ?? na} />
              <Row label={r("scan.row.model")} value={data.cpu.brand ?? na} />
              <Row label={r("scan.row.physicalCores")} value={data.cpu.physicalCores?.toString() ?? na} />
              <Row label={r("scan.row.logicalCores")} value={data.cpu.logicalCores?.toString() ?? na} />
              <Row label={r("scan.row.frequency")} value={data.cpu.speedGhz != null ? `${data.cpu.speedGhz} GHz` : na} />
              <Row label={r("scan.row.load")} value={data.cpu.currentLoadPercent != null ? `${data.cpu.currentLoadPercent} %` : na} />
              <Row label={r("scan.row.temperature")} value={data.cpu.temperatureC != null ? `${data.cpu.temperatureC} °C` : na} />
            </dl>
          </Section>

          <Section title={r("scan.section.ram")}>
            <dl className="kv">
              <Row label={r("scan.row.total")} value={`${(data.ram.totalMb / 1024).toFixed(1)} GB`} />
              <Row label={r("scan.row.inUse")} value={`${(data.ram.usedMb / 1024).toFixed(1)} GB (${data.ram.usedPercent} %)`} />
              <Row label={r("scan.row.available")} value={`${(data.ram.availableMb / 1024).toFixed(1)} GB`} />
            </dl>
          </Section>

          <Section title={r("scan.section.gpu")}>
            {data.gpu.length === 0 && <p className="hint">{t("scan.gpuNone")}</p>}
            {data.gpu.map((g, i) => (
              <dl key={i} className="kv kv__group">
                <Row label={r("scan.row.manufacturer")} value={g.vendor ?? na} />
                <Row label={r("scan.row.model")} value={g.model ?? na} />
                <Row label={r("scan.row.vram")} value={g.vramMb != null ? `${g.vramMb} MB` : na} />
              </dl>
            ))}
          </Section>

          <Section title={r("scan.section.os")}>
            <dl className="kv">
              <Row label={r("scan.row.platform")} value={data.os.platform} />
              <Row label={r("scan.row.distro")} value={data.os.distro ?? na} />
              <Row label={r("scan.row.version")} value={data.os.release ?? na} />
              <Row label={r("scan.row.build")} value={data.os.build ?? na} />
              <Row label={r("scan.row.servicePack")} value={data.os.servicePack ?? na} />
              <Row label={r("scan.row.arch")} value={data.os.arch} />
              <Row label={r("scan.row.uefi")} value={data.os.uefi == null ? na : data.os.uefi ? t("common.yes") : t("common.no")} />
            </dl>
          </Section>

          <Section title={r("scan.section.volumes")}>
            {data.disks.map((d) => (
              <dl key={d.device} className="kv kv__group">
                <Row label={r("scan.row.drive")} value={d.device} />
                <Row label={r("scan.row.fileSystem")} value={d.type ?? na} />
                <Row label={r("scan.row.capacity")} value={`${d.sizeGb} GB`} />
                <Row label={r("scan.row.free")} value={`${d.freeGb} GB (${(100 - d.usedPercent).toFixed(1)} %)`} />
              </dl>
            ))}
          </Section>

          <Section title={r("scan.section.physical")}>
            {data.physicalDisks.length === 0 && <p className="hint">{t("scan.physicalNone")}</p>}
            {data.physicalDisks.map((d, i) => (
              <dl key={`${d.name}-${i}`} className="kv kv__group">
                <Row label={r("scan.row.name")} value={d.name} />
                <Row label={r("scan.row.type")} value={d.type ?? na} />
                <Row label={r("scan.row.capacity")} value={d.sizeGb != null ? `${d.sizeGb} GB` : na} />
                <Row label={r("scan.row.interface")} value={d.interfaceType ?? na} />
              </dl>
            ))}
          </Section>
        </div>
      )}
    </div>
  );
}
