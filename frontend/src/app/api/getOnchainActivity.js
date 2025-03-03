import axios from "axios";

export default async function getOnchainActivity() {
    const response = await axios.get('https://finowl.finance/api/v0/tickers?page=1&pageSize=5&sort=mindshare&sortDir=desc');
    if (response.status === 200) {
        return response.data;
    }
    return null;
}