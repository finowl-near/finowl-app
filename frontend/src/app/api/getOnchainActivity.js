import axios from "axios";

export default async function getOnchainActivity() {
    const response = await axios.get('http://127.0.0.1:8080/api/v0/tickers?page=1&pageSize=5&sort=mindshare&sortDir=desc');
    if (response.status === 200) {
        return response.data;
    }
    return null;
}