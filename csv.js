(() => {
  const escapeCSV = (value) => {
    const text = value === undefined || value === null ? "" : String(value);
    if (/[",\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const buildCSV = (records) => {
    const headers = ["date", ...window.StorageAPI.RECORD_FIELDS];
    const lines = [headers.map(escapeCSV).join(",")];

    Object.keys(records)
      .sort()
      .forEach((dateKey) => {
        const record = records[dateKey] || {};
        const row = [
          dateKey,
          ...window.StorageAPI.RECORD_FIELDS.map((key) => {
            const value = record[key];
            return value === undefined || value === null ? "" : value;
          }),
        ];
        lines.push(row.map(escapeCSV).join(","));
      });

    return lines.join("\n");
  };

  const downloadText = (filename, content, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const exportCSV = async () => {
    const payload = await window.StorageAPI.loadAll();
    const csv = buildCSV(payload.records || {});
    downloadText("daily_state_tracker_export.csv", csv, "text/csv;charset=utf-8");
  };

  window.CSVAPI = {
    exportCSV,
  };
})();
