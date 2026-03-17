const Persistence = {
    SAVE_KEY: "SOVEREIGN_UNIV_5_3",
    autoSave(state) { localStorage.setItem(this.SAVE_KEY, JSON.stringify(state)); },
    autoLoad() { return JSON.parse(localStorage.getItem(this.SAVE_KEY)) || null; },
    clearData() { if(confirm("Permanently delete this character?")) { localStorage.removeItem(this.SAVE_KEY); location.reload(); } }
};
