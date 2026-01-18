(() => {
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

  const readFileText = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error("读取文件失败"));
      reader.readAsText(file);
    });

  const exportJSON = async () => {
    const payload = await window.StorageAPI.loadAll();
    const content = JSON.stringify(payload, null, 2);
    downloadText("daily_state_tracker_backup.json", content, "application/json;charset=utf-8");
  };

  const importJSON = async (file) => {
    if (!file) {
      throw new Error("未选择文件");
    }
    const text = await readFileText(file);
    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      throw new Error("JSON 格式错误");
    }
    const normalized = window.StorageAPI.normalizeStorage(parsed);
    if (!normalized.records || typeof normalized.records !== "object") {
      throw new Error("JSON 结构不正确");
    }
    await window.StorageAPI.saveAll(normalized);
  };

  window.BackupAPI = {
    exportJSON,
    importJSON,
  };
})();
