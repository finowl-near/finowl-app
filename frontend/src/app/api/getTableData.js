import axios from "axios";

export default async function getTableData(page, sort, sortDir) {
  console.log("inside page", page, sort, sortDir);
  const response = await axios.get(
    `https://finowl.finance/api/v0/generic-discovery?sort=${sort}&sortDir=${sortDir}&page=${page}`
  );
  if (response.status === 200) {
    return response.data;
  }
  return null;
}
