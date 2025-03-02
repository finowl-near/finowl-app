import axios from "axios";

export default async function getSummary() {
    const response = await axios.get(`https://finowl.finance/api/v0/summary`);
    if (response.status === 200) {
        return response.data;
    }
    return null;
}