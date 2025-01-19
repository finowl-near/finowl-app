import axios from "axios";

export default async function getTableData() {
    const response = await axios.get('http://localhost:8080/api/v0/tickers?page=1&pageSize=10');
    if (response.status === 200) {
        return response.data;
    }
    return null;
}