(() => {
  const STORAGE_KEY = "daily_state_tracker";
  const SCHEMA_VERSION = 1;
  const RECORD_FIELDS = [
    "pre_sleep_calmness",
    "sleep_recovery",
    "wake_up_state",
    "exercise_quality",
    "deep_work",
    "task_closure",
    "stress_manageability",
    "social_interaction",
    "presence",
    "deep_experience",
    "memo",
  ];

  const getLocalYYYYMMDD = (date = new Date()) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const buildEmptyRecord = () =>
    RECORD_FIELDS.reduce((acc, key) => {
      acc[key] = "";
      return acc;
    }, {});

  const normalizeRecord = (record = {}) => {
    const normalized = buildEmptyRecord();
    RECORD_FIELDS.forEach((key) => {
      const value = record[key];
      if (key === "memo") {
        normalized[key] = typeof value === "string" ? value : "";
        return;
      }

      const numeric =
        typeof value === "number"
          ? value
          : typeof value === "string"
            ? Number.parseInt(value, 10)
            : NaN;
      normalized[key] = Number.isInteger(numeric) && numeric >= 1 && numeric <= 5 ? numeric : "";
    });
    return normalized;
  };

  const normalizeStorage = (payload) => {
    if (!payload || typeof payload !== "object") {
      return { schema_version: SCHEMA_VERSION, records: {} };
    }

    const rawRecords = payload.records && typeof payload.records === "object" ? payload.records : {};
    const normalizedRecords = Object.keys(rawRecords).reduce((acc, dateKey) => {
      acc[dateKey] = normalizeRecord(rawRecords[dateKey]);
      return acc;
    }, {});

    return { schema_version: SCHEMA_VERSION, records: normalizedRecords };
  };

  const loadAll = () =>
    new Promise((resolve) => {
      if (!chrome?.storage?.local) {
        resolve({ schema_version: SCHEMA_VERSION, records: {} });
        return;
      }

      chrome.storage.local.get([STORAGE_KEY], (result) => {
        resolve(normalizeStorage(result[STORAGE_KEY]));
      });
    });

  const saveAll = (payload) =>
    new Promise((resolve) => {
      if (!chrome?.storage?.local) {
        resolve();
        return;
      }
      chrome.storage.local.set({ [STORAGE_KEY]: normalizeStorage(payload) }, resolve);
    });

  const getTodayRecord = async () => {
    const today = getLocalYYYYMMDD();
    const data = await loadAll();
    return data.records[today] ? normalizeRecord(data.records[today]) : buildEmptyRecord();
  };

  const saveTodayRecord = async (partial = {}) => {
    const today = getLocalYYYYMMDD();
    const data = await loadAll();
    const existing = data.records[today] ? normalizeRecord(data.records[today]) : buildEmptyRecord();
    const merged = normalizeRecord({ ...existing, ...partial });
    const next = {
      schema_version: SCHEMA_VERSION,
      records: {
        ...data.records,
        [today]: merged,
      },
    };
    await saveAll(next);
    return merged;
  };

  window.StorageAPI = {
    STORAGE_KEY,
    SCHEMA_VERSION,
    RECORD_FIELDS,
    getLocalYYYYMMDD,
    loadAll,
    saveAll,
    buildEmptyRecord,
    normalizeRecord,
    normalizeStorage,
    getTodayRecord,
    saveTodayRecord,
  };
})();
