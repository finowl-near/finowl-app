const { create } = require("zustand");

const useSortTable = create((set) => ({
  sort: "mindshare",
  sortDir: "desc",
  setSort: (sr) => {
    set({ sort: sr });
  },
  setSortDir: (srd) => {
    set({ sortDir: srd });
  },
}));

export default useSortTable;
