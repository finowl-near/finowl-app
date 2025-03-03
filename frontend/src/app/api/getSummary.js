import axios from "axios";

export default async function getSummary(id) {
  console.log("inside getSummary", id);
  let response;
  if (id) {
    response = await axios.get(
      `https://finowl.finance/api/v0/summary?id=${id}`
    );
} else {
      response = await axios.get(
        `https://finowl.finance/api/v0/summary`
      );
  }
  if (response.status === 200) {
    console.log("data inside summary", response.data);
    return response.data;
  }
  return null;
}
