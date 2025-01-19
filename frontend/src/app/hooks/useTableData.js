import { create } from "zustand";

const useTableData = create((set) => ({
  tableData: [],
  setTableData: (data) => {
    console.log('here', data);
    set({ tableData: data });
  },
}));

export default useTableData;
