const { create } = require("zustand");

const useSwitchTabs = create((set) => ({
    switchTabs: "mindshare",
    setSwitchTabs: (sw) => {
        set({ switchTabs: sw })
    }
}));

export default useSwitchTabs;