import { create } from "zustand";

const useTableData = create((set) => ({
  tableData: [],
  trendingData: null,
  topInfluencers: null,
  allInfluencers: null,
  onChainData: null,
  feed: null,
  feedData: null,
  feedId: 0,
  setTableData: (data) => {
    console.log("here", data);
    set({ tableData: data });
  },
  setTrendingMindshareScore: (data) => {
    console.log("trending", data);
    set({ trendingData: data });
  },
  setTopInfluencers: (data) => {
    console.log("top inf", data);
    set({ topInfluencers: data });
  },
  setAllInfluencers: (data) => {
    console.log("all inf", data);
    set({ allInfluencers: data });
  },
  setOnchainActivity: (data) => {
    console.log("on chain", data);
    set({ onChainData: data });
  },
  setFeed: (data, feedData, feedId) => {
    console.log("feed", data, feedData, feedId);
    set({ feed: data, feedData: feedData, feedId: feedId });
  },
}));

export default useTableData;
