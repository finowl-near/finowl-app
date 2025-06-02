import { create } from "zustand";

const useTableData = create((set) => ({
  tableData: [],
  trendingData: null,
  recentMomentum: null,
  revivedInterest: null,
  topInfluencers: null,
  allInfluencers: null,
  onChainData: null,
  feed: null,
  feedData: null,
  feedId: 0,
  setTableData: (data) => {
    set({ tableData: data });
  },
  setTrendingMindshareScore: (data) => {
    set({ trendingData: data });
  },
  setRecentMomentum: (data) => {
    set({ recentMomentum: data });
  },
  setRevivedInterest: (data) => {
    set({ revivedInterest: data });
  },
  setTopInfluencers: (data) => {
    set({ topInfluencers: data });
  },
  setAllInfluencers: (data) => {
    set({ allInfluencers: data });
  },
  setOnchainActivity: (data) => {
    set({ onChainData: data });
  },
  setFeed: (data, feedData, feedId) => {
    set({ feed: data, feedData: feedData, feedId: feedId });
  },
}));

export default useTableData;
