const { create } = require("zustand");

const useFilter = create((set) => ({
    filter: "Near",
    setFilter: (ft) => {
        set({ filter: ft })
    }
}));

export default useFilter;