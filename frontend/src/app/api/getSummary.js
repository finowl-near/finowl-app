import axios from "axios";

export default async function getSummary(id) {
    console.log('inside getSummary', id)
    const response = await axios.get(`https://finowl.finance/api/v0/summary?id=${id}`);
    if (response.status === 200) {
        return response.data;
    }
    return null;
}