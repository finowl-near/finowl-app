import axios from "axios";

export default async function getTableData(page, sort, sortDir, filter) {
  try {
    let response;
    if (filter === "All") {
      response = await axios.get(
        `https://finowl.finance/api/v0/generic-discovery?sort=${sort}&sortDir=${sortDir}&page=${page}`
      );
    } else {
      response = await axios.get(
        `https://finowl.finance/api/v0/near/tickers?sort=${sort}&sortDir=${sortDir}&page=${page}`
      );
    }
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error('cnnot fetch table data');
    }
  } catch (error) {
    return null;
  }
}
