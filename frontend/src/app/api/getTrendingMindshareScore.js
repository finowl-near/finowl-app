import axios from "axios";

export default async function getTrendingMindshareScore() {
    const response = await axios.get('https://finowl.finance/api/v0/tickers?page=0&pageSize=5&sort=mindshare&sortDir=desc');
    if (response.status === 200) {
        return response.data;
    }
    return null;
}