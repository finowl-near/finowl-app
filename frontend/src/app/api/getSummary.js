import axios from "axios";

export default async function getSummary(filter, id) {

  let url;

  if (filter === "Near") {
    url = `https://finowl.finance/api/v0/near/summary`;
  } else {
    url = `https://finowl.finance/api/v0/summary`;
  }

  if (id) {
    url += `?id=${id}`;
  }

  try {
    const response = await axios.get(url);
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error('cannot get summary');
    }
  } catch (error) {
    return null;
  }
}