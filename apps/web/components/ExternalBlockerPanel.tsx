const blockers = [
  "CASTER_QSTORAGE_ENDPOINT",
  "CASTER_QSTORAGE_WRITE_TOKEN",
  "CASTER_QSTORAGE_VERIFY_ENDPOINT",
  "CASTER_QSTORAGE_NAMESPACE",
  "CASTER_CLOUD_DEPLOY_ENDPOINT",
  "CASTER_CLOUD_DEPLOY_TOKEN",
  "CASTER_CLOUD_PROJECT",
  "CASTER_CLOUD_RELEASE_CHANNEL",
  "CASTER_DEPLOY_SIGNING_KEY_PATH",
  "CASTER_DOMAIN_REGISTRY_ENDPOINT",
  "public Caster node endpoints",
  "audited $GITCASTER contracts",
  "external security audit"
];

export function ExternalBlockerPanel() {
  return (
    <div className="grid">
      {blockers.map((item) => (
        <div className="card" key={item}>
          <h3>{item}</h3>
          <p>Blocked until this external proof or operator-controlled input exists.</p>
        </div>
      ))}
    </div>
  );
}
