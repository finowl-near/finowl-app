const { create } = require("zustand");

const useFilter = create((set) => ({
    filter: "All",
    setFilter: (ft) => {
        set({ filter: ft })
    }
}));

export default useFilter;