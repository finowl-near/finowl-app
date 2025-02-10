const { create } = require("zustand");

const useSwitchTabs = create((set) => ({
    switchTabs: false,
    setSwitchTabs: (sw) => {
        set({ switchTabs: sw })
    }
}));

export default useSwitchTabs;