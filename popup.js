(() => {
  const dateEl = document.getElementById("today-date");
  const statusEl = document.getElementById("status-message");
  const memoEl = document.getElementById("memo");
  const exportCsvBtn = document.getElementById("export-csv");
  const exportJsonBtn = document.getElementById("export-json");
  const prevDayBtn = document.getElementById("prev-day");
  const todayBtn = document.getElementById("today-button");
  let statusTimer = null;
  let memoTimer = null;
  let currentDate = new Date();

  const setStatus = (message, duration = 2000) => {
    if (!statusEl) {
      return;
    }
    statusEl.textContent = message || "";
    if (statusTimer) {
      window.clearTimeout(statusTimer);
    }
    if (message && duration > 0) {
      statusTimer = window.setTimeout(() => {
        statusEl.textContent = "";
      }, duration);
    }
  };

  const renderStars = () => {
    const containers = document.querySelectorAll(".stars");
    containers.forEach((container) => {
      for (let i = 1; i <= 5; i += 1) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "star-button";
        button.setAttribute("aria-label", `${i} 星`);
        button.dataset.value = String(i);
        container.appendChild(button);
      }
    });
  };

  const getDateKey = (date) => window.StorageAPI.getLocalYYYYMMDD(date);

  const isToday = (date) => getDateKey(date) === getDateKey(new Date());

  const initDate = () => {
    if (!dateEl) {
      return;
    }
    dateEl.textContent = getDateKey(currentDate);
  };

  const setStarsValue = (container, value) => {
    const buttons = container.querySelectorAll(".star-button");
    buttons.forEach((button, index) => {
      const active = Number(value) >= index + 1;
      button.classList.toggle("active", active);
      button.setAttribute("aria-checked", active ? "true" : "false");
    });
  };

  const setInteractionEnabled = (enabled) => {
    document.querySelectorAll(".star-button").forEach((button) => {
      button.disabled = !enabled;
    });
    if (memoEl) {
      memoEl.readOnly = !enabled;
    }
  };

  const refreshFromStorage = async () => {
    try {
      const payload = await window.StorageAPI.loadAll();
      const dateKey = getDateKey(currentDate);
      const record = payload.records && payload.records[dateKey]
        ? window.StorageAPI.normalizeRecord(payload.records[dateKey])
        : window.StorageAPI.buildEmptyRecord();
      document.querySelectorAll(".rating-row").forEach((row) => {
        const key = row.dataset.key;
        const container = row.querySelector(".stars");
        if (!container || !key) {
          return;
        }
        setStarsValue(container, record[key]);
      });
      if (memoEl) {
        memoEl.value = record.memo || "";
      }
      setInteractionEnabled(isToday(currentDate));
    } catch (error) {
      setStatus("读取数据失败");
    }
  };

  const handleStarClick = async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) {
      return;
    }
    if (!isToday(currentDate)) {
      setStatus("只读");
      return;
    }
    const row = target.closest(".rating-row");
    const container = target.closest(".stars");
    if (!row || !container) {
      return;
    }
    const key = row.dataset.key;
    const value = Number(target.dataset.value);
    if (!key || !Number.isFinite(value)) {
      return;
    }
    setStarsValue(container, value);
    try {
      await window.StorageAPI.saveTodayRecord({ [key]: value });
      setStatus("已保存");
    } catch (error) {
      setStatus("保存失败");
    }
  };

  const handleMemoInput = () => {
    if (!memoEl) {
      return;
    }
    if (!isToday(currentDate)) {
      setStatus("只读");
      return;
    }
    if (memoTimer) {
      window.clearTimeout(memoTimer);
    }
    memoTimer = window.setTimeout(async () => {
      try {
        await window.StorageAPI.saveTodayRecord({ memo: memoEl.value });
        setStatus("已保存");
      } catch (error) {
        setStatus("保存失败");
      }
    }, 400);
  };

  const initActions = () => {
    document.querySelectorAll(".stars").forEach((container) => {
      container.addEventListener("click", handleStarClick);
    });

    if (memoEl) {
      memoEl.addEventListener("input", handleMemoInput);
    }

    if (exportCsvBtn) {
      exportCsvBtn.addEventListener("click", async () => {
        try {
          await window.CSVAPI.exportCSV();
          setStatus("CSV 已导出");
        } catch (error) {
          setStatus("CSV 导出失败");
        }
      });
    }

    if (exportJsonBtn) {
      exportJsonBtn.addEventListener("click", async () => {
        try {
          await window.BackupAPI.exportJSON();
          setStatus("JSON 已导出");
        } catch (error) {
          setStatus("JSON 导出失败");
        }
      });
    }

    if (prevDayBtn) {
      prevDayBtn.addEventListener("click", async () => {
        const nextDate = new Date(currentDate);
        nextDate.setDate(nextDate.getDate() - 1);
        currentDate = nextDate;
        initDate();
        await refreshFromStorage();
      });
    }

    if (todayBtn) {
      todayBtn.addEventListener("click", async () => {
        if (isToday(currentDate)) {
          return;
        }
        currentDate = new Date();
        initDate();
        await refreshFromStorage();
      });
    }
  };

  const init = async () => {
    initDate();
    renderStars();
    initActions();
    await refreshFromStorage();
    setStatus("");
  };

  document.addEventListener("DOMContentLoaded", init);
})();
